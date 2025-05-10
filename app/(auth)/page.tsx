"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import HeroSection from "../../widgets/home/sections/HeroSection";


const FeaturesSection = dynamic(() => import("../../widgets/home/sections/FeaturesSection"), {
  loading: () => null,
  ssr: true,
});

const SpecialFeaturesSection = dynamic(() => import("../../widgets/home/sections/SpecialFeaturesSection"), {
  loading: () => null,
  ssr: false,
});

const Footer = dynamic(() => import("../../widgets/home/sections/Footer"), {
  loading: () => null,
  ssr: false,
});

interface LazyLoadSectionProps {
  id: string;
  children: React.ReactNode;
}

const LazyLoadSection: React.FC<LazyLoadSectionProps> = ({ id, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { 
        rootMargin: "200px 0px", // 200px 이전에 로드 시작
        threshold: 0.1 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div id={id} ref={sectionRef}>
      {isVisible && children}
    </div>
  );
};


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
      
      <div className="font-sans text-neutral-50">
        <Toaster position="top-center" reverseOrder={false} />
      </div>

      <motion.main
        className="overflow-x-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <section id="hero-section" className="relative">
          <HeroSection />
        </section>

        <LazyLoadSection id="features-section">
          <FeaturesSection />
        </LazyLoadSection>

        <LazyLoadSection id="special-features-section">
          <SpecialFeaturesSection />
        </LazyLoadSection>

        <LazyLoadSection id="footer">
          <Footer />
        </LazyLoadSection>
      </motion.main>
    </>
  );
}