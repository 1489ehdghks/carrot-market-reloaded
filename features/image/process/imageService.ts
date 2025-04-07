// 텍스트-이미지 생성 관련 모듈
import {
  ImageGenerationParams,
  ImageGenerationResult,
  generateImageWithText,
  generateImageWithReplicate,
  extractImageUrl
} from '../../../app/api/image/textToImage/textImageGenerator';

// Cloudflare 업로드 관련 모듈
import {
  optimizedUploadToCloudflare,
  scheduleCloudflareUpload,
  processImageBackground,
  getImageUploadUrl
} from './cloudflare/cloudflareUploader';

// 유틸리티 함수 모듈
import {
  selectVariant,
  generatePublicVariantUrl
} from './utils';


// 세션 관리 및 DB 접근
import { db } from "@/shared/lib/db";
import { getCachedSession } from '@/app/api/image/textToImage/textImageGenerator';

// 업로드 추적을 위한 맵 추가 
const uploadTracker = new Map<string, {
  status: 'pending' | 'completed' | 'failed',
  timestamp: number,
  result?: any
}>();

// 이미지 생성 후 저장이 필요한 경우 API 엔드포인트 호출
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  userId?: number;
}) {
  try {
    // 세션 정보로 유저 ID 가져오기
    const userId = data.userId;
    if (!userId) {
      const session = await getCachedSession();
      if (!session?.id) {
        throw new Error('로그인이 필요합니다');
      }
    }

    // DB에 직접 저장
    const savedImage = await db.aIImage.create({
      data: {
        userId: data.userId || (await getCachedSession())?.id as number,
        title: data.prompt.substring(0, 100),
        prompt: data.prompt.substring(0, 1000),
        negativePrompt: data.negativePrompt ? data.negativePrompt.substring(0, 500) : "",
        model: data.modelId.substring(0, 100),
        width: data.width || 768,
        height: data.height || 768,
        fileUrl: data.fileUrl.substring(0, 500),
        thumbnailUrl: data.fileUrl.substring(0, 500),
        isPermanent: false,
        isPublic: false,
        format: "png",
        created_at: new Date(),
        category: "AI"
      }
    });

    return {
      success: true,
      id: savedImage.id,
      url: data.fileUrl
    };
  } catch (error) {
    console.error('이미지 저장 오류:', error);
    throw error;
  }
}

// 이미지 공개 함수
export async function publishImage(imageId: number) {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    throw new Error("유효하지 않은 이미지 ID입니다.");
  }

  const session = await getCachedSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  // 이미지 조회
  const image = await db.aIImage.findUnique({
    where: { id: imageId }
  });
  
  if (!image) throw new Error("이미지를 찾을 수 없습니다");
  if (image.userId !== session.id) throw new Error("권한이 없습니다");
  if (image.isPublic) return image; // 이미 공개 상태면 바로 반환
  
  try {
    // 공개 상태로 변경
    return await db.aIImage.update({
      where: { id: imageId },
      data: { isPublic: true }
    });
  } catch (error) {
    console.error("이미지 공개 중 오류:", error);
    throw new Error("이미지 공개 중 오류가 발생했습니다");
  }
}

// 기존 함수들 다른 모듈에서 임포트해서 재노출
export {
  // 텍스트-이미지 관련 함수
  generateImageWithText,
  generateImageWithReplicate,
  
  
  // Cloudflare 업로드 관련 함수
  optimizedUploadToCloudflare,
  scheduleCloudflareUpload,
  processImageBackground,
  getImageUploadUrl,
  
  // 유틸리티 함수
  extractImageUrl,
  selectVariant,
  generatePublicVariantUrl,
};

// 타입 정의를 별도로 익스포트
export type {
  ImageGenerationParams,
  ImageGenerationResult,
}; 