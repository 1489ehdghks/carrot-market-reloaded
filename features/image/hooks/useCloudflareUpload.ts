"use client";

import { useState } from 'react';
import { handleGlobalError, UserFacingError } from '@/shared/lib/error-handling';
import { CloudflareUploadResult } from '@/shared/lib/cloudflare';

/**
 * Cloudflare 이미지 업로드 기능을 캡슐화하는 훅
 * 서버와의 통신을 추상화하여 클라이언트 코드에서 API 엔드포인트 구조를 직접 참조하지 않게 합니다.
 */
export function useCloudflareUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 임시 이미지 URL을 Cloudflare에 영구 저장합니다.
   * @param imageUrl 업로드할 이미지 URL
   * @param imageId 이미지 ID (선택적)
   * @param width 이미지 너비 (선택적)
   * @param height 이미지 높이 (선택적)
   */
  const uploadToPermanentStorage = async (
    imageUrl: string, 
    imageId?: string,
    width?: number,
    height?: number
  ): Promise<CloudflareUploadResult> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // URL 유효성 검사 강화
      if (!imageUrl || imageUrl === "pending" || imageUrl === "null") {
        console.warn("[Cloudflare] 유효하지 않은 이미지 URL:", imageUrl);
        throw new UserFacingError('유효한 이미지 URL이 아닙니다');
      }
      
      // URL 형식 확인 (http 또는 https로 시작하는지)
      if (!imageUrl.startsWith('http')) {
        console.warn("[Cloudflare] URL 형식이 아닌 값:", imageUrl);
        throw new UserFacingError('올바른 이미지 URL 형식이 아닙니다');
      }
      
      console.log("[Cloudflare] 영구 저장소 업로드 시작", {
        imageUrl: imageUrl.substring(0, 30) + "...",
        imageId,
        size: width && height ? `${width}x${height}` : "알 수 없음"
      });
      
      const response = await fetch('/features/image/api/cloudflare-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          imageId: imageId || `image-${Date.now()}`,
          width,
          height
        }),
      });
      
      console.log("[Cloudflare] API 응답 상태:", response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("[Cloudflare] 업로드 실패:", data.error || "알 수 없는 오류");
        throw new Error(data.error || '이미지 업로드 중 오류가 발생했습니다');
      }
      
      console.log("[Cloudflare] 업로드 성공:", {
        id: data.id?.substring(0, 8) || "없음",
        hasUrl: !!data.url,
        hasThumbnail: !!data.thumbnailUrl
      });
      
      if (!data.url) {
        throw new Error('Cloudflare에서 이미지 URL을 반환하지 않았습니다');
      }
      
      return {
        success: true,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || null,
        id: data.id || null,
        variants: data.variants || null,
        error: null
      };
      
    } catch (err: any) {
      const errorMessage = err.message || '이미지를 영구 저장소에 업로드하는 중 오류가 발생했습니다';
      console.error("[useCloudflareUpload] 오류:", errorMessage);
      setError(errorMessage);
      handleGlobalError(new UserFacingError(errorMessage));
      
      return {
        success: false,
        url: null,
        thumbnailUrl: null,
        id: null,
        variants: null,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * 로컬 이미지 파일을 Cloudflare에 직접 업로드합니다.
   * @param file 업로드할 파일
   * @param width 이미지 너비 (선택적)
   * @param height 이미지 높이 (선택적)
   */
  const uploadLocalImage = async (
    file: File,
    width?: number,
    height?: number
  ): Promise<CloudflareUploadResult> => {
    setIsUploading(true);
    setError(null);
    
    try {
      if (!file) {
        throw new UserFacingError('업로드할 파일이 제공되지 않았습니다');
      }
      
      console.log("[Cloudflare] 로컬 이미지 업로드 시작", {
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)}KB`,
        size: width && height ? `${width}x${height}` : "알 수 없음"
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // 이미지 크기 정보가 있으면 추가
      if (width) formData.append('width', width.toString());
      if (height) formData.append('height', height.toString());
      
      const response = await fetch('/features/image/api/cloudflare-upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log("[Cloudflare] API 응답 상태:", response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("[Cloudflare] 로컬 이미지 업로드 실패:", data.error || "알 수 없는 오류");
        throw new Error(data.error || '이미지 업로드 중 오류가 발생했습니다');
      }
      
      console.log("[Cloudflare] 로컬 이미지 업로드 성공:", {
        id: data.fileKey?.substring(0, 8) || "없음",
        hasUrl: !!data.fileUrl,
        hasThumbnail: !!data.thumbnailUrl
      });
      
      if (!data.fileUrl) {
        throw new Error('Cloudflare에서 이미지 URL을 반환하지 않았습니다');
      }
      
      return {
        success: true,
        url: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl || null,
        id: data.fileKey || null,
        variants: data.variants || null,
        error: null
      };
      
    } catch (err: any) {
      const errorMessage = err.message || '이미지를 Cloudflare에 업로드하는 중 오류가 발생했습니다';
      console.error("[useCloudflareUpload] 로컬 이미지 업로드 오류:", errorMessage);
      setError(errorMessage);
      handleGlobalError(new UserFacingError(errorMessage));
      
      return {
        success: false,
        url: null,
        thumbnailUrl: null,
        id: null,
        variants: null,
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    isUploading,
    error,
    uploadToPermanentStorage,
    uploadLocalImage
  };
} 