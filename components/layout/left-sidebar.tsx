"use client"

import { HomeIcon, SparklesIcon, PhotoIcon, BookmarkIcon, PlusCircleIcon } from "@heroicons/react/24/outline"
import { HomeIcon as HomeSolid, SparklesIcon as SparklesSolid, PhotoIcon as PhotoSolid, BookmarkIcon as BookmarkSolid, PlusCircleIcon as PlusCircleSolid } from "@heroicons/react/24/solid"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function LeftSidebar() {
  const pathname = usePathname();

  const NavLink = ({ href, icon: Icon, activeIcon: ActiveIcon, label }: any) => (
    <Link 
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300
        ${pathname === href 
          ? "bg-[#2c3e50]/20 text-[#4a3b89]" 
          : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"}`}
    >
      {pathname === href ? <ActiveIcon className="w-6 h-6"/> : <Icon className="w-6 h-6"/>}
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 h-full bg-neutral-900/95 backdrop-blur-sm z-50 border-r border-neutral-800/50">
      <div className="flex flex-col h-full">
        {/* 로고 영역 */}
        <div className="flex items-center gap-3 p-5 mb-2">
          <span className="text-2xl">✨</span>
          <span className="text-xl font-bold text-white">Lumi AI</span>
        </div>

        {/* 메인 네비게이션 */}
        <div className="px-3">
          <nav className="flex flex-col gap-1">
            <NavLink href="/home" icon={HomeIcon} activeIcon={HomeSolid} label="홈" />
            <NavLink href="/explore" icon={SparklesIcon} activeIcon={SparklesSolid} label="탐색하기" />
          </nav>
        </div>

        {/* AI Assets 섹션 */}
        <div className="px-3 mt-6">
          <h3 className="text-neutral-500 text-sm font-medium px-3 mb-2">AI Assets</h3>
          <nav className="flex flex-col gap-1">
            <NavLink href="/images" icon={PhotoIcon} activeIcon={PhotoSolid} label="AI Images" />
            <NavLink href="/videos" icon={BookmarkIcon} activeIcon={BookmarkSolid} label="AI Videos" />
          </nav>
        </div>

        {/* My Space 섹션 */}
        <div className="px-3 mt-6">
          <h3 className="text-neutral-500 text-sm font-medium px-3 mb-2">My Space</h3>
          <nav className="flex flex-col gap-1">
            <NavLink href="/my-creatives" icon={PhotoIcon} activeIcon={PhotoSolid} label="My Creatives" />
            <NavLink href="/my-models" icon={BookmarkIcon} activeIcon={BookmarkSolid} label="My Models" />
          </nav>
        </div>

        {/* 하단 앱 다운로드 버튼 */}
        <div className="mt-auto p-3">
          <Link 
            href="/download" 
            className="flex items-center gap-3 p-4 rounded-lg bg-[#2c3e50]/20 hover:bg-[#2c3e50]/30 transition-colors"
          >
            <div className="flex-shrink-0">
              <PlusCircleIcon className="w-6 h-6 text-[#4a3b89]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">LUMI AI APP</h4>
              <p className="text-xs text-neutral-400">Click to get it now</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
} 