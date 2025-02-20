"use client"

import { 
  PhotoIcon, 
  VideoCameraIcon,
  InformationCircleIcon,
  ShoppingBagIcon,
  GiftIcon,
  HandRaisedIcon,
  PaintBrushIcon,
  CodeBracketIcon,
  XMarkIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline"

import { 
  PhotoIcon as PhotoSolid,
  VideoCameraIcon as VideoCameraSolid,
  InformationCircleIcon as InformationCircleSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  GiftIcon as GiftSolid,
  HandRaisedIcon as HandRaisedSolid,
  PaintBrushIcon as PaintBrushSolid,
  CodeBracketIcon as CodeBracketSolid,
  UserIcon as UserIconOutline,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid"

import Link from "next/link"
import { usePathname } from "next/navigation"


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

interface LeftSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function LeftSidebar({ isVisible, onClose, onToggle }: LeftSidebarProps) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: "Explore",
      items: [
        { href: "/home", icon: InformationCircleIcon, activeIcon: InformationCircleSolid, label: "정보" },
        { href: "/products", icon: ShoppingBagIcon, activeIcon: ShoppingBagSolid, label: "작품" },
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
        { href: "/support/dev", icon: CodeBracketIcon, activeIcon: CodeBracketSolid, label: "기능 문의" },
      ]
    },
    {
      title: "Profile",
      items: [
        { href: "/profile", icon: UserIconOutline, activeIcon: UserIconSolid, label: "프로필" },
      ]
    },
  ];

  const NavLink = ({ href, icon: Icon, activeIcon: ActiveIcon, label }: NavItem) => (
    <Link 
      href={href}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-300
        ${pathname === href 
          ? "bg-[#FFB4B4]/10 text-[#FFB4B4]" 
          : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"}`}
    >
      {pathname === href ? <ActiveIcon className="w-5 h-5"/> : <Icon className="w-5 h-5"/>}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );

  return (
    <>
      {/* 토글 버튼 */}
      {!isVisible && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-[9999] p-2 rounded-lg bg-neutral-800/70 hover:bg-neutral-700/70 transition-colors md:block hidden group"
          title="사이드바 열기 (Alt + 1)"
        >
          <Bars3Icon className="w-5 h-5 text-neutral-300" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Alt + 1
          </span>
        </button>
      )}

      <aside 
        className={`fixed left-0 top-0 h-full bg-neutral-900/95 backdrop-blur-sm z-[9999] border-r border-neutral-800/50
          transition-all duration-300 ease-in-out
          ${isVisible ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full'}
        `}
      >
        <div className={`flex flex-col h-full p-4 ${!isVisible ? 'invisible' : ''}`}>
          {/* 로고와 닫기 버튼 */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2 px-2 py-4 group">
              <span className="font-cairo font-medium text-2xl text-white tracking-wide group-hover:text-[#FFB4B4] transition-colors">
                lumi AI
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800/70 transition-colors group relative"
              title="사이드바 닫기 (Esc)"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-300" />
              <span className="absolute right-full mr-2 px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                Esc
              </span>
            </button>
          </div>

          {/* 네비게이션 섹션들 */}
          <div className="flex-1 space-y-6 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <h3 className="px-3 text-xs font-medium text-neutral-500">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item, index) => (
                    <NavLink key={index} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
} 