import { LuCopy, LuScanLine } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect} from "react";
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { t } from "i18next";
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider";

interface Props {
    min: number
    max: number
    price: number
    onSend: (address: string, amount: number) => void
}

export const BitcoinSendForm: React.FC<Props> = ({ min, max, price, onSend}) => {

    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(min * price)
    const [btcAmount, setBtcAmount] = useState(0)
    const [scanner, setScanner] = useState(false)

    const pasteAddress = async () => {
        const text = await navigator.clipboard.readText();
        setAddress(text)
    }

    useEffect(() => {
        const defaultValue = (max-min) / 2
        setAmount(defaultValue)
        if (price) {
            setBtcAmount(defaultValue / price)
        }
    }, [price, max, min])

    useEffect(() => {
        if (price) {
            setBtcAmount(amount / price)
        }   
    }, [amount])

    const onScannerResult = (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes.length == 0) {
            return
        }
        setAddress(detectedCodes[0].rawValue)
        setScanner(false)
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
                </div>
                {scanner && <Scanner onScan={onScannerResult} />}
            </div>
            
            { price &&
                <div>
                    <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')}</Label>
                    <Slider min={min} max={max} value={amount} onValueChange={setAmount} price={price}/>
                </div>
            }

            <div className="flex justify-center">
                <Button onClick={() => onSend(address, btcAmount)}>Send</Button>
            </div>
        </div>
    )
}