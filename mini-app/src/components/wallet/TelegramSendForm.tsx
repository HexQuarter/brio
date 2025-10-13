import { useEffect, useRef, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { convertBtcToSats, convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number"
import { fetchLightningAddress, registerPayment } from "@/lib/api"
import { Spinner } from "@telegram-apps/telegram-ui"
import { useWallet } from "@/lib/walletContext"
import { useNavigate, useOutletContext } from "react-router-dom"
import { parse, PrepareLnurlPayResponse, SdkEvent } from "@breeztech/breez-sdk-spark/web"
import { toast } from "sonner"
import { openTelegramLink, retrieveLaunchParams } from "@telegram-apps/sdk-react"
import { addContact, listContacts } from "@/lib/contact"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

export const TelegramSendForm = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [handle, setHandle] = useState("")
    // const [phoneNumber, setPhoneNumber] = useState("")
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
        if (handle == "" || !breezSdk) return
        const delayDebounceFn = setTimeout(async () => {
            const strippedHandle = handle.startsWith('@') ? handle.slice(1, handle.length) : handle
            try {
                const response = await fetchLightningAddress(strippedHandle)
                if (response.status == 200) {
                    const { address: lnUrl }  = await response.json()
                    setAddress(lnUrl)

                    const fiatRates = await breezSdk?.listFiatRates()
                    const rate = fiatRates?.rates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                    if (!rate) return
                    setPrice(rate.value)
                    const contactSet = new Set(contacts).add(`@${strippedHandle}`)
                    
                    setContacts(Array.from(contactSet))
                    return
                }

                setLookupError(t('wallet.telegram.notFound'))
            }
            catch(e) {
                setLookupError((e as Error).message)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [handle])

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
                                    await registerPayment(handle, event.payment.details.paymentHash)
                                }
                                await addContact(handle)
                                await breezSdk?.removeEventListener(listenerId as string)
                                toast(t('wallet.sendPaymentSucceeded'))
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
        const miniappLink = `https://t.me/brio_dev_bot?startapp=${encodedStartParam}`;
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

    return (
        <div className='flex flex-col gap-10 pt-10'>
            <div className='flex flex-col gap-1'>
                <Label htmlFor="handle" className='text-gray-400'>{t('wallet.telegram.handle')}</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger className="flex">
                        <Button
                            variant="ghost"
                            role="combobox"
                            aria-expanded={open}
                            className="font-light"
                        >
                            {handle
                                ? contacts.find((contact) => contact === handle)
                                : t('wallet.telegram.handle.placeholder')}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="">
                    <Command>
                        <CommandInput placeholder={t('wallet.telegram.handle.placeholder')}  className="h-9" onValueChange={setHandle}/>
                        <CommandList>
                            <CommandEmpty>{ lookupError && 
                                <>
                                    <p className="text-red-500 text-sm italic mt-2">{lookupError}</p>
                                    <Button variant="link" className="p-0 text-sm italic" onClick={() => shareInvite()}>Share an invitation</Button>
                                </>
                            }</CommandEmpty>
                            <CommandGroup heading="Favourites">
                                {contacts.map((contact) => (
                                    <CommandItem
                                    key={contact}
                                    value={contact}
                                    onSelect={(currentValue) => {
                                        setHandle(currentValue === handle ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                    >
                                    {contact}
                                    <Check
                                        className={`ml-auto ${handle === contact ? "opacity-100" : "opacity-0"}`}
                                    />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            
            {/* <div>
                <Label htmlFor="phone" className='text-gray-400'>{t('wallet.telegram.phoneNumber')}</Label>
                <Input id='phone' placeholder={t('wallet.telegram.phoneNumber.placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
            </div> */}

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
                            {!sendError && <Button className="w-40" onClick={() => handleSend()}>Send</Button>}
                            {fees > 0 && 
                                <div>
                                    <p className="text-xs">Fees: {formatBtcAmount(convertSatsToBtc(fees))} BTC / {formatFiatAmount(convertSatsToBtc(fees) * price)} {currency}</p>
                                    <p className="text-xs">Remaining : {formatBtcAmount(remaining)} BTC / {formatFiatAmount(remaining * price)} {currency}</p>
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