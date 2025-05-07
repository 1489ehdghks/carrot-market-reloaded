"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// 저화질 이미지 가져오기
// 실제 이미지 파일 경로는 프로젝트 구조에 맞게 조정해야 함
// 이 예시에서는 기존 이미지와 동일한 경로 사용
import bgMobile from "@/public/image/mbg.png";
import bgDesktop from "@/public/image/dbg2.png";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "로딩 중..." }: LoadingProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* 배경 이미지 - 가볍고 빠르게 로드되도록 최적화 */}
      <div className="absolute inset-0 z-0">
        <div className="hidden md:block relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 20% 20%, rgba(255, 180, 180, 0.08) 0%, transparent 70%), 
                        radial-gradient(circle at 80% 50%, rgba(180, 180, 255, 0.05) 0%, transparent 60%)`,
            opacity: 0.8
          }} />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 10%, rgba(255, 180, 180, 0.05) 0%, transparent 60%),
                        radial-gradient(circle at 80% 30%, rgba(180, 180, 255, 0.03) 0%, transparent 50%)`,
            opacity: 0.8
          }} />
        </div>
      </div>
      
      {/* 글로우 효과 */}
      <div className="absolute inset-0 z-1 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-amber-900/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(251,146,60,0.1),transparent_70%)]" />
      </div>
      
      {/* 메인 컨텐츠 스켈레톤 */}
      <div className="container relative z-10 px-4 md:px-6 flex items-center justify-center h-full">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-2xl bg-black/30 backdrop-blur-sm p-8 md:p-16 border border-white/5 shadow-2xl min-h-[500px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 rounded-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(251,146,60,0.1),transparent_70%)]" />
            
            <div className="relative text-center">
              {/* 타이틀 스켈레톤 */}
              <motion.div 
                className="inline-block mb-8"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
              >
                <div className="h-10 w-64 bg-gradient-to-r from-orange-500/20 via-orange-300/20 to-amber-200/20 rounded-lg" />
                <div className="h-8 w-56 bg-white/10 rounded-lg mt-2" />
              </motion.div>

              {/* 텍스트 스켈레톤 */}
              <div className="my-6 space-y-2">
                <div className="h-4 w-full bg-white/5 rounded" />
                <div className="h-4 w-5/6 mx-auto bg-white/5 rounded" />
              </div>

              {/* 버튼 스켈레톤 */}
              <motion.div 
                className="h-12 w-32 mx-auto bg-gradient-to-r from-orange-500/30 via-orange-400/30 to-amber-500/30 rounded-lg"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            {/* 로딩 표시기 */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <div className="text-white/50 text-sm flex items-center">
                {message}
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2 flex space-x-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 