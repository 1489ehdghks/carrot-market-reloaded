import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { db } from "@/shared/lib/db";
import getSession from "@/shared/lib/session";

// 사용자 로그인 처리
async function signIn(userId: number) {
    try {
        const session = await getSession();
        session.id = userId;
        await session.save();
    } catch (error) {
        console.error("SignIn error:", error);
        throw new Error("로그인 처리 중 오류가 발생했습니다.");
    }
}

// 고유한 사용자 이름 생성
async function generateUniqueUsername(baseUsername: string): Promise<string> {
    const maxAttempts = 100;
    let counter = 1;
    
    while (counter <= maxAttempts) {
        const username = `GH#${counter}${baseUsername}`;
        const existingUser = await db.user.findUnique({
            where: { username }
        });
        
        if (!existingUser) return username;
        counter++;
    }
    throw new Error("사용자 이름을 생성할 수 없습니다.");
}

export async function GET(request: NextRequest) {
    try {
        // 환경 변수 확인
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            console.error("환경 변수 오류:", { clientId: !!clientId, clientSecret: !!clientSecret });
            throw new Error("GitHub OAuth 환경 변수가 설정되지 않았습니다.");
        }

        // GitHub 인증 코드 확인
        const code = request.nextUrl.searchParams.get("code");
        if (!code) {
            console.error("코드 없음");
            return notFound();
        }
        
        console.log("GitHub 인증 시작:", { code: code.slice(0, 5) + "..." });

        // GitHub Access Token 요청 - 객체 대신 URLSearchParams 사용
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code
        });
        
        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: tokenParams.toString(),
            }
        );

        if (!tokenResponse.ok) {
            console.error("토큰 요청 실패:", tokenResponse.status, tokenResponse.statusText);
            throw new Error(`GitHub 토큰 요청 실패: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log("토큰 응답:", { 
            hasError: !!tokenData.error, 
            hasToken: !!tokenData.access_token,
            keys: Object.keys(tokenData)
        });
        
        if (tokenData.error) {
            console.error("GitHub OAuth error:", tokenData.error, tokenData.error_description);
            return new Response(
                JSON.stringify({ 
                    error: "GitHub 인증에 실패했습니다.", 
                    details: tokenData.error_description || tokenData.error
                }), 
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        if (!tokenData.access_token) {
            console.error("토큰 없음:", tokenData);
            throw new Error("GitHub 토큰을 받지 못했습니다.");
        }

        // GitHub 사용자 정보 요청
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                "Authorization": `token ${tokenData.access_token}`,
                "Accept": "application/json",
                "User-Agent": "NextJS-App",
            },
            cache: "no-store",
        });

        if (!userResponse.ok) {
            console.error("사용자 정보 요청 실패:", userResponse.status, userResponse.statusText);
            throw new Error(`GitHub 사용자 정보 요청 실패: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        console.log("사용자 정보:", { 
            id: userData.id, 
            login: userData.login, 
            hasEmail: !!userData.email 
        });
        
        if (!userData.id) {
            console.error("사용자 ID 없음:", userData);
            throw new Error("GitHub 사용자 정보를 가져올 수 없습니다.");
        }

        // 데이터베이스 처리 - 별도 try-catch 블록
        try {
            // 기존 사용자 확인
            const existingUser = await db.user.findUnique({
                where: { github_id: userData.id.toString() },
                select: { id: true },
            });

            if (existingUser) {
                console.log("기존 사용자 로그인:", existingUser.id);
                await signIn(existingUser.id);
                return redirect("/profile");
            }

            // 새 사용자 생성
            console.log("새 사용자 생성 시작");
            const username = await generateUniqueUsername(userData.login);
            console.log("생성된 사용자명:", username);
            
            const newUser = await db.user.create({
                data: {
                    username,
                    github_id: userData.id.toString(),
                    avatar: userData.avatar_url,
                    email: userData.email || `${userData.id}@github.user`,
                },
                select: { id: true },
            });

            console.log("새 사용자 생성 완료:", newUser.id);
            await signIn(newUser.id);
            return redirect("/profile");
        } catch (dbError) {
            console.error("Database error:", dbError);
            throw new Error(dbError instanceof Error ? dbError.message : "사용자 계정 처리 중 오류가 발생했습니다.");
        }

    } catch (error) {
        console.error("GitHub auth error:", error);
        
        // 에러 응답 처리
        return new Response(
            JSON.stringify({ 
                error: "인증 처리 중 오류가 발생했습니다.",
                details: process.env.NODE_ENV === "development" 
                    ? (error instanceof Error ? error.message : String(error)) 
                    : undefined 
            }), 
            { 
                status: 500,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || 'https://carrot-market-reloaded.vercel.app'
                }
            }
        );
    }
}