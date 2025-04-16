// 텍스트-이미지 생성 관련 모듈
import {
  ImageGenerationParams,
  ImageGenerationResult,
  generateImageWithText,
  generateImageWithReplicate,
  extractImageUrl
} from '../../../app/api/image/textToImage/textImageGenerator';

// 이미지-이미지 생성 관련 타입
import {
  ImageToImageGenerationParams,
  ImageToImageGenerationResult
} from '../image-category-types';

// 이미지 모델 관련 모듈
import {
  getImageModelById
} from '@/shared/models/image/imageModels';

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
import getSession from "@/shared/lib/session";

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

// 타입 정의 부분을 확인하거나 추가
export interface GenerateImageWithImageParams {
  userId: number;
  image: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  scheduler?: string;
  strength?: number;
  model: string;
}

export interface GenerateImageWithImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  id?: number;
}

// 이미지-이미지 생성 함수
export async function generateImageWithImage({
  userId,
  image,
  prompt,
  negativePrompt,
  width,
  height,
  num_inference_steps,
  guidance_scale,
  scheduler,
  strength,
  model,
}: GenerateImageWithImageParams): Promise<GenerateImageWithImageResult> {
  try {
    if (!userId) {
      return { success: false, error: "인증된 사용자만 이미지를 생성할 수 있습니다." };
    }

    // 이미지 처리
    let processedImage = image;
    let rawBase64Data = '';

    // 이미지 형식 확인 (Base64 문자열 또는 URL)
    if (image.startsWith('data:')) {
      // Base64 문자열인 경우 데이터 URI 프리픽스 제거
      const base64Parts = image.split(',');
      if (base64Parts.length !== 2) {
        return { success: false, error: "유효하지 않은 Base64 이미지 형식입니다" };
      }
      rawBase64Data = base64Parts[1];
    } else if (image.startsWith('http')) {
      // URL인 경우 가져와서 Base64로 변환
      try {
        const response = await fetch(image);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        rawBase64Data = buffer.toString('base64');
      } catch (error) {
        console.error("이미지 URL을 가져오는 중 오류 발생:", error);
        return { success: false, error: "이미지 URL을 가져오는 데 실패했습니다" };
      }
    } else {
      return { success: false, error: "지원되지 않는 이미지 형식입니다" };
    }

    const modelInfo = await getImageModelById(model);
    if (!modelInfo) {
      return { success: false, error: "모델 정보를 찾을 수 없습니다" };
    }

    try {
      console.log('Replicate API 호출 시작', { 
        model: modelInfo.version || modelInfo.apiModel, 
        prompt,
        hasRawBase64: !!rawBase64Data,
        imageDataLength: rawBase64Data.length
      });

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
        body: JSON.stringify({
          version: modelInfo.version || modelInfo.apiModel,
          input: {
            prompt,
            negative_prompt: negativePrompt,
            image: rawBase64Data,
            width,
            height,
            num_inference_steps,
            guidance_scale,
            scheduler,
            strength,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('이미지 생성 API 호출에 실패했습니다');
      }

      const data = await response.json();
      if (!data.id) {
        throw new Error('이미지 생성 ID를 받지 못했습니다');
      }

      // 결과 URL을 얻을 때까지 폴링
      let resultUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (!resultUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error('이미지 생성 상태 확인에 실패했습니다');
        }

        const statusData = await statusResponse.json();
        if (statusData.status === 'succeeded' && statusData.output?.[0]) {
          resultUrl = statusData.output[0];
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('이미지 생성에 실패했습니다');
        }

        attempts++;
      }

      if (!resultUrl) {
        throw new Error('이미지 생성 시간이 초과되었습니다');
      }

      return { success: true, imageUrl: resultUrl };
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' };
    }
  } catch (error) {
    console.error('이미지 생성 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' };
  }
}

async function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  ImageToImageGenerationParams,
  ImageToImageGenerationResult
}; 