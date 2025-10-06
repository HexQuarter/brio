import { useWallet } from "@/lib/useWallet"
import { useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { useTranslation } from "react-i18next"
import { convertSatsToBtc, formatFiatAmount } from "@/helpers/number"
import { ReceiveAmount } from "@breeztech/breez-sdk-liquid/web"
import { Spinner } from "@telegram-apps/telegram-ui"

type Props = {
    onGeneratedInvoice: (invoice: string) => void
    onLoading: () => void
}

export const Bolt11Form: React.FC<Props> = ({ onGeneratedInvoice, onLoading }) => {

    const {t} = useTranslation()
    const { breezSdk, currency } = useWallet()
    const [min, setMin] = useState(0)
    const [max, setMax] = useState(0)
    const [amount, setAmount] = useState(0)
    const [amountError, setAmountError] = useState<string | null>(null)
    const [genError, setGenError] = useState<string | null>(null)
    const [price, setPrice] = useState(0)
    const [loading, setLoading] = useState(false)
    const [bolt11Invoice, setBolt11Invoice] = useState<string|null>(null)

    useEffect(() => {
        if (breezSdk) {
            const loadLimits = async () => {
                const limits = await breezSdk?.fetchLightningLimits()
                if (!limits) return
                setMin(limits.receive.minSat)
                setMax(limits.receive.maxSat)

                const fiatRates = await breezSdk.fetchFiatRates()
                if (!fiatRates) return
                const rate = fiatRates.find(r => r.coin.toLowerCase() == currency.toLowerCase())
                if (!rate) return
                setPrice(rate.value)
            }

            loadLimits()
        }

    }, [breezSdk])

    useEffect(() => {
        onLoading()
        const delayDebounceFn = setTimeout(async () => {
            setAmountError(null)
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

            const refreshInvoice = async () => await generateInvoice()
            if (amount > 0) {
                refreshInvoice()
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)

    }, [amount])

    const generateInvoice = async () => {
        try{
            setLoading(true)
            const optionalAmount: ReceiveAmount = {
                type: 'bitcoin',
                payerAmountSat: amount
            }

            const prepareResponse = await breezSdk?.prepareReceivePayment({
                paymentMethod: 'bolt11Invoice',
                amount: optionalAmount
            })
            if (!prepareResponse) {
                setGenError(t('wallet.unablePrepareBolt11'))
                return
            }

            const res = await breezSdk?.receivePayment({
                prepareResponse
            })
            if (!res) {
                setGenError(t('wallet.unablePrepareBolt11'))
                return
            }
            setLoading(false)
            setBolt11Invoice(res.destination)
            onGeneratedInvoice(res.destination)
        }
        catch(e) {
            setGenError((e as Error).message)
        }
    }

    return (
        <div className="flex flex-col gap-10 items-center w-full">
            {price == 0 && <Spinner size="s" />}
            { price > 0 && 
                <div className="flex flex-col w-full gap-5">
                    <Slider min={min} max={max} value={amount} onValueChanged={setAmount} error={amountError} currency={currency} price={price}/>
                    <div className="flex flex-col items-center">{loading && <Spinner size="s" />}</div>
                    {!loading && !bolt11Invoice &&
                        <div className="flex flex-col items-center">
                            { genError &&
                                <p className="text-red-500 text-sm italic mt-2">{genError}</p>
                            }
                        </div>
                    }
                </div>
            }
        </div>
    )
}