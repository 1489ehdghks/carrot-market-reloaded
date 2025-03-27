/**
 * 세션 관련 타입 정의
 * 
 * 애플리케이션에서 사용하는 세션 및 인증 관련 타입을 정의합니다.
 * 
 * @module entities/session/types
 */

/**
 * 세션 사용자 정보
 */
export interface SessionUser {
  id: string | number;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  isVerified?: boolean;
}

/**
 * 세션 데이터 구조
 */
export interface Session {
  id?: string | number;
  user?: SessionUser;
  expires?: string;
  isLoggedIn: boolean;
}

/**
 * 이미지 세션 데이터 구조
 */
export interface ImageSession {
  id: number;
  email?: string;
  name?: string;
  credits?: number;
  role?: string;
  isVerified?: boolean;
}

/**
 * 인증 토큰 타입
 */
export interface AuthToken {
  token: string;
  expires: Date;
} 