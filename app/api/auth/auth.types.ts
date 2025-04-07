/**
 * 인증 관련 타입 정의
 * 
 * 로그인, 회원가입 등 인증 관련 기능에 사용되는 타입을 정의합니다.
 * 
 * @module entities/auth/types
 */

/**
 * 로그인 요청 데이터
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 로그인 응답 데이터
 */
export interface LoginResponse {
  success: boolean;
  error?: string;
  errorCode?: AuthErrorType;
}

/**
 * 회원가입 요청 데이터
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirm?: string;
}

/**
 * 필드별 에러 메시지
 */
export interface FieldErrors {
  username?: string[];
  email?: string[];
  password?: string[];
  passwordConfirm?: string[];
}

/**
 * 회원가입 응답 데이터
 */
export interface RegisterResponse {
  success: boolean;
  error?: string;
  errorCode?: AuthErrorType;
  fieldErrors?: FieldErrors;
  userId?: number;
}

/**
 * 사용자 인증 정보
 */
export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
}

/**
 * 비밀번호 검증 요청
 */
export interface VerifyPasswordRequest {
  userId: number;
  password: string;
}

/**
 * 인증 에러 타입
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_EXISTS = 'email_exists',
  USERNAME_EXISTS = 'username_exists',
  PASSWORD_MISMATCH = 'password_mismatch',
  PASSWORD_TOO_WEAK = 'password_too_weak',
  USERNAME_INVALID = 'username_invalid',
  EMAIL_INVALID = 'email_invalid',
  REQUIRED_FIELD_MISSING = 'required_field_missing',
  SERVER_ERROR = 'server_error',
  NOT_VERIFIED = 'not_verified'
} 