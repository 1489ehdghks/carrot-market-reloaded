"use client";

import { useFormStatus } from "react-dom";
import { CustomInput } from "../../elements/custom-input";
import { CustomButton } from "../../elements/custom-button";
import { PASSWORD_MIN_LENGTH } from "@/shared/lib/constants";

// 로딩 상태 표시 버튼 컴포넌트
function FormButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  
  return (
    <CustomButton 
      type="submit"
      variant="primary"
      disabled={pending}
      className="relative w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-70"
    >
      {pending ? (
        <div className="flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          <span>가입 중...</span>
        </div>
      ) : children}
    </CustomButton>
  );
}

export type RegisterFormState = {
  fieldErrors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    passwordConfirm?: string[];
  };
  formErrors?: string[];
} | null;

interface RegisterFormProps {
  state: RegisterFormState;
  dispatch: (formData: FormData) => void;
}

export default function RegisterForm({ state, dispatch }: RegisterFormProps) {
  const { pending } = useFormStatus();
  
  return (
    <form action={dispatch} className="flex flex-col gap-4">
      <CustomInput
        name="username"
        type="text"
        placeholder="사용자 이름"
        required
        error={state?.fieldErrors?.username}
        autoComplete="username"
        className="bg-zinc-900/50 border-zinc-700/50 focus:border-amber-500/50 text-white rounded-lg py-2.5 px-4"
        disabled={pending}
      />
      <CustomInput
        name="email"
        type="email"
        placeholder="이메일"
        required
        error={state?.fieldErrors?.email}
        autoComplete="email"
        className="bg-zinc-900/50 border-zinc-700/50 focus:border-amber-500/50 text-white rounded-lg py-2.5 px-4"
        disabled={pending}
      />
      <CustomInput
        name="password"
        type="password"
        placeholder="비밀번호 (8자 이상)"
        required
        error={state?.fieldErrors?.password}
        minLength={PASSWORD_MIN_LENGTH}
        autoComplete="new-password"
        className="bg-zinc-900/50 border-zinc-700/50 focus:border-amber-500/50 text-white rounded-lg py-2.5 px-4"
        disabled={pending}
      />
      <CustomInput
        name="passwordConfirm"
        type="password"
        placeholder="비밀번호 확인"
        required
        error={state?.fieldErrors?.passwordConfirm}
        minLength={PASSWORD_MIN_LENGTH}
        autoComplete="new-password"
        className="bg-zinc-900/50 border-zinc-700/50 focus:border-amber-500/50 text-white rounded-lg py-2.5 px-4"
        disabled={pending}
      />
      
      {state?.formErrors && state.formErrors.length > 0 && (
        <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20" role="alert">
          {state.formErrors[0]}
        </div>
      )}
      
      <FormButton>회원가입</FormButton>
    </form>
  );
}
