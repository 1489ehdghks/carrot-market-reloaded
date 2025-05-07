// app/github/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { createServerSupabaseClient } from "@/shared/lib/supabase";
import getSession from "@/shared/lib/session";

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    
    if (!code) {
      console.error("GitHub 콜백 오류: 인증 코드 없음");
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
    }
    
    // Supabase 클라이언트 생성
    const supabase = createServerSupabaseClient();
    
    // GitHub 토큰 및 사용자 정보 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.session) {
      console.error("GitHub 인증 오류:", error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_error`);
    }
    
    // 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser(data.session.access_token);
    
    if (!user) {
      console.error("사용자 정보를 가져오지 못함");
      return NextResponse.redirect(`${requestUrl.origin}/login?error=user_error`);
    }
    
    // GitHub ID 추출
    const githubId = Number(user.app_metadata.provider_id);
    
    // 기존 사용자 확인
    const existingUser = await db.user.findUnique({
      where: { github_id: githubId },
      select: { id: true, username: true },
    });
    
    if (existingUser) {
      // 기존 사용자 로그인 처리
      const session = await getSession();
      session.id = existingUser.id;
      await session.save();
      
      return NextResponse.redirect(`${requestUrl.origin}/profile`);
    } else {
      // 새 사용자 생성
      const username = `GH#${Math.floor(Math.random() * 10000)}${user.user_metadata.user_name || 'user'}`;
      
      const newUser = await db.user.create({
        data: {
          username,
          github_id: githubId,
          avatar: user.user_metadata.avatar_url,
          email: user.email || `${githubId}@github.user`,
        },
        select: { id: true },
      });
      
      // 세션 저장
      const session = await getSession();
      session.id = newUser.id;
      await session.save();
      
      // 사용자 이름 설정 페이지로 리다이렉트
      return NextResponse.redirect(`${requestUrl.origin}/profile/setup-username?provider=github`);
    }
  } catch (error) {
    console.error("GitHub 콜백 처리 오류:", error);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=callback_error`);
  }
}