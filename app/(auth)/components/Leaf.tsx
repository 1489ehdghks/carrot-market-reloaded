"use client"

import { motion } from "framer-motion";

interface LeafProps {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  speed: number;
  color: string;
}

export default function Leaf({ x, y, rotation, scale, speed, color }: LeafProps) {
  return (
    <motion.div
      className="absolute"
      animate={{
        y: [
          y + '%',
          `${Math.min(y + 20, 100)}%`
        ],
        x: [
          x + '%',
          `${x + (Math.sin(y) * 5)}%`
        ],
        rotate: [
          rotation,
          rotation + 360
        ]
      }}
      transition={{
        duration: 20 / speed,
        repeat: Infinity,
        ease: "linear",
        y: {
          duration: 10 / speed,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "reverse"
        }
      }}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        style={{
          fill: color,
          opacity: 0.7,
          transform: `scale(${scale})`,
        }}
      >
        {/* 더 자연스러운 낙엽 모양의 SVG 패스 */}
        <path d="
          M15,3 
          C17,3 20,4 22,6
          C24,8 25,11 25,13
          C25,15 24,18 22,20
          C20,22 17,23 15,23
          C13,23 10,22 8,20
          C6,18 5,15 5,13
          C5,11 6,8 8,6
          C10,4 13,3 15,3
          Z
          M15,8
          C16,8 19,9 19,13
          C19,17 16,18 15,18
          C14,18 11,17 11,13
          C11,9 14,8 15,8
          Z
        "/>
        {/* 낙엽의 잎맥 */}
        <path d="M15,3 L15,23 M5,13 L25,13" 
          style={{ 
            fill: 'none', 
            stroke: color, 
            strokeWidth: '0.5',
            opacity: 0.5 
          }}
        />
      </svg>
    </motion.div>
  );
} 