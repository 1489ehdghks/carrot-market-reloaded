import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/widgets/elements/sub/button';
import { downloadImage } from '../utils/download';
import { useNotification } from '@/widgets/shared/custom-notification';

interface DownloadButtonProps {
  imageUrl: string;
  filename?: string;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
  quality?: number;
  className?: string;
}

export function DownloadButton({
  imageUrl,
  filename,
  format = 'png',
  quality = 0.9,
  className
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showNotification } = useNotification();

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadImage(imageUrl, { filename, format, quality });
      showNotification({
        title: '다운로드 완료',
        message: '이미지가 성공적으로 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('다운로드 중 오류:', error);
      showNotification({
        title: '다운로드 실패',
        message: '이미지 다운로드 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {isDownloading ? '다운로드 중...' : '다운로드'}
    </Button>
  );
} 