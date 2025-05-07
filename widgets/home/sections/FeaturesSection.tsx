"use client"

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Feature {
  title: string;
  description: string;
  special?: boolean;
}

const features: Feature[] = [
  {
    title: "다양한 이미지 모델",
    description: "Stable Diffusion, DALL-E, Midjourney 등 다양한 AI 모델을 지원합니다. 각 모델의 특성을 활용하여 원하는 스타일의 이미지를 생성할 수 있습니다.",
    special: true
  },
  {
    title: "프롬프트 공유 시스템",
    description: "사용자들이 만든 프롬프트를 공유하고 서로의 작품을 영감으로 삼을 수 있습니다. 커뮤니티와 함께 성장하는 프롬프트 라이브러리를 구축하세요.",
    special: true
  },
  {
    title: "이미지 편집",
    description: "생성된 이미지를 바로 편집하고 수정할 수 있습니다. AI의 도움을 받아 이미지를 더욱 완성도 있게 만들어보세요.",
    special: true
  },
  {
    title: "소통 공간",
    description: "다른 사용자들과 작품을 공유하고 피드백을 받을 수 있습니다. AI 이미지 생성에 대한 다양한 의견과 경험을 나누세요.",
    special: true
  },
  {
    title: "랭크 시스템",
    description: "활동적인 참여와 퀄리티 높은 작품을 통해 랭크를 올릴 수 있습니다. 상위 랭크 사용자들은 특별한 혜택을 받을 수 있습니다.",
    special: true
  },
  {
    title: "작품 라이브러리",
    description: "생성한 모든 이미지를 한 곳에서 관리할 수 있습니다. 좋아하는 작품을 저장하고 나만의 포트폴리오를 만들어보세요.",
    special: true
  }
];

const premiumBenefits = [
  {
    title: "무제한 이미지 생성",
    description: "하루 100장의 제한 없이 원하는 만큼 이미지를 생성할 수 있습니다.",
    price: "월 29,900원"
  },
  {
    title: "고해상도 이미지",
    description: "최대 4K 해상도까지 지원하여 더욱 선명하고 품질 높은 이미지를 생성할 수 있습니다.",
    price: "월 29,900원"
  },
  {
    title: "우선 생성",
    description: "프리미엄 멤버는 일반 사용자보다 우선적으로 이미지가 생성됩니다.",
    price: "월 29,900원"
  },
  {
    title: "고급 AI 모델",
    description: "DALL-E 3, Midjourney 등 고급 AI 모델을 무제한으로 사용할 수 있습니다.",
    price: "월 29,900원"
  }
];

export default function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-black">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-heading font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-amber-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            주요 기능
          </motion.h2>
          <motion.p 
            className="text-slate-400 max-w-2xl mx-auto font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Lumi AI의 다양한 기능을 통해 당신의 창의성을 마음껏 발휘하세요
          </motion.p>
        </div>

        {/* 기능 버튼 */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setSelectedFeature(feature);
                setShowPremium(false);
              }}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedFeature?.title === feature.title
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {feature.title}
            </motion.button>
          ))}
          <motion.button
            onClick={() => {
              setSelectedFeature(null);
              setShowPremium(true);
            }}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
              showPremium
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            프리미엄 멤버십
          </motion.button>
        </div>

        {/* 기능 카드 */}
        <AnimatePresence mode="wait">
          {selectedFeature && (
            <motion.div
              ref={contentRef}
              key={selectedFeature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-xl min-h-[600px]"
              style={{
                transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease-out'
              }}
            >
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1">
                  <h3 className="text-3xl font-heading font-bold text-white mb-6">{selectedFeature.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-lg font-body">{selectedFeature.description}</p>
                </div>
                <div className="w-full md:w-1/2 bg-slate-800/50 rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <Image
                      src={`/image/${selectedFeature.title.toLowerCase().replace(/\s+/g, '-')}.png`}
                      alt={selectedFeature.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 프리미엄 멤버십 카드 */}
          {showPremium && (
            <motion.div
              ref={contentRef}
              key="premium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-xl min-h-[600px]"
              style={{
                transform: `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease-out'
              }}
            >
              <div className="text-center mb-12">
                <h3 className="text-4xl font-heading font-bold text-white mb-4">프리미엄 멤버십</h3>
                <p className="text-orange-400 text-2xl font-semibold mb-2">월 29,900원</p>
                <p className="text-slate-400 text-lg font-body">더 많은 혜택을 누리세요</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {premiumBenefits.map((benefit, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-8">
                    <h4 className="text-2xl font-heading font-semibold text-white mb-4">{benefit.title}</h4>
                    <p className="text-slate-300 text-lg font-body">{benefit.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <motion.button
                  className="group relative px-10 py-4 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 rounded-lg overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 font-medium text-white flex items-center justify-center gap-2 text-lg">
                    Join Premium
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
} 