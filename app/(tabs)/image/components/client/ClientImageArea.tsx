"use client";

import { useState } from "react";
import GeneratedImage from "../GeneratedImage";

export default function ClientImageArea() {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerationStart = () => {
    setIsGenerating(true);
    setError(null);
  };
  
  const handleGenerationComplete = (imageUrl: string, imageId: string) => {
    setGeneratedImageUrl(imageUrl);
    setGeneratedImageId(imageId);
    setIsGenerating(false);
  };
  
  const handleGenerationError = (error: string) => {
    setError(error);
    setIsGenerating(false);
  };
  
  const handleResetImage = () => {
    setGeneratedImageUrl(null);
    setGeneratedImageId(null);
  };
  
  // 공유 상태 및 이벤트 핸들러를 TextToImageForm에 전달하기 위한 객체
  const formProps = {
    onGenerationStart: handleGenerationStart,
    onGenerationComplete: handleGenerationComplete,
    onError: handleGenerationError
  };
  
  // 이 상태 및 핸들러를 전역 상태로 내보내 TextToImageForm에서 접근할 수 있게 함
  if (typeof window !== 'undefined') {
    (window as any).__formProps = formProps;
  }
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {isGenerating && (
        <div className="flex justify-center items-center p-8 border border-neutral-800 rounded-lg bg-neutral-900 h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {generatedImageUrl && !isGenerating && (
        <GeneratedImage 
          imageUrl={generatedImageUrl} 
          imageId={generatedImageId!} 
          onReset={handleResetImage}
        />
      )}
      
      {!isGenerating && !generatedImageUrl && (
        <div className="border border-neutral-800 rounded-lg bg-neutral-900 h-64 flex items-center justify-center text-neutral-400">
          이미지가 여기에 생성됩니다
        </div>
      )}
    </div>
  );
} 