"use client"

import { motion } from "framer-motion";
import Link from "next/link";

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  href: string;
  index: number;
}

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  href,
  index 
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
    >
      <Link 
        href={href}
        className="group p-4 rounded-lg border border-neutral-800 hover:border-[#FFB4B4] transition-all duration-300 hover:scale-105 block"
      >
        <div className="flex flex-col items-start gap-4">
          <div className="p-2 rounded bg-neutral-900 group-hover:bg-neutral-800 transition-colors">
            <Icon className="w-5 h-5 text-[#FFB4B4]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-neutral-400">
              {description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 