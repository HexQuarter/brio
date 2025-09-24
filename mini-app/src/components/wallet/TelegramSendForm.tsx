import { useEffect, useState } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { t } from "i18next"

interface Props {
     onAdddressChange: (address: string) => void,
     onBtcAmountChange: (amount: number) => void
}

export const TelegramSendForm: React.FC<Props> = ({onAdddressChange, onBtcAmountChange}) => {

    const [handle, setHandle] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [amount, setAmount] = useState(0.0)
       const [btcAmount, setBtcAmount] = useState(0)
   
    useEffect(() => {
        // TODO: retrieve address from either Telegram handle or phone number using the API
        //onAdddressChange(address)
    }, [handle, phoneNumber])

    useEffect(() => {
        // TODO: convert amount to btcAmount
        onBtcAmountChange(btcAmount)
    }, [amount])

    return (
        <div className='flex flex-col gap-10 pt-10 '>
            <div className='flex flex-col gap-1'>
                <Label htmlFor="handle" className='text-gray-400'>{t('wallet.telegram.handle')}</Label>
                <Input id='handle' placeholder={t('wallet.telegram.handle.placeholder')} value={handle} onChange={(e) => setHandle(e.target.value)}/>
            </div>
            
            <div>
                <Label htmlFor="phone" className='text-gray-400'>{t('wallet.telegram.phoneNumber')}</Label>
                <Input id='phone' placeholder={t('wallet.telegram.phoneNumber.placeholder')} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}/>
            </div>

            <div>
                <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')}</Label>
                <div className="flex flex-col gap-2">
                    <div className='flex items-center gap-5 border-b border-gray-200 hover:border-primary'>
                        <Input id="amount" type='number' placeholder="100" className='border-none' value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))}/>
                        <span>USD</span>
                    </div>
                    { /* TODO: Display BTC amount as decimal */ }
                    <span className='text-xs text-gray-400'>{btcAmount} BTC</span>
                </div>
            </div>
        </div>
    )
}