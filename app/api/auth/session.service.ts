/**
 * 세션 서비스 모듈
 * 
 * 사용자 세션 관리를 위한 통합 서비스 모듈로, 세션 조회, 검증, 생성 등의 기능을 제공합니다.
 * - 일반 사용자 세션 관리
 * - 이미지 생성 세션 관리
 * - 인증 토큰 관리
 * 
 * @module entities/session/service
 */

import { cookies } from "next/headers";
import { db } from "@/shared/lib/db";
import { Session, ImageSession } from "./session.types";
import { getIronSession, IronSession } from "iron-session";

// 세션 데이터 인터페이스
interface SessionData {
  id?: number;
}

// 세션 쿠키 이름 상수
const SESSION_COOKIE_NAME = "LUMI";

// 세션 옵션 설정
export const sessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: process.env.COOKIE_PASSWORD!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  }
};

/**
 * 현재 사용자 세션 조회
 * 
 * 쿠키에서 세션 정보를 가져와 유효한 세션인지 확인합니다.
 * 
 * @returns 유효한 세션 또는 비로그인 상태 세션
 */
export async function getSession(): Promise<Session> {
  try {
    // Iron Session을 사용하여 세션 데이터 가져오기
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    // 세션 ID가 없는 경우 비로그인 상태 반환
    if (!session.id) {
      return { isLoggedIn: false };
    }
    
    // 사용자 정보 조회
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isVerified: true
      }
    });
    
    // 사용자를 찾을 수 없는 경우
    if (!user) {
      return { isLoggedIn: false };
    }
    
    // 유효한 세션 반환
    return {
      id: user.id,
      user: {
        id: user.id,
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.avatar || undefined,
        role: user.role || undefined,
        isVerified: user.isVerified
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
      isLoggedIn: true
    };
  } catch (error) {
    console.error("세션 조회 중 오류:", error);
    return { isLoggedIn: false };
  }
}

/**
 * 이미지 생성용 세션 조회
 * 
 * 이미지 생성 기능에 접근할 수 있는 권한을 가진 세션을 조회합니다.
 * 
 * @returns 이미지 세션 또는 null
 */
export async function getImageSession(): Promise<ImageSession | null> {
  try {
    // 일반 세션 정보 가져오기
    const session = await getSession();
    
    // 로그인되지 않은 경우
    if (!session.isLoggedIn || !session.id) {
      return null;
    }
    
    // 사용자 ID로 사용자 조회
    const userId = typeof session.id === 'string' ? parseInt(session.id) : session.id;
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        points: true // 크레딧 대신 포인트 사용
      }
    });
    
    // 사용자를 찾을 수 없는 경우
    if (!user) {
      return null;
    }
    
    // 이미지 세션 반환
    return {
      id: user.id,
      name: user.name || undefined,
      email: user.email || undefined,
      role: user.role || undefined,
      isVerified: user.isVerified,
      credits: user.points // 포인트를 크레딧으로 사용
    };
  } catch (error) {
    console.error("이미지 세션 조회 중 오류:", error);
    return null;
  }
}

/**
 * 세션 설정
 * 
 * 아이언 세션을 사용하여 세션 정보를 설정합니다.
 * 
 * @param userId 사용자 ID
 */
export async function setSession(userId: number): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  session.id = userId;
  await session.save();
}

/**
 * 세션 삭제
 * 
 * 로그아웃 시 세션을 삭제합니다.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  session.destroy();
} 