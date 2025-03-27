"use client"

import { motion } from "framer-motion";
import { MdAutoFixHigh, MdStyle, MdOutlineArtTrack } from "react-icons/md";
import FeatureCard from "@/widgets/landing/FeatureCard";

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-[#0D0D0D]" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">핵심 기능</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Lumi AI는 다음과 같은 강력한 이미지 생성 기능을 제공합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MdAutoFixHigh size={24} />}
            title="AI 이미지 생성"
            description="텍스트 프롬프트만으로 고품질의 이미지를 손쉽게 생성할 수 있습니다."
            delay={0.1}
          />
          <FeatureCard
            icon={<MdStyle size={24} />}
            title="스타일 커스터마이징"
            description="다양한 아트 스타일과 테마로 원하는 느낌의 이미지를 생성해보세요."
            delay={0.2}
          />
          <FeatureCard
            icon={<MdOutlineArtTrack size={24} />}
            title="이미지 편집"
            description="기존 이미지의 배경 변경, 객체 추가/제거 등 다양한 편집 기능을 제공합니다."
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
} 