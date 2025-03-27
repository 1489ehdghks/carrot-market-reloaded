/**
 * 이미지 생성 관련 오류 처리 모듈
 * 
 * 이 모듈은 이미지 생성 과정에서 발생할 수 있는 다양한 유형의 오류를 처리합니다.
 * - 이미지 생성 유효성 검사
 * - API 오류 처리
 * - 사용자 피드백 메시지 생성
 * - 오류 유형 감지 및 분류
 * 
 * @module features/imageGeneration/errors
 */

import { ImageGenerationParams } from "./types";

/**
 * 이미지 생성 요청 유효성 검사
 * 
 * 이미지 생성 요청의 파라미터가 유효한지 검사하고 오류 메시지를 반환합니다.
 * 
 * @param params 이미지 생성 파라미터
 * @returns 유효성 검사 결과 (성공 여부와 오류 메시지)
 */
export function validateImageGeneration(params: Partial<ImageGenerationParams>): { valid: boolean; error?: string } {
  // 필수 프롬프트 검사
  if (!params.prompt || params.prompt.trim() === '') {
    return {
      valid: false,
      error: '이미지 생성을 위한 프롬프트를 입력해주세요.'
    };
  }

  // 프롬프트 길이 제한 검사
  if (params.prompt.length > 1000) {
    return {
      valid: false,
      error: '프롬프트가 너무 깁니다. 1000자 이내로 작성해주세요.'
    };
  }

  // 네거티브 프롬프트 길이 제한 검사
  if (params.negativePrompt && params.negativePrompt.length > 500) {
    return {
      valid: false,
      error: '네거티브 프롬프트가 너무 깁니다. 500자 이내로 작성해주세요.'
    };
  }

  // 스텝 수 검사
  if (params.steps !== undefined) {
    if (params.steps < 10) {
      return {
        valid: false,
        error: '스텝 수는 최소 10 이상이어야 합니다.'
      };
    }
    if (params.steps > 150) {
      return {
        valid: false,
        error: '스텝 수는 최대 150 이하여야 합니다.'
      };
    }
  }

  // CFG 스케일 검사
  if (params.cfgScale !== undefined) {
    if (params.cfgScale < 1) {
      return {
        valid: false,
        error: 'CFG 스케일은 최소 1 이상이어야 합니다.'
      };
    }
    if (params.cfgScale > 30) {
      return {
        valid: false,
        error: 'CFG 스케일은 최대 30 이하여야 합니다.'
      };
    }
  }

  // 이미지 크기 검사
  if (params.size) {
    const [width, height] = params.size.split('x').map(Number);
    if (isNaN(width) || isNaN(height)) {
      return {
        valid: false,
        error: '유효하지 않은 이미지 크기 형식입니다. "너비x높이" 형태로 입력해주세요.'
      };
    }

    if (width < 256 || height < 256) {
      return {
        valid: false,
        error: '이미지 크기는 최소 256x256 이상이어야 합니다.'
      };
    }

    if (width > 1024 || height > 1024) {
      return {
        valid: false,
        error: '이미지 크기는 최대 1024x1024 이하여야 합니다.'
      };
    }
  }

  // 너비/높이 검사 (size 대신 직접 값을 제공한 경우)
  if (params.width !== undefined || params.height !== undefined) {
    const width = params.width || 0;
    const height = params.height || 0;

    if (width < 256 || height < 256) {
      return {
        valid: false,
        error: '이미지 크기는 최소 256x256 이상이어야 합니다.'
      };
    }

    if (width > 1024 || height > 1024) {
      return {
        valid: false,
        error: '이미지 크기는 최대 1024x1024 이하여야 합니다.'
      };
    }
  }

  // 모든 검사 통과
  return { valid: true };
}

/**
 * API 오류 처리 함수
 * 
 * API 호출 중 발생한 오류를 처리하고 사용자 친화적인 메시지를 반환합니다.
 * 
 * @param error API 호출 중 발생한 오류
 * @returns 사용자 친화적인 오류 메시지
 */
export function processApiError(error: unknown): string {
  // 오류 객체 기본 처리
  if (error instanceof Error) {
    const errorMessage = error.message || '알 수 없는 오류';
    
    // Replicate API 오류 패턴 감지
    if (errorMessage.includes('Replicate') || errorMessage.includes('replicate')) {
      return `AI 이미지 생성 서비스 오류: ${errorMessage}`;
    }
    
    // NSFW 콘텐츠 감지 관련 오류
    if (errorMessage.toLowerCase().includes('nsfw') || 
        errorMessage.toLowerCase().includes('safety') || 
        errorMessage.toLowerCase().includes('inappropriate')) {
      return '부적절한 콘텐츠가 감지되었습니다. 프롬프트를 수정해주세요.';
    }
    
    // 인증 관련 오류
    if (errorMessage.includes('auth') || 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('authentication')) {
      return '인증 오류가 발생했습니다. 다시 로그인해주세요.';
    }
    
    // 네트워크 오류
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('connection')) {
      return '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }
    
    // 서버 오류
    if (errorMessage.includes('500') || 
        errorMessage.includes('server') || 
        errorMessage.includes('internal')) {
      return '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.';
    }
    
    // 기본 오류 메시지
    return `이미지 생성 오류: ${errorMessage}`;
  }
  
  // 문자열 오류
  if (typeof error === 'string') {
    return `이미지 생성 오류: ${error}`;
  }
  
  // 그 외 모든 오류 타입
  return '이미지 생성 중 알 수 없는 오류가 발생했습니다.';
}

/**
 * 오류 유형 감지 함수
 * 
 * 주어진 오류 메시지를 분석하여 오류 유형을 감지합니다.
 * 
 * @param error 오류 메시지 또는 객체
 * @returns 감지된 오류 유형
 */
export function detectErrorType(error: unknown): 'nsfw' | 'network' | 'server' | 'auth' | 'validation' | 'unknown' {
  const errorMessage = error instanceof Error ? error.message : 
                      typeof error === 'string' ? error : 
                      'unknown error';
  
  // 소문자로 변환하여 일관된 비교
  const lowerCaseError = errorMessage.toLowerCase();
  
  // NSFW 콘텐츠 관련 오류 감지
  if (lowerCaseError.includes('nsfw') || 
      lowerCaseError.includes('safety') || 
      lowerCaseError.includes('inappropriate') || 
      lowerCaseError.includes('explicit') || 
      lowerCaseError.includes('adult')) {
    return 'nsfw';
  }
  
  // 네트워크 관련 오류 감지
  if (lowerCaseError.includes('network') || 
      lowerCaseError.includes('timeout') || 
      lowerCaseError.includes('connection') || 
      lowerCaseError.includes('unreachable')) {
    return 'network';
  }
  
  // 서버 관련 오류 감지
  if (lowerCaseError.includes('500') || 
      lowerCaseError.includes('server') || 
      lowerCaseError.includes('internal') || 
      lowerCaseError.includes('unavailable')) {
    return 'server';
  }
  
  // 인증 관련 오류 감지
  if (lowerCaseError.includes('auth') || 
      lowerCaseError.includes('unauthorized') || 
      lowerCaseError.includes('authentication') || 
      lowerCaseError.includes('permission') || 
      lowerCaseError.includes('access')) {
    return 'auth';
  }
  
  // 유효성 검사 오류 감지
  if (lowerCaseError.includes('validation') || 
      lowerCaseError.includes('invalid') || 
      lowerCaseError.includes('required') || 
      lowerCaseError.includes('format')) {
    return 'validation';
  }
  
  // 기본 오류 유형
  return 'unknown';
} 