import { useEffect, useRef, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { convertBtcToSats, convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number"
import { fetchBotInfo, fetchLightningAddress, fetchPrice, registerPayment } from "@/lib/api"
import { Spinner } from "@telegram-apps/telegram-ui"
import { useWallet } from "@/lib/walletContext"
import { useNavigate, useOutletContext } from "react-router-dom"
import { parse, PrepareLnurlPayResponse, SdkEvent } from "@breeztech/breez-sdk-spark/web"
import { toast } from "sonner"
import { openTelegramLink, retrieveLaunchParams } from "@telegram-apps/sdk-react"
import { addContact, listContacts, removeContact } from "@/lib/contact"
import { SearchContactForm } from "./TelegramSearchContact"
export const TelegramSendForm = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [contact, setContact] = useState("")
    const [search, setSearch] = useState("")
    const [address, setAddress] = useState("")
    const [fiatAmount, setFiatAmount] = useState<string | number>("")
    const [btcAmount, setBtcAmount] = useState(0)
    const [lookupError, setLookupError] = useState<string | null>(null)
    const [sendError, setSendError] = useState<string|null>(null)
    const [price, setPrice] = useState(0)
    const [prepareResponse, setPrepareResponse] = useState<PrepareLnurlPayResponse | undefined>(undefined)
    const [fees, setFees] = useState(0)
    const [loadingPayment, setLoadingPayment] = useState<null | string>(null)
    const [contacts, setContacts] = useState<string[]>([])

    const [btcBalance] = useOutletContext<any>()
    const [remaining, setRemaining] = useState(0)
    const [loadingAll, setLoadingAll] = useState(false)

    useEffect(() => {
        setLookupError(null)
        if (search == "" ||  !breezSdk) return
        const delayDebounceFn = setTimeout(async () => {
            const strippedContact = search.startsWith('@') 
                ? search.slice(1, search.length) 
                : search
            try {
                const response = await fetchLightningAddress(strippedContact)
                if (response.status == 200) {
                    const { address: lnUrl }  = await response.json()
                    setAddress(lnUrl)
                    const price = await fetchPrice(currency)
                    setPrice(price)
                    setContact(strippedContact.startsWith("+") ? strippedContact : `@${strippedContact}`)
                    // let contactSet = new Set(contacts)
                    // contactSet = contact.startsWith("+") ? contactSet.add(contact) : contactSet.add(`@${strippedContact}`)
                    // setContacts(Array.from(contactSet))
                    return
                }

                setContact("")
                setLookupError(t('wallet.telegram.notFound'))
            }
            catch(e) {
                setLookupError((e as Error).message)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [search])

    useEffect(() => {
        const loadContacts = async () => {
            const _contacts = await listContacts()
            setContacts(_contacts)
        }

        loadContacts()
    }, [])

    let debounceTimeout = useRef<number|undefined>(undefined);

    const handleAmountChange = (amount: number) => {
        setSendError(null)

        if (Number.isNaN(amount)) {
            setFiatAmount("")
            return
        }

        setFiatAmount(amount)

        if (amount == 0) {
            return
        }
        
        const btc = amount / price
        setBtcAmount(btc)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(async () => {
            try {
                setSendError(null)
                setLoadingPayment(t('walletSend.fetchingFees'))
                const input = await parse(address)
                if (input.type != 'lnurlPay') {
                    setLoadingPayment(null)
                    setSendError(t('wallet.invalidAddress'))
                    return
                }
               
                const prepareResponse = await breezSdk?.prepareLnurlPay({
                    amountSats: convertBtcToSats(btc),
                    payRequest: input,
                    comment: 'Pay via Brio'
                })
                setLoadingPayment(null)
                if (!prepareResponse) {
                    return
                }
                const feeSats = prepareResponse.feeSats
                setFees(feeSats)
                const reducedBtc = convertSatsToBtc(prepareResponse.amountSats + prepareResponse.feeSats)
                const remaining = btcBalance - reducedBtc
                setRemaining(remaining)
                if (remaining < 0) {
                    setSendError('Unsufficient funds')
                    return
                }
                setPrepareResponse(prepareResponse)
            }
            catch(e) {
                setLoadingPayment(null)
                const err = e as Error
                console.error(e)
                if (err.message == 'Lnurl error: error calling lnurl endpoint: Json error: data did not match any variant of untagged enum LnurlRequestDetails') {
                    setSendError('Lightning address not registered on Spark')
                    return
                }
                setSendError((e as Error).message)
            }
        }, 500)

        return () => clearTimeout(debounceTimeout.current)
    }

    const drain = async () => {
        setLoadingAll(true)
        const input = await parse(address)
        if (input.type != 'lnurlPay') {
            setLoadingAll(false)
            setSendError(t('wallet.invalidAddress'))
            return
        }

        try {
            let prepareResponse = await breezSdk?.prepareLnurlPay({
                amountSats: convertBtcToSats(btcBalance),
                payRequest: input
            })
            setLoadingAll(false)
            if (!prepareResponse) {
                return
    
            }
            const reducedBtc = btcBalance - convertSatsToBtc(prepareResponse.feeSats)
            handleAmountChange(parseFloat(formatFiatAmount(reducedBtc * price, 4)))
        }
        catch (e) {
            setLoadingAll(false)
            const error = e as Error
            setSendError(error.message)
        }

    }

    const handleSend = async () => {
        setSendError(null)
        setLoadingPayment(t('wallet.sendPaymentPending'))
        try {

            let listenerId: string | undefined

            class EventListener {
                async onEvent(event: SdkEvent) {
                    switch(event.type) {
                        case 'paymentSucceeded':
                            if (event.payment.paymentType == 'send' && event.payment.status == 'completed') {
                                if (event.payment.details?.type == 'lightning') {
                                    await registerPayment('lightning', event.payment.details.paymentHash, convertSatsToBtc(event.payment.amount), contact)
                                }
                                await addContact(contact)
                                await breezSdk?.removeEventListener(listenerId as string)
                                await new Promise(r => setTimeout(r, 1000));
                                setLoadingPayment(null)
                                navigate('/wallet/activity')
                            }
                            break
                        case 'paymentFailed':
                            if (event.payment.paymentType == 'send' && event.payment.status == 'failed') {
                                await breezSdk?.removeEventListener(listenerId as string)
                                setLoadingPayment(null)
                                setSendError(t('wallet.paymentFailed'))
                            }
                            break
                        default:
                            break
                    }
                }
            }

            listenerId = await breezSdk?.addEventListener(new EventListener())
            
            await breezSdk?.lnurlPay({
                prepareResponse: prepareResponse as PrepareLnurlPayResponse
            })
        }
        catch(e) {
            console.error(e)
            setLoadingPayment(null)
            setSendError((e as Error).message)
        }
    }

    const shareInvite = async () => {
        const tgData = retrieveLaunchParams()
        const startParam = new URLSearchParams()
        startParam.append('referral', tgData.tgWebAppData?.user?.id.toString() as string)
        const encodedStartParam = encodeURIComponent(startParam.toString())
        const botInfo = await fetchBotInfo()
        const miniappLink = `https://t.me/${botInfo.username}?startapp=${encodedStartParam}`;
        if (openTelegramLink.isAvailable()) {
            openTelegramLink(
                `https://t.me/share/url?url=${encodeURIComponent(miniappLink)}&text=${encodeURIComponent("Use Bitcoin on Telegram")}`
            )
        }
        else {
            navigator.clipboard.writeText(miniappLink)
            toast.info('Invitation link copied. Share it via Telegram manually')
        }
    }

    const [open, setOpen] = useState(false)

    const removeFavoriteContact = async (contact: string) => {
        await removeContact(contact)
        setContacts(await listContacts())
        setOpen(false)
    }

    return (
        <div className='flex flex-col gap-10 pt-10'>
            <div className='flex flex-col gap-1'>
                <Label className='text-gray-400 text-xs mb-5'>{t('wallet.telegram.contact')}</Label>
                <SearchContactForm 
                    placeholder={t('wallet.telegram.contact.placeholder')}
                    open={open}
                    handleOpen={setOpen}
                    handleSelection={setSearch}
                    handleShareInvite={shareInvite}
                    lookupError={lookupError}
                    contacts={contacts}
                    search={search}
                    contact={contact}
                    removeContact={removeFavoriteContact}
                />
            </div>

            { address != '' && price > 0 && !lookupError && 
                <div>
                    <div className="flex justify-between">
                        <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} ({currency})</Label>
                        <Button variant="outline" className="p-3 rounded-sm h-0 text-xs border-gray-200" onClick={drain}>
                            All
                            {loadingAll && <Spinner size="s" />}
                        </Button>
                    </div>
                    <Input 
                        type="number" 
                        inputMode="decimal"
                        min={0.01} 
                        step={0.01} 
                        value={fiatAmount} 
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
                        /> 
                    {fiatAmount != '' && <small>{formatBtcAmount(btcAmount)}  BTC</small>}
                </div>
            }
            {address != '' && !lookupError && 
                <div className="flex flex-col items-center">
                    {!loadingPayment &&
                        <div className="text-center flex flex-col gap-2 items-center">
                            {!sendError && <Button className="w-40" onClick={() => handleSend()}>{t('wallet.sendButton')}</Button>}
                            {fees > 0 && 
                                <div>
                                    <p className="text-xs">{t('fees')}: {formatBtcAmount(convertSatsToBtc(fees))} BTC / {formatFiatAmount(convertSatsToBtc(fees) * price)} {currency}</p>
                                    <p className="text-xs">{t('remaining')} : {formatBtcAmount(remaining)} BTC / {formatFiatAmount(remaining * price)} {currency}</p>
                                </div>
                            }
                        </div>}
                    {loadingPayment && 
                            <div className='flex flex-col items-center gap-2'>
                                <Spinner size="s"/>
                                <p className="text-xs">{loadingPayment}</p>
                            </div>}
                    { sendError &&
                        <p className="text-red-500 text-sm italic mt-2">{sendError}</p>
                    }
                </div>
            }

        </div>
    )
}