'use client'

import Input from "@/components/input";
import Button from "@/components/button";
import SocialLogin from "@/components/social-login";
import { CreateAccount } from "./actions";
import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import Link from "next/link";

export default function Home() {
  const [state, dispatch] = useActionState(CreateAccount, null);
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A]">
      <div className="max-w-md w-full space-y-8 bg-[#2A2A2A] p-8 rounded-2xl shadow-xl border border-[#3A3A3A]">
        <div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            회원가입
          </h1>
        </div>

        <form action={dispatch} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">닉네임</label>
            <Input 
              name="username" 
              type="text" 
              placeholder="2-10자 사이의 닉네임을 입력해주세요" 
              required={true} 
              errors={state?.fieldErrors.username} 
              minLength={3} 
              maxLength={10}
              autoComplete="username"
              className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:border-[#FFB4B4] h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">이메일</label>
            <Input 
              name="email" 
              type="email" 
              placeholder="이메일 주소를 입력해주세요" 
              required={true} 
              errors={state?.fieldErrors.email}
              autoComplete="email"
              className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:border-[#FFB4B4] h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">비밀번호</label>
            <Input 
              name="password" 
              type="password" 
              placeholder="8-12자의 비밀번호를 입력해주세요" 
              required={true} 
              errors={state?.fieldErrors.password} 
              minLength={PASSWORD_MIN_LENGTH} 
              maxLength={12}
              autoComplete="new-password"
              className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:border-[#FFB4B4] h-12"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">비밀번호 확인</label>
            <Input 
              name="passwordConfirm" 
              type="password" 
              placeholder="비밀번호를 다시 입력해주세요" 
              required={true} 
              errors={state?.fieldErrors.passwordConfirm} 
              minLength={PASSWORD_MIN_LENGTH} 
              maxLength={12}
              autoComplete="new-password"
              className="bg-[#1A1A1A] border-[#3A3A3A] text-white focus:border-[#FFB4B4] h-12"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button text="계정 만들기" variant="primary" />
            <Link 
              href="/"
              className="flex-1 h-12 flex items-center justify-center rounded-lg border border-[#3A3A3A] text-neutral-300 hover:bg-[#3A3A3A] transition-colors"
            >
              취소
            </Link>
          </div>
        </form>

        <div className="pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#3A3A3A]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#2A2A2A] text-neutral-400">
                또는 소셜 계정으로 시작하기
              </span>
            </div>
          </div>

          <div className="mt-6">
            <SocialLogin />
          </div>
        </div>
      </div>
    </div>
  );
}