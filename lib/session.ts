import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
    id?: number;
}

export const sessionOptions = {
    cookieName: "LUMI",
    password: process.env.COOKIE_PASSWORD!,
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true, // 클라이언트에서 쿠키 접근 방지
        sameSite: "lax" as const, // CSRF 보호
    }
};

export default async function getSession() {
    const session =  getIronSession<SessionData>(await cookies(), sessionOptions);
    
    if (!process.env.COOKIE_PASSWORD) {
        throw new Error("COOKIE_PASSWORD is not defined");
    }
    
    return session;
}