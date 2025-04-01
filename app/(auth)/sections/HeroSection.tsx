"use client"

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, Reorder, useDragControls } from "framer-motion";
import { useRouter } from "next/navigation";
import LoginModal from "@/widgets/auth/LoginModal";
import bgMobile from "@/public/image/mbg.png";  // 모바일용 배경 이미지
import bgDesktop from "@/public/image/dbg2.png"; // 데스크톱용 배경 이미지
import mapleleaf from "@/public/image/maple-leaf.svg"; // SVG 경로로 수정

export default function HeroSection() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [draggedLeaves, setDraggedLeaves] = useState<number[]>([]);
  const [leaves, setLeaves] = useState(() => 
    Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 30,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      velocity: { x: 0, y: 0 },
    }))
  );
  const [cleanedArea, setCleanedArea] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const router = useRouter();
  const leafContainerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.6]);
  const textScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 마우스 움직임 감지
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      
      const { clientX, clientY } = e;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 마우스 위치에 따른 단풍잎 움직임
  useEffect(() => {
    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!leafContainerRef.current) return;
      const rect = leafContainerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      mouseY = ((e.clientY - rect.top) / rect.height) * 100;
    };

    const updateLeaves = () => {
      setLeaves(prevLeaves => 
        prevLeaves.map(leaf => {
          const dx = mouseX - leaf.x;
          const dy = mouseY - leaf.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 15) { // 마우스와의 거리가 15% 이내일 때
            const angle = Math.atan2(dy, dx);
            const force = (15 - distance) / 15; // 거리에 반비례하는 힘
            
            // 마우스에서 멀어지는 방향으로의 속도 계산
            leaf.velocity.x -= Math.cos(angle) * force * 2;
            leaf.velocity.y -= Math.sin(angle) * force * 2;
          }

          // 감쇠와 경계 확인
          leaf.velocity.x *= 0.95;
          leaf.velocity.y *= 0.95;
          
          const newX = leaf.x + leaf.velocity.x;
          const newY = leaf.y + leaf.velocity.y;
          
          // 경계 확인 및 위치 조정
          return {
            ...leaf,
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(30, newY)),
            rotation: leaf.rotation + leaf.velocity.x * 2,
          };
        })
      );

      // 청소된 영역 계산
      const totalArea = 100 * 45;
      const cleanedAreaPercent = (leaves.filter(leaf => 
        leaf.x < 10 || leaf.x > 90 || leaf.y < 5
      ).length / leaves.length) * 100;
      
      setCleanedArea(cleanedAreaPercent);
      
      // 80% 이상 청소되면 이스터에그 표시
      if (cleanedAreaPercent > 80 && !showEasterEgg) {
        setShowEasterEgg(true);
      }

      animationFrameId = requestAnimationFrame(updateLeaves);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateLeaves);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showEasterEgg]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black"
      style={{ opacity }}
    >
      {/* 배경 이미지 */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{
            x: mousePosition.x * -15,
            y: mousePosition.y * -15
          }}
        >
          <div className="hidden md:block">
            <Image
              src={bgDesktop}
              alt="Lumi AI"
              fill
              priority
              quality={90}
              className="object-cover object-center"
            />
          </div>
          <div className="block md:hidden">
            <Image
              src={bgMobile}
              alt="Lumi AI"
              fill
              priority
              quality={80}
              className="object-cover object-center"
            />
          </div>
        </motion.div>
        
        {/* 배경 오버레이 효과 */}
        <motion.div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-1" style={{ opacity: overlayOpacity }} />
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/50 z-1" />
        
        {/* 배경 글로우 효과 */}
        <div className="absolute inset-0 z-1">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-500/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-amber-900/20 to-transparent" />
        </div>
      </div>
      
      {/* 입자 효과 */}
      <div className="absolute inset-0 z-2 opacity-30">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200/30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 1}px`,
              height: `${Math.random() * 6 + 1}px`,
              opacity: Math.random() * 0.5 + 0.3,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`
            }}
          />
        ))}
      </div>
      
      {/* 바닥에 낙엽 효과 */}
      <div className="absolute bottom-0 left-0 right-0 h-20 z-10 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-10">
          <svg className="w-full h-8 text-amber-800/40" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,0 Q300,50 600,0 T1200,0 L1200,100 L0,100 Z" fill="currentColor" />
          </svg>
          <svg className="w-full h-6 text-amber-700/50 -mt-3" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,20 Q400,70 800,20 T1200,20 L1200,100 L0,100 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container relative z-10 px-4 md:px-6">
        <motion.div 
          ref={textRef}
          className="max-w-2xl mx-auto"
          style={{ 
            scale: textScale,
            transform: `perspective(1000px) rotateX(${mousePosition.y * 0.8}deg) rotateY(${mousePosition.x * 0.8}deg)`,
            transformStyle: 'preserve-3d',
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
                  animate={{ 
                    textShadow: [
                      '0 2px 10px rgba(251,191,36,0.5)',
                      '0 2px 20px rgba(251,191,36,0.8)',
                      '0 2px 10px rgba(251,191,36,0.5)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI로 만드는
                </motion.h1>
                <motion.h2
                  className="text-2xl md:text-2xl lg:text-3xl font-heading font-bold mt-2 bg-clip-text text-white"
                  animate={{ 
                    textShadow: [
                      '0 2px 10px rgba(251,191,36,0.3)',
                      '0 2px 20px rgba(251,191,36,0.6)',
                      '0 2px 10px rgba(251,191,36,0.3)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
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