"use client";

import { useState, useCallback } from 'react';
import { handleGlobalError, UserFacingError } from '@/shared/lib/error-handling';
import { useFormStatus } from 'react-dom';

export type FormStatus = 'idle' | 'validating' | 'submitting' | 'processing' | 'generating' | 'uploading' | 'saving' | 'success' | 'error';
export type ErrorType = 'validation' | 'submission' | 'processing' | 'network' | 'server' | 'unknown';

interface FormStatusManager {
  status: FormStatus;
  isProcessing: boolean;  // 모든 처리 중인 상태(submitting, processing, generating, uploading, saving)
  error: string | null;
  errorType: ErrorType | null;
  setStatus: (status: FormStatus) => void;
  startProcess: (newStatus: FormStatus) => void;
  setSuccess: (message?: string) => void;
  setError: (message: string, errorType?: ErrorType) => void;
  resetStatus: () => void;
  handleError: (error: unknown, defaultMessage?: string) => void;
}

/**
 * 폼 상태와 오류를 관리하는 커스텀 훅
 * React의 기본 useFormStatus와 함께 사용할 수 있습니다.
 */
export function useFormStatusManager(initialStatus: FormStatus = 'idle'): FormStatusManager {
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [error, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  
  // React DOM의 기본 폼 상태도 통합 (선택적)
  const formStatus = useFormStatus();
  
  // 상태가 처리 중인지 확인하는 편의 getter
  const isProcessing = ['submitting', 'processing', 'generating', 'uploading', 'saving'].includes(status);
  
  // 폼 처리 시작
  const startProcess = useCallback((newStatus: FormStatus) => {
    setStatus(newStatus);
    setErrorMessage(null);
    setErrorType(null);
  }, []);
  
  // 성공 상태 설정
  const setSuccess = useCallback((message?: string) => {
    setStatus('success');
    setErrorMessage(null);
    setErrorType(null);
    
    if (message) {
      // 성공 알림 표시 (선택적)
    }
  }, []);
  
  // 오류 상태 설정
  const setError = useCallback((message: string, type: ErrorType = 'unknown') => {
    setStatus('error');
    setErrorMessage(message);
    setErrorType(type);
    
    // 전역 에러 핸들러는 특정 상황에서만 호출
    if (type === 'server' || type === 'network') {
      handleGlobalError(new UserFacingError(message));
    }
  }, []);
  
  // 상태 초기화
  const resetStatus = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
    setErrorType(null);
  }, []);
  
  // 오류 처리 헬퍼
  const handleError = useCallback((error: unknown, defaultMessage = '처리 중 오류가 발생했습니다') => {
    let errorMessage = defaultMessage;
    let errorType: ErrorType = 'unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 오류 유형 추정
      if (error instanceof UserFacingError) {
        // 이미 사용자 친화적인 오류 메시지
        errorType = 'validation';
      } else if (error.name === 'ValidationError') {
        errorType = 'validation';
      } else if (error.name === 'NetworkError' || error.message.includes('network')) {
        errorType = 'network';
      } else if (error.message.includes('server') || error.message.includes('500')) {
        errorType = 'server';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setError(errorMessage, errorType);
  }, [setError]);
  
  // React DOM의 폼 상태 업데이트 (선택적 통합)
  /*
  useEffect(() => {
    if (formStatus.pending) {
      setStatus('submitting');
    }
  }, [formStatus.pending]);
  */
  
  return {
    status,
    isProcessing,
    error,
    errorType,
    setStatus,
    startProcess,
    setSuccess,
    setError,
    resetStatus,
    handleError
  };
} 