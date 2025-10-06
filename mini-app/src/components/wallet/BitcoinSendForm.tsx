import { LuCopy, LuScanLine } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect} from "react";
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { t } from "i18next";
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider";
import { convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number";
import { useWallet } from "@/lib/useWallet";
import { InputType, PayAmount, SdkEvent } from "@breeztech/breez-sdk-liquid/web";
import { toast } from "sonner";
import { Spinner } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";


export const BitcoinSendForm  = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(0)
    const [scanner, setScanner] = useState(false)
    const [parseAddressError, setParseAddressError] = useState<string|null>(null)
    const [sendError, setSendError] = useState<string|null>(null)
    const [inputType, setInputType] = useState<InputType | null>(null)
    const [amountError, setAmountError] = useState<string | null>(null)
    const [min, setMin] = useState(0)
    const [max, setMax] = useState(0)
    const [price, setPrice] = useState(0)
    const [fees, setFees] = useState(0)
    const [loadingPayment, setLoadingPayment] = useState(false)

    const pasteAddress = async () => {
        const text = await navigator.clipboard.readText();
        setAddress(text)
    }

    const onScannerResult = (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length == 0) {
            return
        }
        setAddress(detectedCodes[0].rawValue)
        setScanner(false)
    }

    useEffect(() => {
        const handleAddressChange = async (address: string) => {
            setParseAddressError(null)
            try {
                const inputType = await breezSdk?.parse(address)
                if (!inputType) {
                    setParseAddressError(t('wallet.invalidAddress'))
                    return
                }
                if (inputType.type != "bitcoinAddress" && inputType.type != 'bolt11' && inputType.type != 'bolt12Offer') {
                    setParseAddressError(t('wallet.addressUnknown'))
                    return
                }
                if (!breezSdk) return

                setInputType(inputType)
               
                const fiatRates = await breezSdk.fetchFiatRates()

                if (!fiatRates) return

                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)

                if (inputType.type == 'bitcoinAddress') {
                    const limits = await breezSdk.fetchOnchainLimits()
                    setMin(limits.send.minSat)
                    setMax(limits.send.maxSat)
                }
                else {
                    const limits = await breezSdk.fetchLightningLimits()
                    setMin(limits.send.minSat)
                    setMax(limits.send.maxSat)
                }
            }
            catch(e) {
                setParseAddressError((e as Error).message)
            }
        }   
        if (address != '') {
            handleAddressChange(address)
        }

    }, [address])

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
            if (!inputType) return
            try {
                switch(inputType.type) {
                    case "bitcoinAddress":
                        const prepareResponse = await breezSdk?.preparePayOnchain({
                            amount: {
                                type: 'bitcoin',
                                receiverAmountSat: amount
                            }
                        })

                        if (!prepareResponse) return
                        setFees(prepareResponse.totalFeesSat)
                        break
                    case "bolt11":
                        {
                            const prepareResponse = await breezSdk?.prepareSendPayment({
                                destination: address,
                            })
                            if (!prepareResponse || !prepareResponse.feesSat) return
                            setFees(prepareResponse.feesSat)
                            break
                        }
                    case "bolt12Offer":
                        {
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
                            break
                        }
                }
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
            if (!inputType) return
            switch(inputType.type) {
                case "bitcoinAddress":
                    const prepareResponse = await breezSdk?.preparePayOnchain({
                        amount: {
                            type: 'bitcoin',
                            receiverAmountSat: amount
                        }
                    })
                    if (!prepareResponse) {
                        setSendError(t('wallet.unablePrepareBitcoin'))
                        return 
                    }
                    const payOnchainRes = await breezSdk?.payOnchain({
                        address: address,
                        prepareResponse
                    })
                    if (!payOnchainRes) {
                        setSendError(t('wallet.unableSendBitcoin'))
                        return 
                    }
                    console.log("fees", payOnchainRes.payment.feesSat)
                    break;
                case "bolt11":
                    {
                        const prepareResponse = await breezSdk?.prepareSendPayment({
                            destination: address,
                        })
                        if (!prepareResponse) {
                             setSendError(t('wallet.unablePrepareBolt11'))
                            return 
                        }
                        const sendResponse = await breezSdk?.sendPayment({
                            prepareResponse
                        })
                        if (!sendResponse) {
                            setSendError(t('wallet.unableSendBolt11'))
                            return 
                        }
                        console.log("fees", sendResponse.payment.feesSat)
                        console.log(sendResponse)
                    }
                    break;
                case "bolt12Offer":
                    {
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

                        breezSdk?.addEventListener(new EventListener())

                        const sendResponse = await breezSdk?.sendPayment({
                            prepareResponse
                        })
                        if (!sendResponse) {
                            setSendError(t('wallet.unableSendBolt12'))
                            return 
                        }
                    }
                    break;
                default:
                    setSendError(t('wallet.addressUnknown'))
            }
        }
        catch(e) {
            setSendError((e as Error).message)
        }
    }

    return (
        <div className='flex flex-col gap-10 pt-10 '>
            <div>
                <Label htmlFor="address" className='text-gray-400'>{t('wallet.address')}</Label>
                <div className="flex flex-col gap-2">
                    <div className='flex items-center gap-5 border-b border-gray-200 hover:border-primary'>
                        <Input id="address" placeholder={t('wallet.bitcoin.address.placeholder')} className='border-none' value={address} onChange={(e) => setAddress(e.target.value)} />
                        <LuCopy className="w-5 h-5" onClick={() => pasteAddress()}/>
                        <LuScanLine className="w-5 h-5" onClick={() => setScanner(true)}/>
                    </div>
                    { parseAddressError &&
                        <p className="text-red-500 text-sm italic mt-2">{parseAddressError}</p>
                    }
                </div>
                {scanner && <Scanner onScan={onScannerResult} />}
            </div>
            
            { inputType && price > 0 && 
                <div>
                    <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')}</Label>
                    <Slider min={min} max={max} onValueChanged={setAmount} value={amount} price={price} currency={currency} error={amountError}/>
                </div>
            }
            {!amountError &&
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