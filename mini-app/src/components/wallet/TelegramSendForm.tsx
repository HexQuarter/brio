import { useEffect, useRef, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { convertBtcToSats, convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number"
import { fetchUserInfo, registerPayment } from "@/lib/api"
import { Spinner } from "@telegram-apps/telegram-ui"
import { useWallet } from "@/lib/walletContext"
import { useNavigate } from "react-router-dom"
import { parse, PrepareLnurlPayResponse, SdkEvent } from "@breeztech/breez-sdk-spark/web"
import { toast } from "sonner"
import { openTelegramLink } from "@telegram-apps/sdk-react"

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

    useEffect(() => {
        setLookupError(null)
        if (handle == "" || !breezSdk) return
        const delayDebounceFn = setTimeout(async () => {
            const strippedHandle = handle.startsWith('@') ? handle.slice(1, handle.length) : handle
            try {
                const response = await fetchUserInfo(strippedHandle)
                if (response.status == 200) {
                    const { user: userInfo }  = await response.json()
                    setAddress(userInfo.breezLnUrl)

                    const fiatRates = await breezSdk?.listFiatRates()
                    const rate = fiatRates?.rates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                    if (!rate) return
                    setPrice(rate.value)

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
                setLoadingPayment(null)
                setPrepareResponse(prepareResponse)
            }
            catch(e) {
                console.error(e)
                setLoadingPayment(null)
                setSendError((e as Error).message)
            }
        }, 500)

        return () => clearTimeout(debounceTimeout.current)
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

    const shareInvite = () => {
        const link = 'https://t.me/brio_dev_bot'
        if (openTelegramLink.isAvailable()) {
            openTelegramLink(
                `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Use Bitcoin on Telegram")}`
            )
        }
        else {
            navigator.clipboard.writeText(link)
            toast.info('Invitation link copied. Share it via Telegram manually')
        }
    }

    return (
        <div className='flex flex-col gap-10 pt-10'>
            <div className='flex flex-col gap-1'>
                <Label htmlFor="handle" className='text-gray-400'>{t('wallet.telegram.handle')}</Label>
                <Input id='handle' 
                    placeholder={t('wallet.telegram.handle.placeholder')} 
                    value={handle} 
                    onChange={(e) => setHandle(e.target.value)}
                    autoCorrect="false"
                    autoCapitalize="false"
                    spellCheck="false"
                    autoComplete="false"
                    />
                { lookupError &&
                    <div>
                        <p className="text-red-500 text-sm italic mt-2">{lookupError}</p>
                        <Button variant="link" className="p-0 text-sm italic" onClick={() => shareInvite()}>Share an invitation</Button>
                    </div>
                }
            </div>
            
            {/* <div>
                <Label htmlFor="phone" className='text-gray-400'>{t('wallet.telegram.phoneNumber')}</Label>
                <Input id='phone' placeholder={t('wallet.telegram.phoneNumber.placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
            </div> */}

            { address != '' && price > 0 && !lookupError && 
                <div>
                    <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} ({currency})</Label>
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
                    {!loadingPayment && !sendError && 
                        <div className="text-center flex flex-col gap-2 items-center">
                            <Button className="w-40" onClick={() => handleSend()}>Send</Button>
                            {fees > 0 && <p className="text-xs">Fees: {formatBtcAmount(convertSatsToBtc(fees))} BTC / {formatFiatAmount(convertSatsToBtc(fees) * price)} {currency}</p>}
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