import { cookies } from "next/headers";
import { cache } from "react";
import getSession from "@/shared/lib/session";
import { db } from "@/shared/lib/db";

let sessionCache = null;
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

  // 쿠키에서 세션 ID 가져오기
  const cookieStore = cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return null;
  }

  try {
    // 데이터베이스에서 세션 정보 조회
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // 세션이 없거나 만료된 경우
    if (!session || new Date(session.expires) < new Date()) {
      return null;
    }

    // 세션 정보에서 필요한 데이터만 추출
    const sessionData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role,
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
 * 이미지 서비스 전용 캐싱된 세션 관리 
 * - React의 cache 기능으로 렌더링 사이클 내에서 캐싱
 * - 기존 lib/session의 getSession 함수 재사용
 */
export const getImageSession = cache(async () => {
  return await getSession();
});

/**
 * 이미지 서비스에서 세션 ID를 통해 사용자 정보 가져오기
 * @deprecated 되도록 getImageSession()을 사용하는 것을 권장합니다.
 */
export async function getImageSessionById(userId: number) {
  // 세션이 없는 경우를 대비한 기본 정보
  if (!userId) return null;
  
  try {
    // 필요한 경우 여기에 사용자 ID로 추가 정보를 조회하는 코드 추가
    // 예: DB에서 사용자 정보 직접 조회 등
    
    return {
      id: userId,
      // 기타 필요한 정보는 실제 구현 시 추가
    };
  } catch (error) {
    console.error("이미지 서비스 세션 ID 조회 오류:", error);
    return null;
  }
} 