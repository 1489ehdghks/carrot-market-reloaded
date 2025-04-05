import React from 'react';
import { CustomButton } from '@/widgets/elements/custom-button';
import { CustomTooltip } from "@/widgets/shared/custom-tooltip";
import { CustomSwitch } from '@/widgets/elements/custom-switch';

interface InstantIDModelSettingsProps {
  faceImagePreview: string | null;
  config: Record<string, any>;
  onConfigChange: (key: string, value: any) => void;
  onFaceImageClick: () => void;
  clearFaceImage: () => void;
  faceImageRef: React.RefObject<HTMLInputElement>;
  handleFaceImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showAdvancedSettings: boolean;
}

export default function InstantIDModelSettings({
  faceImagePreview,
  config,
  onConfigChange,
  onFaceImageClick,
  clearFaceImage,
  faceImageRef,
  handleFaceImageUpload,
  showAdvancedSettings
}: InstantIDModelSettingsProps) {
  return (
    <div className="space-y-4">
      {/* 얼굴 참조 이미지 업로드 영역 - 항상 표시 */}
      {!showAdvancedSettings && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">얼굴 참조 이미지</label>
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                  {faceImagePreview ? (
                    <img 
                      src={faceImagePreview} 
                      alt="얼굴 참조 이미지" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  {faceImagePreview ? (
                    <CustomButton 
                      type="button" 
                      variant="outline"
                      onClick={clearFaceImage}
                      className="w-full"
                    >
                      이미지 변경
                    </CustomButton>
                  ) : (
                    <CustomButton 
                      type="button" 
                      variant="outline"
                      onClick={onFaceImageClick}
                      className="w-full"
                    >
                      이미지 선택
                    </CustomButton>
                  )}
                  <p className="text-xs text-gray-400">
                    얼굴이 잘 나온 정면 이미지를 사용하세요
                  </p>
                </div>
                <input
                  ref={faceImageRef}
                  type="file"
                  onChange={handleFaceImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
          
          {/* 기본 설정 (얼굴 특징 강도, 얼굴 영역 강화) */}
          <div className="space-y-4">
            {/* 얼굴 특징 강도 설정 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">얼굴 특징 강도</label>
                <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">
                  {(config.ip_adapter_scale || 0.8).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.ip_adapter_scale || 0.8}
                onChange={(e) => onConfigChange('ip_adapter_scale', parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
              <p className="text-xs text-gray-400">
                값이 클수록 참조 얼굴의 특징을 더 강하게 반영합니다
              </p>
            </div>
            
            {/* 얼굴 영역 강화 설정 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">얼굴 영역 강화</label>
                <CustomTooltip 
                  title="얼굴 영역 강화" 
                  description="활성화하면 생성된 얼굴의 디테일이 향상됩니다."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </CustomTooltip>
              </div>
              <CustomSwitch 
                checked={config.enhance_face_region ?? true}
                onCheckedChange={(checked) => onConfigChange('enhance_face_region', checked)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 고급 설정 영역 */}
      {showAdvancedSettings && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-2">고급 설정</h3>
          
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
              min="20"
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
                {config.guidance_scale || 5}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={config.guidance_scale || 5}
              onChange={(e) => onConfigChange('guidance_scale', parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
            <p className="text-xs text-gray-400">
              값이 클수록 프롬프트를 더 충실히 따르지만, 다양성이 제한됩니다 (권장: 4-6)
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 