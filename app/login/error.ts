'use client'

export type AuthErrorType = 
  | 'invalid_credentials'
  | 'email_exists'
  | 'username_exists'
  | 'password_mismatch'
  | 'invalid_email'
  | 'invalid_password'
  | 'server_error'
  | 'network_error'
  | 'unknown';

export interface AuthError {
  type: AuthErrorType;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export const handleAuthError = (error: any): AuthError => {
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error
    };
  }

  if (error instanceof Error) {
    return {
      type: 'server_error',
      message: error.message
    };
  }

  if (error && error.error) {
    const errorType = detectAuthErrorType(error.error);
    return {
      type: errorType,
      message: getAuthErrorMessage(errorType),
      fieldErrors: error.fieldErrors
    };
  }

  return {
    type: 'unknown',
    message: '알 수 없는 오류가 발생했습니다.'
  };
};

const detectAuthErrorType = (errorMessage: string): AuthErrorType => {
  const errorMessage_lower = errorMessage.toLowerCase();
  
  if (errorMessage_lower.includes('invalid credentials')) {
    return 'invalid_credentials';
  }
  
  if (errorMessage_lower.includes('email exists')) {
    return 'email_exists';
  }
  
  if (errorMessage_lower.includes('username exists')) {
    return 'username_exists';
  }
  
  if (errorMessage_lower.includes('password mismatch')) {
    return 'password_mismatch';
  }
  
  if (errorMessage_lower.includes('invalid email')) {
    return 'invalid_email';
  }
  
  if (errorMessage_lower.includes('invalid password')) {
    return 'invalid_password';
  }
  
  if (errorMessage_lower.includes('server error')) {
    return 'server_error';
  }
  
  if (errorMessage_lower.includes('network error')) {
    return 'network_error';
  }
  
  return 'unknown';
};

const getAuthErrorMessage = (errorType: AuthErrorType): string => {
  const messages: Record<AuthErrorType, string> = {
    'invalid_credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'email_exists': '이미 사용 중인 이메일입니다.',
    'username_exists': '이미 사용 중인 사용자 이름입니다.',
    'password_mismatch': '비밀번호가 일치하지 않습니다.',
    'invalid_email': '올바른 이메일 형식이 아닙니다.',
    'invalid_password': '비밀번호는 8자 이상이어야 합니다.',
    'server_error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'network_error': '네트워크 연결에 문제가 있습니다.',
    'unknown': '알 수 없는 오류가 발생했습니다.'
  };
  
  return messages[errorType];
}; 