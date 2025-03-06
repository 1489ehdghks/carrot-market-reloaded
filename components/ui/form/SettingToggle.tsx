"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export default function SettingToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange
}: SettingToggleProps) {
  return (
    <div className="flex justify-between items-center space-x-2">
      <div>
        <Label htmlFor={`toggle-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-neutral-400">{description}</p>
        )}
      </div>
      
      <Switch
        id={`toggle-${label}`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
} 