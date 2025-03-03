"use client";

import { PostType, PostCategory } from "../actions";
import { CustomTooltip } from "@/components/ui/custom-tooltip";

interface PostFilterProps {
  type?: PostType;
  onTypeChange: (type: PostType) => void;
  category?: PostCategory;
  onCategoryChange: (category: PostCategory) => void;
  showAdult: boolean;
  onShowAdultChange: (show: boolean) => void;
  isAdmin?: boolean;
  mode?: "write" | "view";
}

const postTypes = [
  { value: "general", label: "일반", description: "일상적인 대화와 소통을 위한 공간" },
  { value: "notice", label: "공지", description: "공지사항을 위한 공간", adminOnly: true },
  { value: "question", label: "질문", description: "질문을 위한 공간" },
  { value: "info", label: "정보", description: "유용한 팁과 노하우를 공유하는 공간" },
  { value: "resource", label: "자료", description: "프롬프트, 설정 파일 등을 공유하는 공간" },
];

const categories = [
  { value: "general", label: "일반", description: "잡담을 위한 공간" },
  { value: "2d", label: "2D", description: "애니메이션, 2D 일러스트레이션을 위한 공간" },
  { value: "2.5d", label: "반실사", description: "반실사를 위한 공간" },
  { value: "realistic", label: "실사", description: "현실적이고 사실적인 이미지를 위한 공간" },
  { value: "other", label: "특수", description: "퍼리 등 다양한 세계관을 위한 공간" },
];

const tabStyles = {
  base: "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
  active: "bg-gradient-to-r from-neutral-700 to-neutral-800 text-white shadow-inner",
  inactive: "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
};

export default function PostFilter({ 
  type = "general", 
  onTypeChange, 
  category = "general", 
  onCategoryChange, 
  showAdult, 
  onShowAdultChange, 
  isAdmin,
  mode = "view"
}: PostFilterProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 게시글 유형 & 카테고리를 하나의 필터 그룹으로 */}
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-medium text-neutral-400">type</h3>
          <div className="flex flex-wrap gap-2">
            {postTypes.map(({ value, label, description, adminOnly }) => {
              if (mode === "write" && adminOnly && !isAdmin) return null;
              
              return (
                <CustomTooltip key={value} title={label} content={description}>
                  <button
                    onClick={() => onTypeChange(value as PostType)}
                    className={`${tabStyles.base} ${
                      type === value ? tabStyles.active : tabStyles.inactive
                    }`}
                  >
                    {label}
                  </button>
                </CustomTooltip>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(({ value, label, description }) => (
              <CustomTooltip key={value} title={label} content={description}>
                <button
                  onClick={() => onCategoryChange(value as PostCategory)}
                  className={`${tabStyles.base} ${
                    category === value ? tabStyles.active : tabStyles.inactive
                  }`}
                >
                  {label}
                </button>
              </CustomTooltip>
            ))}
          </div>
        </div>

        {/* NSFW 토글을 오른쪽으로 */}
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showAdult}
              onChange={(e) => onShowAdultChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            <span className="ml-3 text-sm font-medium text-neutral-400">
              {showAdult ? 'NSFW 컨텐츠 표시중' : 'NSFW 컨텐츠 숨김'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
} 