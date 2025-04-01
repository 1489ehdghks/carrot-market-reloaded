"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/shared/lib/utils"

const CustomSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
CustomSlider.displayName = SliderPrimitive.Root.displayName

// 설정용 Slider 컴포넌트 통합
interface CustomSettingSliderProps {
  title: string
  description?: string
  defaultValue: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function CustomSettingSlider({
  title,
  description,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: CustomSettingSliderProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <CustomSlider
          value={[defaultValue]}
          onValueChange={([newValue]) => onValueChange(newValue)}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <div className="w-12 text-sm text-muted-foreground">{defaultValue}</div>
      </div>
    </div>
  )
}

export { CustomSlider } 