"use client"

import { 
  SparklesIcon, 
  ClockIcon, 
  ChevronRightIcon, 
  ClipboardIcon, 
  ChevronDoubleDownIcon, 
  FireIcon, 
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  Bars3Icon 
} from "@heroicons/react/24/outline"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Tooltip } from "@/components/ui/tooltip"

interface Creation {
  id: number
  title: string
  date: string
  preview: string
  type: "image" | "video"
}

interface Prompt {
  id: number
  title: string
  date: string
  content: string
}

interface PopularPost {
  id: number
  title: string
  date: string
  likes: number
}

interface AIChat {
  id: number
  name: string
  avatar: string
  specialty: string
  status: "online" | "busy" | "offline"
  lastChat?: string
}


interface RightSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function RightSidebar({ isVisible, onClose, onToggle }: RightSidebarProps) {
  const [showAllCreations, setShowAllCreations] = useState(false)
  const [showAllPrompts, setShowAllPrompts] = useState(false)
  const [showAllPopular, setShowAllPopular] = useState(false)
  const [showAllAIChats, setShowAllAIChats] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // 실제로는 API나 데이터베이스에서 가져올 데이터
  const creations: Creation[] = [/* ... */]
  const prompts: Prompt[] = [/* ... */]
  const popularPosts: PopularPost[] = [/* ... */]

  // 샘플 데이터
  const aiChats: AIChat[] = [
    {
      id: 1,
      name: "Creative AI",
      avatar: "/ai-avatars/creative.png",
      specialty: "이미지 생성 전문",
      status: "online",
      lastChat: "어떤 이미지를 만들어볼까요?"
    },
    {
      id: 2,
      name: "Code Helper",
      avatar: "/ai-avatars/code.png",
      specialty: "코딩 도우미",
      status: "online",
    },
    {
      id: 3,
      name: "Writing Pro",
      avatar: "/ai-avatars/write.png",
      specialty: "글쓰기 전문",
      status: "busy",
    },
  ]

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {/* 토글 버튼 - 사이드바가 숨겨졌을 때 */}
      {!isVisible && (
        <button
          onClick={onToggle}
          className="fixed right-4 top-4 z-50 p-2 rounded-lg bg-neutral-800/70 hover:bg-neutral-700/70 transition-colors"
        >
          <Bars3Icon className="w-5 h-5 text-neutral-300" />
        </button>
      )}

      {/* 사이드바 */}
      <aside 
        className={`fixed right-0 top-0 h-full bg-neutral-900/95 backdrop-blur-sm z-50 border-l border-neutral-800/50 overflow-y-auto
          transition-all duration-300 ease-in-out
          ${isVisible ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'}
        `}
      >
        <div className="p-4 space-y-5">
          {/* 닫기 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-800/70 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-neutral-300" />
            </button>
          </div>

          {/* 인기글 섹션 */}
          <div className="bg-neutral-800/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/70">
              <div className="flex items-center gap-2">
                <FireIcon className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-medium text-neutral-300">인기글</h3>
              </div>
              <button 
                onClick={() => setShowAllPopular(!showAllPopular)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                더보기 {showAllPopular ? 
                  <ChevronDoubleDownIcon className="w-3 h-3" /> : 
                  <ChevronRightIcon className="w-3 h-3" />
                }
              </button>
            </div>
            <div className="divide-y divide-neutral-700/50">
              {popularPosts.slice(0, showAllPopular ? 10 : 3).map((item) => (
                <Link 
                  key={item.id}
                  href={`/posts/${item.id}`}
                  className="px-4 py-3 hover:bg-neutral-700/30 transition-colors cursor-pointer block"
                >
                  <div className="text-sm text-neutral-300">{item.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-500">{item.date}</span>
                    <span className="text-xs text-orange-500">♥ {item.likes}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 최근 만든 작품 섹션 */}
          <div className="bg-neutral-800/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/70">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-medium text-neutral-300">최근 만든 작품</h3>
              </div>
              <button 
                onClick={() => setShowAllCreations(!showAllCreations)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                더보기 {showAllCreations ? 
                  <ChevronDoubleDownIcon className="w-3 h-3" /> : 
                  <ChevronRightIcon className="w-3 h-3" />
                }
              </button>
            </div>
            <div className="divide-y divide-neutral-700/50">
              {creations.slice(0, showAllCreations ? 10 : 3).map((item) => (
                <Tooltip
                  key={item.id}
                  content={
                    <div className="w-48 h-48 relative">
                      {item.type === "image" ? (
                        <Image 
                          src={item.preview} 
                          alt={item.title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      ) : (
                        <video 
                          src={item.preview}
                          className="w-full h-full object-cover rounded-lg"
                          autoPlay
                          muted
                          loop
                        />
                      )}
                    </div>
                  }
                >
                  <Link 
                    href={`/creations/${item.id}`}
                    className="px-4 py-3 hover:bg-neutral-700/30 transition-colors cursor-pointer block"
                  >
                    <div className="text-sm text-neutral-300">{item.title}</div>
                    <div className="text-xs text-neutral-500 mt-1">{item.date}</div>
                  </Link>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 최근 사용한 프롬프트 섹션 */}
          <div className="bg-neutral-800/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/70">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-medium text-neutral-300">최근 사용한 프롬프트</h3>
              </div>
              <button 
                onClick={() => setShowAllPrompts(!showAllPrompts)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                더보기 {showAllPrompts ? 
                  <ChevronDoubleDownIcon className="w-3 h-3" /> : 
                  <ChevronRightIcon className="w-3 h-3" />
                }
              </button>
            </div>
            <div className="divide-y divide-neutral-700/50">
              {prompts.slice(0, showAllPrompts ? 10 : 3).map((item) => (
                <Tooltip
                  key={item.id}
                  content={
                    <div className="p-3 bg-neutral-800 rounded-lg max-w-xs">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="text-sm text-neutral-300">{item.content}</p>
                        <button
                          onClick={() => copyToClipboard(item.content, item.id)}
                          className="flex-shrink-0"
                        >
                          <ClipboardIcon className={`w-4 h-4 ${copiedId === item.id ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} />
                        </button>
                      </div>
                    </div>
                  }
                >
                  <div className="px-4 py-3 hover:bg-neutral-700/30 transition-colors cursor-pointer">
                    <div className="text-sm text-neutral-300">{item.title}</div>
                    <div className="text-xs text-neutral-500 mt-1">{item.date}</div>
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* AI 챗봇 섹션 */}
          <div className="bg-neutral-800/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/70">
              <div className="flex items-center gap-2">
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-medium text-neutral-300">AI 어시스턴트</h3>
              </div>
              <button 
                onClick={() => setShowAllAIChats(!showAllAIChats)}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                더보기 {showAllAIChats ? 
                  <ChevronDoubleDownIcon className="w-3 h-3" /> : 
                  <ChevronRightIcon className="w-3 h-3" />
                }
              </button>
            </div>
            <div className="divide-y divide-neutral-700/50">
              {aiChats.slice(0, showAllAIChats ? 10 : 3).map((ai) => (
                <Link 
                  key={ai.id}
                  href={`/chat/${ai.id}`}
                  className="px-4 py-3 hover:bg-neutral-700/30 transition-colors cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-800
                        ${ai.status === 'online' ? 'bg-green-500' : 
                          ai.status === 'busy' ? 'bg-yellow-500' : 'bg-neutral-500'}`} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-300">{ai.name}</span>
                        <span className="text-xs text-neutral-500">{ai.specialty}</span>
                      </div>
                      {ai.lastChat && (
                        <p className="text-xs text-neutral-400 mt-0.5 truncate">{ai.lastChat}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 