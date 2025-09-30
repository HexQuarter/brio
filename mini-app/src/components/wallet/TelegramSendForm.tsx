import { useEffect, useState } from "react"
import { t } from "i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { buf2hex } from "@/helpers/crypto"
import { formatBtcAmount } from "@/helpers/number"

interface Props {
    min: number
    max: number
    price: number
    onSend: (address: string, amount: number) => void
    sendError: string | null
}

export const TelegramSendForm: React.FC<Props> = ({ min, max, price, onSend, sendError}) => {

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
        if (price) {
            setBtcAmount(parseFloat(formatBtcAmount(amount, price) as string))
        }   
    }, [amount])

    useEffect(() => {
        setLookupError(null)
        if (handle == "") return
        const delayDebounceFn = setTimeout(async () => {
            const rpcEndpoint = import.meta.env.DEV ? 'http://localhost:3000/rpc' : 'https://dev.backend.brio.hexquarter.com/rpc'

            const digest = await crypto.subtle.digest("sha-256", new TextEncoder().encode(handle))
            const response = await fetch(rpcEndpoint, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    operation: 'search-user',
                    payload: {
                        handle: buf2hex(digest)
                    }
                })
            })
            
            if (response.status == 200) {
                const { user: userInfo }  = await response.json()
                setAddress(userInfo.breezBolt12Destination)
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
            return
        }

          if (amount < min) {
            setAmount(min)
            return 
        }

        if (amount > max) {
            setAmount(max)
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
                <Label htmlFor="amount" className='text-gray-400'>{t('wallet.amount')} {loading && <Loading />}</Label>
                {!loading && 
                    <Slider min={min} max={max} onValueChange={handleChangeAmount} value={amount} price={price} />
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

function Loading() {
  return <span className="text-xs">(loading...)</span>;
}