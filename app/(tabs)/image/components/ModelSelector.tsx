"use client";

import { useState } from "react";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { AI_MODELS, CATEGORY_NAMES, AIModel } from "../data/models";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-between p-3 border border-neutral-700 rounded-lg bg-neutral-800 cursor-pointer"
        onClick={() => setShowModelSelector(!showModelSelector)}
      >
        <div className="flex items-center gap-2">
          <CustomTooltip
            title={selectedModel.name}
            description={selectedModel.description}
            content={
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {selectedModel.features.map((feature, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-neutral-700 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-neutral-400">
                  {selectedModel.nsfw ? "🔞 NSFW 컨텐츠 생성 가능" : "✓ NSFW 컨텐츠 제한됨"}
                </p>
              </div>
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </CustomTooltip>
          <span className="font-medium">{selectedModel.name}</span>
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
              <h2 className="text-lg font-medium">AI 모델 선택</h2>
            </div>
            {Object.entries(CATEGORY_NAMES).map(([category, categoryName]) => (
              <div key={category} className="p-3 border-b border-neutral-700 last:border-0">
                <h3 className="text-sm font-medium text-neutral-400 mb-2">{categoryName}</h3>
                <div className="space-y-1">
                  {AI_MODELS.filter(m => m.category === category).map((m) => (
                    <div 
                      key={m.id} 
                      className={`p-2.5 rounded-md hover:bg-neutral-700/70 transition-colors cursor-pointer ${selectedModel.id === m.id ? 'bg-neutral-700' : ''}`}
                      onClick={() => {
                        onModelChange(m.id);
                        setShowModelSelector(false);
                      }}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-sm text-neutral-400 mt-0.5">{m.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 