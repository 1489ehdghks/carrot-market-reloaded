// app/google/callback/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            console.error("Google OAuth 콜백 에러:", error);
            return NextResponse.redirect(new URL("/login?error=google_auth_rejected",request.url));
        }

        if (!code) {
            console.error("Google OAuth 콜백 실패: 인증 코드 없음");
            return NextResponse.redirect(new URL("/login?error=no_auth_code",request.url));
        }

        // 토큰 교환을 위한 필수 환경 변수 확인
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_CALLBACK_URL;

        if (!clientId || !clientSecret) {
            console.error("Google OAuth 토큰 교환 실패: 환경 변수 누락");
            return NextResponse.redirect(new URL("/login?error=oauth_config_missing",request.url));
        }

        // 인증 코드를 액세스 토큰으로 교환
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri || "",
                grant_type: "authorization_code"
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error("Google 토큰 교환 실패:", errorData);
            return NextResponse.redirect(new URL("/login?error=token_exchange_failed",request.url));
        }

        const tokenData = await tokenResponse.json();
        
        // 사용자 정보 가져오기
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            console.error("Google 사용자 정보 조회 실패");
            return NextResponse.redirect(new URL("/login?error=user_info_failed",request.url));
        }

        const userData = await userResponse.json();

        // 사용자 세션 정보 저장
        const sessionData = {
            accessToken: tokenData.access_token,
            idToken: tokenData.id_token,
            refreshToken: tokenData.refresh_token,
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                picture: userData.picture,
                verified: userData.verified_email
            }
        };

        // 쿠키 설정과 함께 리다이렉트
        const response = NextResponse.redirect(new URL("/google/complete", request.url));
        response.cookies.set("google_session", JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 3,
            path: "/",
            sameSite: "lax"
        });
        
        return response;
        
    } catch (error) {
        console.error("Google OAuth 콜백 처리 중 오류:", error);
        return NextResponse.redirect(
            new URL(`/login?error=auth_error`, request.url)
        );
    }
}