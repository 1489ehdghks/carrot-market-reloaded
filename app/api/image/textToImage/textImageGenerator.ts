import Replicate from "replicate";
import { db } from "@/shared/lib/db";
import { getSession } from "@/shared/lib/auth";
import { cache } from "react";
import { getModelById, getDefaultModel } from "@/shared/models/image/textModels";

// 캐싱된 세션 가져오기
export const getCachedSession = cache(async () => {
  return await getSession();
});

// Replicate 클라이언트 인스턴스 생성 (싱글톤 패턴)
const getReplicateClient = (() => {
  let instance: Replicate | null = null;
  
  return () => {
    if (!instance) {
      instance = new Replicate({
        auth: process.env.REPLICATE_API_KEY || "",
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(60000) // 60초 이상 자동 중지
          });
        }
      });
    }
    return instance;
  };
})();

// 타입 정의
export interface ImageGenerationParams {
  prompt: string;
  modelId?: string;
  negativePrompt?: string;
  apiModel?: string;
  vae?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  width?: number;
  height?: number;
  additionalParams?: Record<string, any>;
  userId?: number;
}

export interface ImageGenerationResult {
  id?: number;
  imageUrl?: string;
  modelId?: string;
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  model?: string;
  source?: string;
  success: boolean;
  error?: string;
}

/**
 * Replicate API를 사용하여 이미지 생성 (run 메서드 사용)
 * API 엔드포인트와 다른 서비스 함수에서 모두 사용할 수 있는 통합 함수
 */
export async function generateImageWithReplicate({
  prompt,
  negativePrompt,
  width,
  height,
  steps,
  cfgScale,
  modelId,
  sampler,
  vae
}: {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  modelId?: string;
  sampler?: string;
  vae?: string;
}): Promise<ImageGenerationResult> {                                 
  try {
    if (!width || !height || !steps || !cfgScale || !modelId || !sampler) {
      return {
        success: false,
        error: "이미지 생성에 필요한 필수 값이 제공되지 않았습니다.",
        imageUrl: ''
      };
    }

    console.log(`[Replicate] 이미지 생성 시작: "${prompt.substring(0, 30)}...", 모델: ${modelId}, 크기: ${width}x${height}`);
    
    // Replicate API 설정
    const input = {
      prompt,
      negative_prompt: negativePrompt || "",
      width,
      height,
      num_inference_steps: steps,
      guidance_scale: cfgScale,
      scheduler: sampler,
      vae: vae || null,
      seed: Math.floor(Math.random() * 1000000)
    };
    
    // 모델 정보 가져오기
    const modelInfo = getModelById(modelId) || getDefaultModel();
    const apiModel = modelInfo.apiModel;
    
    console.log(`[Replicate] 모델 정보: ${apiModel}, ${modelInfo.name}`);
    console.log(`[Replicate] 사용 시드: ${input.seed}`);
    
    // Replicate 클라이언트 가져오기
    const replicate = getReplicateClient();
    
    // 이미지 생성 요청 (run 메서드 사용)
    const output = await replicate.run(
      apiModel as `${string}/${string}:${string}`,
      {
        input: input
      }
    );
    
    console.log("Replicate API 응답 타입:", typeof output);
    
    // 결과 처리
    let imageUrl = '';
    
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = String(output[0]);
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      const outputObj = output as any;
      if (outputObj.output) {
        if (typeof outputObj.output === 'string') {
          imageUrl = outputObj.output;
        } else if (Array.isArray(outputObj.output) && outputObj.output.length > 0) {
          imageUrl = String(outputObj.output[0]);
        }
      }
    }
    
    // URL 검증
    if (!imageUrl) {
      return { success: false, error: "이미지 URL을 생성하지 못했습니다", imageUrl: '' };
    }
    
    // 유효한 URL 검증
    try {
      new URL(imageUrl);
    } catch (e) {
      return { success: false, error: "유효하지 않은 이미지 URL 형식", imageUrl: '' };
    }
    
    return { 
      success: true, 
      imageUrl,
      prompt: prompt,
      modelId: modelId,
      width: width,
      height: height
    };
  } catch (error) {
    console.error("이미지 생성 실패:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이미지 생성 중 오류 발생",
      imageUrl: ''
    };
  }
}

