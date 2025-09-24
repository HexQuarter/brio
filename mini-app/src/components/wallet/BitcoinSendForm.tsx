import { LuCopy, LuScanLine } from "react-icons/lu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect} from "react";
import { IDetectedBarcode, Scanner } from '@yudiel/react-qr-scanner';
import { t } from "i18next";

interface Props {
     onAdddressChange: (address: string) => void
     onBtcAmountChange: (amount: number) => void
}

export const BitcoinSendForm: React.FC<Props> = ({ onAdddressChange, onBtcAmountChange }) => {
    const [address, setAddress] = useState("")
    const [amount, setAmount] = useState(0.0)
    const [btcAmount, setBtcAmount] = useState(0)
    const [scanner, setScanner] = useState(false)

    const pasteAddress = async () => {
        const text = await navigator.clipboard.readText();
        setAddress(text)
    }

    useEffect(() => {
        onAdddressChange(address)
    }, [address])

     useEffect(() => {
        // TODO: convert amount to btcAmount
        onBtcAmountChange(btcAmount)
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