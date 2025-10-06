import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { convertBtcToSats, convertSatsToBtc, formatBtcAmount, formatFiatAmount } from "@/helpers/number"

interface SliderProps {
  value: number
  min: number
  max: number
  price: number
  currency: string,
  className?: string,
  onValueChanged: (amount: number) => void,
  error: string | null
}

export const Slider: React.FC<SliderProps> = ({ value, min, max, price, currency, onValueChanged, error, className, ...props }) => {
  const btcAmount = parseFloat(formatBtcAmount(convertSatsToBtc(value)))
  const fiatAmount = formatFiatAmount(btcAmount * price)

  const onInputChange = (fiatAmount: number) => {
    if (Number.isNaN(fiatAmount)) {
      onValueChanged(0)
      return
    }

    const sats = convertBtcToSats(fiatAmount / price)
    onValueChanged(sats)
  }

  return (
    <div className='flex flex-col items-center gap-10 mt-5'>
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-primary justify-center w-40">
          <Input 
            type="number"
            step={0.01}
            className="w-[5] text-2xl border-primary border-b-1 text-center" 
            value={fiatAmount} 
            onChange={(e) => onInputChange(parseFloat(e.target.value)) }
            inputMode="decimal" />
          <span className="">{currency}</span>
        </div>
        <p className='text-xs text-gray-400 text-center'>{formatBtcAmount(btcAmount)} BTC</p>
      </div>
      <SliderPrimitive.Root
        data-slot="slider"
        value={[value]}
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={1}
        className={cn(
          "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
          className
        )}
        onValueChange={(values) => onValueChanged(values[0])}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "bg-gray-200 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="mt-10 bg-transparent border-b-primary border-b-8 border-x-transparent border-x-8 border-t-0 ring-ring/50 block size-4 shrink-0 transition-[color,box-shadow] hover:cursor-pointer focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Root>
      <div className="flex w-full justify-between">
        <span className="text-xs text-gray-400">{formatFiatAmount(convertSatsToBtc(min) * price)} {currency}</span>
        <span className="text-xs text-gray-400">{formatFiatAmount(convertSatsToBtc(max) * price)} {currency}</span>
      </div>
      {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
    </div>
  )
}
