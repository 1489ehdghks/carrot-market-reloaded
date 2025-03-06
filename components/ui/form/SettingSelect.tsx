"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function SettingSelect({
  label,
  description,
  value,
  options,
  disabled = false,
  onChange
}: SettingSelectProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={`select-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-neutral-400 mt-1">{description}</p>
        )}
      </div>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={`select-${label}`} className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 