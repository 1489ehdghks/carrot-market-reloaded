"use client"

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { login } from "@/app/login/actions";
import { CreateAccount } from "@/app/create-account/actions";
import { useActionState } from "react";
import LoginForm from "../form/LoginForm";
import RegisterForm from "../form/RegisterForm";

const DynamicSocialLogin = dynamic(
  () => import("@/widgets/shared/social-login-form"),
  { 
    loading: () => (
      <div className="h-12 bg-zinc-800/50 animate-pulse rounded-lg" />
    ),
    ssr: false
  }
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 애니메이션 프리셋 정의
const overlayAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

const modalAnimation = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.15 }
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoginFormActive, setLoginFormActive] = useState(true);
  
  // useActionState를 사용하여 서버 액션 상태 관리
  const [loginState, loginDispatch] = useActionState(login, null);
  const [registerState, registerDispatch] = useActionState(CreateAccount, null);

  // useCallback으로 핸들러 최적화
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleForm = useCallback(() => {
    setLoginFormActive(prev => !prev);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...overlayAnimation}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            {...modalAnimation}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900/95 backdrop-blur-md rounded-2xl w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-800/50 relative"
          >
            {/* 디자인 요소: 유리효과 배경 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/15 via-stone-600/5 to-blue-900/20 pointer-events-none" />
            
            <div className="relative z-10 p-7">
              {/* 헤더 섹션 */}
              <div className="flex justify-between items-center mb-7">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-300 to-stone-300">
                  {isLoginFormActive ? "Log In" : "Sign Up"}
                </h2>
                <button
                  onClick={handleClose}
                  className="h-12 w-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200"
                  aria-label="닫기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* 폼 컴포넌트 */}
              <div className="bg-zinc-800/30 backdrop-blur-sm p-5 rounded-xl border border-zinc-700/30 shadow-inner">
                {isLoginFormActive ? (
                  <LoginForm state={loginState} dispatch={loginDispatch} />
                ) : (
                  <RegisterForm state={registerState} dispatch={registerDispatch} />
                )}
              </div>

              {/* 폼 전환 버튼 */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={toggleForm}
                  className="text-zinc-400 hover:text-amber-400 transition-colors text-sm font-medium"
                >
                  {isLoginFormActive
                    ? "아직 계정이 없으신가요? 회원가입하기"
                    : "이미 계정이 있으신가요? 로그인하기"}
                </button>
              </div>

              {/* 소셜 로그인 */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px bg-zinc-800 flex-grow"></div>
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">또는</span>
                  <div className="h-px bg-zinc-800 flex-grow"></div>
                </div>
                <DynamicSocialLogin />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 