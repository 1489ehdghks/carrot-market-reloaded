"use client"

import * as React from "react"
import { CustomSwitch } from "./custom-switch"
import { cn } from "@/shared/lib/utils"

interface CustomSettingToggleProps {
  title: string
  description?: string
  defaultValue: boolean
  onValueChange: (value: boolean) => void
  className?: string
}

export function CustomSettingToggle({
  title,
  description,
  defaultValue,
  onValueChange,
  className,
}: CustomSettingToggleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
      <CustomSwitch checked={defaultValue} onCheckedChange={onValueChange} />
    </div>
  )
} 