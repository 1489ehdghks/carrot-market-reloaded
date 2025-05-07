"use client"

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import LoginModal from "@/widgets/auth/layout/LoginModal";
import bgMobile from "@/public/image/mbg.png";
import bgDesktop from "@/public/image/dbg2.png";

// 최적화된 HeroSection 컴포넌트
export default function HeroSection() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.6]);

  // 마우스 움직임 감지 - 디바운스 및 최적화 적용
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!sectionRef.current || !gradientRef.current) return;
    
    const { clientX, clientY } = e;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    
    setMousePosition({ x, y });
    
    // 마우스에 따라 radial gradient 움직이기 - transform 최적화
    const moveX = x * 30; // 최대 30px 이동
    const moveY = y * 30;
    
    // requestAnimationFrame으로 성능 최적화
    requestAnimationFrame(() => {
      if (gradientRef.current) {
        gradientRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    });
  }, []);

  useEffect(() => {
    // 디바운싱 적용
    let frameId: number;
    const debouncedHandleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener("mousemove", debouncedHandleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", debouncedHandleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [handleMouseMove]);

  // 제목 애니메이션 - 사전 정의
  const titleAnimation = {
    animate: { 
      textShadow: [
        '0 2px 10px rgba(251,191,36,0.5)',
        '0 2px 20px rgba(251,191,36,0.8)',
        '0 2px 10px rgba(251,191,36,0.5)',
      ]
    },
    transition: { duration: 2, repeat: Infinity }
  };

  const subtitleAnimation = {
    animate: { 
      textShadow: [
        '0 2px 10px rgba(251,191,36,0.3)',
        '0 2px 20px rgba(251,191,36,0.6)',
        '0 2px 10px rgba(251,191,36,0.3)',
      ]
    },
    transition: { duration: 2, repeat: Infinity, delay: 0.3 }
  };

  return (
    <motion.section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black"
      style={{ opacity, position: "relative" }}
    >
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        <div className="hidden md:block relative w-full h-full">
          <Image
            src={bgDesktop}
            alt="Lumi AI"
            fill
            sizes="100vw"
            priority
            quality={85}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <Image
            src={bgMobile}
            alt="Lumi AI"
            fill
            sizes="100vw"
            priority
            quality={85}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        
        {/* 배경 오버레이 효과 */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-1" 
          style={{ opacity: overlayOpacity, position: "absolute" }}
        />
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/50 z-1" />
        
        {/* 배경 글로우 효과 */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-amber-900/20 to-transparent" />
          
          {/* 마우스에 따라 움직이는 radial gradient */}
          <div 
            ref={gradientRef}
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(251,146,60,0.1),transparent_70%)]"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 px-4 md:px-6">
        <motion.div 
          ref={textRef}
          className="max-w-2xl mx-auto"
          style={{
            x: mousePosition.x * -45,
            y: mousePosition.y * -45,
            position: "relative",
            willChange: "transform"
          }}
        >
          {/* 텍스트 영역 배경 */}
          <div className="relative rounded-2xl bg-black/30 backdrop-blur-sm p-8 md:p-16 border border-white/5 shadow-2xl min-h-[500px] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 rounded-2xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(251,146,60,0.1),transparent_70%)]" />
            
            <div className="relative text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-block mb-8"
              >
                <motion.h1 
                  className="text-3xl md:text-4xl lg:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-amber-200"
                  {...titleAnimation}
                >
                  AI로 만드는
                </motion.h1>
                <motion.h2
                  className="text-2xl md:text-2xl lg:text-3xl font-heading font-bold mt-2 bg-clip-text text-white"
                  {...subtitleAnimation}
                >
                  당신의 상상을 현실로
                </motion.h2>
              </motion.div>

              <motion.p
                className="text-base md:text-lg text-white/80 mt-6 max-w-2xl mx-auto leading-relaxed font-body mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                이미지 생성, 영상 제작, 편집까지
                <br />
                AI와 함께 당신의 창의력을 실현하세요
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <motion.button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 font-medium text-white flex items-center justify-center gap-2 text-lg">
                    Join
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* 아래로 스크롤 안내 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div 
          className="animate-bounce text-white/50 hover:text-white/70 transition-colors"
          whileHover={{ scale: 1.2 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
      
      {isLoginModalOpen && (
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      )}
    </motion.section>
  );
} 