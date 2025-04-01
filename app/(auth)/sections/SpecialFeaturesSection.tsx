"use client"

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const specialFeatures = [
  {
    title: "맞춤형 이미지 생성",
    description: "당신의 요구사항에 완벽하게 맞춘 이미지를 생성합니다. 텍스트 프롬프트를 통해 원하는 디테일을 정확히 반영해보세요.",
    gradient: "from-rose-500 to-orange-500",
    delay: 0.1
  },
  {
    title: "배치 처리 기능",
    description: "한 번에 여러 개의 이미지를 생성하여 시간을 절약하세요. 다양한 변형을 탐색하고 최상의 결과물을 선택할 수 있습니다.",
    gradient: "from-blue-500 to-purple-500",
    delay: 0.2
  },
  {
    title: "고해상도 업스케일링",
    description: "AI 기술로 이미지의 해상도를 높여 더 선명하고 디테일한 결과물을 만들 수 있습니다. 인쇄용 고품질 이미지도 손쉽게 제작하세요.",
    gradient: "from-emerald-500 to-teal-500",
    delay: 0.3
  }
];

export default function SpecialFeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      ref={sectionRef}
      className="py-24 relative overflow-hidden bg-black"
    >
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-black z-0" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute -top-40 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] z-0 opacity-50" />
      <div className="absolute -bottom-40 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] z-0 opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-amber-200">
            특별한 기능
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Lumi AI의 고급 기능을 활용하여 더 창의적인 결과물을 제작해보세요.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {specialFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: feature.delay }}
              className="relative overflow-hidden"
            >
              <div className="bg-black/40 rounded-xl backdrop-blur-sm border border-white/5 p-8 h-full relative z-10">
                <div 
                  className={`absolute inset-0 rounded-xl opacity-10 z-0 bg-gradient-to-br ${feature.gradient}`}
                />
                <div className="relative z-10">
                  <h3 className={`text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${feature.gradient}`}>
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* 특별 섹션: 프리미엄 플랜 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 p-8 rounded-2xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0" />
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5 z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-amber-200">
                프리미엄 멤버십으로 업그레이드
              </h3>
              <p className="text-zinc-300 mb-6">
                무제한 이미지 생성, 우선 처리, 고급 편집 기능 등 다양한 혜택을 누려보세요. 
                월 사용량에 제한 없이 자유롭게 창작 활동을 이어갈 수 있습니다.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "월 무제한 이미지 생성",
                  "우선 처리 및 빠른 생성 속도",
                  "모든 고급 편집 기능 이용 가능",
                  "상업적 사용 라이센스",
                  "24/7 우선 지원"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-[#FFB4B4]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="bg-black p-8 rounded-xl border border-[#FFB4B4]/20 shadow-xl">
                <div className="text-center mb-6">
                  <span className="text-[#FFB4B4] text-sm font-medium uppercase tracking-wider">프리미엄 플랜</span>
                  <div className="mt-2 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">₩19,900</span>
                    <span className="text-zinc-400 ml-2">/월</span>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-gradient-to-r from-[#FFB4B4] to-[#FF9B9B] hover:from-[#FF9B9B] hover:to-[#FFB4B4] text-black font-medium rounded-lg transition-all duration-300 hover:scale-105">
                  지금 바로 시작하기
                </button>
                
                <p className="text-center text-zinc-500 text-xs mt-4">
                  언제든지 해지 가능
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 