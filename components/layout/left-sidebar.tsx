"use client"

import { 
  HomeIcon, 
  SparklesIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  PencilSquareIcon,
  UserIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  GiftIcon,
  HandRaisedIcon,
  WrenchScrewdriverIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  XMarkIcon,
  Bars3Icon,
  ServerStackIcon
} from "@heroicons/react/24/outline"

import { 
  HomeIcon as HomeSolid,
  SparklesIcon as SparklesSolid,
  PhotoIcon as PhotoSolid,
  VideoCameraIcon as VideoCameraSolid,
  PencilSquareIcon as PencilSquareSolid,
  UserIcon as UserSolid,
  InformationCircleIcon as InformationCircleSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  GiftIcon as GiftSolid,
  HandRaisedIcon as HandRaisedSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverSolid,
  PaintBrushIcon as PaintBrushSolid,
  CodeBracketIcon as CodeBracketSolid
} from "@heroicons/react/24/solid"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

interface NavItem {
  href: string
  icon: any
  activeIcon: any
  label: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export default function LeftSidebar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + L로 사이드바 토글
      if (e.altKey && e.key === '1') {
        setIsVisible(prev => !prev);
      }
      // Escape 키로 사이드바 닫기
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  // 마우스가 왼쪽 가장자리에 닿으면 사이드바 표시
  const handleMouseEnter = () => {
    if (!isVisible) {
      setIsVisible(true);
    }
  };

  const navSections: NavSection[] = [

    {
      title: "Explore",
      items: [
        { href: "/explore/info", icon: InformationCircleIcon, activeIcon: InformationCircleSolid, label: "정보" },
        { href: "/products", icon: ShoppingBagIcon, activeIcon: ShoppingBagSolid, label: "작품 갤러리" },
      ]
    },
    {
      title: "Request",
      items: [
        { href: "/request/events", icon: GiftIcon, activeIcon: GiftSolid, label: "이벤트" },
        { href: "/request/custom", icon: HandRaisedIcon, activeIcon: HandRaisedSolid, label: "작업 요청" },
      ]
    },
    {
      title: "AI Assets",
      items: [
        { href: "/assets/image", icon: PhotoIcon, activeIcon: PhotoSolid, label: "이미지 생성" },
        { href: "/assets/video", icon: VideoCameraIcon, activeIcon: VideoCameraSolid, label: "영상 제작" },
        { href: "/assets/custom", icon: PaintBrushIcon, activeIcon: PaintBrushSolid, label: "편집" },
      ]
    },
    {
      title: "Support",
      items: [
        { href: "/support/dev", icon: CodeBracketIcon, activeIcon: CodeBracketSolid, label: "개발자 문의" },
      ]
    },
  ];

  const NavLink = ({ href, icon: Icon, activeIcon: ActiveIcon, label }: NavItem) => (
    <Link 
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300
        ${pathname === href 
          ? "bg-[#2c3e50]/20 text-[#4a3b89]" 
          : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"}`}
    >
      {pathname === href ? <ActiveIcon className="w-5 h-5"/> : <Icon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );

  return (
    <>
      {/* 마우스 감지 영역 */}
      {!isVisible && (
        <div 
          className="fixed left-0 top-0 w-2 h-full z-40 hidden md:block"
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* 토글 버튼 */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed left-4 top-4 z-50 p-2 rounded-lg bg-neutral-800/70 hover:bg-neutral-700/70 transition-colors md:block hidden group"
          title="사이드바 열기 (Alt + 1)"
        >
          <Bars3Icon className="w-5 h-5 text-neutral-300" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Alt + 1
          </span>
        </button>
      )}

      {/* 사이드바 */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-neutral-900/95 backdrop-blur-sm z-50 border-r border-neutral-800/50
          transition-all duration-300 ease-in-out hidden md:block
          ${isVisible 
            ? 'w-64 opacity-100 translate-x-0' 
            : 'w-0 opacity-0 -translate-x-full'
          }
        `}
      >
        <div className={`flex flex-col h-full p-4 ${!isVisible ? 'invisible' : ''}`}>
          {/* 로고와 닫기 버튼 */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/home"
              className="flex items-center gap-3 px-2 py-4"
            >
              <span className="text-2xl">✨</span>
              <span className="text-xl font-bold text-white">Lumi AI</span>
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 rounded-lg hover:bg-neutral-800/70 transition-colors group relative"
              title="사이드바 닫기 (Esc)"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-300" />
              <span className="absolute right-full mr-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                Esc
              </span>
            </button>
          </div>

          {/* 검색 바 추가 */}
          <div className="px-2 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="빠른 검색..."
                className="w-full bg-neutral-800/50 text-neutral-300 text-sm rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#4a3b89]/50"
              />
              <ServerStackIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
          </div>

          {/* 네비게이션 섹션들 */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="group">
                {section.title && (
                  <h3 className="text-xs font-medium text-neutral-500 px-3 mb-2 group-hover:text-neutral-400 transition-colors">
                    {section.title}
                  </h3>
                )}
                <nav className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavLink key={item.href} {...item} />
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* 프로필 링크 */}
          <div className="pt-6 mt-6 border-t border-neutral-800">
            <Link 
              href="/profile"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300
                ${pathname === "/profile" 
                  ? "bg-[#2c3e50]/20 text-[#4a3b89]" 
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"}`}
            >
              {pathname === "/profile" ? 
                <UserSolid className="w-5 h-5"/> : 
                <UserIcon className="w-5 h-5"/>
              }
              <span className="font-medium text-sm">프로필</span>
            </Link>
          </div>

          {/* 키보드 단축키 안내 */}
          <div className="mt-4 px-3 py-2 bg-neutral-800/30 rounded-lg">
            <p className="text-xs text-neutral-500">
              단축키: <span className="text-neutral-400">Alt + 1</span> (토글) / <span className="text-neutral-400">Esc</span> (닫기)
            </p>
          </div>
        </div>
      </aside>
    </>
  );
} 