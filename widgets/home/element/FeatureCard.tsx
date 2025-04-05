import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[#1A1A1A] rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#222] border border-neutral-800 hover:border-neutral-700"
    >
      <div className="w-14 h-14 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4 text-[#FFB4B4]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-neutral-400">{description}</p>
    </motion.div>
  );
} 