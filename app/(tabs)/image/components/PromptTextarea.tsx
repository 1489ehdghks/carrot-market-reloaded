"use client";

import React, { useState, useEffect } from 'react';
import { encode } from 'gpt-tokenizer';

interface PromptTextareaProps {
  prompt: string;
  negativePrompt: string;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  promptTokenLimit?: number;
  negativeTokenLimit?: number;
  className?: string;
}

export default function PromptTextarea({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativePromptChange,
  promptTokenLimit = 1500,
  negativeTokenLimit = 500,
  className = ""
}: PromptTextareaProps) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  
  // 토큰 계산 함수
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    return encode(text).length;
  };

  // 초기 및 변경 시 토큰 계산
  useEffect(() => {
    setPromptTokenCount(calculateTokens(prompt));
    setNegativeTokenCount(calculateTokens(negativePrompt));
  }, [prompt, negativePrompt]);
  
  // 탭 버튼에 대한 참조 생성
  const promptTabRef = React.useRef<HTMLButtonElement>(null);
  const negativeTabRef = React.useRef<HTMLButtonElement>(null);
  
  // 탭 변경 시 인디케이터 위치 조정
  useEffect(() => {
    const updateIndicator = () => {
      const activeRef = activeTab === 'prompt' ? promptTabRef.current : negativeTabRef.current;
      
      if (activeRef) {
        const { offsetLeft, offsetWidth } = activeRef;
        setIndicatorPosition(offsetLeft);
        setIndicatorWidth(offsetWidth);
      }
    };
    
    updateIndicator();
    // 윈도우 크기 변경 시에도 업데이트
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  return (
    <div className={`w-full rounded-lg overflow-hidden ${className}`}>
      <div className="relative flex border-b border-neutral-700">
        <button
          ref={promptTabRef}
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'prompt' 
              ? 'text-white' 
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
          prompt
        </button>
        <button
          ref={negativeTabRef}
          type="button"
          onClick={() => setActiveTab('negative')}
          className={`py-2 px-4 text-sm font-medium transition-colors ${
            activeTab === 'negative' 
              ? 'text-white' 
              : 'text-neutral-400 hover:text-neutral-300'
          }`}
        >
         negative prompt
        </button>
        
        {/* 애니메이션 인디케이터 */}
        <div 
          className="absolute bottom-0 h-0.5 bg-orange-500 transition-all duration-300 ease-in-out"
          style={{ 
            left: `${indicatorPosition}px`, 
            width: `${indicatorWidth}px`
          }}
        />
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm ${
            activeTab === 'prompt' 
              ? promptTokenCount > promptTokenLimit ? 'text-red-500' : 'text-neutral-400' 
              : negativeTokenCount > negativeTokenLimit ? 'text-red-500' : 'text-neutral-400'
          }`}>
            {activeTab === 'prompt' 
              ? `${promptTokenCount}/${promptTokenLimit} 토큰` 
              : `${negativeTokenCount}/${negativeTokenLimit} 토큰`}
          </span>
        </div>
        
        {activeTab === 'prompt' ? (
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => {
                e.stopPropagation();
                onPromptChange(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="생성하고 싶은 이미지를 자세하게 설명해보세요..."
              className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
            />
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={negativePrompt}
              onChange={(e) => {
                e.stopPropagation();
                onNegativePromptChange(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="생성된 이미지에서 제외하고 싶은 요소를 설명해보세요..."
              className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
} 