"use client";

import { useState } from "react";
import { handleGlobalError, UserFacingError } from "@/app/lib/error-handling";
import { useCloudflareUpload } from "./useCloudflareUpload";

type GenerationStatus = 'idle' | 'generating' | 'uploading' | 'saving' | 'complete' | 'error';

interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae?: string;
  loras?: any[];
}

interface ImageGenerationHook {
  status: GenerationStatus;
  progress: number;
  error: string | null;
  imageUrl: string | null;
  imageId: string | null;
  thumbnailUrl: string | null;
  generateImage: (params: GenerationParams) => Promise<void>;
  reset: () => void;
}

export function useImageGeneration(
  onStart?: () => void,
  onComplete?: (imageUrl: string, imageId: string, thumbnailUrl?: string) => void
): ImageGenerationHook {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const { uploadToPermanentStorage } = useCloudflareUpload();
  
  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setImageUrl(null);
    setImageId(null);
    setThumbnailUrl(null);
  };
  
  const generateImage = async (params: GenerationParams) => {
    try {
      // 상태 초기화 및 생성 시작
      setStatus('generating');
      setProgress(0);
      setError(null);
      if (onStart) onStart();
      
      // API 요청 준비
      const body = {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt || "",
        modelId: params.modelId,
        width: params.width,
        height: params.height,
        steps: params.steps,
        cfgScale: params.cfgScale,
        sampler: params.sampler,
        vae: params.vae,
        saveMetadata: false
      };

      // 진행 상태 업데이트
      setProgress(10);
      
      // API 요청
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // 진행 상태 업데이트
      setProgress(50);
      
      // 오류 응답 처리
      if (!response.ok) {
        const errorData = await response.json();
        throw new UserFacingError(errorData.error || "이미지 생성 중 오류가 발생했습니다");
      }

      // 성공 응답 처리
      const data = await response.json();
      setProgress(80);
      
      if (!data.success) {
        throw new UserFacingError(data.error || "이미지 생성에 실패했습니다");
      }

      // 이미지 정보 설정
      const tempId = data.image.id || `temp-${Date.now()}`;
      setImageId(tempId);
      
      // 처리 중 상태 확인
      if (data.processing && (!data.image.url || data.image.status === "processing")) {
        console.log("이미지 처리 중, 상태 폴링 시작:", tempId);
        setStatus('generating');
        
        // 상태 폴링 (최대 60초, 5초 간격)
        let attempt = 0;
        const maxAttempts = 12;
        let imageData = null;
        
        while (attempt < maxAttempts) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
          
          try {
            // 이미지 상태 확인
            const statusResponse = await fetch(`/api/generate?tempId=${tempId}`);
            
            if (!statusResponse.ok) {
              console.log(`폴링 시도 ${attempt}/${maxAttempts}: 응답 오류`);
              continue;
            }
            
            const statusData = await statusResponse.json();
            console.log(`폴링 시도 ${attempt}/${maxAttempts}:`, statusData);
            
            if (statusData.success && statusData.status === 'completed' && statusData.image?.url) {
              // 처리 완료, 이미지 URL 설정
              imageData = statusData.image;
              break;
            } else if (statusData.status === 'failed') {
              // 처리 실패
              throw new UserFacingError("이미지 생성에 실패했습니다");
            }
            
            // 진행률 업데이트 (80~95%)
            setProgress(80 + Math.min(15, attempt));
          } catch (error) {
            console.error("이미지 상태 폴링 중 오류:", error);
          }
        }
        
        if (!imageData || !imageData.url) {
          throw new UserFacingError("이미지 생성 시간이 초과되었습니다");
        }
        
        // 이미지 URL 설정
        setImageUrl(imageData.url);
        setStatus('complete');
        setProgress(100);
        
        // 완료 콜백 호출
        if (onComplete) onComplete(imageData.url, imageData.id || tempId);
        return;
      }

      // 바로 URL이 있는 경우 (기존 코드)
      const tempUrl = data.image.url;
      
      if (!tempUrl) {
        throw new UserFacingError("유효한 이미지 URL이 반환되지 않았습니다");
      }
      
      setImageUrl(tempUrl);
      setStatus('complete');
      setProgress(100);
      
      // 완료 콜백 호출
      if (onComplete) onComplete(tempUrl, tempId);
      
      // 백그라운드에서 영구 URL로 저장 (useCloudflareUpload 훅 사용)
      setStatus('uploading');
      const result = await uploadToPermanentStorage(
        tempUrl, 
        tempId,
        params.width,
        params.height
      );
      
      if (result.success) {
        // URL 업데이트
        if (result.url) {
          setImageUrl(result.url);
        }
        
        // 썸네일 URL 설정
        if (result.thumbnailUrl) {
          setThumbnailUrl(result.thumbnailUrl);
        }
        
        // ID 업데이트
        if (result.id) {
          setImageId(result.id);
        }
        
        // 완료 콜백 다시 호출 (영구 URL로)
        if (onComplete && result.url) {
          onComplete(
            result.url, 
            result.id || tempId,
            result.thumbnailUrl || undefined
          );
        }
      } else if (result.error) {
        console.warn("영구 저장소 업로드 실패:", result.error);
        // 실패해도 임시 URL은 계속 사용 가능하므로 치명적인 오류는 아님
      }
      
      setStatus('complete');
      
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      
      setStatus('error');
      setProgress(0);
      
      // 오류 메시지 설정
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다");
      
      // 전역 오류 핸들러에 전달
      if (error instanceof UserFacingError) {
        handleGlobalError(error);
      } else {
        handleGlobalError(new UserFacingError(error.message || "이미지 생성 중 오류가 발생했습니다"));
      }
    }
  };
  
  return {
    status,
    progress,
    error,
    imageUrl,
    imageId,
    thumbnailUrl,
    generateImage,
    reset
  };
} 