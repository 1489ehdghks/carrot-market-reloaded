"use client"

import { motion } from "framer-motion";
import { plans } from "../data/pricing";
import PricingCard from "../components/PricingCard";
import Footer from "../components/Footer";

export default function PricingSection() {
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
            요금제
          </h2>
          <p className="text-neutral-400">
            당신에게 맞는 플랜을 선택하세요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard 
              key={plan.name}
              {...plan}
              index={index}
            />
          ))}
        </div>
      </div>
      <Footer />
    </section>
  );
} 