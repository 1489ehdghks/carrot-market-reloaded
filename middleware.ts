import { NextRequest, NextResponse } from "next/server";
import { sessionOptions } from "@/shared/lib/session";

interface Routes {
    [key:string]:boolean;
}

const publicOnlyUrls:Routes = {
    "/":true,
    "/login":true,
    "/sms":true,
    "/create-account":true,
    "/github/start":true,
    "/github/callback":true,
    "/github/complete":true,
    "/google/start":true,
    "/google/callback":true,
    "/google/complete":true,
}

const oauthUrls:Routes = {
    "/github/start":true,
    "/github/callback":true,
    "/github/complete":true,
    "/google/start":true,
    "/google/callback":true,
    "/google/complete":true,
}

const oauthCallbackUrls = [
    "/github/callback",
    "/google/callback"
  ];

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get(sessionOptions.cookieName);
    const isPublicUrl = publicOnlyUrls[request.nextUrl.pathname];
    const isOAuthUrl = oauthUrls[request.nextUrl.pathname];


    // OAuth 경로는 항상 허용
    if(isOAuthUrl) {
        return NextResponse.next();
    }

    // 로그인하지 않은 상태에서 보호된 경로 접근 시 홈으로 리다이렉트
    if(!sessionCookie?.value && !isPublicUrl) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // 로그인 상태에서 로그인 전용 페이지 접근 시 홈으로 리다이렉트
    if(sessionCookie?.value && isPublicUrl && !isOAuthUrl) {
        return NextResponse.redirect(new URL("/home", request.url));
    }
    if (oauthCallbackUrls.includes(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};