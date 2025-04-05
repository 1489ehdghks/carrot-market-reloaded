import { SparklesIcon } from "lucide-react";
import Image from "next/image";

interface EmptyImageStateProps {
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export default function EmptyImageState({ 
  showUploadButton = false,
  onUploadClick
}: EmptyImageStateProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 p-6">
      <div className="w-80 h-80 relative">
        <Image
          src="/image/no-image.png"
          alt="이미지 생성 전"
          fill
          className="object-contain opacity-80"
          priority
        />
      </div>
      
      <div className="text-center space-y-2">
        {showUploadButton && (
          <div className="pt-6">
            <button
              onClick={onUploadClick}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium text-white transition-colors"
            >
              이미지 업로드
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 