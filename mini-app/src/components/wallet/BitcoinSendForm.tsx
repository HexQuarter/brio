import { LuCopy, LuScanLine } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef} from "react";
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { t } from "i18next";
import { Button } from "@/components/ui/button"
import { convertSatsToBtc, convertBtcToSats, formatBtcAmount, formatFiatAmount } from "@/helpers/number";
import { useWallet } from "@/lib/walletContext";
import { InputType, PrepareLnurlPayResponse, PrepareSendPaymentResponse, SendPaymentOptions } from "@breeztech/breez-sdk-spark";
import { Spinner } from "@telegram-apps/telegram-ui";
import { useNavigate } from "react-router-dom";
import { parse } from "@breeztech/breez-sdk-spark/web";


export const BitcoinSendForm  = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [address, setAddress] = useState("")
    const [price, setPrice] = useState(0)
    const [fiatAmount, setFiatAmount] = useState(0)
    const [btcAmount, setBtcAmount] = useState(0)
    const [prepareResponse, setPrepareResponse] = useState<
        PrepareLnurlPayResponse | 
        PrepareSendPaymentResponse | 
        undefined
    >(undefined) 

    const [scanner, setScanner] = useState(false)
    const [parseAddressError, setParseAddressError] = useState<string|null>(null)
    const [sendError, setSendError] = useState<string|null>(null)
    const [inputType, setInputType] = useState<InputType | null>(null)
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
                const inputType = await parse(address)
                if (inputType.type != 'bitcoinAddress' && 
                    inputType.type != 'lightningAddress' && 
                    inputType.type != 'lnurlPay' && 
                    inputType.type != 'bolt11Invoice') {
                    setParseAddressError(t('wallet.addressUnknown'))
                    return
                }
                setInputType(inputType)
               
                const fiatRates = await breezSdk?.listFiatRates()
                const rate = fiatRates?.rates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)

                if (inputType.type == 'bolt11Invoice'){
                    if (inputType.amountMsat) {
                        handleAmountChange(inputType.amountMsat * 0.00000000001 * price)
                    }
                }
            }
            catch(e) {
                setParseAddressError((e as Error).message)
            }
        }   
        if (breezSdk && address != '') {
            handleAddressChange(address)
        }

    }, [breezSdk, address])

    let debounceTimeout = useRef<number|undefined>(undefined);

    const handleAmountChange = async (amount: number) => {
        setSendError(null)

        if (amount == 0 && price > 0) return
        if (Number.isNaN(amount)) {
            setFiatAmount(0)
            return
        }

        setFiatAmount(amount)
        const btc = amount / price
        setBtcAmount(btc)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(async () => {
            setLoadingPayment(true)

            try {
                if (!inputType) return
                switch(inputType.type) {
                    case "lnurlPay":
                        {const prepareResponse = await breezSdk?.prepareLnurlPay({
                            amountSats: convertBtcToSats(btc),
                            payRequest: inputType,
                        })
                        setLoadingPayment(false)
                        if (!prepareResponse) {
                            throw new Error('Unable to prepare LNURL payment')
                        }
                        const feeSats = prepareResponse.feeSats
                        setFees(feeSats)
                        setPrepareResponse(prepareResponse)}
                        break
                    case "lightningAddress":
                        {const prepareResponse = await breezSdk?.prepareLnurlPay({
                            amountSats: convertBtcToSats(btcAmount),
                            payRequest: inputType.payRequest,
                        })

                        if (!prepareResponse) {
                            throw new Error('Unable to prepare lightning payment')
                        }
                        const feeSats = prepareResponse.feeSats
                        setFees(feeSats)
                        setPrepareResponse(prepareResponse)}
                        break
                    case "bitcoinAddress":
                        {const prepareResponse = await breezSdk?.prepareSendPayment({
                            paymentRequest: inputType.address,
                            amountSats: convertBtcToSats(btcAmount)
                        })
                         if (!prepareResponse) {
                            throw new Error('Unable to prepare Bitcoin payment')
                        }
                        if (prepareResponse.paymentMethod.type === 'bitcoinAddress') {
                            const feeQuote = prepareResponse.paymentMethod.feeQuote
                            const fastFeeSats = feeQuote.speedFast.userFeeSat + feeQuote.speedFast.l1BroadcastFeeSat
                            setFees(fastFeeSats)
                            setPrepareResponse(prepareResponse)
                            setLoadingPayment(false)
                        }
                        }
                        break
                    case "bolt11Invoice":
                        const prepareResponse = await breezSdk?.prepareSendPayment({
                            paymentRequest: inputType.invoice.bolt11,
                            amountSats: inputType.amountMsat ? undefined : convertBtcToSats(btcAmount)
                        })
                         if (!prepareResponse) {
                            throw new Error('Unable to prepare Bolt11 payment')
                        }
                        setPrepareResponse(prepareResponse)
                }
            }
            catch(e) {
                console.log(e)
                setLoadingPayment(false)
                setSendError((e as Error).message)
            }
            finally {
                setLoadingPayment(false)
            }
        }, 500)

        return () => clearTimeout(debounceTimeout.current)
    }

    const handleSend = async () => {
        setSendError(null)
        setLoadingPayment(true)
        try {
            if (!inputType && !prepareResponse) return
            switch(inputType?.type) {
                case "lnurlPay":
                    await breezSdk?.lnurlPay({
                        prepareResponse: prepareResponse as PrepareLnurlPayResponse
                    })
                    setLoadingPayment(false)
                    navigate('/wallet/activity')
                    break
                case "lightningAddress":
                    await breezSdk?.lnurlPay({
                        prepareResponse: prepareResponse as PrepareLnurlPayResponse
                    })
                    navigate('/wallet/activity')
                    break
                case "bitcoinAddress":
                    {
                        const options: SendPaymentOptions = {
                            type: 'bitcoinAddress',
                            confirmationSpeed: 'fast'
                        }
                        await breezSdk?.sendPayment({
                            prepareResponse: prepareResponse as PrepareSendPaymentResponse,
                            options
                        })
                        navigate('/wallet/activity')
                    }
                    break
                case "bolt11Invoice":
                    {
                        const options: SendPaymentOptions = {
                            type: 'bolt11Invoice',
                            preferSpark: false,
                            completionTimeoutSecs: 10
                        }
                        await breezSdk?.sendPayment({
                            prepareResponse: prepareResponse as PrepareSendPaymentResponse,
                            options
                        })
                        navigate('/wallet/activity')
                    }
            }
        }
        catch(e) {
            setLoadingPayment(false)
            setSendError((e as Error).message)
        }
        finally{
            setLoadingPayment(false)
        }
    }

    return (
        <div className='flex flex-col gap-10 pt-10 '>
            <div>
                <Label htmlFor="address" className='text-gray-400'>{t('wallet.address')}</Label>
                <div className="flex flex-col gap-2">
                    <div className='flex items-center gap-5 border-b border-gray-200 hover:border-primary'>
                        <Input 
                            id="address" 
                            placeholder={t('wallet.bitcoin.address.placeholder')} 
                            value={address} 
                            inputMode='decimal'
                            onChange={(e) => setAddress(e.target.value)} 
                            autoCorrect="false"
                            autoCapitalize="false"
                            spellCheck="false"/>
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
                    <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} ({currency})</Label>
                    <Input 
                        type="number" 
                        min={0} 
                        step={0.001} 
                        value={fiatAmount} 
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value))} /> 
                    <small>{formatBtcAmount(btcAmount)} BTC</small>
                </div>
            }
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
        </div>
    )
}