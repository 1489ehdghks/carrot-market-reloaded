"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PromptInputProps {
  initialPrompt?: string;
  initialNegativePrompt?: string;
  onPromptChange: (prompt: string) => void;
  onNegativePromptChange: (negativePrompt: string) => void;
  onTokenCountChange?: (type: 'prompt' | 'negative', count: number) => void;
  maxTokensPrompt?: number;
  maxTokensNegative?: number;
}

export default function PromptInput({
  initialPrompt = "",
  initialNegativePrompt = "",
  onPromptChange,
  onNegativePromptChange,
  onTokenCountChange,
  maxTokensPrompt = 1500,
  maxTokensNegative = 500
}: PromptInputProps) {
  // 상태 관리
  const [activeTab, setActiveTab] = useState<string>("prompt");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState(initialNegativePrompt);
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  
  // 초기값 설정
  useEffect(() => {
    setPrompt(initialPrompt);
    setNegativePrompt(initialNegativePrompt);
    calculateTokens(initialPrompt, "prompt");
    calculateTokens(initialNegativePrompt, "negative");
  }, [initialPrompt, initialNegativePrompt]);
  
  // 토큰 계산 (단순한 구현, 실제로는 더 정확한 토크나이저 사용 필요)
  const calculateTokens = (text: string, type: 'prompt' | 'negative'): number => {
    // 간단히 문자 길이로 계산 (실제로는 모델별 토크나이저 사용 필요)
    const tokenCount = text.length;
    
    if (type === 'prompt') {
      setPromptTokenCount(tokenCount);
      if (onTokenCountChange) {
        onTokenCountChange('prompt', tokenCount);
      }
    } else {
      setNegativeTokenCount(tokenCount);
      if (onTokenCountChange) {
        onTokenCountChange('negative', tokenCount);
      }
    }
    
    return tokenCount;
  };
  
  // 텍스트 변경 핸들러
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    calculateTokens(newPrompt, "prompt");
    onPromptChange(newPrompt);
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem("imagePrompt", newPrompt);
    } catch (error) {
      console.error("Failed to save prompt to localStorage:", error);
    }
  };
  
  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNegativePrompt = e.target.value;
    setNegativePrompt(newNegativePrompt);
    calculateTokens(newNegativePrompt, "negative");
    onNegativePromptChange(newNegativePrompt);
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem("imageNegativePrompt", newNegativePrompt);
    } catch (error) {
      console.error("Failed to save negative prompt to localStorage:", error);
    }
  };
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-2">
          <TabsTrigger value="prompt">프롬프트</TabsTrigger>
          <TabsTrigger value="negative">네거티브 프롬프트</TabsTrigger>
        </TabsList>
        
        <TabsContent value="prompt" className="space-y-1">
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="원하는 이미지를 자세히 묘사해주세요..."
            className="w-full min-h-[200px] p-3 bg-neutral-800 rounded-lg resize-none text-sm"
          />
          <div className={`text-xs flex justify-end ${
            promptTokenCount > maxTokensPrompt ? "text-red-500" : "text-neutral-400"
          }`}>
            {promptTokenCount} / {maxTokensPrompt} 문자
          </div>
        </TabsContent>
        
        <TabsContent value="negative" className="space-y-1">
          <textarea
            value={negativePrompt}
            onChange={handleNegativePromptChange}
            placeholder="이미지에 포함하지 않을 요소를 적어주세요..."
            className="w-full min-h-[200px] p-3 bg-neutral-800 rounded-lg resize-none text-sm"
          />
          <div className={`text-xs flex justify-end ${
            negativeTokenCount > maxTokensNegative ? "text-red-500" : "text-neutral-400"
          }`}>
            {negativeTokenCount} / {maxTokensNegative} 문자
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 