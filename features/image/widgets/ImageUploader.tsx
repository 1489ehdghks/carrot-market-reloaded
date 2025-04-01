import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/widgets/elements/sub/button';
import { useNotification } from '@/widgets/shared/custom-notification';

interface ImageUploaderProps {
  onImageUploaded: (file: File, previewUrl: string) => void;
  isDisabled?: boolean;
  maxSize?: number; // MB 단위
  accept?: string;
}

export default function ImageUploader({
  onImageUploaded,
  isDisabled = false,
  maxSize = 5,
  accept = 'image/*'
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { showNotification } = useNotification();

  const handleFile = useCallback((file: File) => {
    // 파일 크기 체크
    if (file.size > maxSize * 1024 * 1024) {
      showNotification({
        title: '파일 크기 초과',
        message: `파일 크기는 ${maxSize}MB를 초과할 수 없습니다.`,
        type: 'error',
      });
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      showNotification({
        title: '잘못된 파일 형식',
        message: '이미지 파일만 업로드 가능합니다.',
        type: 'error',
      });
      return;
    }

    // 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    onImageUploaded(file, previewUrl);
  }, [maxSize, onImageUploaded, showNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-700 hover:border-neutral-600'}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isDisabled && document.getElementById('image-upload')?.click()}
    >
      <input
        id="image-upload"
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={isDisabled}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-neutral-400" />
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-200">
            이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-neutral-400">
            최대 {maxSize}MB, PNG, JPG, JPEG, WEBP
          </p>
        </div>
      </div>
    </div>
  );
} 