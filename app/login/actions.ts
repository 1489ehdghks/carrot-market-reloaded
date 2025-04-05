"use server";

import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/shared/lib/constants";
import { login as authLogin } from "@/entities/auth/service";
import { redirect } from "next/navigation";
import { LoginRequest, LoginResponse, AuthErrorType } from "@/entities/auth/types";

type LoginFormState = {
    fieldErrors?: {
        email?: string[];
        password?: string[];
    };
    formErrors?: string[];
} | null;


const formSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string({
        required_error: "Password is required",
    }).min(PASSWORD_MIN_LENGTH),
});

export async function login(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
    const data = {
        email: formData.get("email"),
        password: formData.get("password"),
    };
    
    // 기본적인 유효성 검사만 수행
    const result = await formSchema.safeParseAsync(data);
    if (!result.success) {
        return(result.error.flatten());
    }
    
    // entities/auth/service의 login 함수 호출
    const loginRequest: LoginRequest = {
        email: result.data.email,
        password: result.data.password
    };
    
    const loginResult: LoginResponse = await authLogin(loginRequest);
    
    if (!loginResult.success) {
        // 에러 코드별 처리
        switch(loginResult.errorCode) {
            case AuthErrorType.INVALID_CREDENTIALS:
                return {
                    fieldErrors: {
                        password: [loginResult.error || "이메일 또는 비밀번호가 잘못되었습니다."],
                        email: []
                    }
                };
            case AuthErrorType.NOT_VERIFIED:
                return {
                    fieldErrors: {
                        email: [loginResult.error || "이메일 인증이 필요합니다."]
                    }
                };
            case AuthErrorType.REQUIRED_FIELD_MISSING:
                return {
                    fieldErrors: {
                        email: loginResult.error?.includes("이메일") ? ["이메일을 입력해주세요."] : [],
                        password: loginResult.error?.includes("비밀번호") ? ["비밀번호를 입력해주세요."] : []
                    }
                };
            default:
                return {
                    formErrors: [loginResult.error || "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."]
                };
        }
    }
    
    // 성공 시 홈페이지로 리다이렉트
    redirect("/");
}