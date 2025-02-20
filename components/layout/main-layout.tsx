"use client"

import LeftSidebar from "./left-sidebar"
import RightSidebar from "./right-sidebar"
import { useState, useEffect } from "react"
import { Bars3Icon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') {
        setShowLeftSidebar(prev => !prev);
      }
      if (e.altKey && e.key === '2') {
        setShowRightSidebar(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* 모바일 헤더 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-neutral-900/95 border-b border-neutral-800/50 flex items-center justify-between px-4 sm:hidden z-[9999]">
        <button
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="p-2 rounded-lg hover:bg-neutral-800/70"
        >
          <Bars3Icon className="w-6 h-6 text-neutral-300" />
        </button>
        <span className="text-white font-medium">lumiAI</span>
        <button
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="p-2 rounded-lg hover:bg-neutral-800/70"
        >
          <EllipsisHorizontalIcon className="w-6 h-6 text-neutral-300" />
        </button>
      </div>

      {/* 왼쪽 사이드바 컨테이너 */}
      <div className="fixed sm:static h-full z-[9999]">
        <LeftSidebar 
          isVisible={showLeftSidebar} 
          onClose={() => setShowLeftSidebar(false)}
          onToggle={() => setShowLeftSidebar(prev => !prev)}
        />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 pt-6 sm:ml-5 lg:mr-5 min-h-screen w-full transition-all duration-300 mt-16 sm:mt-0 relative z-0">
        <div className="max-w-screen-xl mx-auto px-4">
          {children}
        </div>
      </main>

      {/* 오른쪽 사이드바 컨테이너 */}
      <div className="fixed sm:static h-full right-0 z-[9999]">
        <RightSidebar 
          isVisible={showRightSidebar} 
          onClose={() => setShowRightSidebar(false)}
          onToggle={() => setShowRightSidebar(prev => !prev)}
        />
      </div>
    </div>
  );
} 