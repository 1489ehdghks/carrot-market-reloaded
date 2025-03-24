import { SparklesIcon } from "lucide-react";

interface EmptyImageStateProps {
  message?: string;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

export default function EmptyImageState({ 
  message = "이미지를 생성해 보세요!", 
  showUploadButton = false,
  onUploadClick
}: EmptyImageStateProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 p-6">
      <div className="w-32 h-32 mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-600 rounded-full opacity-20 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <SparklesIcon className="h-16 w-16 text-orange-400" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-white">{message}</h3>
        <p className="text-neutral-400 text-sm max-w-md">
          왼쪽에서 원하는 프롬프트를 입력하고 이미지를 생성해보세요. 
          AI가 당신의 상상을 현실로 만들어드립니다!
        </p>
        
        {/* 귀여운 캐릭터 */}
        <div className="pt-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden">
              <div className="w-10 h-5 bg-white rounded-full absolute top-5" />
              <div className="flex mt-8 space-x-6">
                <div className="w-2.5 h-2.5 bg-black rounded-full" />
                <div className="w-2.5 h-2.5 bg-black rounded-full" />
              </div>
            </div>
            <div className="absolute top-1 right-0 w-3 h-3 bg-orange-300 rounded-full animate-bounce" />
            <div className="absolute top-2 left-0 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-0 right-2 w-4 h-4 bg-orange-300 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>
        
        
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