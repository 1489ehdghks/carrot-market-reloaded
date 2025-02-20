"use client"

import { motion } from "framer-motion";
import { specialFeatures } from "../data/features";
import SpecialFeatureCard from "../components/SpecialFeatureCard";

export default function SpecialFeaturesSection() {
  return (
    <section className="relative py-20 bg-[#0D0D0D]/50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            특별한 기능
          </h2>
          <p className="text-neutral-400">
            더 나은 작업 환경을 위한 프리미엄 기능
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialFeatures.map((feature, index) => (
            <SpecialFeatureCard 
              key={feature.title}
              {...feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 