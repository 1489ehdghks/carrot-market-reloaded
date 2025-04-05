/**
 * LoRA(Low-Rank Adaptation) 정의 파일
 * 특정 스타일이나 컨셉을 이미지에 적용하는 어댑터입니다.
 */

/**
 * LoRA 옵션 인터페이스
 */
export interface LoraOption {
  id: string;           // 시스템 내부에서 사용할 고유 ID
  name: string;         // 사용자에게 표시할 이름
  description: string;  // 설명
  preview?: string;     // 미리보기 이미지 URL (선택사항)
  strength: number;     // 기본 강도 (0.0 ~ 1.0)
  category: 'style' | 'character' | 'concept' | 'object' | 'other';  // 카테고리
  modelCompatibility: string[];  // 호환되는 모델 ID 목록
  triggerWords?: string[];  // 자동으로 프롬프트에 추가될 트리거 단어 (선택사항)
  nsfw?: boolean;       // 성인 콘텐츠 여부 (선택사항)
}

/**
 * 선택된 LoRA 인터페이스
 */
export interface SelectedLora {
  id: string;         // LoRA ID
  strength: number;   // 적용 강도 (0.0 ~ 1.0)
}

/**
 * 사용 가능한 LoRA 옵션 목록
 */
export const LORA_OPTIONS: LoraOption[] = [
  // 스타일 LoRA
  {
    id: "anime-style",
    name: "애니메이션 스타일",
    description: "일본식 애니메이션 스타일로 변환합니다",
    preview: "/loras/anime-style.jpg",
    strength: 0.7,
    category: 'style',
    modelCompatibility: ["stable-diffusion", "Pony-Realism-v2.2", "dreamshaper", "realistic-vision-v5.1", "pony-nai3"],
    triggerWords: ["anime style", "anime art", "2D illustration"]
  },
  {
    id: "watercolor",
    name: "수채화",
    description: "수채화 스타일로 이미지를 생성합니다",
    preview: "/loras/watercolor.jpg",
    strength: 0.8,
    category: 'style',
    modelCompatibility: ["stable-diffusion", "Pony-Realism-v2.2", "dreamshaper", "realistic-vision-v5.1"],
    triggerWords: ["watercolor painting", "watercolor", "wet media"]
  },
  {
    id: "vaporwave",
    name: "베이퍼웨이브",
    description: "80-90년대 향수를 불러일으키는 레트로 미학 스타일",
    preview: "/loras/vaporwave.jpg",
    strength: 0.75,
    category: 'style',
    modelCompatibility: ["stable-diffusion", "dreamshaper", "pony-nai3"],
    triggerWords: ["vaporwave", "retrowave", "80s aesthetic", "neon", "glitch art"]
  },
  
  // 캐릭터 LoRA
  {
    id: "chibi-character",
    name: "치비 캐릭터",
    description: "귀여운 미니어처 캐릭터 스타일",
    preview: "/loras/chibi.jpg",
    strength: 0.8,
    category: 'character',
    modelCompatibility: ["pony-nai3", "dreamshaper"],
    triggerWords: ["chibi", "cute", "small character", "mini character"]
  },
  {
    id: "realistic-portrait",
    name: "사실적 인물",
    description: "사실적인 인물 디테일을 향상시킵니다",
    preview: "/loras/realistic-portrait.jpg",
    strength: 0.6,
    category: 'character',
    modelCompatibility: ["realistic-vision-v5.1", "Pony-Realism-v2.2"],
    triggerWords: ["detailed face", "photorealistic person", "lifelike features"]
  },
  
  // 컨셉 LoRA
  {
    id: "cyberpunk",
    name: "사이버펑크",
    description: "하이테크, 로우 라이프 사이버펑크 세계관",
    preview: "/loras/cyberpunk.jpg",
    strength: 0.75,
    category: 'concept',
    modelCompatibility: ["stable-diffusion", "Pony-Realism-v2.2", "realistic-vision-v5.1", "dreamshaper"],
    triggerWords: ["cyberpunk", "neon city", "dystopian future", "cybernetics"]
  },
  {
    id: "fantasy-landscape",
    name: "판타지 풍경",
    description: "판타지 세계의 풍경을 생성합니다",
    preview: "/loras/fantasy-landscape.jpg",
    strength: 0.8,
    category: 'concept',
    modelCompatibility: ["stable-diffusion", "Pony-Realism-v2.2", "dreamshaper"],
    triggerWords: ["fantasy landscape", "magical scene", "epic vista"]
  },
  
  // 오브젝트 LoRA
  {
    id: "detailed-eyes",
    name: "상세한 눈",
    description: "더 사실적이고 상세한 눈 표현",
    preview: "/loras/detailed-eyes.jpg",
    strength: 0.5,
    category: 'object',
    modelCompatibility: ["realistic-vision-v5.1", "Pony-Realism-v2.2", "pony-nai3"],
    triggerWords: ["detailed eyes", "realistic eyes", "intricate iris"]
  },
  {
    id: "mecha",
    name: "메카닉 디자인",
    description: "로봇과 기계적 요소를 향상시킵니다",
    preview: "/loras/mecha.jpg",
    strength: 0.7,
    category: 'object',
    modelCompatibility: ["dreamshaper", "stable-diffusion", "realistic-vision-v5.1"],
    triggerWords: ["mecha", "mechanical", "robot", "detailed machinery"]
  },
  
  // 성인 콘텐츠 LoRA (nsfw 플래그 포함)
  {
    id: "nsfw-enhancement",
    name: "성인 콘텐츠 향상",
    description: "성인 콘텐츠의 품질을 향상시킵니다",
    preview: "/loras/nsfw-placeholder.jpg", // 적절한 자리 표시자 사용
    strength: 0.6,
    category: 'other',
    modelCompatibility: ["Pony-Realism-v2.2", "realistic-vision-v5.1"],
    nsfw: true,
    triggerWords: ["nsfw", "mature content"]
  }
];

/**
 * LoRA ID로 LoRA 옵션을 찾는 헬퍼 함수
 */
export function getLoraById(id: string): LoraOption | undefined {
  return LORA_OPTIONS.find(lora => lora.id === id);
}

/**
 * 모델 ID와 호환되는 모든 LoRA를 찾는 헬퍼 함수
 */
export function getCompatibleLoras(modelId: string): LoraOption[] {
  return LORA_OPTIONS.filter(lora => 
    lora.modelCompatibility.includes(modelId)
  );
}

/**
 * 카테고리별로 LoRA를 필터링하는 헬퍼 함수
 */
export function getLorasByCategory(category: LoraOption['category']): LoraOption[] {
  return LORA_OPTIONS.filter(lora => lora.category === category);
} 