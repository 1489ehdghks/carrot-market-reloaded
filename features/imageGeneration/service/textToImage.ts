"use server";

import { generateWithReplicate, extractImageUrl } from "@/shared/api/replicate";
import { ImageGenerationParams, ImageGenerationResult } from "../types";
import { getModelById, getDefaultModel } from "@/data";

/**
 * 텍스트 기반 이미지 생성 함수
 * @param params 이미지 생성 매개변수
 * @returns 이미지 생성 결과
 */
export async function generateTextToImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    // 모델 정보 가져오기
    const modelInfo = getModelById(params.modelId || "") || getDefaultModel();
    const apiModel = modelInfo.apiModel;
    
    // 크기 파싱
    let parsedWidth = params.width;
    let parsedHeight = params.height;
    
    if (!parsedWidth || !parsedHeight) {
      const [sizeWidth, sizeHeight] = (params.size || "768x768").split("x").map(Number);
      if (!isNaN(sizeWidth) && !isNaN(sizeHeight)) {
        parsedWidth = sizeWidth;
        parsedHeight = sizeHeight;
      } else {
        parsedWidth = 768;
        parsedHeight = 768;
      }
    }
    
    // 시드 생성
    const seed = Math.floor(Math.random() * 2147483647);
    
    // Replicate API 호출
    const replicateResult = await generateWithReplicate({
      apiModel,
      input: {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        width: parsedWidth,
        height: parsedHeight,
        num_inference_steps: params.steps || 30,
        guidance_scale: params.cfgScale || 7,
        scheduler: params.sampler || "K_EULER_ANCESTRAL",
        seed
      }
    });
    
    if (!replicateResult.success) {
      return {
        success: false,
        error: replicateResult.error || "이미지 생성에 실패했습니다",
        imageUrl: ""
      };
    }
    
    // 이미지 URL 추출
    const imageUrl = extractImageUrl(replicateResult.result);
    
    if (!imageUrl) {
      return {
        success: false,
        error: "이미지 URL을 추출할 수 없습니다",
        imageUrl: ""
      };
    }
    
    // 성공 응답 반환
    return {
      success: true,
      imageUrl,
      modelId: params.modelId,
      prompt: params.prompt,
      width: parsedWidth,
      height: parsedHeight
    };
  } catch (error) {
    console.error("[TextToImage] 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다",
      imageUrl: ""
    };
  }
} 