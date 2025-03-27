"use client"

import { useState } from "react"
import { Switch } from "@/widgets/ui/form/switch"

interface SettingToggleProps {
  title: string
  description?: string
  defaultValue?: boolean
  onValueChange?: (value: boolean) => void
  disabled?: boolean
}

export function SettingToggle({
  title,
  description,
  defaultValue = false,
  onValueChange,
  disabled = false,
}: SettingToggleProps) {
  const [value, setValue] = useState(defaultValue)

  const handleValueChange = (newValue: boolean) => {
    setValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className="mb-4 flex items-start justify-between space-x-4">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        disabled={disabled}
        checked={value}
        onCheckedChange={handleValueChange}
      />
    </div>
  )
} 