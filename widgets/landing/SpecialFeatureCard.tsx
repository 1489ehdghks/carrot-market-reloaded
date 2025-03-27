import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SpecialFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
  className?: string;
}

export default function SpecialFeatureCard({
  icon,
  title,
  description,
  delay = 0,
  className = ""
}: SpecialFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A] rounded-xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 hover:from-[#2D2D2D] hover:to-[#222] border border-neutral-800 hover:border-neutral-700 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4 text-[#FFB4B4] border border-neutral-700">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </motion.div>
  );
} 