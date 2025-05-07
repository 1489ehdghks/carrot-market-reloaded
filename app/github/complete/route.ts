import { notFound, redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import getSession from "@/shared/lib/session";

// 사용자 로그인 처리 - 안전하게 수정
async function signIn(userId: number) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error("세션을 생성할 수 없습니다.");
    }
    
    session.id = userId;
    await session.save();
    return true;
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
      return NextResponse.json(
        { error: "GitHub OAuth 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // GitHub 인증 코드 확인
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      console.error("코드 없음");
      return NextResponse.json(
        { error: "GitHub 인증 코드가 제공되지 않았습니다." },
        { status: 400 }
      );
    }
    
    console.log("GitHub 인증 시작:", { code: code.slice(0, 5) + "..." });

    // GitHub Access Token 요청
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
      return NextResponse.json(
        { error: `GitHub 토큰 요청 실패: ${tokenResponse.status} ${tokenResponse.statusText}` },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log("토큰 응답:", { 
      hasError: !!tokenData.error, 
      hasToken: !!tokenData.access_token,
      keys: Object.keys(tokenData)
    });
    
    if (tokenData.error) {
      console.error("GitHub OAuth error:", tokenData.error, tokenData.error_description);
      return NextResponse.json(
        { 
          error: "GitHub 인증에 실패했습니다.", 
          details: tokenData.error_description || tokenData.error
        },
        { status: 400 }
      );
    }

    if (!tokenData.access_token) {
      console.error("토큰 없음:", tokenData);
      return NextResponse.json(
        { error: "GitHub 토큰을 받지 못했습니다." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: `GitHub 사용자 정보 요청 실패: ${userResponse.status} ${userResponse.statusText}` },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();
    console.log("사용자 정보:", { 
      id: userData.id, 
      login: userData.login, 
      hasEmail: !!userData.email 
    });
    
    if (!userData.id) {
      console.error("사용자 ID 없음:", userData);
      return NextResponse.json(
        { error: "GitHub 사용자 정보를 가져올 수 없습니다." },
        { status: 400 }
      );
    }

    // 데이터베이스 처리
    console.log("데이터베이스 조회 시작, GitHub ID:", userData.id);
    try {
      // GitHub ID를 숫자로 변환
      const githubId = Number(userData.id);
      console.log("GitHub ID 변환됨:", githubId);
      
      // 기존 사용자 확인
      const existingUser = await db.user.findUnique({
        where: { github_id: githubId },
        select: { id: true },
      });

      console.log("데이터베이스 조회 결과:", existingUser);
      
      if (existingUser) {
        console.log("기존 사용자 로그인:", existingUser.id);
        await signIn(existingUser.id);
        console.log("로그인 성공, 리다이렉트 실행");
        return redirect("/profile");
      }

      // 새 사용자 생성
      console.log("새 사용자 생성 시작");
      const username = await generateUniqueUsername(userData.login);
      console.log("생성된 사용자명:", username);
      
      const newUser = await db.user.create({
        data: {
          username,
          github_id: githubId,
          avatar: userData.avatar_url,
          email: userData.email || `${userData.id}@github.user`,
        },
        select: { id: true },
      });
      
      console.log("새 사용자 생성 완료:", newUser.id);
      await signIn(newUser.id);
      console.log("새 사용자 로그인 성공, 리다이렉트 실행");
      return redirect("/profile");
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      return NextResponse.json(
        { 
          error: "사용자 정보 처리 중 오류가 발생했습니다.",
          details: dbError instanceof Error ? dbError.message : "알 수 없는 데이터베이스 오류"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("GitHub auth error:", error);
    return NextResponse.json(
      { 
        error: "인증 처리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류" 
      }, 
      { status: 500 }
    );
  }
} 