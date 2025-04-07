/**
 * 인증 서비스 모듈
 * 
 * 사용자 인증 및 계정 관리에 필요한 기능을 제공합니다.
 * - 로그인
 * - 로그아웃
 * - 회원가입
 * - 비밀번호 검증
 * 
 * @module entities/auth/service
 */

import { db } from "@/shared/lib/db";
import bcrypt from "bcrypt";
import { setSession, clearSession } from "@/app/api/auth/session.service";
import { redirect } from "next/navigation";
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AuthErrorType } from "./auth.types";

/**
 * 로그인 처리
 * 
 * 이메일과 비밀번호를 검증하여 로그인을 처리합니다.
 * 
 * @param data 로그인 요청 데이터
 * @returns 로그인 결과 (성공 여부와 에러 메시지)
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    // 사용자 찾기
    const user = await db.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        password: true,
        isVerified: true,
      },
    });

    // 사용자가 존재하지 않는 경우
    if (!user) {
      return { 
        success: false, 
        error: "이메일 또는 비밀번호가 잘못되었습니다.", 
        errorCode: AuthErrorType.INVALID_CREDENTIALS 
      };
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(data.password, user.password || "");
    if (!isPasswordValid) {
      return { 
        success: false, 
        error: "이메일 또는 비밀번호가 잘못되었습니다.", 
        errorCode: AuthErrorType.INVALID_CREDENTIALS 
      };
    }

    // 이메일 인증 확인 (필요에 따라 주석 해제)
    // if (!user.isVerified) {
    //   return { 
    //     success: false, 
    //     error: "이메일 인증이 필요합니다.", 
    //     errorCode: AuthErrorType.NOT_VERIFIED 
    //   };
    // }

    // 세션 설정
    await setSession(user.id);

    return { success: true };
  } catch (error) {
    console.error("로그인 중 오류:", error);
    return { 
      success: false, 
      error: "로그인 처리 중 오류가 발생했습니다.", 
      errorCode: AuthErrorType.SERVER_ERROR 
    };
  }
}

/**
 * 로그아웃 처리
 * 
 * 사용자 세션을 제거하고 로그아웃합니다.
 */
export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}

/**
 * 회원가입 처리
 * 
 * 새 사용자 계정을 생성합니다.
 * 
 * @param data 회원가입 요청 데이터
 * @returns 회원가입 결과 (성공 여부와 에러 메시지)
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    // 필수 필드 검증
    if (!data.username || !data.email || !data.password) {
      return {
        success: false,
        error: "모든 필수 정보를 입력해주세요.",
        errorCode: AuthErrorType.REQUIRED_FIELD_MISSING,
        fieldErrors: {
          username: !data.username ? ["사용자 이름을 입력해주세요."] : undefined,
          email: !data.email ? ["이메일을 입력해주세요."] : undefined,
          password: !data.password ? ["비밀번호를 입력해주세요."] : undefined
        }
      };
    }

    // 비밀번호 확인 (만약 passwordConfirm이 제공된 경우)
    if (data.passwordConfirm && data.password !== data.passwordConfirm) {
      return {
        success: false,
        error: "비밀번호가 일치하지 않습니다.",
        errorCode: AuthErrorType.PASSWORD_MISMATCH,
        fieldErrors: {
          passwordConfirm: ["비밀번호와 비밀번호 확인이 일치하지 않습니다."]
        }
      };
    }
    
    // 이메일 중복 확인
    const existingEmail = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingEmail) {
      return {
        success: false,
        error: "이미 사용 중인 이메일입니다.",
        errorCode: AuthErrorType.EMAIL_EXISTS,
        fieldErrors: {
          email: ["이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요."]
        }
      };
    }

    // 사용자 이름 중복 확인
    const existingUsername = await db.user.findUnique({
      where: { username: data.username },
      select: { id: true },
    });

    if (existingUsername) {
      return {
        success: false,
        error: "이미 사용 중인 사용자 이름입니다.",
        errorCode: AuthErrorType.USERNAME_EXISTS,
        fieldErrors: {
          username: ["이미 사용 중인 사용자 이름입니다. 다른 이름을 선택해주세요."]
        }
      };
    }

    // 비밀번호 유효성 검사 (예: 최소 길이)
    if (data.password.length < 8) {
      return {
        success: false,
        error: "비밀번호는 최소 8자 이상이어야 합니다.",
        errorCode: AuthErrorType.PASSWORD_TOO_WEAK,
        fieldErrors: {
          password: ["비밀번호는 최소 8자 이상이어야 합니다."]
        }
      };
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 사용자 생성
    const user = await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });

    // 세션 설정
    await setSession(user.id);

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("회원가입 중 오류:", error);
    return { 
      success: false, 
      error: "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 
      errorCode: AuthErrorType.SERVER_ERROR 
    };
  }
}

/**
 * 비밀번호 검증
 * 
 * 사용자 ID와 비밀번호를 받아 비밀번호가 올바른지 확인합니다.
 * 
 * @param userId 사용자 ID
 * @param password 검증할 비밀번호
 * @returns 비밀번호 검증 결과
 */
export async function verifyPassword(userId: number, password: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  } catch (error) {
    console.error("비밀번호 검증 중 오류:", error);
    return false;
  }
} 