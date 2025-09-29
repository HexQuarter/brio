import { useEffect, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface Props {
    min: number
    max: number
    price: number
    onSend: (address: string, amount: number) => void
}

export const TelegramSendForm: React.FC<Props> = ({ min, max, price, onSend}) => {

    const [handle, setHandle] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [address, _setAddress] = useState("")
    const [amount, setAmount] = useState(0)
    const [btcAmount, setBtcAmount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (min > 0 && max > 0) {
            const defaultValue = (max-min) / 2
            setAmount(defaultValue)
            setLoading(false)
        }
    }, [price, max, min])

    useEffect(() => {
        if (price) {
            setBtcAmount(amount / price)
        }   
    }, [amount])

    useEffect(() => {
        // TODO: retrieve address from either Telegram handle or phone number using the API
        //setAddress(address)
    }, [handle, phoneNumber])

    return (
        <div className='flex flex-col gap-10 pt-10'>
            <div className='flex flex-col gap-1'>
                <Label htmlFor="handle" className='text-gray-400'>{t('wallet.telegram.handle')}</Label>
                <Input id='handle' placeholder={t('wallet.telegram.handle.placeholder')} value={handle} onChange={(e) => setHandle(e.target.value)}/>
            </div>
            
            <div>
                <Label htmlFor="phone" className='text-gray-400'>{t('wallet.telegram.phoneNumber')}</Label>
                <Input id='phone' placeholder={t('wallet.telegram.phoneNumber.placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
            </div>

            <div>
                <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} {loading && <Loading />}</Label>
                {!loading && 
                    <Slider min={min} max={max} onValueChange={setAmount} value={amount} price={price} />
                }
                
            </div>

            <div className="flex justify-center">
                <Button onClick={() => onSend(address, btcAmount)}>Send</Button>
            </div>
        </div>
    )
}

function Loading() {
  return <span className="text-xs">(loading...)</span>;
}