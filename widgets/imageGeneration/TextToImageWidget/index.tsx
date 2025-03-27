"use client";

import { useState } from "react";
import { textToImageAction } from "@/features/imageGeneration/actions/generationActions";
import { ImageGenerationParams } from "@/features/imageGeneration/types";

interface TextToImageWidgetProps {
  onGenerationStart?: () => void;
  onGenerationComplete?: (imageUrl: string, imageId: string) => void;
  onError?: (message: string) => void;
}

export default function TextToImageWidget({
  onGenerationStart,
  onGenerationComplete,
  onError
}: TextToImageWidgetProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError("프롬프트를 입력해주세요");
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      onGenerationStart?.();
      
      // 이미지 생성 매개변수 설정
      const params: ImageGenerationParams = {
        prompt,
        negativePrompt: negativePrompt || undefined,
        size: "768x768",
        steps: 30,
        cfgScale: 7
      };
      
      // 서버 액션 호출
      const result = await textToImageAction(params);
      
      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || "이미지 생성에 실패했습니다");
      }
      
      // 결과 처리
      setGeneratedImageUrl(result.imageUrl);
      onGenerationComplete?.(result.imageUrl, result.id?.toString() || "temp-id");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "이미지 생성 중 오류가 발생했습니다";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            프롬프트
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-[100px] p-3 border rounded-md"
            placeholder="이미지에 포함할 내용을 자세히 설명해주세요..."
          />
        </div>
        
        <div>
          <label htmlFor="negativePrompt" className="block text-sm font-medium mb-1">
            네거티브 프롬프트 (선택사항)
          </label>
          <textarea
            id="negativePrompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full min-h-[60px] p-3 border rounded-md"
            placeholder="이미지에서 제외할 내용을 입력하세요..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isGenerating ? "생성 중..." : "이미지 생성"}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {generatedImageUrl && !isGenerating && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">생성된 이미지</h3>
          <div className="overflow-hidden rounded-lg">
            <img 
              src={generatedImageUrl} 
              alt="생성된 이미지" 
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
} 