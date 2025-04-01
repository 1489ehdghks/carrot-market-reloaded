"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative bg-black py-16 overflow-hidden"
    >
      {/* 구분선 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* 배경 효과 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 right-20 w-96 h-96 bg-[#FFB4B4]/5 rounded-full blur-[100px] opacity-50" />
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-[#FFB4B4]/5 rounded-full blur-[100px] opacity-50" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* 회사 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-bold text-2xl text-white">Lumi</span>
              <span className="bg-gradient-to-r from-[#FFB4B4] to-[#FF9B9B] bg-clip-text text-transparent font-bold text-2xl">AI</span>
            </div>
            <p className="text-zinc-400 mb-6">
              인공지능으로 당신의 창의적인 아이디어를 현실로 만들어보세요. 상상했던 모든 이미지를 생성할 수 있습니다.
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com" className="text-zinc-400 hover:text-[#FFB4B4] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-3.3-1.5 4.926 4.926 0 00-4.92 6.59 13.98 13.98 0 01-10.15-5.147A4.927 4.927 0 003.04 9.722a4.897 4.897 0 01-2.23-.616v.06a4.923 4.923 0 003.95 4.827 4.996 4.996 0 01-2.224.084 4.936 4.936 0 004.6 3.42A9.88 9.88 0 010 19.54a13.94 13.94 0 007.548 2.208c9.054 0 14.01-7.5 14.01-14.01 0-.21 0-.42-.01-.63A9.936 9.936 0 0024 4.59z"></path>
                </svg>
              </Link>
              <Link href="https://facebook.com" className="text-zinc-400 hover:text-[#FFB4B4] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                </svg>
              </Link>
              <Link href="https://instagram.com" className="text-zinc-400 hover:text-[#FFB4B4] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          {/* 빠른 링크 */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">빠른 링크</h3>
            <ul className="space-y-2">
              {[
                { name: "홈", href: "/" },
                { name: "기능", href: "#features" },
                { name: "요금제", href: "#pricing" },
                { name: "갤러리", href: "#gallery" },
                { name: "FAQ", href: "#faq" }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-zinc-400 hover:text-[#FFB4B4] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 법적 정보 */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">법적 정보</h3>
            <ul className="space-y-2">
              {[
                { name: "이용약관", href: "/terms" },
                { name: "개인정보처리방침", href: "/privacy" },
                { name: "쿠키 정책", href: "/cookies" },
                { name: "라이센스", href: "/license" }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="text-zinc-400 hover:text-[#FFB4B4] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 뉴스레터 */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">뉴스레터 구독</h3>
            <p className="text-zinc-400 mb-4">
              최신 업데이트와 특별한 혜택 정보를 받아보세요.
            </p>
            <form className="space-y-2">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="이메일 주소 입력" 
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB4B4]/50 focus:border-transparent"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-[#FFB4B4] to-[#FF9B9B] hover:from-[#FF9B9B] hover:to-[#FFB4B4] text-black font-medium rounded-lg transition-all duration-300 hover:scale-105"
              >
                구독하기
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-16 pt-8 text-center text-zinc-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Lumi AI. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  );
} 