import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  min: number
  max: number
  price: number
  className?: string,
  onValueChange: (amount: number) => void
}

const formatBtcAmount = (amount: number, price?: number) => {
  if (price) {
    return new Intl.NumberFormat("en", {maximumFractionDigits: 8}).format(amount / price)
  }
}

const formatFiatAmount = (amount: number) => new Intl.NumberFormat("en", {maximumFractionDigits: 2}).format(amount)

export const Slider: React.FC<SliderProps> = ({ value, min, max, price, onValueChange, className, ...props }) => {
  return (
    <div className='flex flex-col items-center gap-5 mt-5'>
      <div>
        <p className="text-2xl text-primary text-center">{formatFiatAmount(value)} USD</p>
        <p className='text-xs text-gray-400 text-center'>{formatBtcAmount(value , price)} BTC</p>
      </div>
      <SliderPrimitive.Root
        data-slot="slider"
        value={[value]}
        min={min}
        max={max}
        minStepsBetweenThumbs={1}
        className={cn(
          "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
          className
        )}
        onValueChange={(values) => onValueChange(values[0])}
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
          className="mt-10 bg-transparent border-b-primary border-b-8 border-x-transparent border-x-8 border-t-0 ring-ring/50 block size-4 shrink-0 transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Root>
      <div className="flex w-full justify-between">
        <span className="text-xs text-gray-400">{formatFiatAmount(min)} USD</span>
        <span className="text-xs text-gray-400">{formatFiatAmount(max)} USD</span>
      </div>
    </div>
  )
}
