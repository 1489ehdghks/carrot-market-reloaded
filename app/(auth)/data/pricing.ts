interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: "₩0",
    period: "월",
    features: [
      "기본 AI 모델 사용",
      "월 10회 이미지 생성",
      "기본 편집 도구",
      "커뮤니티 접근"
    ]
  },
  {
    name: "Pro",
    price: "₩19,900",
    period: "월",
    features: [
      "고급 AI 모델 사용",
      "무제한 이미지 생성",
      "고급 편집 도구",
      "우선 순위 지원",
      "실시간 협업 기능",
      "API 액세스"
    ],
    recommended: true
  }
]; 