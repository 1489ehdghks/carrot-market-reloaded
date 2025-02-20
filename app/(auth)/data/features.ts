import { 
  PhotoIcon, 
  VideoCameraIcon,
  PaintBrushIcon,
  ChatBubbleBottomCenterTextIcon 
} from "@heroicons/react/24/outline";

interface Feature {
  icon: any; // IconType 대신 any 사용 (HeroIcons 사용시)
  title: string;
  description: string;
  href: string;
}

interface SpecialFeature {
  title: string;
  description: string;
  image: string;
}

export const features: Feature[] = [
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

export const specialFeatures: SpecialFeature[] = [
  {
    title: "실시간 협업",
    description: "팀원들과 실시간으로 작업물을 공유하고 피드백을 주고받으세요",
    image: "/images/features/collaboration.jpg"
  },
  {
    title: "고급 AI 모델",
    description: "최신 AI 모델을 활용하여 더 높은 품질의 결과물을 만들어보세요",
    image: "/images/features/ai-models.jpg"
  },
  {
    title: "커스텀 워크플로우",
    description: "자신만의 작업 방식을 설정하고 자동화하세요",
    image: "/images/features/workflow.jpg"
  }
]; 