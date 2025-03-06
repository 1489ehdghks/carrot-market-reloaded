"use client";

import { useState } from "react";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { AI_MODELS, CATEGORY_NAMES, AIModel, getModelById, getDefaultModel } from "../data/models";

interface ModelSelectorProps {
  selectedModel: string | AIModel;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // 선택된 모델 객체 가져오기
  const selectedModelObject = typeof selectedModel === 'string' 
    ? getModelById(selectedModel) || getDefaultModel()
    : selectedModel;
  
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-between w-full px-3 py-2 border rounded-lg bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
        onClick={() => setShowModelSelector(!showModelSelector)}
      >
        <div className="flex items-center gap-2">
          <CustomTooltip
            title={selectedModelObject.name}
            description={
              <div>
                <p className="text-neutral-300">{selectedModelObject.description}</p>
                {selectedModelObject.recommendedSettings && (
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
                  {/* 모델 기반 태그 (SD, SDXL, Flux 등) */}
                  <span className="text-xs px-2 py-1 bg-blue-900 text-blue-100 rounded-full">
                    {selectedModelObject.modelTags?.base || "기타"}
                  </span>
                  
                  {/* 스타일 태그 (사실적, 애니메이션 등) */}
                  {selectedModelObject.modelTags?.style?.map((style, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-neutral-700 rounded-full">
                      {style}
                    </span>
                  ))}
                  
                  {/* NSFW 지원 여부 */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedModelObject.modelTags?.nsfwSupport 
                      ? "bg-red-900 text-red-100" 
                      : "bg-green-900 text-green-100"
                  }`}>
                    {selectedModelObject.modelTags?.nsfwSupport ? "NSFW 허용" : "SFW 전용"}
                  </span>
                </div>
              </div>
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </CustomTooltip>
          <span className="font-medium">{selectedModelObject.name}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
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
              <p className="text-sm text-neutral-400">이미지 생성에 사용할 AI 모델을 선택하세요</p>
            </div>
            
            <div className="p-2">
              {AI_MODELS.map((model) => (
                <div 
                  key={model.id}
                  className={`p-3 border rounded-lg mb-2 cursor-pointer transition-all ${
                    selectedModelObject.id === model.id 
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
                    {model.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-600 rounded-full">기본</span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2 mb-1">
                    {/* 모델 기반 태그 */}
                    <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-100 rounded-full">
                      {model.modelTags?.base || "기타"}
                    </span>
                    
                    {/* 스타일 태그 */}
                    {model.modelTags?.style?.slice(0, 2).map((style, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-neutral-700 rounded-full">
                        {style}
                      </span>
                    ))}
                    
                    {/* NSFW 지원 여부 */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      model.modelTags?.nsfwSupport 
                        ? "bg-red-900 text-red-100" 
                        : "bg-green-900 text-green-100"
                    }`}>
                      {model.modelTags?.nsfwSupport ? "NSFW 허용" : "SFW 전용"}
                    </span>
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