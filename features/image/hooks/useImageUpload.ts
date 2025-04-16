"use client";

import { useState } from 'react';
import { handleGlobalError, UserFacingError } from "@/shared/lib/error-handling";

interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  compressionQuality?: number;
  maxDimension?: number;
}

interface ImageUploadHook {
  imageFile: File | null;
  previewUrl: string | null;
  isUploading: boolean;
  error: string | null;
  handleImageSelect: (file: File) => Promise<void>;
  handleImageDrop: (e: React.DragEvent) => Promise<void>;
  clearImage: () => void;
  compressImage: (file: File) => Promise<File>;
  uploadImageToServer: (path: string) => Promise<string>;
  uploadToCloudflare: (file: File, id: string, width: number, height: number) => Promise<{ success: boolean; url?: string; error?: string }>;
}

export function useImageUpload(options?: UploadOptions): ImageUploadHook {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    compressionQuality = 0.8,
    maxDimension = 1200
  } = options || {};
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 이미지 유효성 검증
  const validateImage = (file: File): boolean => {
    setError(null);
    
    // 파일 타입 검증
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `지원되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      handleGlobalError(new UserFacingError(errorMsg));
      return false;
    }
    
    // 파일 크기 검증
    if (file.size > maxSizeMB * 1024 * 1024) {
      const errorMsg = `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 허용됩니다.`;
      setError(errorMsg);
      handleGlobalError(new UserFacingError(errorMsg));
      return false;
    }
    
    return true;
  };
  
  // 이미지 선택 처리
  const handleImageSelect = async (file: File): Promise<void> => {
    if (!validateImage(file)) return;
    
    try {
      // 필요한 경우 이미지 압축
      let processedFile = file;
      if (file.size > 5 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }
      
      // 미리보기 URL 생성
      const newPreviewUrl = URL.createObjectURL(processedFile);
      
      // 이전 미리보기 URL 정리
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      // 이미지 파일과 미리보기 URL 설정
      setImageFile(processedFile);
      setPreviewUrl(newPreviewUrl);
      setError(null);
      
      console.log("이미지 파일 설정 완료:", {
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type
      });
      
    } catch (err: any) {
      const errorMsg = `이미지 처리 중 오류: ${err.message || '알 수 없는 오류'}`;
      setError(errorMsg);
      handleGlobalError(new UserFacingError(errorMsg));
    }
  };
  
  // 드래그 앤 드롭 처리
  const handleImageDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageSelect(e.dataTransfer.files[0]);
    }
  };
  
  // 이미지 초기화
  const clearImage = (): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
  };
  
  // 이미지 압축
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 이미지 크기 계산
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Canvas 생성 및 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas 컨텍스트 생성 실패'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob 생성
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('이미지 압축 실패'));
            return;
          }
          
          // File 객체 생성
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, 'image/jpeg', compressionQuality);
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      
      // FileReader로 이미지 데이터 로드
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('파일 읽기 실패'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };
  
  // 서버에 이미지 업로드
  const uploadImageToServer = async (path: string): Promise<string> => {
    if (!imageFile) {
      throw new UserFacingError('업로드할 이미지가 없습니다');
    }
    
    try {
      setIsUploading(true);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // 이미지 업로드 API 호출
      const response = await fetch(path, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.url) {
        throw new Error('서버에서 이미지 URL을 반환하지 않았습니다');
      }
      
      return data.url;
      
    } catch (err: any) {
      const errorMsg = `이미지 업로드 오류: ${err.message || '알 수 없는 오류'}`;
      setError(errorMsg);
      handleGlobalError(new UserFacingError(errorMsg));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Cloudflare 업로드 함수 추가
  const uploadToCloudflare = async (
    file: File,
    id: string,
    width: number,
    height: number
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      setIsUploading(true);
      setError(null);

      // 이미지 압축
      const compressedFile = await compressImage(file);

      // FormData 생성
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('id', id);
      formData.append('width', width.toString());
      formData.append('height', height.toString());

      // Cloudflare 업로드 API 호출
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Cloudflare 업로드 실패');
      }

      const data = await response.json();
      return { success: true, url: data.url };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };
  
  return {
    imageFile,
    previewUrl,
    isUploading,
    error,
    handleImageSelect,
    handleImageDrop,
    clearImage,
    compressImage,
    uploadImageToServer,
    uploadToCloudflare,
  };
} 