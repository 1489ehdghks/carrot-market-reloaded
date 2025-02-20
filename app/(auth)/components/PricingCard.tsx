"use client"

import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";


interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
  index: number;
}

export default function PricingCard({ 
  name, 
  price, 
  period, 
  features, 
  recommended = false,
  index 
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className={`relative p-6 rounded-xl border ${
        recommended 
          ? 'border-[#FFB4B4] bg-[#FFB4B4]/5' 
          : 'border-neutral-800 bg-neutral-900/50'
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFB4B4] text-[#0D0D0D] text-sm font-medium rounded-full">
          추천
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="text-neutral-400">/{period}</span>
        </div>
      </div>
      <ul className="space-y-3">
        {features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-center gap-2 text-neutral-300">
            <CheckCircleIcon className="w-5 h-5 text-[#FFB4B4]" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/create-account"
        className={`mt-6 block text-center py-2 rounded-lg transition-all duration-300 ${
          recommended
            ? 'bg-[#FFB4B4] hover:bg-[#FF9B9B] text-[#0D0D0D]'
            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
        }`}
      >
        시작하기
      </Link>
    </motion.div>
  );
} 