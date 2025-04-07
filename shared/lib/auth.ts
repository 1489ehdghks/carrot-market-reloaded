import { db } from "@/shared/lib/db";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "./session";

/**
 * 사용자 정보를 반환하는 함수
 * 
 * @returns 사용자 객체 예: { id: 123, username: '홍길동', role: 'USER' } 또는 null
 * 
 * @description
 * - 인증된 사용자의 상세 정보 조회에 중점을 둡니다.
 * - 세션 ID를 이용해 데이터베이스에서 사용자 정보를 조회합니다.
 * - 주요 사용 사례:
 *   - 사용자 프로필 표시
 *   - 권한 기반 기능 제어
 *   - 사용자 맞춤형 콘텐츠 제공
 */

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
  if (!session.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      role: true
    }
  });

  return user;
}

export type Session = Awaited<ReturnType<typeof getSession>>; 