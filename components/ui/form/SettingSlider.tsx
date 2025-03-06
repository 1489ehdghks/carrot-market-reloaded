"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SettingSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export default function SettingSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
  onChange
}: SettingSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  
  // 외부에서 value prop이 변경되면 내부 상태도 업데이트
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // 슬라이더 값 변경 핸들러
  const handleSliderChange = (newValue: number[]) => {
    const value = newValue[0];
    setLocalValue(value);
    onChange(value);
  };
  
  // 값 표시
  const displayValue = `${localValue}${unit}`;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor={`slider-${label}`} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-sm font-medium">
          {displayValue}
        </span>
      </div>
      
      <Slider
        id={`slider-${label}`}
        value={[localValue]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={handleSliderChange}
        className="cursor-pointer"
      />
    </div>
  );
} 