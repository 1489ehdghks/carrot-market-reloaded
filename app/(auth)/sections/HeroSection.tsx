"use client"

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import bgMobile from "@/public/image/mbg.png";  // 2:3 비율
import bgDesktop from "@/public/image/dbg2.png"; // 3:2 비율
import LoginModal from "@/widgets/auth/LoginModal";
import Leaf from "@/widgets/landing/Leaf";
import React from "react";

const LEAVES_COUNT = 12;
const LEAF_COLORS = ['#8B0000', '#8B4513', '#CD853F', '#D2691E', '#A0522D'];

// 초기 낙엽 상태를 생성하는 함수
const createInitialLeaves = () => 
  [...Array(LEAVES_COUNT)].map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    speed: 0.2 + Math.random() * 0.3
  }));

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [leaves, setLeaves] = useState<Array<any>>([]);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // useEffect에서 초기 상태 설정
  useEffect(() => {
    setLeaves(createInitialLeaves());
  }, []);

  // 패럴랙스 효과 (스크롤 기반)
  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 마우스 움직임 감지 - 효과 크기 감소
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 화면 중앙을 기준으로 마우스 위치 계산
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // 화면 중앙으로부터의 마우스 거리를 -1~1 범위로 정규화
      const normalizedX = (e.clientX - centerX) / (window.innerWidth / 2);
      const normalizedY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      // 매우 작은 값으로 감소시켜 미묘한 효과만 남김
      setMousePosition({
        x: normalizedX * 2, // 최대 ±2도 회전으로 제한
        y: normalizedY * 1  // 최대 ±1도 회전으로 제한
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  let leavesComponent = Array.from({ length: LEAVES_COUNT }).map((_, i) => {
    // 랜덤 위치 및 지연 생성
    const initialX = Math.random() * 100; // 0-100%
    const initialY = Math.random() * 30; // 0-30%
    const delay = Math.random() * 5000; // 0-5초
    const direction = Math.random() > 0.5 ? "left" : "right";
    const size = Math.random() * 20 + 30; // 30-50px
    const opacity = Math.random() * 0.5 + 0.2; // 0.2-0.7

    return (
      <Leaf
        key={i}
        initialX={initialX}
        initialY={initialY}
        delay={delay}
        direction={direction}
        size={size}
        opacity={opacity}
      />
    );
  });

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      <motion.div 
        className="absolute inset-0"
        style={{ y, opacity }}
      >
        {/* 배경 이미지 */}
        <Image
          src={isMobile ? bgMobile : bgDesktop}
          alt="Background"
          fill
          className="object-cover"
          style={{
            transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px)`,
            transition: 'transform 0.5s ease-out'
          }}
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4"
        style={{
          // 미세한 3D 효과만 적용하여 과도한 회전 방지
          transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s ease-out'
        }}
      >
        {/* 3D 텍스트 효과 */}
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-7xl font-bold text-white mb-6 relative"
          style={{ textShadow: '0 0 20px rgba(255,180,180,0.3)' }}
        >
          <span className="relative inline-block">
            Lumi AI
          </span>
          <br />
          <motion.span 
            className="text-[#FFB4B4] relative inline-block"
            animate={{ 
              textShadow: [
                '0 0 20px rgba(255,180,180,0.3)',
                '0 0 40px rgba(255,180,180,0.5)',
                '0 0 20px rgba(255,180,180,0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            이미지 생성
          </motion.span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-neutral-300 mb-12 relative"
        >
          AI의 힘으로 당신의 상상을 현실로 만들어보세요. 지금 바로 시작하세요!
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link 
            href="/create-account" 
            className="group px-8 py-4 bg-gradient-to-r from-[#FFB4B4] to-[#FF9B9B] hover:from-[#FF9B9B] hover:to-[#FFB4B4] text-[#0D0D0D] rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <span className="relative z-10">시작하기</span>
            <ArrowRightIcon className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            onClick={(e) => {
              e.preventDefault();
              setLoginModalOpen(true);
            }}
            href="/login" 
            className="group px-8 py-4 bg-transparent border border-[#FFB4B4] text-[#FFB4B4] hover:bg-[#FFB4B4]/10 rounded-lg font-medium transition-all duration-300 backdrop-blur-sm transform hover:scale-105"
          >
            로그인
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            className="animate-bounce text-neutral-400"
            whileHover={{ scale: 1.2 }}
          >
            <ArrowRightIcon className="w-6 h-6 transform rotate-90" />
          </motion.div>
        </motion.div>
      </motion.div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </section>
  );
} 