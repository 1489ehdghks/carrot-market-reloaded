import { notFound, redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import getSession from "@/lib/session";

async function SignIn(user_id: number) {
    try {
        const session = await getSession();
        session.id = user_id;
        await session.save();
    } catch (error) {
        console.error("SignIn error:", error);
        throw new Error("로그인 처리 중 오류가 발생했습니다.");
    }
}

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
        // GitHub 인증 코드 확인
        const code = request.nextUrl.searchParams.get("code");
        if (!code) return notFound();

        // GitHub Access Token 요청
        const tokenResponse = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                }),
            }
        );

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            console.error("GitHub OAuth error:", tokenData.error);
            return new Response(
                JSON.stringify({ error: "GitHub 인증에 실패했습니다." }), 
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // GitHub 사용자 정보 요청
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                "Authorization": `Bearer ${tokenData.access_token}`,
                "User-Agent": "NextJS-App",
            },
            cache: "no-store",
        });

        const userData = await userResponse.json();
        if (!userData.id) {
            throw new Error("GitHub 사용자 정보를 가져올 수 없습니다.");
        }

        // 기존 사용자 확인
        const existingUser = await db.user.findUnique({
            where: { github_id: userData.id.toString() },
            select: { id: true },
        });

        if (existingUser) {
            await SignIn(existingUser.id);
            return redirect("/profile");
        }

        // 새 사용자 생성
        const newUser = await db.user.create({
            data: {
                username: await generateUniqueUsername(userData.login),
                github_id: userData.id.toString(),
                avatar: userData.avatar_url,
            },
            select: { id: true },
        });

        await SignIn(newUser.id);
        return redirect("/profile");

    } catch (error) {
        console.error("GitHub auth error:", error);
        return new Response(
            JSON.stringify({ error: "인증 처리 중 오류가 발생했습니다." }), 
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}