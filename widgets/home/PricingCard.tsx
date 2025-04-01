import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  icon: ReactNode;
  isPopular?: boolean;
  cta: string;
  delay?: number;
}

export default function PricingCard({
  title,
  price,
  description,
  features,
  icon,
  isPopular = false,
  cta,
  delay = 0
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl p-6 flex flex-col shadow-lg transition-all duration-300 border ${
        isPopular
          ? "border-[#FFB4B4] bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A]"
          : "border-neutral-800 bg-[#1A1A1A] hover:bg-[#222] hover:border-neutral-700"
      }`}
    >
      {isPopular && (
        <span className="text-xs font-medium bg-[#FFB4B4] text-black px-3 py-1 rounded-full self-start mb-4">
          인기 상품
        </span>
      )}
      <div className="flex items-center space-x-3 mb-4">
        <div className={`text-[#FFB4B4] ${!isPopular && "opacity-70"}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        <p className="text-sm text-neutral-400 mt-1">{description}</p>
      </div>
      <ul className="space-y-2 mb-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-neutral-300">
            <svg className="w-4 h-4 mr-2 text-[#FFB4B4]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          isPopular
            ? "bg-[#FFB4B4] hover:bg-[#FF9B9B] text-black"
            : "bg-[#2A2A2A] hover:bg-[#333] text-white"
        }`}
      >
        {cta}
      </button>
    </motion.div>
  );
} 