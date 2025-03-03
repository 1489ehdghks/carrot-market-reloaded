"use client";

import Image from "next/image";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import ImagePublishButton from "./ImagePublishButton";

interface GeneratedImageProps {
  imageUrl: string;
  imageId: number | null;
  onReset: () => void;
}

export default function GeneratedImage({ imageUrl, imageId, onReset }: GeneratedImageProps) {
  if (!imageUrl) return null;
  
  return (
    <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">생성된 이미지</h2>
      </div>
      
      <div className="relative aspect-square w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto rounded-lg overflow-hidden shadow-lg">
        <Image
          src={imageUrl}
          alt="생성된 이미지"
          fill
          className="object-contain"
        />
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <a
          href={imageUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          다운로드
        </a>
        
        <CustomTooltip
          title="이미지 공개하기"
          description="이미지를 갤러리에 공개하면 다른 사용자들이 볼 수 있습니다. 공개된 이미지는 영구적으로 저장됩니다."
          content={
            <div>
              <p className="text-sm text-neutral-400">- 공개된 이미지는 모든 사용자에게 노출됩니다</p>
              <p className="text-sm text-neutral-400">- 이미지 URL이 영구적으로 저장됩니다</p>
              <p className="text-sm text-neutral-400">- 한번 공개된 이미지는 비공개로 전환할 수 없습니다</p>
            </div>
          }
        >
          <div>
            <ImagePublishButton imageId={imageId} />
          </div>
        </CustomTooltip>
      </div>
    </div>
  );
} 