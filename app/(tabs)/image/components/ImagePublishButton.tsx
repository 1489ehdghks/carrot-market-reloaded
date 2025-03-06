"use client";

import { useState } from "react";
import { publishImage } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ImagePublishButtonProps {
  imageId: string | null;
}

export default function ImagePublishButton({ imageId }: ImagePublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const router = useRouter();
  
  const handlePublish = async () => {
    if (!imageId) {
      toast.error("유효하지 않은 이미지입니다.");
      return;
    }
    
    setIsPublishing(true);
    try {
      const result = await publishImage(Number(imageId));
      
      if (!result.isPublic) {
        throw new Error("이미지 공개 처리에 실패했습니다.");
      }
      
      toast.success("이미지가 성공적으로 공개되었습니다!");
      router.refresh();
    } catch (error) {
      console.error("이미지 공개 실패:", error);
      toast.error(error instanceof Error ? error.message : "이미지 공개 중 오류가 발생했습니다.");
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing || !imageId}
      className={`
        px-4 py-2.5 rounded-lg font-medium transition-all duration-200
        ${isPublishing || !imageId 
          ? 'bg-neutral-700 cursor-not-allowed opacity-50' 
          : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
        }
      `}
    >
      {isPublishing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          처리 중...
        </div>
      ) : (
        "공개하기"
      )}
    </button>
  );
} 