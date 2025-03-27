"use server";

import { generateTextToImage } from "../service/textToImage";
import { ImageGenerationParams, ImageGenerationResult } from "../types";

/**
 * 텍스트로 이미지 생성하는 서버 액션
 * 
 * @param params 이미지 생성 매개변수
 * @returns 이미지 생성 결과
 */
export async function textToImageAction(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    // 실제 이미지 생성 서비스 호출
    const result = await generateTextToImage(params);
    
    // 결과 반환
    return result;
  } catch (error) {
    console.error("텍스트-이미지 생성 액션 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다",
      imageUrl: ""
    };
  }
} 