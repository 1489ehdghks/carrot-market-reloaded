"use client"

import { motion } from "framer-motion";
import { BsStars, BsSpeedometer, BsFillCloudArrowUpFill } from "react-icons/bs";
import SpecialFeatureCard from "@/widgets/landing/SpecialFeatureCard";

export default function SpecialFeaturesSection() {
  return (
    <section className="py-20 bg-[#0D0D0D]" id="special-features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">프리미엄 기능</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Lumi AI의 프리미엄 멤버십으로 더 많은 크리에이티브 옵션을 이용해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SpecialFeatureCard
            icon={<BsStars size={24} />}
            title="고해상도 이미지"
            description="최대 4K 해상도의 초고화질 이미지를 생성하여 전문적인 작업에 활용할 수 있습니다."
            delay={0.1}
          />
          <SpecialFeatureCard
            icon={<BsSpeedometer size={24} />}
            title="우선 처리"
            description="프리미엄 사용자는 이미지 생성 대기열에서 우선 처리되어 더 빠른 결과를 받을 수 있습니다."
            delay={0.2}
          />
          <SpecialFeatureCard
            icon={<BsFillCloudArrowUpFill size={24} />}
            title="무제한 저장"
            description="생성된 모든 이미지를 클라우드에 무제한으로 저장하고 언제든지 액세스할 수 있습니다."
            delay={0.3}
          />
        </div>
      </div>
    </section>
  );
} 