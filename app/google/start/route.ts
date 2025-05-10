// app/google/start/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 환경 변수 확인
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

        if (!clientId) {
            console.error("Google 로그인 시작 실패: 환경 변수 누락");
            return NextResponse.json(
                { error: "Google OAuth 설정이 누락되었습니다 (GOOGLE_CLIENT_ID)" },
                { status: 500 }
            );
        }

        console.log("Google 로그인 시작", { 
            hasClientId: !!clientId, 
            hasCallbackUrl: !!callbackUrl 
        });

        // Google OAuth 2.0 인증 URL 생성
        const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const config = {
            client_id: clientId,
            response_type: "code",
            scope: "openid email profile",
            access_type: "offline",
            prompt: "consent",
            ...(callbackUrl && {
                redirect_uri: callbackUrl
            })
        };
        
        const params = new URLSearchParams(config).toString();
        const finalUrl = `${baseUrl}?${params}`;
        
        console.log("Google 리다이렉트 URL 생성 완료");
        
        return NextResponse.redirect(finalUrl, {
            status: 302
        });
    } catch (error) {
        console.error("Google OAuth start error:", error);
        
        return NextResponse.json(
            { 
                error: "Google 로그인을 시작할 수 없습니다", 
                details: error instanceof Error ? error.message : "알 수 없는 오류" 
            },
            { status: 500 }
        );
    }
}