import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 환경 변수 확인
        const clientId = process.env.GITHUB_CLIENT_ID;
        const callbackUrl = process.env.GITHUB_CALLBACK_URL;

        if (!clientId) {
            console.error("GitHub 로그인 시작 실패: 환경 변수 누락");
            return NextResponse.json(
                { error: "GitHub OAuth 설정이 누락되었습니다 (GITHUB_CLIENT_ID)" },
                { status: 500 }
            );
        }

        console.log("GitHub 로그인 시작", { 
            hasClientId: !!clientId, 
            hasCallbackUrl: !!callbackUrl 
        });

        const baseUrl = "https://github.com/login/oauth/authorize";
        const config = {
            client_id: clientId,
            scope: "read:user,user:email",
            allow_signup: "true",
            ...(callbackUrl && {
                redirect_uri: callbackUrl
            })
        };
        
        const params = new URLSearchParams(config).toString();
        const finalUrl = `${baseUrl}?${params}`;
        
        console.log("GitHub 리다이렉트 URL 생성 완료");
        
        return NextResponse.redirect(finalUrl, {
            status: 302
        });
    } catch (error) {
        console.error("GitHub OAuth start error:", error);
        
        return NextResponse.json(
            { 
                error: "GitHub 로그인을 시작할 수 없습니다", 
                details: error instanceof Error ? error.message : "알 수 없는 오류" 
            },
            { status: 500 }
        );
    }
}