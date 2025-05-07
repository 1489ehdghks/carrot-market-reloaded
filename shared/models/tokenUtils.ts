import { getModelById } from "./image/textModels";
import { getEditModelById } from "./image/editModels";

// 이미지 생성 비용 계산
interface ImageCostParams {
  modelId: string;
  width: number;
  height: number;
  faceSwapModelId?: string;
}

/**
 * 이미지 생성 비용을 계산합니다.
 * @param params 이미지 생성 매개변수
 * @returns 계산된 토큰 비용
 */
export function calculateImageCost(params: ImageCostParams): {
  total: number;
  breakdown: { name: string; tokens: number }[];
} {
  const { modelId, width, height, faceSwapModelId } = params;
  let totalTokens = 0;
  const breakdown: { name: string; tokens: number }[] = [];

  // 기본 모델 비용 계산
  const model = getModelById(modelId);
  if (model?.tokenPrice) {
    // 모델 기본 비용
    totalTokens += model.tokenPrice;
    breakdown.push({ name: `${model.name} 기본 비용`, tokens: model.tokenPrice });

    // 해상도 추가 비용 (512x512 이상일 경우)
    const baseSize = 512 * 512;
    const actualSize = width * height;
    if (actualSize > baseSize) {
      const sizeMultiplier = actualSize / baseSize;
      const sizeAdjustment = Math.round(model.tokenPrice * 0.1 * Math.min(sizeMultiplier - 1, 3));
      
      if (sizeAdjustment > 0) {
        totalTokens += sizeAdjustment;
        breakdown.push({ name: "고해상도 추가 비용", tokens: sizeAdjustment });
      }
    }
  }

  // Face Swap 추가 비용 계산
  if (faceSwapModelId) {
    const faceSwapModel = getEditModelById(faceSwapModelId);
    if (faceSwapModel?.tokenPrice) {
      totalTokens += faceSwapModel.tokenPrice;
      breakdown.push({ name: "Face Swap 추가 비용", tokens: faceSwapModel.tokenPrice });
    }
  }

  return {
    total: totalTokens,
    breakdown
  };
} 