"use client";

import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { CustomTooltip } from "@/widgets/shared/custom-tooltip";
import { IMAGE_MODELS, ImageModel, getImageModelById } from "@/shared/models/image/imageModels";

interface ModelSelectorImageProps {
  selectedModel: string | ImageModel;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelectorImage({ selectedModel, onModelChange }: ModelSelectorImageProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // 선택된 모델 객체 가져오기
  const selectedModelObject = typeof selectedModel === 'string' 
    ? getImageModelById(selectedModel) || IMAGE_MODELS[0]
    : selectedModel;
  
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
        onClick={() => setShowModelSelector(!showModelSelector)}
      >
        <div className="flex items-center gap-2">
          <CustomTooltip
            title={selectedModelObject?.name || "모델 선택"}
            description={
              <div>
                <p className="text-neutral-300">{selectedModelObject?.description}</p>
                {selectedModelObject?.recommendedSettings && (
                  <div className="mt-3 border-t border-neutral-700 pt-2">
                    <p className="font-medium mb-1 text-neutral-300">권장 설정:</p>
                    <div className="bg-neutral-800/50 p-2 rounded border border-neutral-700">
                      {selectedModelObject.recommendedSettings.split('\n').map((setting, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                          {setting.includes(':') ? (
                            <div className="flex">
                              <span className="font-medium text-neutral-300 min-w-[100px]">{setting.split(':')[0]}:</span>
                              <span className="text-orange-400 ml-2">{setting.split(':')[1]}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-300">{setting}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
            content={
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {/* 필요 이미지 정보 표시 */}
                  {selectedModelObject?.requiredImages?.sourceImage && (
                    <span className="text-xs px-2 py-1 bg-blue-900 text-blue-100 rounded-full">
                      원본 이미지 필요
                    </span>
                  )}
                  {selectedModelObject?.requiredImages?.faceImage && (
                    <span className="text-xs px-2 py-1 bg-purple-900 text-purple-100 rounded-full">
                      얼굴 이미지 필요
                    </span>
                  )}
                  
                  {/* 토큰 가격 표시 */}
                  {selectedModelObject?.tokenPrice && (
                    <span className="text-xs px-2 py-1 bg-green-900 text-green-100 rounded-full">
                      {selectedModelObject.tokenPrice} 토큰
                    </span>
                  )}
                </div>
              </div>
            }
          >
            <Info className="h-5 w-5 text-neutral-400" />
          </CustomTooltip>
          <span className="font-medium">{selectedModelObject?.name || "모델 선택"}</span>
        </div>
        <ChevronDown className="h-5 w-5 text-neutral-400" />
      </div>
      
      {showModelSelector && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-[9998]" 
            onClick={() => setShowModelSelector(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-neutral-800 border border-neutral-700 rounded-lg shadow-2xl z-[9999] max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-900 p-3 border-b border-neutral-700">
              <h3 className="font-semibold">모델 선택</h3>
              <p className="text-sm text-neutral-400">이미지 변환에 사용할 AI 모델을 선택하세요</p>
            </div>
            
            <div className="p-2">
              {IMAGE_MODELS.map((model) => (
                <div 
                  key={model.id}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition-all ${
                    selectedModelObject?.id === model.id 
                      ? 'bg-neutral-700 border-neutral-500' 
                      : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                  }`}
                  onClick={() => {
                    onModelChange(model.id);
                    setShowModelSelector(false);
                  }}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{model.name}</h4>
                    {model.tokenPrice && (
                      <span className="text-xs px-2 py-0.5 bg-green-800 rounded-full">{model.tokenPrice} 토큰</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2 mb-1">
                    {/* 필요 이미지 정보 표시 */}
                    {model.requiredImages.sourceImage && (
                      <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-100 rounded-full">
                        원본 이미지
                      </span>
                    )}
                    {model.requiredImages.faceImage && (
                      <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-100 rounded-full">
                        얼굴 이미지
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                    {model.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 