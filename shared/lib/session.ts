import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

export type SessionData = {
    id?: number;
}

export const sessionOptions = {
    cookieName: "LUMI",
    password: process.env.COOKIE_PASSWORD!,
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax" as const, // CSRF 보호
        maxAge: 60 * 60 * 24 * 7, // 일주일
    }
};

/**
* 세션 객체를 반환하는 함수
* 
* @returns 세션 객체 예: { id: 123 }
* 
* @description
* - 세션 관리에 중점을 둔 기본 함수입니다.
* - 쿠키에서 세션 정보만 추출하여 반환합니다.
* - 주요 사용 사례:
*   - 세션 존재 여부 확인
*   - 세션 객체 직접 조작 (생성, 삭제)
*   - 사용자 로그인 상태만 확인할 때
*/


export default async function getSession() {
    const session =  getIronSession<SessionData>(await cookies(), sessionOptions);
    
    if (!process.env.COOKIE_PASSWORD) {
        throw new Error("COOKIE_PASSWORD is not defined");
    }
    
    return session;
}