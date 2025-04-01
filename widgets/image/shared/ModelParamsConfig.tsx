"use client";

import React from 'react';
import { ModelDefinition, ModelParam } from '../../data/model-params';
import { Slider } from '@/components/ui/form/slider';
import { Select } from '@/components/ui/form/select';
import { Switch } from '@/components/ui/form/switch';
import { Input } from '@/components/ui/form/input';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';
import { Info } from 'lucide-react';

interface ModelParamsConfigProps {
  model: ModelDefinition;
  params: Record<string, any>;
  onChange: (name: string, value: any) => void;
  showAdvanced?: boolean;
}

export function ModelParamsConfig({ 
  model, 
  params, 
  onChange,
  showAdvanced = false
}: ModelParamsConfigProps) {
  // 기본 + 고급 매개변수 필터링
  const visibleParams = model.params.filter(param => 
    !param.isFixed && (showAdvanced || !param.isAdvanced)
  );
  
  if (visibleParams.length === 0) {
    return <p className="text-sm text-neutral-400">조정 가능한 매개변수가 없습니다.</p>;
  }
  
  return (
    <div className="space-y-4">
      {visibleParams.map(param => (
        <div key={param.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              {param.label}
            </label>
            {param.description && (
              <CustomTooltip 
                title={param.label} 
                content={param.description}
              >
                <Info className="w-4 h-4 text-neutral-400" />
              </CustomTooltip>
            )}
          </div>
          
          {renderParamInput(param, params[param.name], onChange)}
        </div>
      ))}
    </div>
  );
}

// 매개변수 타입별 입력 컴포넌트 렌더링
function renderParamInput(
  param: ModelParam, 
  value: any, 
  onChange: (name: string, value: any) => void
) {
  const currentValue = value !== undefined ? value : param.default;
  
  switch (param.type) {
    case 'number':
      return (
        <div className="flex items-center gap-3">
          <Slider
            value={[currentValue]}
            min={param.min || 0}
            max={param.max || 100}
            step={param.step || 0.1}
            onValueChange={([val]) => onChange(param.name, val)}
            className="flex-grow"
          />
          <span className="text-sm w-12 text-right">{currentValue.toFixed(2)}</span>
        </div>
      );
      
    case 'integer':
      return (
        <div className="flex items-center gap-3">
          <Slider
            value={[currentValue]}
            min={param.min || 0}
            max={param.max || 100}
            step={1}
            onValueChange={([val]) => onChange(param.name, Math.round(val))}
            className="flex-grow"
          />
          <span className="text-sm w-8 text-right">{currentValue}</span>
        </div>
      );
      
    case 'string':
      if (param.options) {
        return (
          <Select
            value={currentValue}
            onValueChange={val => onChange(param.name, val)}
          >
            {param.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      }
      return (
        <Input
          value={currentValue}
          onChange={e => onChange(param.name, e.target.value)}
          className="w-full"
        />
      );
      
    case 'boolean':
      return (
        <Switch
          checked={currentValue}
          onCheckedChange={val => onChange(param.name, val)}
        />
      );
      
    default:
      return null;
  }
} 