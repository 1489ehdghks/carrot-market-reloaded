/**
 * 이미지 생성 오류 유형
 */
export type ImageGenerationErrorType = 
  | 'prompt_missing' 
  | 'model_missing' 
  | 'face_image_missing'
  | 'invalid_parameter'
  | 'api_error'
  | 'token_limit'
  | 'content_filter'
  | 'rate_limit'
  | 'server_error'
  | 'network_error'
  | 'unknown';

/**
 * 오류 메시지를 기반으로 오류 유형 감지
 */
export const detectErrorType = (errorMessage: string): ImageGenerationErrorType => {
  const errorMessage_lower = errorMessage.toLowerCase();
  
  if (errorMessage_lower.includes('prompt') && (errorMessage_lower.includes('missing') || errorMessage_lower.includes('empty'))) {
    return 'prompt_missing';
  }
  
  if (errorMessage_lower.includes('model') && errorMessage_lower.includes('missing')) {
    return 'model_missing';
  }
  
  if (errorMessage_lower.includes('face') && errorMessage_lower.includes('image')) {
    return 'face_image_missing';
  }
  
  if (errorMessage_lower.includes('token') && errorMessage_lower.includes('limit')) {
    return 'token_limit';
  }
  
  if (errorMessage_lower.includes('content') && errorMessage_lower.includes('filter')) {
    return 'content_filter';
  }
  
  if (errorMessage_lower.includes('rate') && errorMessage_lower.includes('limit')) {
    return 'rate_limit';
  }
  
  if (errorMessage_lower.includes('invalid') || errorMessage_lower.includes('parameter')) {
    return 'invalid_parameter';
  }
  
  if (errorMessage_lower.includes('server') || errorMessage_lower.includes('500')) {
    return 'server_error';
  }
  
  if (errorMessage_lower.includes('network') || errorMessage_lower.includes('connection')) {
    return 'network_error';
  }
  
  if (errorMessage_lower.includes('api')) {
    return 'api_error';
  }
  
  return 'unknown';
};

/**
 * 이미지 생성 오류를 처리합니다.
 */
export const handleImageGenerationError = (
  errorType: ImageGenerationErrorType, 
  error: Error | null = null,
  customMessage?: string
): string => {
  // 오류 타입별 기본 메시지
  const errorMessages: Record<ImageGenerationErrorType, string> = {
    'prompt_missing': '프롬프트를 입력해주세요.',
    'model_missing': '모델을 선택해주세요.',
    'face_image_missing': '얼굴 이미지를 업로드해주세요.',
    'invalid_parameter': '잘못된 매개변수가 입력되었습니다.',
    'api_error': 'API 호출 중 오류가 발생했습니다.',
    'token_limit': '토큰 한도를 초과했습니다. 프롬프트를 줄여주세요.',
    'content_filter': '부적절한 콘텐츠가 감지되었습니다.',
    'rate_limit': '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'server_error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'network_error': '네트워크 연결에 문제가 있습니다.',
    'unknown': '알 수 없는 오류가 발생했습니다.'
  };
  
  // 사용할 메시지 결정 (우선순위: customMessage > error.message > 기본 메시지)
  const message = customMessage || (error && error.message) || errorMessages[errorType];
  
  // 콘솔에 오류 기록
  console.error(`ImageGeneration Error (${errorType}):`, message, error);
  
  // 필요한 경우 여기에 알림, 로깅 등의 추가 처리 로직 구현
  
  return message;
};

/**
 * API 오류를 처리합니다.
 */
export const processApiError = (error: any, fallbackMessage: string = '오류가 발생했습니다.'): string => {
  // 오류가 문자열인 경우
  if (typeof error === 'string') {
    return handleImageGenerationError(detectErrorType(error), null, error);
  }
  
  // 오류가 Error 객체인 경우
  if (error instanceof Error) {
    return handleImageGenerationError(detectErrorType(error.message), error);
  }
  
  // 오류가 API 응답 객체인 경우
  if (error && error.error) {
    return handleImageGenerationError(detectErrorType(error.error), null, error.error);
  }
  
  // 그 외의 경우 기본 메시지 사용
  return handleImageGenerationError('unknown', null, fallbackMessage);
}; 