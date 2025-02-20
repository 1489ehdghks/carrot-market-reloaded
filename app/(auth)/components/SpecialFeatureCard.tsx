"use client"

import { motion } from "framer-motion";
import Image from "next/image";

interface SpecialFeatureCardProps {
  title: string;
  description: string;
  image: string;
  index: number;
}

export default function SpecialFeatureCard({ 
  title, 
  description, 
  image,
  index 
}: SpecialFeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="group relative overflow-hidden rounded-xl"
    >
      <div className="aspect-video relative">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-xl font-bold text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {description}
        </p>
      </div>
    </motion.div>
  );
} 