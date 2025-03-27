"use server"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { z } from "zod";
import { redirect } from "next/navigation";
import { register } from "@/entities/auth/service";
import { RegisterRequest, RegisterResponse, AuthErrorType } from "@/entities/auth/types";

type FormState = {
    fieldErrors?: {
        username?: string[];
        email?: string[];
        password?: string[];
        passwordConfirm?: string[];
    };
    formErrors?: string[];
} | null;

const checkPassword = ({password, passwordConfirm}: {password: string, passwordConfirm: string}) => password === passwordConfirm;

const formSchema = z.object({
    username: z.string({
        required_error: "Username is required",
        invalid_type_error: "Username must be a string"
    })
    .toLowerCase()
    .trim(),
    email: z.string().email().toLowerCase(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    passwordConfirm: z.string().min(PASSWORD_MIN_LENGTH),
})
.refine(checkPassword, {message: "Both Passwords should be same!", path: ["passwordConfirm"]});

export async function CreateAccount(prevState: FormState, formData: FormData): Promise<FormState> {
    try {
        const data = {
            username: formData.get("username"),
            email: formData.get("email"),
            password: formData.get("password"),
            passwordConfirm: formData.get("passwordConfirm"),
        };
        
        // 기본적인 유효성 검사만 수행
        const result = await formSchema.safeParseAsync(data);
        if (!result.success) {
            return result.error.flatten();
        }

        // entities/auth/service의 register 함수 호출
        const registerRequest: RegisterRequest = {
            username: result.data.username,
            email: result.data.email,
            password: result.data.password,
            passwordConfirm: result.data.passwordConfirm
        };
        
        const registerResult: RegisterResponse = await register(registerRequest);
        
        if (!registerResult.success) {
            // 서비스 계층에서 제공하는 필드별 에러 메시지가 있으면 그대로 사용
            if (registerResult.fieldErrors) {
                return { fieldErrors: registerResult.fieldErrors };
            }
            
            // 에러 코드별 처리 (fallback)
            const fieldErrors: any = {};
            
            switch(registerResult.errorCode) {
                case AuthErrorType.EMAIL_EXISTS:
                    fieldErrors.email = [registerResult.error || "이미 사용 중인 이메일입니다."];
                    break;
                case AuthErrorType.USERNAME_EXISTS:
                    fieldErrors.username = [registerResult.error || "이미 사용 중인 사용자 이름입니다."];
                    break;
                case AuthErrorType.PASSWORD_MISMATCH:
                    fieldErrors.passwordConfirm = [registerResult.error || "비밀번호가 일치하지 않습니다."];
                    break;
                case AuthErrorType.PASSWORD_TOO_WEAK:
                    fieldErrors.password = [registerResult.error || "더 강력한 비밀번호를 사용해주세요."];
                    break;
                case AuthErrorType.REQUIRED_FIELD_MISSING:
                    // 필수 필드 누락에 대한 처리
                    if (registerResult.error?.includes("사용자 이름")) {
                        fieldErrors.username = ["사용자 이름을 입력해주세요."];
                    }
                    if (registerResult.error?.includes("이메일")) {
                        fieldErrors.email = ["이메일을 입력해주세요."];
                    }
                    if (registerResult.error?.includes("비밀번호")) {
                        fieldErrors.password = ["비밀번호를 입력해주세요."];
                    }
                    break;
                default:
                    // 서버 에러의 경우에도 가능한 한 구체적인 메시지 제공
                    return {
                        formErrors: [registerResult.error || "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."]
                    };
            }
            
            return { fieldErrors };
        }

        // 성공 시 홈페이지로 리다이렉트
        redirect("/");

    } catch (error) {
        if (error instanceof Error) {
            return {
                formErrors: [error.message]
            };
        }
        return {
            formErrors: ["알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."]
        };
    }
}