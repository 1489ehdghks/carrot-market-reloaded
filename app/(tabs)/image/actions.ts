"use server";

import {
  generateImageWithText as genImageWithText,
  generateImageWithImage as genImageWithImage,
  scheduleCloudflareUpload as scheduleUpload,
  getImageUploadUrl as getUploadUrl,
  saveGeneratedImage as saveImage,
  publishImage as publish,
  type ImageGenerationParams,
  type ImageGenerationResult
} from "../../lib/imageService";
import { db } from '@/shared/lib/db';
import getSession from "@/shared/lib/session";
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * 최적화된 이미지 생성 함수
 * 빠른 응답을 위해 Replicate API 호출 후 즉시 결과를 반환하며,
 * 이미지는 API 엔드포인트를 통해 생성되고 백그라운드에서 저장됩니다.
 * 
 * @param {object} params - 이미지 생성 매개변수
 * @param {string} params.prompt - 이미지 생성을 위한 프롬프트
 * @param {string} [params.modelId] - 사용할 모델 ID
 * @param {string} [params.negativePrompt] - 부정적 프롬프트
 * @param {number} [params.width] - 이미지 너비
 * @param {number} [params.height] - 이미지 높이
 * @param {number} [params.steps] - 생성 단계 수
 * @param {number} [params.cfgScale] - CFG 스케일
 * @param {string} [params.sampler] - 샘플러
 * @param {string} [params.vae] - VAE 모델
 * @returns {Promise<{success: boolean, image?: any, error?: string, tempUrl?: string}>}
 */
export async function generateImage(params: {
  prompt: string,
  modelId?: string,
  negativePrompt?: string,
  width?: number,
  height?: number,
  steps?: number,
  cfgScale?: number,
  sampler?: string,
  vae?: string,
}) {
  try {
    // API 호출 (즉시 결과 반환 + 백그라운드 처리)
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이미지 생성 실패');
    }
    
    const data = await response.json();
    return {
      success: true,
      image: data.image,
      // tempUrl은 즉시 사용 가능한 임시 URL
      tempUrl: data.image.tempUrl || data.image.url
    };
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// Text2Image 함수 - 외부로 노출할 서버 액션
/**
 * 텍스트를 기반으로 이미지를 생성합니다.
 * 
 * @param {ImageGenerationParams} params - 이미지 생성 매개변수
 * @returns {Promise<ImageGenerationResult>} 생성된 이미지 결과
 */
export async function generateImageWithText(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  return await genImageWithText({ ...params, saveMetadata: params.saveMetadata || false });
}

// Image2Image 함수 - 외부로 노출할 서버 액션
/**
 * 기존 이미지를 기반으로 새 이미지를 생성합니다.
 * 
 * @param {string} prompt - 이미지 생성을 위한 프롬프트
 * @param {string} imageUrl - 기준 이미지 URL
 * @param {number} [strength] - 변형 강도
 * @param {number} [width] - 이미지 너비
 * @param {number} [height] - 이미지 높이
 * @param {boolean} [saveMetadata] - 메타데이터 저장 여부
 * @returns {Promise<ImageGenerationResult>} 생성된 이미지 결과
 */
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength?: number,
  width?: number,
  height?: number,
  saveMetadata: boolean = false
): Promise<ImageGenerationResult> {
  return await genImageWithImage(prompt, imageUrl, strength, width, height, saveMetadata);
}

// Cloudflare 업로드 스케줄링 - 외부로 노출할 서버 액션
/**
 * 이미지를 Cloudflare에 업로드하도록 예약합니다.
 * 백그라운드에서 비동기적으로 처리됩니다.
 * 
 * @param {number} imageId - 이미지 ID
 * @param {string} originalUrl - 원본 이미지 URL
 * @returns {Promise<any>} 업로드 스케줄링 결과
 */
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  return await scheduleUpload(imageId, originalUrl);
}

// Cloudflare 이미지 업로드 URL 얻기 - 외부로 노출할 서버 액션
/**
 * Cloudflare 이미지 직접 업로드 URL을 가져옵니다.
 * 
 * @returns {Promise<any>} Cloudflare 업로드 URL 정보
 */
export async function getImageUploadUrl() {
  return await getUploadUrl();
}

// 이미지 정보를 DB에 저장 (영구 URL 포함) - 외부로 노출할 서버 액션
/**
 * 생성된 이미지 정보를 데이터베이스에 저장합니다.
 * 
 * @param {object} data - 이미지 데이터
 * @param {string} data.prompt - 이미지 생성 프롬프트
 * @param {string} data.fileUrl - 이미지 파일 URL
 * @param {string} data.modelId - 사용된 모델 ID
 * @param {string} [data.negativePrompt] - 부정적 프롬프트
 * @param {number} [data.width] - 이미지 너비
 * @param {number} [data.height] - 이미지 높이
 * @returns {Promise<any>} 저장 결과
 */
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}) {
  return await saveImage(data);
}

// 이미지 공개 함수 - 외부로 노출할 서버 액션
/**
 * 생성된 이미지를 공개 상태로 변경합니다.
 * 
 * @param {number} imageId - 공개할 이미지 ID
 * @returns {Promise<any>} 공개 처리 결과
 */
export async function publishImage(imageId: number) {
  return await publish(imageId);
}

/**
 * 이미지 공개 및 제목 업데이트 함수
 */
export async function publishImageWithTitle(
  imageId: number,
  title: string
) {
  try {
    const session = await getSession();
    const userId = session?.id;

    if (!userId) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    if (!imageId || typeof imageId !== 'number') {
      return {
        success: false,
        error: '유효하지 않은 이미지 ID입니다.'
      };
    }

    if (!title || title.trim() === '') {
      return {
        success: false,
        error: '제목을 입력해 주세요.'
      };
    }

    // 이미지 존재 여부 확인 및 소유자 확인
    const image = await db.aIImage.findUnique({
      where: {
        id: imageId,
        userId
      }
    });

    if (!image) {
      return {
        success: false,
        error: '이미지를 찾을 수 없거나 접근 권한이 없습니다.'
      };
    }

    // 이미지 공개 상태로 업데이트 및 제목 설정
    const updatedImage = await db.aIImage.update({
      where: {
        id: imageId
      },
      data: {
        title: title.trim(),
        isPublic: true
      }
    });

    // 캐시 갱신
    revalidatePath('/image');
    revalidatePath('/profile');
    
    return {
      success: true,
      image: updatedImage
    };

  } catch (error) {
    console.error('이미지 공개 중 오류 발생:', error);
    return {
      success: false,
      error: '이미지 공개 중 오류가 발생했습니다.'
    };
  }
} 