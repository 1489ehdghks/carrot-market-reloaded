"use client"

import { motion } from "framer-motion";
import { features } from "../data/features";
import FeatureCard from "../components/FeatureCard";

export default function FeaturesSection() {
  return (
    <section className="relative py-20 bg-[#0D0D0D]">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            주요 기능
          </h2>
          <p className="text-neutral-400">
            AI 기술로 당신의 창작 활동을 더욱 풍부하게
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <FeatureCard 
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