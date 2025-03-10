import { getModelById, getDefaultModel } from '@/app/(tabs)/image/data/models';
import { AIModel } from '@/app/(tabs)/image/data/models';

/**
 * 모델 ID로 모델 정보를 가져오고 확장된 정보를 추가하는 유틸리티 함수
 * @param modelId 모델 ID
 * @returns 확장된 모델 정보 객체
 */
export function getModelInformation(modelId: string): AIModel & { version: string; supportsVae: boolean } {
  // 모델 정보 가져오기
  const modelInfo = getModelById(modelId);
  
  // 모델이 없으면 기본 모델 정보 반환
  const baseModel = modelInfo || getDefaultModel();
  
  // 모델 정보를 확장하여 추가 속성 제공
  return {
    ...baseModel,
    // version 속성: 버전이 있으면 사용하고 없으면 apiModel 자체를 사용
    version: extractModelVersion(baseModel.apiModel),
    // vae 지원 여부: 모델의 vae 속성이 비어있지 않은 경우 지원
    supportsVae: !!baseModel.vae
  };
}

/**
 * 모델 ID에서 버전 정보 추출
 * @param apiModel 모델 API ID
 * @returns 모델 버전 문자열 또는 apiModel 자체
 */
function extractModelVersion(apiModel: string): string {
  // 콜론(:)으로 버전 정보가 포함된 경우
  if (apiModel.includes(':')) {
    return apiModel.split(':')[1];
  }
  
  // 버전이 없는 모델들은 apiModel 자체를 사용
  return apiModel;
} 