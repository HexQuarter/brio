import { useEffect, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number"
import { fetchUserInfo } from "@/lib/api"
import { toast } from "sonner"
import { Spinner } from "@telegram-apps/telegram-ui"
import { useWallet } from "@/lib/useWallet"
import { useNavigate } from "react-router-dom"
import { PayAmount, SdkEvent } from "@breeztech/breez-sdk-liquid/web"

export const TelegramSendForm = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [handle, setHandle] = useState("")
    // const [phoneNumber, setPhoneNumber] = useState("")
    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(0)
    const [lookupError, setLookupError] = useState<string | null>(null)
    const [sendError, setSendError] = useState<string|null>(null)
    const [amountError, setAmountError] = useState<string | null>(null)
    const [min, setMin] = useState(0)
    const [max, setMax] = useState(0)
    const [price, setPrice] = useState(0)
    const [fees, setFees] = useState(0)
    const [loadingPayment, setLoadingPayment] = useState(false)

    useEffect(() => {
        setLookupError(null)
        if (handle == "" || !breezSdk) return
        const delayDebounceFn = setTimeout(async () => {
            const response = await fetchUserInfo(handle)
            if (response.status == 200) {
                const { user: userInfo }  = await response.json()
                setAddress(userInfo.breezBolt12Offer)

                const fiatRates = await breezSdk.fetchFiatRates()
                if (!fiatRates) return
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)
                const limits = await breezSdk.fetchLightningLimits()
                setMin(limits.send.minSat)
                setMax(limits.send.maxSat)

                return
            }

            setLookupError(t('wallet.telegram.notFound'))
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [handle])

    useEffect(() => {
            setAmountError(null)
            setSendError(null)
            if(Number.isNaN(amount)) {
                setAmountError(`${t('wallet.minIs')} ${formatFiatAmount(convertSatsToBtc(min) * price)} ${currency}`)
                return
            }
    
            if (amount < min) {
                setAmountError(`${t('wallet.minIs')} ${formatFiatAmount(convertSatsToBtc(min) * price)} ${currency}`)
                return 
            }
    
            if (amount > max) {
                setAmountError(`${t('wallet.maxIs')} ${formatFiatAmount(convertSatsToBtc(max) * price)} ${currency}`)
                return 
            }
    
            const loadFee = async (amount: number) => {
                try{
                    const payAmount: PayAmount = {
                        type: 'bitcoin',
                        receiverAmountSat: amount
                    }
                    const prepareResponse = await breezSdk?.prepareSendPayment({
                        destination: address,
                        amount: payAmount
                    })
                    if (!prepareResponse || !prepareResponse.feesSat) return
                    setFees(prepareResponse.feesSat)
                }
                catch(e) {
                    setSendError((e as Error).message)
                }
            }

            loadFee(amount)
    }, [amount])

    const handleSend = async () => {
        setSendError(null)
        try {
            const payAmount: PayAmount = {
                type: 'bitcoin',
                receiverAmountSat: amount
            }
            const prepareResponse = await breezSdk?.prepareSendPayment({
                destination: address,
                amount: payAmount
            })
            if (!prepareResponse) {
                setSendError(t('wallet.unablePrepareBolt12'))
                return 
            }

            let listenerId: string | undefined
            class EventListener {
                onEvent = (event: SdkEvent) => {
                    switch(event.type) {
                        case "paymentPending":
                            setLoadingPayment(true)
                            break
                        case "paymentSucceeded":
                            setLoadingPayment(false)
                            breezSdk?.removeEventListener(listenerId as string)
                            navigate('/wallet/activity')
                            break
                        case "paymentFailed":
                            setLoadingPayment(false)
                            breezSdk?.removeEventListener(listenerId as string)
                            break
                        default:
                            console.error('Unhandle event', event.type)
                    }
                }
            }

            listenerId = await breezSdk?.addEventListener(new EventListener())

            const sendResponse = await breezSdk?.sendPayment({
                prepareResponse
            })
            if (!sendResponse) {
                setSendError(t('wallet.unableSendBolt12'))
                return 
            }
        }
        catch(e) {
            setSendError((e as Error).message)
        }
    }

    return (
        <div className='flex flex-col gap-10 pt-10'>
            <div className='flex flex-col gap-1'>
                <Label htmlFor="handle" className='text-gray-400'>{t('wallet.telegram.handle')}</Label>
                <Input id='handle' placeholder={t('wallet.telegram.handle.placeholder')} value={handle} onChange={(e) => setHandle(e.target.value)}/>
                { lookupError &&
                    <p className="text-red-500 text-sm italic mt-2">{lookupError}</p>
                }
            </div>
            
            {/* <div>
                <Label htmlFor="phone" className='text-gray-400'>{t('wallet.telegram.phoneNumber')}</Label>
                <Input id='phone' placeholder={t('wallet.telegram.phoneNumber.placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
            </div> */}

            { address != '' && price > 0 && !lookupError && 
                <div>
                    <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')}</Label>
                    <Slider min={min} max={max} onValueChanged={setAmount} value={amount} price={price} currency={currency} error={amountError}/>
                </div>
            }
            {!amountError && address != '' && !lookupError && 
                <div className="flex flex-col items-center">
                    {!loadingPayment && !sendError && 
                        <div className="text-center flex flex-col gap-2 items-center">
                            <Button className="w-40" onClick={() => handleSend()}>Send</Button>
                            {fees > 0 && <p className="text-xs">Fees: {formatBtcAmount(convertSatsToBtc(fees))} BTC / {formatFiatAmount(convertSatsToBtc(fees) * price)} {currency}</p>}
                        </div>}
                    {loadingPayment && <Spinner size="s"/>}
                    { sendError &&
                        <p className="text-red-500 text-sm italic mt-2">{sendError}</p>
                    }
                </div>
            }

        </div>
    )
}