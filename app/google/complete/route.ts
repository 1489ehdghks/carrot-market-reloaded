import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import getSession from "@/shared/lib/session";
import { cookies } from "next/headers";

// 사용자 로그인 처리
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
    const username = `GG#${counter}${baseUsername}`;
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
    const sessionCookie = request.cookies.get("google_session");
    
    if (!sessionCookie?.value) {
      console.error("Google 인증 완료 실패: 세션 데이터 없음");
      return NextResponse.redirect(new URL("/login?error=no_session", request.url));
    }
    
    const sessionData = JSON.parse(sessionCookie.value);
    
    // 세션 데이터에서 사용자 정보 확인
    if (!sessionData || !sessionData.user || !sessionData.user.email) {
      console.error("Google 인증 완료 실패: 사용자 정보 없음");
      return NextResponse.redirect(new URL("/login?error=no_user_info", request.url));
    }
    
    const userData = sessionData.user;
    
    // 데이터베이스 처리
    try {
      // 이메일로 기존 사용자 확인
      let user = await db.user.findUnique({
        where: { email: userData.email },
        select: { id: true }
      });
      
      let userId: number;
      
      if (user) {
        // 기존 사용자면 ID 사용
        userId = user.id;
        console.log("기존 사용자 로그인:", userId);
      } else {
        // 새 사용자 생성
        const username = await generateUniqueUsername(userData.name?.replace(/\s+/g, '') || 'user');
        
        const newUser = await db.user.create({
          data: {
            username,
            email: userData.email,
            avatar: userData.picture,
            name: userData.name,
            isVerified: userData.verified_email || false
          },
          select: { id: true }
        });
        
        userId = newUser.id;
        console.log("새 사용자 생성:", userId);
      }
      
      await signIn(userId);
      const response = NextResponse.redirect(new URL("/profile", request.url));
      response.cookies.delete("google_session");
      return response;

    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError);
      return NextResponse.redirect(new URL("/login?error=database_error", request.url));
    }
  } catch (error) {
    console.error("Google 인증 완료 처리 중 오류:", error);
    return NextResponse.redirect(
        new URL("/login?error=auth_completion_failed", request.url)
    );
  }
}