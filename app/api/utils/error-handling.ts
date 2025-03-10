/**
 * 에러 처리 유틸리티
 * 사용자가 볼 수 있는 에러와 시스템 내부 에러 구분 처리
 */

// 사용자에게 표시 가능한 에러 클래스
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

// 시스템 내부 에러 클래스 (사용자에게 노출하지 않음)
export class SystemError extends Error {
  cause: unknown;
  context?: Record<string, any>;

  constructor(message: string, cause?: unknown, context?: Record<string, any>) {
    super(message);
    this.name = 'SystemError';
    this.cause = cause;
    this.context = context;
  }
}

/**
 * Replicate API 에러 메시지 파싱
 * @param errorText API 응답 텍스트 또는 에러 객체
 * @returns 사용자 친화적인 에러 메시지
 */
export function parseReplicateError(errorText: string | any): string {
  // 문자열이 아닌 경우 처리
  if (typeof errorText !== 'string') {
    if (errorText?.detail) {
      errorText = errorText.detail;
    } else if (errorText?.message) {
      errorText = errorText.message;
    } else {
      try {
        errorText = JSON.stringify(errorText);
      } catch {
        return "이미지 생성 요청 처리 중 오류가 발생했습니다.";
      }
    }
  }

  // 적절한 오류 메시지 파싱
  const lowerCaseError = errorText.toLowerCase();

  // NSFW 관련 에러 - 더 정확한 패턴 매칭
  if (
    lowerCaseError.includes('nsfw') || 
    lowerCaseError.includes('adult') || 
    lowerCaseError.includes('inappropriate') ||
    lowerCaseError.includes('explicit content') ||
    lowerCaseError.includes('성인') ||
    lowerCaseError.includes('부적절한') ||
    lowerCaseError.includes('all generated images contained nsfw content')
  ) {
    // Replicate NSFW 에러 메시지를 그대로 보여주되, 한국어 설명 추가
    if (lowerCaseError.includes('all generated images contained nsfw content')) {
      return "생성된 모든 이미지가 NSFW(성인) 콘텐츠로 감지되었습니다. 다른 프롬프트로 시도해보세요.";
    }
    return "NSFW 콘텐츠 감지: 부적절한 콘텐츠는 생성할 수 없습니다. 다른 프롬프트로 시도해주세요.";
  }

  // 프롬프트 관련 에러
  if (
    lowerCaseError.includes('prompt') || 
    lowerCaseError.includes('text') ||
    lowerCaseError.includes('입력')
  ) {
    return "프롬프트 오류: 입력된 텍스트가 유효하지 않습니다. 다른 문구로 시도해보세요.";
  }

  // 모델 생성 실패
  if (
    lowerCaseError.includes('failed to generate') ||
    lowerCaseError.includes('generation failed') ||
    lowerCaseError.includes('생성 실패')
  ) {
    return "이미지 생성에 실패했습니다. 설정을 변경하거나 다른 프롬프트로 시도해보세요.";
  }

  // API 인증 에러
  if (
    lowerCaseError.includes('token') ||
    lowerCaseError.includes('auth') ||
    lowerCaseError.includes('authorization') ||
    lowerCaseError.includes('인증')
  ) {
    // 시스템 에러이지만 개발자가 확인할 수 있는 메시지 표시
    return "서버 인증 오류가 발생했습니다. 관리자에게 문의하세요.";
  }

  // 타임아웃 오류
  if (
    lowerCaseError.includes('timeout') ||
    lowerCaseError.includes('timed out') ||
    lowerCaseError.includes('시간 초과')
  ) {
    return "이미지 생성 시간이 초과되었습니다. 서버가 혼잡하니 잠시 후 다시 시도해주세요.";
  }

  // 원본 오류 메시지를 그대로 반환
  if (lowerCaseError.length > 0 && !lowerCaseError.includes('error') && !lowerCaseError.includes('exception')) {
    return errorText;
  }

  // 기본 에러 메시지
  return "이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.";
}

/**
 * HTTP 응답 객체에서 에러 추출
 * @param response fetch API 응답 객체
 * @returns 에러 객체 또는 메시지
 */
export async function extractErrorFromResponse(response: Response): Promise<UserFacingError | SystemError> {
  try {
    // 콘텐츠 타입 확인
    const contentType = response.headers.get('content-type') || '';
    
    // JSON 응답 처리
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      
      // 에러 메시지 추출
      const errorMessage = 
        errorData.error?.message || 
        errorData.error || 
        errorData.message || 
        errorData.detail || 
        `API 오류: ${response.status} ${response.statusText}`;
      
      // NSFW 관련 에러는 사용자 에러로 분류
      if (typeof errorMessage === 'string' && (
        errorMessage.toLowerCase().includes('nsfw') || 
        errorMessage.toLowerCase().includes('adult') ||
        errorMessage.toLowerCase().includes('inappropriate')
      )) {
        return new UserFacingError(parseReplicateError(errorMessage));
      }
      
      // 기본적으로 시스템 에러로 처리
      return new SystemError(`API 오류: ${response.status}`, errorData);
    }
    
    // 텍스트 응답 처리
    const errorText = await response.text();
    
    // 텍스트가 JSON인지 확인 시도
    try {
      const jsonData = JSON.parse(errorText);
      const message = jsonData.error || jsonData.message || jsonData.detail || errorText;
      
      if (typeof message === 'string' && (
        message.toLowerCase().includes('nsfw') || 
        message.toLowerCase().includes('adult')
      )) {
        return new UserFacingError(parseReplicateError(message));
      }
      
      return new SystemError(`API 오류: ${response.status}`, jsonData);
    } catch {
      // 일반 텍스트인 경우
      if (
        errorText.toLowerCase().includes('nsfw') || 
        errorText.toLowerCase().includes('adult')
      ) {
        return new UserFacingError(parseReplicateError(errorText));
      }
      
      return new SystemError(`API 오류: ${response.status}`, { text: errorText });
    }
  } catch (error) {
    // 예외 발생 시 기본 에러 반환
    return new SystemError(`응답 파싱 실패: ${response.status}`, error);
  }
}

/**
 * 시스템 에러 로깅 유틸리티
 * @param error 에러 객체
 * @param source 에러 발생 위치/소스
 */
export function logSystemError(error: SystemError | Error | unknown, source: string = "Unknown") {
  let errorMessage = "알 수 없는 에러";
  
  // 에러 메시지 추출
  if (error instanceof SystemError) {
    errorMessage = error.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error) {
    try {
      if (typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
    } catch {
      // 변환 실패 시 기본값 사용
    }
  }
  
  // 안전하게 로깅 - 상세 정보는 보내지 않음
  try {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SYSTEM_ERROR] [${source}] ${errorMessage}`);
    } else {
      console.error(`[SYSTEM_ERROR] [${source}] ${errorMessage.substring(0, 200)}`);
    }
  } catch (loggingError) {
    // 로깅 실패 시 최소한의 정보만 출력
    console.error(`[LOGGING_ERROR] 오류 로깅 중 추가 오류 발생: ${source}`);
  }
} 