// Text2Image 함수
export async function generateImageWithText({
  prompt, 
  modelId, 
  negativePrompt,
  vae,
  steps,
  cfgScale,
  sampler,
  width,
  height,
  userId,
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    console.log(`[서비스] 텍스트에서 이미지 생성: "${prompt.substring(0, 30)}...", 모델: ${modelId}, 크기: ${width}x${height}`);
    
    // Replicate API 직접 호출
    const imageResult = await generateImageWithReplicate({
      prompt,
      negativePrompt,
      width,
      height,
      steps,
      cfgScale,
      modelId,
      sampler,
      vae
    });
    
    // 이미지 생성 실패 시 오류 반환
    if (!imageResult.success || !imageResult.imageUrl) {
      console.log(`[서비스] 이미지 생성 실패: ${imageResult.error}`);
      return { 
        success: false, 
        error: imageResult.error || "이미지 생성 실패", 
        imageUrl: '' 
      };
    }
    
    console.log(`[서비스] 이미지 생성 성공: ${imageResult.imageUrl.substring(0, 30)}...`);
    
    // 항상 이미지 저장
    let savedImageId: number | undefined = undefined;
    
    if (userId) {
      try {
        // 로그인한 사용자인 경우 생성된 이미지 정보를 DB에 저장
        const savedResult = await db.aIImage.create({
          data: {
            userId,
            title: prompt.substring(0, 100),
            prompt: prompt.substring(0, 1000),
            negativePrompt: negativePrompt || "",
            model: modelId || "unknown",
            width: width || 0,
            height: height || 0,
            steps: steps || 0,
            cfgScale: cfgScale || 0,
            sampler: sampler || "unknown",
            vae: vae ? vae.substring(0, 100) : null,
            fileUrl: imageResult.imageUrl.substring(0, 500),
            thumbnailUrl: imageResult.imageUrl.substring(0, 500),
            isPermanent: false,
            isPublic: false,
            format: "png",
            created_at: new Date(),
            category: "AI"
          }
        });
        
        savedImageId = savedResult.id;
        console.log(`[서비스] 이미지 저장 성공: ID=${savedImageId}`);
      } catch (dbError) {
        console.error('[서비스] 생성된 이미지 저장 중 오류:', dbError);
        // DB 저장 실패해도 이미지 URL은 반환
      }
    } else {
      console.log('[서비스] 저장 없이 이미지만 생성 (사용자 ID 없음)');
    }
    
    return {
      id: savedImageId,
      success: true,
      imageUrl: imageResult.imageUrl,
      modelId: modelId,
      prompt: prompt,
      width: width,
      height: height
    };
  } catch (error) {
    console.error('[서비스] 이미지 생성 중 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이미지 생성 중 오류 발생", 
      imageUrl: '' 
    };
  }
}

// 응답에서 이미지 URL 추출 유틸리티 함수
export function extractImageUrl(output: any): string | null {
  // 응답이 없는 경우 null 반환
  if (!output) return null;
  
  // 배열인 경우 첫 번째 항목 반환
  if (Array.isArray(output) && output.length > 0) {
    return typeof output[0] === 'string' ? output[0] : null;
  }
  
  // 문자열인 경우 그대로 반환
  if (typeof output === 'string') {
    return output;
  }
  
  // 객체인 경우 output.output 또는 output.url 등의 필드 확인
  if (typeof output === 'object') {
    // output.output 필드 확인
    if (output.output) {
      if (Array.isArray(output.output) && output.output.length > 0) {
        return typeof output.output[0] === 'string' ? output.output[0] : null;
      }
      if (typeof output.output === 'string') {
        return output.output;
      }
    }
    
    // 직접 URL 필드들 확인
    const urlFields = ['url', 'imageUrl', 'image_url', 'file', 'fileUrl', 'file_url'];
    for (const field of urlFields) {
      if (output[field] && typeof output[field] === 'string') {
        return output[field];
      }
    }
  }
  
  // URL을 찾지 못한 경우 null 반환
  return null;
} 