"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/widgets/ui/form/select"

interface SettingSelectOption {
  value: string
  label: string
}

interface SettingSelectProps {
  title: string
  description?: string
  options: SettingSelectOption[]
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

export function SettingSelect({
  title,
  description,
  options,
  defaultValue = options[0]?.value || "",
  onValueChange,
  disabled = false,
}: SettingSelectProps) {
  const [value, setValue] = useState(defaultValue)

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Select
        disabled={disabled}
        value={value}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 