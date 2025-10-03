import { useEffect, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatBtcAmount } from "@/helpers/number"
import { fetchUserInfo } from "@/lib/api"
import { toast } from "sonner"
import { Spinner } from "@telegram-apps/telegram-ui"

interface Props {
    min: number
    max: number
    price: number
    onSend: (address: string, amount: number) => void
    sendError: string | null,
    currency: string
}

export const TelegramSendForm: React.FC<Props> = ({ min, max, price, onSend, sendError, currency}) => {

    const [handle, setHandle] = useState("")
    // const [phoneNumber, setPhoneNumber] = useState("")
    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(0)
    const [btcAmount, setBtcAmount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [lookupError, setLookupError] = useState<string | null>(null)

    useEffect(() => {
        if (min > 0 && max > 0) {
            const defaultValue = (max-min) / 2
            setAmount(Math.round(defaultValue))
            setLoading(false)
        }
    }, [price, max, min])

    useEffect(() => {
        setBtcAmount(parseFloat(formatBtcAmount(amount) as string))
    }, [amount])

    useEffect(() => {
        setLookupError(null)
        if (handle == "") return
        const delayDebounceFn = setTimeout(async () => {
            const response = await fetchUserInfo(handle)
            if (response.status == 200) {
                const { user: userInfo }  = await response.json()
                setAddress(userInfo.breezBolt12Offer)
                return
            }

            setLookupError('Telegram not matching registed user. Username might be invalid')
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [handle])

    // useEffect(() => {
    //     // TODO: retrieve address from either Telegram handle or phone number using the API
    //     //setAddress(address)
    // }, [handle, phoneNumber])

    const handleChangeAmount = (amount: number) => {
        if(Number.isNaN(amount)) {
            setAmount(0.0)
            toast.info(`Minimum is ${min} ${currency}`)
            return
        }

        if (amount < min) {
            setAmount(amount)
            toast.info(`Minimum is ${min} ${currency}`)
            return 
        }

        if (amount > max) {
            setAmount(amount)
            toast.info(`Maximum is ${max} ${currency}`)
            return 
        }
        setAmount(amount)
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

            <div>
                <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} {loading && <Spinner size='s'/>}</Label>
                {!loading && 
                    <Slider min={min} max={max} onValueChange={handleChangeAmount} value={amount} price={price} currency={currency}/>
                }
                
            </div>

            {address != '' &&
                <div className="flex justify-center flex flex-col items-center">
                    <Button className="w-40" onClick={() => onSend(address, btcAmount)}>{t('wallet.sendButton')}</Button>
                    { sendError &&
                        <p className="text-red-500 text-sm italic mt-2">{sendError}</p>
                    }
                </div>
            }
        </div>
    )
}