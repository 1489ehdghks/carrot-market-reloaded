import { ImageIcon } from 'lucide-react';

export default function EmptyImageState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
        <ImageIcon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-200 mb-2">이미지가 없습니다</h3>
      <p className="text-sm text-neutral-400">
        이미지를 생성하거나 업로드하여 시작하세요
      </p>
    </div>
  );
} 