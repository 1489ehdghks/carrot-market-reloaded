import Link from "next/link";
import { 
  SparklesIcon, 
  PhotoIcon, 
  VideoCameraIcon,
  PaintBrushIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Home() {
  const features = [
    {
      icon: PhotoIcon,
      title: "AI 이미지 생성",
      description: "상상하는 모든 이미지를 AI로 구현하세요",
      href: "/assets/image",
    },
    {
      icon: VideoCameraIcon,
      title: "AI 영상 제작",
      description: "전문적인 영상을 AI로 쉽게 만들어보세요",
      href: "/assets/video",
    },
    {
      icon: PaintBrushIcon,
      title: "AI 편집 도구",
      description: "이미지와 영상을 AI로 편집하고 개선하세요",
      href: "/assets/custom",
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: "AI 어시스턴트",
      description: "전문 AI 어시스턴트와 함께 작업하세요",
      href: "/chat",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0D0D]">
      {/* Hero 섹션 */}
      <div className="relative min-h-screen">
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"  // 어두운 톤의 예술적인 배경 이미지
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/80 to-[#0D0D0D]" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-[640px] mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              AI와 함께<br />
              <span className="text-[#FFB4B4]">상상을 현실로</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400">
              이미지 생성, 영상 제작, 편집까지<br />
              AI와 함께 당신의 창의력을 실현하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link 
                href="/create-account" 
                className="px-8 py-3 bg-[#FFB4B4] hover:bg-[#FF9B9B] text-[#0D0D0D] rounded font-medium transition-colors"
              >
                시작하기
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-3 border border-[#FFB4B4] text-[#FFB4B4] hover:bg-[#FFB4B4]/10 rounded font-medium transition-colors"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 기능 소개 섹션 */}
      <div className="relative py-20 bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Link 
                key={index}
                href={feature.href}
                className="group p-4 rounded-lg border border-neutral-800 hover:border-[#FFB4B4] transition-colors"
              >
                <div className="flex flex-col items-start gap-4">
                  <div className="p-2 rounded bg-neutral-900 group-hover:bg-neutral-800 transition-colors">
                    <feature.icon className="w-5 h-5 text-[#FFB4B4]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-neutral-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}