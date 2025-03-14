"use client";

import { useRef, useState, useCallback } from "react";
import { generateImageWithImage } from "../actions";
import { Loader2, Wand2 } from "lucide-react";
import { useImageUpload } from "../hooks/useImageUpload";
import { usePromptManagement } from "../hooks/usePromptManagement";
import { useFormStatusManager } from "../hooks/useFormStatusManager";
import { useCloudflareUpload } from "../hooks/useCloudflareUpload";
import { handleGlobalError, UserFacingError } from "@/app/lib/error-handling";

interface ImageToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string, thumbnailUrl?: string) => void;
  compact?: boolean;
}

export default function ImageToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  compact = false
}: ImageToImageFormProps) {
  // 커스텀 훅 사용
  const {
    imageFile,
    previewUrl,
    handleImageSelect,
    clearImage
  } = useImageUpload({ maxSizeMB: 10 });
  
  const {
    prompt,
    negativePrompt,
    promptTokenCount,
    negativeTokenCount,
    setPrompt,
    setNegativePrompt
  } = usePromptManagement(1500, 500);
  
  const {
    status,
    isProcessing,
    startProcess,
    handleError,
    setSuccess
  } = useFormStatusManager();
  
  const { uploadToPermanentStorage } = useCloudflareUpload();
  
  // 로컬 상태
  const [strength, setStrength] = useState(0.8);
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 이미지 크기 상수
  const IMAGE_WIDTH = 768;
  const IMAGE_HEIGHT = 768;
  
  // 이미지 파일 선택 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await handleImageSelect(file);
    } catch (error) {
      console.error("Image upload error:", error);
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 유효성 검사
      if (!prompt.trim()) {
        throw new UserFacingError('프롬프트를 입력해주세요');
      }
      
      if (!imageFile) {
        throw new UserFacingError('이미지를 업로드해주세요');
      }
      
      if (promptTokenCount > 1500) {
        throw new UserFacingError('프롬프트는 1500 토큰을 초과할 수 없습니다');
      }
      
      if (negativeTokenCount > 500) {
        throw new UserFacingError('네거티브 프롬프트는 500 토큰을 초과할 수 없습니다');
      }
      
      // 생성 시작
      onGenerationStart();
      startProcess('uploading');
      
      // 1. 이미지 업로드 URL 가져오기 및 이미지 업로드
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const uploadResponse = await fetch('/api/image-upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드 중 오류가 발생했습니다');
      }
      
      const { fileUrl, fileKey } = await uploadResponse.json();
      
      // 2. 이미지 생성 API 호출
      startProcess('generating');
      const result = await generateImageWithImage(
        prompt,
        fileKey,
        strength
      );
      
      if (!result || !result.imageUrl) {
        throw new Error('이미지 생성에 실패했습니다');
      }
      
      // 3. 생성된 이미지 정보 저장
      startProcess('saving');
      const uploadResult = await uploadToPermanentStorage(
        result.imageUrl,
        result.id?.toString() || `temp-${Date.now()}`,
        IMAGE_WIDTH,  // 이미지 너비
        IMAGE_HEIGHT  // 이미지 높이
      );
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('이미지 저장에 실패했습니다');
      }
      
      // 4. 완료 콜백 호출
      setSuccess();
      onGenerationComplete(
        uploadResult.url,
        uploadResult.id || String(Date.now()),
        uploadResult.thumbnailUrl || undefined
      );
      
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      handleError(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이미지 업로드 영역 */}
      <div className="w-full aspect-square bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Uploaded image" 
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => clearImage()}
              className="absolute bottom-3 right-3 bg-neutral-800 p-2 rounded-lg text-white text-xs hover:bg-neutral-700"
            >
              Change image
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Upload image</h3>
            <p className="text-sm text-neutral-400 mb-4">Please upload the image you want to transform</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-neutral-800 rounded-lg text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              Select image
            </button>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* 프롬프트 입력 영역 - 탭 디자인 개선 */}
      <div className="w-full mb-4">
        <div className="flex space-x-3 border-b border-neutral-700 mb-2">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prompt' 
                ? 'border-orange-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Prompt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('negative')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'negative' 
                ? 'border-orange-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Negative Prompt
          </button>
        </div>
        
        {activeTab === 'prompt' ? (
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
              placeholder="Describe what you want to generate..."
              required
            />
            <div className="absolute bottom-2 right-2 text-xs flex gap-2">
              <span className={promptTokenCount > 1500 ? 'text-red-500' : 'text-neutral-400'}>
                {promptTokenCount}/1500 tokens
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
              placeholder="Describe what you want to avoid in the generated image..."
            />
            <div className="absolute bottom-2 right-2 text-xs flex gap-2">
              <span className={negativeTokenCount > 500 ? 'text-red-500' : 'text-neutral-400'}>
                {negativeTokenCount}/500 tokens
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* 제어 설정 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="strength" className="block text-sm font-medium text-neutral-200">
            Transformation strength: {strength.toFixed(1)}
          </label>
          <span className="text-xs text-neutral-400">
            {strength < 0.4 ? 'Weak transformation' : strength > 0.7 ? 'Strong transformation' : 'Medium transformation'}
          </span>
        </div>
        <input
          type="range"
          id="strength"
          min="0.1"
          max="0.9"
          step="0.1"
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>
      
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={
            isProcessing || 
            !prompt.trim() || 
            !imageFile || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500
          }
          className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {status === 'uploading' ? '업로드 중...' :
                 status === 'generating' ? '생성 중...' :
                 status === 'saving' ? '저장 중...' : '처리 중...'}
              </span>
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              <span>Generate image</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
} 