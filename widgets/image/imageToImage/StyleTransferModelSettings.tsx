import React from 'react';
import { Label } from "@/components/ui/form/label";
import { Slider } from "@/components/ui/form/slider";
import { CustomTooltip } from "@/widgets/shared/custom-tooltip";
import { Button } from "@/widgets/elements/sub/button";
import { Switch } from "@/components/ui/form/switch";

interface StyleTransferModelSettingsProps {
  strength: number;
  onStrengthChange: (value: number) => void;
  config: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  showAdvancedSettings: boolean;
}

export default function StyleTransferModelSettings({
  strength,
  onStrengthChange,
  config,
  onConfigChange,
  showAdvancedSettings
}: StyleTransferModelSettingsProps) {
  return (
    <div className="space-y-4">
      {!showAdvancedSettings && (
        <div className="space-y-4">
          {/* 변환 강도 슬라이더 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">변환 강도</label>
              <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">
                {strength.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={strength}
              onChange={(e) => onStrengthChange(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-xs text-gray-400">
              낮은 값: 원본 이미지의 구조를 많이 유지, 높은 값: 스타일을 더 강하게 적용
            </p>
          </div>
        </div>
      )}
      
      {showAdvancedSettings && (
        <>
          {/* 고급 설정 섹션 */}
          <h3 className="text-lg font-medium mb-4">고급 설정</h3>
          
          <div className="space-y-4">
            {/* 추론 단계 수 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">추론 단계 수</label>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">
                  {config.num_inference_steps || 30}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="1"
                value={config.num_inference_steps || 30}
                onChange={(e) => onConfigChange('num_inference_steps', parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
              <p className="text-xs text-gray-400">
                값이 클수록 더 세밀한 이미지가 생성되지만, 처리 시간이 길어집니다 (권장: 30-40)
              </p>
            </div>
            
            {/* 가이던스 스케일 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">가이던스 스케일</label>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">
                  {config.guidance_scale || 7.5}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                step="0.5"
                value={config.guidance_scale || 7.5}
                onChange={(e) => onConfigChange('guidance_scale', parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
              <p className="text-xs text-gray-400">
                값이 클수록 프롬프트를 더 충실히 따르지만, 다양성이 제한됩니다 (권장: 7-9)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 