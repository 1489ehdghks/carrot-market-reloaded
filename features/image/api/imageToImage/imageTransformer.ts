import Replicate from "replicate";
import { getReplicateClient } from "../shared/replicateClient";
import { extractImageUrl } from "../shared/utils";

export interface ImageTransformResult {
  success: boolean;
  imageUrl: string;
  modelId?: string;
  prompt?: string;
  width?: number;
  height?: number;
  error?: string;
}

// Image2Image 함수
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength: number = 0.8,
  width: number = 768,
  height: number = 768,
  modelId: string = "styleTransfer"
): Promise<ImageTransformResult> {
  try {
    // base64 이미지 처리
    let processedImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image')) {
      const formData = new FormData();
      const blob = await (await fetch(imageUrl)).blob();
      formData.append('file', blob);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드에 실패했습니다');
      }
      
      const { url } = await uploadResponse.json();
      processedImageUrl = url;
    }
    
    // imageModels.ts에서 모델 정보 가져오기
    const { getImageModelById } = await import('@/shared/models/image/imageModels');
    const modelInfo = getImageModelById(modelId);
    
    if (!modelInfo) {
      throw new Error(`모델 ID ${modelId}를 찾을 수 없습니다`);
    }
    
    console.log(`[Image2Image] 모델 사용: ${modelInfo.name} (${modelInfo.apiModel})`);
    
    // Replicate API 호출 및 이미지 생성
    const replicate = getReplicateClient();
    
    // 모델별 기본 입력 파라미터 준비
    const baseInput: Record<string, any> = {
      image: processedImageUrl,
      prompt: prompt
    };
    
    // 모델 타입에 따라 추가 파라미터 설정
    let modelInput: Record<string, any> = { ...baseInput };
    
    switch (modelId) {
      case 'styleTransfer':
        modelInput = {
          ...baseInput,
          style_strength: strength
        };
        break;
      case 'imageUpscaler':
        modelInput = {
          ...baseInput,
          scale: 2 // 기본값
        };
        break;
      case 'backgroundRemover':
        // 배경 제거는 추가 파라미터가 필요 없을 수 있음
        break;
      case 'imageExtender':
        modelInput = {
          ...baseInput,
          expansion_ratio: strength
        };
        break;
      case 'instantId':
        modelInput = {
          ...baseInput,
          ip_adapter_scale: strength,
          width: width,
          height: height
        };
        break;
      default:
        // 기본 입력값 사용
        modelInput = {
          ...baseInput,
          strength: strength,
          width: width,
          height: height
        };
    }
    
    console.log(`[Image2Image] 입력 파라미터:`, JSON.stringify(modelInput, null, 2));
    
    // API 호출
    const apiOutput = await replicate.run(
      modelInfo.apiModel as `${string}/${string}:${string}`,
      { input: modelInput }
    );
    
    // 이미지 URL 추출
    const outputUrl = extractImageUrl(apiOutput);
    if (!outputUrl) {
      throw new Error("이미지 생성에 실패했습니다");
    }
    
    console.log(`[Image2Image] 생성 완료: ${outputUrl.substring(0, 30)}...`);
    
    return {
      success: true,
      imageUrl: outputUrl,
      modelId: modelId,
      prompt,
      width,
      height
    };
  } catch (error) {
    console.error("이미지 변환 오류:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이미지 변환 중 오류 발생",
      imageUrl: ''
    };
  }
} 