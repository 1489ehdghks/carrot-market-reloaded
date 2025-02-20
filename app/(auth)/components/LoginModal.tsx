"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FormInput from "@/components/input";
import FormBtn from "@/components/button";
import SocialLogin from "@/components/social-login";
import { login } from "@/app/login/actions";
import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoginFormActive, setLoginFormActive] = useState(true);
  const [state, dispatch] = useActionState(login, null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
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
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>

            {isLoginFormActive ? (
              <form action={dispatch} className="flex flex-col gap-4">
                <FormInput
                  name="email"
                  type="email"
                  placeholder="이메일"
                  required
                  errors={state?.fieldErrors.email}
                  autoComplete="email"
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <FormInput
                  name="password"
                  type="password"
                  placeholder="비밀번호"
                  required
                  errors={state?.fieldErrors.password}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="current-password"
                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                />
                <FormBtn text="로그인" />
              </form>
            ) : (
              // 회원가입 폼 구현
              <div>회원가입 폼</div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setLoginFormActive(!isLoginFormActive)}
                className="text-[#FFB4B4] hover:text-[#FF9B9B] transition-colors"
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