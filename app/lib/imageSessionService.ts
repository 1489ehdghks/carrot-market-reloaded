import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { cache } from "react";
import getSession from "@/lib/session";


let sessionCache: {
  id: number; // string에서 number로 변경
  email: string | null; // null 허용
  name: string | null;
  avatar: string | null; // image → avatar로 수정
  role: string;
} | null = null;
let sessionCacheTime = 0;

// 세션 캐시 유효 시간 (5분)
const SESSION_CACHE_TTL = 5 * 60 * 1000;

// 세션 정보 캐싱을 통해 성능 최적화
export async function getCachedSession() {
  // 캐시가 유효한 경우 캐시된 세션 반환
  const now = Date.now();
  if (sessionCache && now - sessionCacheTime < SESSION_CACHE_TTL) {
    return sessionCache;
  }

  // 쿠키에서 세션 ID 가져오기 (async/await 처리)
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return null;
  }

  try {
    // 데이터베이스에서 사용자 정보 조회 - schema.prisma 기반으로 올바른 필드 사용
    const user = await db.user.findUnique({
      where: { id: parseInt(sessionId, 10) }, // 문자열 세션 ID를 숫자로 변환
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true, // image → avatar로 수정
        role: true,
      },
    });

    // 사용자가 없는 경우
    if (!user) {
      return null;
    }

    // 세션 정보에서 필요한 데이터만 추출
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar, // image → avatar로 수정
      role: user.role,
    };

    // 캐시 업데이트
    sessionCache = sessionData;
    sessionCacheTime = now;

    return sessionData;
  } catch (error) {
    console.error("세션 조회 오류:", error);
    return null;
  }
}

/**
 * 이미지 서비스용 캐시된 세션 정보를 가져오는 함수
 * - 이미지 생성, 편집, 저장 기능에서 사용
 * 
 * React의 cache 기능을 활용하여 동일 요청 내에서 중복 호출 방지
 * 
 * @returns {Promise<{id: number} | null>} 세션 정보 또는 null
 */
export const getImageSession = cache(async () => {
  try {
    // 기본 세션 관리자에서 세션 정보 가져오기
    const session = await getSession();
    
    if (!session || !session.id) {
      console.log("[이미지 세션] 로그인된 세션이 없습니다");
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("[이미지 세션] 세션 정보 조회 중 오류:", error);
    return null;
  }
});

/**
 * @deprecated - 기본 getImageSession 사용을 권장합니다
 * 
 * 세션 ID로 사용자 정보를 가져오는 함수
 * 
 * @param {string} sessionId 세션 ID
 * @returns {Promise<{id: number} | null>} 사용자 정보 또는 null
 */
export async function getImageSessionById(sessionId: string) {
  if (!sessionId) {
    console.error("[이미지 세션] 세션 ID가 제공되지 않았습니다");
    return null;
  }
  
  try {
    // 기본 세션 관리자에 위임
    const session = await getSession();
    
    if (!session || !session.id) {
      console.log(`[이미지 세션] 세션 ID ${sessionId}에 대한 유효한 사용자 정보가 없습니다`);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("[이미지 세션] 사용자 정보 조회 중 오류:", error);
    return null;
  }
} 