"use client"

import { useState } from "react"
import { Slider } from "@/widgets/ui/form/slider"

interface SettingSliderProps {
  title: string
  description?: string
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  showValue?: boolean
  valueUnit?: string
  onValueChange?: (value: number) => void
  disabled?: boolean
}

export function SettingSlider({
  title,
  description,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = min,
  showValue = true,
  valueUnit = "",
  onValueChange,
  disabled = false,
}: SettingSliderProps) {
  const [value, setValue] = useState(defaultValue)

  const handleValueChange = (values: number[]) => {
    const newValue = values[0]
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className="mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {title}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {showValue && (
          <div className="w-12 text-right text-sm">
            {value}
            {valueUnit}
          </div>
        )}
      </div>
      <Slider
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        defaultValue={[defaultValue]}
        value={[value]}
        onValueChange={handleValueChange}
        className="w-full"
      />
    </div>
  )
} 