"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomInput } from "../elements/custom-input";
import { CustomButton } from "../elements/custom-button";
import SocialLogin from "@/widgets/shared/social-login-form";
import { login } from "@/app/login/actions";
import { CreateAccount } from "@/app/create-account/actions";
import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/shared/lib/constants";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}


type LoginFormState = {
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
  formErrors?: string[];
} | null;

type RegisterFormState = {
  fieldErrors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    passwordConfirm?: string[];
  };
  formErrors?: string[];
} | null;

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoginFormActive, setLoginFormActive] = useState(true);
  
  // useActionState를 사용하여 서버 액션 상태 관리
  const [loginState, loginDispatch] = useActionState(login, null);
  const [registerState, registerDispatch] = useActionState(CreateAccount, null);

  // 사용자가 모달을 닫거나 폼을 전환할 때 상태 초기화
  const resetAndClose = () => {
    onClose();
  };

  const toggleForm = () => {
    setLoginFormActive(!isLoginFormActive);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1A1A1A] rounded-xl w-full max-w-md p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isLoginFormActive ? "로그인" : "회원가입"}
              </h2>
              <button
                onClick={resetAndClose}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            {isLoginFormActive ? (
              <form action={loginDispatch} className="flex flex-col gap-4">
                <CustomInput
                  name="email"
                  type="email"
                  placeholder="이메일"
                  required
                  error={loginState?.fieldErrors?.email}
                  autoComplete="email"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                <CustomInput
                  name="password"
                  type="password"
                  placeholder="비밀번호"
                  required
                  error={loginState?.fieldErrors?.password}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="current-password"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                {loginState?.formErrors && loginState.formErrors.length > 0 && (
                  <div className="text-red-500 text-sm">
                    {loginState.formErrors[0]}
                  </div>
                )}
                <CustomButton 
                  type="submit"
                  variant="primary"
                  className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 hover:from-orange-400 hover:via-orange-300 hover:to-amber-400"
                >
                  로그인
                </CustomButton>
              </form>
            ) : (
              <form action={registerDispatch} className="flex flex-col gap-4">
                <CustomInput
                  name="username"
                  type="text"
                  placeholder="사용자 이름"
                  required
                  error={registerState?.fieldErrors?.username}
                  autoComplete="username"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                <CustomInput
                  name="email"
                  type="email"
                  placeholder="이메일"
                  required
                  error={registerState?.fieldErrors?.email}
                  autoComplete="email"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                <CustomInput
                  name="password"
                  type="password"
                  placeholder="비밀번호 (8자 이상)"
                  required
                  error={registerState?.fieldErrors?.password}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                <CustomInput
                  name="passwordConfirm"
                  type="password"
                  placeholder="비밀번호 확인"
                  required
                  error={registerState?.fieldErrors?.passwordConfirm}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  className="bg-[#2A2A2A] border-orange-500/20 focus:border-orange-500/50 text-white"
                />
                {registerState?.formErrors && registerState.formErrors.length > 0 && (
                  <div className="text-red-500 text-sm">
                    {registerState.formErrors[0]}
                  </div>
                )}
                <CustomButton 
                  type="submit"
                  variant="primary"
                  className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 hover:from-orange-400 hover:via-orange-300 hover:to-amber-400"
                >
                  회원가입
                </CustomButton>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={toggleForm}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {isLoginFormActive
                  ? "계정이 없으신가요? 회원가입"
                  : "이미 계정이 있으신가요? 로그인"}
              </button>
            </div>

            <div className="mt-6">
              <SocialLogin />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 