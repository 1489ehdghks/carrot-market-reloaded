"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";

const HeroSection = dynamic(() => import("./sections/HeroSection"), {
  ssr: false,
});
const FeaturesSection = dynamic(() => import("./sections/FeaturesSection"), {
  ssr: false,
});
const SpecialFeaturesSection = dynamic(
  () => import("./sections/SpecialFeaturesSection"),
  { ssr: false }
);
const Footer = dynamic(() => import("./sections/Footer"), {
  ssr: false
});

export default function HomePage() {
  return (
    <>
      <style jsx global>{`
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          background-color: #000;
        }
        
        @media (max-width: 768px) {
          body {
            background-image: 
              radial-gradient(circle at 30% 10%, rgba(255, 180, 180, 0.05) 0%, transparent 60%),
              radial-gradient(circle at 80% 30%, rgba(180, 180, 255, 0.03) 0%, transparent 50%);
          }
        }
        
        @media (min-width: 769px) {
          body {
            background-image: 
              radial-gradient(circle at 20% 20%, rgba(255, 180, 180, 0.08) 0%, transparent 70%),
              radial-gradient(circle at 80% 50%, rgba(180, 180, 255, 0.05) 0%, transparent 60%);
          }
        }
      `}</style>
      
      <motion.main 
        className="relative w-full overflow-x-hidden bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeroSection />
        <FeaturesSection />
        <SpecialFeaturesSection />
        <Footer />
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(16, 16, 16, 0.9)',
              color: '#fff',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 180, 180, 0.15)',
            },
          }}
        />
      </motion.main>
    </>
  );
}