"use client";

import SettingsGroup from "@/components/ui/layout/SettingsGroup";
import SettingSlider from "@/components/ui/form/SettingSlider";
import SettingToggle from "@/components/ui/form/SettingToggle";
import SettingSelect from "@/components/ui/form/SettingSelect";

interface SettingsPanelProps {
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae: boolean;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onStepsChange: (steps: number) => void;
  onCfgScaleChange: (cfgScale: number) => void;
  onSamplerChange: (sampler: string) => void;
  onVaeChange: (vae: boolean) => void;
  samplers: string[];
  disabled?: boolean;
}

export default function SettingsPanel({
  width,
  height,
  steps,
  cfgScale,
  sampler,
  vae,
  onWidthChange,
  onHeightChange,
  onStepsChange,
  onCfgScaleChange,
  onSamplerChange,
  onVaeChange,
  samplers,
  disabled = false
}: SettingsPanelProps) {
  // 샘플러 옵션 생성
  const samplerOptions = samplers.map(s => ({
    value: s,
    label: s
  }));
  
  return (
    <div className="space-y-4">
      <SettingsGroup
        title="이미지 크기"
        description="생성할 이미지의 가로 및 세로 크기"
      >
        <SettingSlider
          label="가로 크기"
          value={width}
          min={512}
          max={1536}
          step={64}
          unit="px"
          disabled={disabled}
          onChange={onWidthChange}
        />
        
        <SettingSlider
          label="세로 크기"
          value={height}
          min={512}
          max={1536}
          step={64}
          unit="px"
          disabled={disabled}
          onChange={onHeightChange}
        />
      </SettingsGroup>
      
      <SettingsGroup
        title="생성 품질"
        description="이미지 품질 및 생성 속도 설정"
      >
        <SettingSlider
          label="스텝 수"
          value={steps}
          min={10}
          max={150}
          step={1}
          disabled={disabled}
          onChange={onStepsChange}
        />
        
        <SettingSlider
          label="CFG 스케일"
          value={cfgScale}
          min={1}
          max={20}
          step={0.5}
          disabled={disabled}
          onChange={onCfgScaleChange}
        />
        
        <SettingToggle
          label="VAE 사용"
          description="향상된 시각적 품질을 위한 변분 오토인코더 사용"
          checked={vae}
          disabled={disabled}
          onChange={onVaeChange}
        />
      </SettingsGroup>
      
      <SettingsGroup
        title="샘플러 설정"
        description="이미지 생성에 사용할 알고리즘"
      >
        <SettingSelect
          label="샘플러"
          value={sampler}
          options={samplerOptions}
          disabled={disabled}
          onChange={onSamplerChange}
        />
      </SettingsGroup>
    </div>
  );
} 