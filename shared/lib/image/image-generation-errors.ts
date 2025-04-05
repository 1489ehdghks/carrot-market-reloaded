/**
 * 이미지 생성 관련 에러 처리 유틸리티
 * 텍스트-이미지, 이미지-텍스트, 이미지 편집 등 여러 부분에서 재사용 가능
 */

import { UserFacingError, SystemError, handleGlobalError } from '../../constants/lib/error-handling';

// 이미지 생성 관련 에러 타입
export type ImageGenerationErrorType = 
  | 'prompt_missing'
  | 'model_missing'
  | 'size_missing'
  | 'nsfw_content'
  | 'face_image_missing'
  | 'api_error'
  | 'timeout'
  | 'server_error'
  | 'network_error'
  | 'quota_exceeded'
  | 'invalid_parameter'
  | 'unknown';

// 에러 타입별 사용자 친화적 메시지
const errorMessages: Record<ImageGenerationErrorType, string> = {
  prompt_missing: '이미지 생성을 위해 프롬프트를 입력해주세요.',
  model_missing: '이미지 생성을 위해 AI 모델을 선택해주세요.',
  size_missing: '이미지 생성을 위해 이미지 비율을 선택해주세요.',
  nsfw_content: '부적절한 콘텐츠가 감지되었습니다. 다른 프롬프트로 시도해주세요.',
  face_image_missing: 'Face Swap을 위해 얼굴 참조 이미지를 업로드해주세요.',
  api_error: 'API 서버와 통신 중 오류가 발생했습니다. 다시 시도해주세요.',
  timeout: '이미지 생성 시간이 초과되었습니다. 서버가 혼잡할 수 있으니 잠시 후 다시 시도해주세요.',
  server_error: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  network_error: '네트워크 연결이 불안정합니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
  quota_exceeded: '일일 이미지 생성 한도를 초과했습니다. 내일 다시 시도하거나 멤버십 업그레이드를 고려해보세요.',
  invalid_parameter: '잘못된 설정값이 있습니다. 입력값을 확인하고 다시 시도해주세요.',
  unknown: '이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
};

/**
 * 이미지 생성 관련 에러 처리 및 사용자 알림 함수
 * @param errorType 에러 유형
 * @param originalError 원본 에러 객체 (선택적)
 * @param additionalMessage 추가 메시지 (선택적)
 */
export function handleImageGenerationError(
  errorType: ImageGenerationErrorType,
  originalError?: Error | unknown,
  additionalMessage?: string
): void {
  // 기본 에러 메시지 가져오기
  let errorMessage = errorMessages[errorType] || errorMessages.unknown;
  
  // 추가 메시지가 있으면 결합
  if (additionalMessage) {
    errorMessage = `${errorMessage} ${additionalMessage}`;
  }
  
  // 특정 에러 타입에 따라 적절한 에러 객체 생성 및 처리
  if (
    errorType === 'prompt_missing' || 
    errorType === 'model_missing' || 
    errorType === 'size_missing' || 
    errorType === 'nsfw_content' || 
    errorType === 'face_image_missing' ||
    errorType === 'quota_exceeded' ||
    errorType === 'invalid_parameter'
  ) {
    // 사용자 실수나 인지 가능한 문제는 UserFacingError로 처리
    handleGlobalError(new UserFacingError(errorMessage));
  } else {
    // 시스템이나 서버 문제는 SystemError로 처리
    handleGlobalError(new SystemError(errorMessage, originalError));
  }
}

/**
 * API 응답에서 에러 유형 감지 함수
 * @param errorResponse API 에러 응답 또는 에러 메시지
 * @returns 감지된 에러 유형
 */
export function detectErrorType(errorResponse: any): ImageGenerationErrorType {
  if (!errorResponse) return 'unknown';
  
  const errorMessage = typeof errorResponse === 'string' 
    ? errorResponse.toLowerCase()
    : typeof errorResponse.message === 'string' 
      ? errorResponse.message.toLowerCase() 
      : typeof errorResponse.error === 'string'
        ? errorResponse.error.toLowerCase()
        : '';
  
  // 에러 메시지에 따른 유형 감지
  if (errorMessage.includes('nsfw') || errorMessage.includes('adult') || errorMessage.includes('inappropriate')) {
    return 'nsfw_content';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'timeout';
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('exceeded')) {
    return 'quota_exceeded';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'network_error';
  }
  
  if (errorMessage.includes('server') || errorMessage.includes('internal')) {
    return 'server_error';
  }
  
  if (errorMessage.includes('parameter') || errorMessage.includes('invalid')) {
    return 'invalid_parameter';
  }
  
  // HTTP 상태 코드 확인
  const statusCode = errorResponse.status || errorResponse.statusCode;
  if (statusCode) {
    if (statusCode === 400) return 'invalid_parameter';
    if (statusCode === 401 || statusCode === 403) return 'api_error';
    if (statusCode === 429) return 'quota_exceeded';
    if (statusCode >= 500) return 'server_error';
  }
  
  return 'api_error';
}

/**
 * API 요청 전 입력값 유효성 검증 함수
 * @param prompt 프롬프트 텍스트
 * @param modelId 모델 ID
 * @param size 이미지 크기
 * @param requireFaceImage Face Swap 모드에서 얼굴 이미지 필요 여부
 * @param faceImage Face Swap용 얼굴 이미지
 * @returns 유효성 검증 결과 (true: 유효, false: 유효하지 않음)
 */
export function validateImageGeneration(
  prompt?: string, 
  modelId?: string,
  size?: string,
  requireFaceImage: boolean = false,
  faceImage?: File | null
): boolean {
  // 프롬프트 검증
  if (!prompt || prompt.trim() === '') {
    handleImageGenerationError('prompt_missing');
    return false;
  }
  
  // 모델 검증
  if (!modelId) {
    handleImageGenerationError('model_missing');
    return false;
  }
  
  // 크기 검증
  if (!size || size === '') {
    handleImageGenerationError('size_missing');
    return false;
  }
  
  // Face Swap 모드에서 얼굴 이미지 검증
  if (requireFaceImage && !faceImage) {
    handleImageGenerationError('face_image_missing');
    return false;
  }
  
  return true;
}

/**
 * 에러 응답 처리 함수
 * @param error 에러 객체
 * @param fallbackMessage 기본 에러 메시지
 */
export function processApiError(error: unknown, fallbackMessage?: string): void {
  console.error('API 에러:', error);
  
  if (error instanceof Error) {
    // API 응답에서 에러 유형 감지
    const errorType = detectErrorType(error);
    handleImageGenerationError(errorType, error);
  } else {
    // 알 수 없는 에러
    handleImageGenerationError(
      'unknown', 
      error, 
      fallbackMessage || '서버 응답을 처리할 수 없습니다.'
    );
  }
} 