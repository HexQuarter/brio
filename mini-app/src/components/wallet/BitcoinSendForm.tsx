import { LuCopy, LuScanLine } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef} from "react";
import { t } from "i18next";
import { Button } from "@/components/ui/button"
import { convertSatsToBtc, convertBtcToSats, formatBtcAmount, formatFiatAmount } from "@/helpers/number";
import { useWallet } from "@/lib/walletContext";
import { InputType, PrepareLnurlPayResponse, PrepareSendPaymentResponse, SendPaymentOptions } from "@breeztech/breez-sdk-spark";
import { Spinner } from "@telegram-apps/telegram-ui";
import { useNavigate, useOutletContext } from "react-router-dom";
import { parse } from "@breeztech/breez-sdk-spark/web";
import { openQrScanner } from "@telegram-apps/sdk-react";
import { fetchPrice } from "@/lib/api";


export const BitcoinSendForm  = () => {
    const navigate = useNavigate()
    const { breezSdk, currency } = useWallet()
    const [address, setAddress] = useState("")
    const [price, setPrice] = useState(0)
    const [fiatAmount, setFiatAmount] = useState<string | number>("")
    const [btcAmount, setBtcAmount] = useState(0)
    const [prepareResponse, setPrepareResponse] = useState<
        PrepareLnurlPayResponse | 
        PrepareSendPaymentResponse | 
        undefined
    >(undefined) 

    // const [scanner, setScanner] = useState(false)
    const [parseAddressError, setParseAddressError] = useState<string|null>(null)
    const [sendError, setSendError] = useState<string|null>(null)
    const [inputType, setInputType] = useState<InputType | null>(null)
    const [fees, setFees] = useState(0)
    const [loadingPayment, setLoadingPayment] = useState<string | null>(null)

    const [btcBalance] = useOutletContext<any>()
    const [remaining, setRemaining] = useState(0)
    const [loadingAll, setLoadingAll] = useState(false)

    const pasteAddress = async () => {
        const text = await navigator.clipboard.readText();
        setAddress(text)
    }

    const showScanner = async () => {
        const result = await openQrScanner()
        if (result) {
            setAddress(result)
        }
    }

    // const onScannerResult = (detectedCodes: IDetectedBarcode[]) => {
    //     if (detectedCodes.length == 0) {
    //         return
    //     }
    //     setAddress(detectedCodes[0].rawValue)
    //     setScanner(false)
    // }

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
               
                const price = await fetchPrice(currency)
                setPrice(price)

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
        if (Number.isNaN(amount)) {
            setFiatAmount("")
            return
        }
        if (amount == 0) {
            return
        }

        setFiatAmount(amount)
        const btc = amount / price
        setBtcAmount(btc)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(async () => {
            try {
                setLoadingPayment(t('walletSend.fetchingFees'))
                if (!inputType) return
                switch(inputType.type) {
                    case "lnurlPay":
                        {const prepareResponse = await breezSdk?.prepareLnurlPay({
                            amountSats: convertBtcToSats(btc),
                            payRequest: inputType,
                        })
                        setLoadingPayment(null)
                        if (!prepareResponse) {
                            throw new Error('Unable to prepare LNURL payment')
                        }
                        const feeSats = prepareResponse.feeSats
                        setFees(feeSats)
                        const remaining = btcBalance - (btc - convertSatsToBtc(feeSats))
                        setRemaining(remaining)
                        if (remaining < 0) {
                            setSendError('Unsufficient funds')
                            return
                        }
                        setPrepareResponse(prepareResponse)}
                        break
                    case "lightningAddress":
                        {const prepareResponse = await breezSdk?.prepareLnurlPay({
                            amountSats: convertBtcToSats(btc),
                            payRequest: inputType.payRequest,
                        })

                        if (!prepareResponse) {
                            throw new Error('Unable to prepare lightning payment')
                        }
                        const feeSats = prepareResponse.feeSats
                        setFees(feeSats)
                        const remaining = btcBalance - (btc - convertSatsToBtc(feeSats))
                        setRemaining(remaining)
                        if (remaining < 0) {
                            setSendError('Unsufficient funds')
                            return
                        }
                        setPrepareResponse(prepareResponse)}
                        break
                    case "bitcoinAddress":
                        {const prepareResponse = await breezSdk?.prepareSendPayment({
                            paymentRequest: inputType.address,
                            amountSats: convertBtcToSats(btc)
                        })
                         if (!prepareResponse) {
                            throw new Error('Unable to prepare Bitcoin payment')
                        }
                        if (prepareResponse.paymentMethod.type === 'bitcoinAddress') {
                            const feeQuote = prepareResponse.paymentMethod.feeQuote
                            const fastFeeSats = feeQuote.speedFast.userFeeSat + feeQuote.speedFast.l1BroadcastFeeSat
                            setFees(fastFeeSats)
                            const remaining = btcBalance - (btc - convertSatsToBtc(fastFeeSats))
                            setRemaining(remaining)
                            if (remaining < 0) {
                                setSendError('Unsufficient funds')
                                return
                            }
                            setPrepareResponse(prepareResponse)
                            setLoadingPayment(null)
                        }
                        }
                        break
                    case "bolt11Invoice":
                        const prepareResponse = await breezSdk?.prepareSendPayment({
                            paymentRequest: inputType.invoice.bolt11,
                            amountSats: inputType.amountMsat ? undefined : convertBtcToSats(btc)
                        })
                         if (!prepareResponse) {
                            throw new Error('Unable to prepare Bolt11 payment')
                        }
                        if (prepareResponse.paymentMethod.type === 'bolt11Invoice') {
                            const feeQuote = prepareResponse.paymentMethod.lightningFeeSats + (prepareResponse.paymentMethod.sparkTransferFeeSats || 0)
                            setFees(feeQuote)
                            const reducedBtc = convertSatsToBtc(prepareResponse.amountSats + feeQuote)
                            const remaining = btcBalance - reducedBtc
                            if (remaining < 0) {
                                setSendError('Unsufficient funds')
                                return
                            }
                            setPrepareResponse(prepareResponse)
                            setLoadingPayment(null)
                        }
                        setPrepareResponse(prepareResponse)
                }
            }
            catch(e) {
                console.log(e)
                setLoadingPayment(null)
                setSendError((e as Error).message)
            }
            finally {
                setLoadingPayment(null)
            }
        }, 500)

        return () => clearTimeout(debounceTimeout.current)
    }

    const drain = async () => {
        setLoadingAll(true)
        const inputType = await parse(address)
        if (!inputType) {
            setLoadingAll(false)
            return
        }
        let fees = 0
        try {
            switch(inputType.type) {
                case "lnurlPay":
                    const lnUrlPayPrepareResponse = await breezSdk?.prepareLnurlPay({
                        amountSats: convertBtcToSats(btcBalance),
                        payRequest: inputType,
                    })
                    if (lnUrlPayPrepareResponse) {
                        fees = lnUrlPayPrepareResponse.feeSats
                    }
                    break
                case "lightningAddress":
                    const lnPrepareResponse = await breezSdk?.prepareLnurlPay({
                        amountSats: convertBtcToSats(btcBalance),
                        payRequest: inputType.payRequest,
                    })
                    if (lnPrepareResponse) {
                        fees = lnPrepareResponse.feeSats
                    }
                    break
                case "bitcoinAddress":
                    const btcPrepareResponse = await breezSdk?.prepareSendPayment({
                        paymentRequest: inputType.address,
                        amountSats: convertBtcToSats(btcBalance)
                    })
                     if (btcPrepareResponse && btcPrepareResponse.paymentMethod.type === 'bitcoinAddress') {
                        const feeQuote = btcPrepareResponse.paymentMethod.feeQuote
                        const fastFeeSats = feeQuote.speedFast.userFeeSat + feeQuote.speedFast.l1BroadcastFeeSat
                        fees = fastFeeSats
                     }
                    break
                case "bolt11Invoice":
                    const bolt11PrepareResponse = await breezSdk?.prepareSendPayment({
                        paymentRequest: inputType.invoice.bolt11,
                        amountSats: inputType.amountMsat ? undefined : convertBtcToSats(btcBalance)
                    })
                    if (bolt11PrepareResponse && bolt11PrepareResponse.paymentMethod.type === 'bolt11Invoice') {
                        fees = bolt11PrepareResponse.paymentMethod.lightningFeeSats + (bolt11PrepareResponse.paymentMethod.sparkTransferFeeSats || 0)
                    }
                    break
            }
            setLoadingAll(false)
            if (fees == 0) {
                return
            }
            const reducedBtc = btcBalance - convertSatsToBtc(fees)
            await handleAmountChange(parseFloat(formatFiatAmount(reducedBtc * price, 4)))
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
            if (!inputType && !prepareResponse) return
            switch(inputType?.type) {
                case "lnurlPay":
                    await breezSdk?.lnurlPay({
                        prepareResponse: prepareResponse as PrepareLnurlPayResponse
                    })
                    setLoadingPayment(null)
                    navigate('/wallet/activity')
                    break
                case "lightningAddress":
                    await breezSdk?.lnurlPay({
                        prepareResponse: prepareResponse as PrepareLnurlPayResponse
                    })
                    setLoadingPayment(null)
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
                        setLoadingPayment(null)
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
                        setLoadingPayment(null)
                        navigate('/wallet/activity')
                    }
            }
        }
        catch(e) {
            setLoadingPayment(null)
            setSendError((e as Error).message)
        }
        finally{
            setLoadingPayment(null)
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
                            type="text"
                            placeholder={t('wallet.bitcoin.address.placeholder')} 
                            value={address} 
                            onChange={(e) => setAddress(e.target.value)} 
                            autoCorrect="false"
                            autoCapitalize="false"
                            spellCheck="false"/>
                        <LuCopy className="w-5 h-5" onClick={() => pasteAddress()}/>
                        <LuScanLine className="w-5 h-5" onClick={() => showScanner()}/>
                    </div>
                    { parseAddressError &&
                        <p className="text-red-500 text-sm italic mt-2">{parseAddressError}</p>
                    }
                </div>
                {/* {scanner && <Scanner onScan={onScannerResult} />} */}
            </div>
            
            { inputType && price > 0 && 
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
                        min={0} 
                        step={0.001} 
                        inputMode='decimal'
                        value={fiatAmount} 
                        onChange={(e) => handleAmountChange(parseFloat(e.target.value))} /> 
                    <small>{formatBtcAmount(btcAmount)} BTC</small>
                </div>
            }
            <div className="flex flex-col items-center">
                {!loadingPayment &&
                    <div className="text-center flex flex-col gap-2 items-center">
                        {!sendError && <Button className="w-40" onClick={() => handleSend()}>Send</Button>}
                        {fees > 0 && 
                            <div>
                                <p className="text-xs">Fees: {formatBtcAmount(convertSatsToBtc(fees))} BTC / {formatFiatAmount(convertSatsToBtc(fees) * price, 4)} {currency}</p>
                                <p className="text-xs">Remaining : {formatBtcAmount(remaining)} BTC / {formatFiatAmount(remaining * price, 4)} {currency}</p>
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
        </div>
    )
}