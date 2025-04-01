import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/widgets/elements/sub/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/widgets/ui/form/label';
import { Switch } from '@/components/ui/form/switch';
import { useNotification } from '@/widgets/shared/custom-notification';

interface PublishDialogProps {
  imageId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PublishDialog({
  imageId,
  isOpen,
  onOpenChange
}: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const { showNotification } = useNotification();

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      
      // TODO: API 호출 구현
      await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이
      
      showNotification({
        title: '공유 완료',
        message: '이미지가 성공적으로 공유되었습니다.',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('공유 중 오류:', error);
      showNotification({
        title: '공유 실패',
        message: '이미지 공유 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이미지 공유</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이미지 제목을 입력하세요"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이미지에 대한 설명을 입력하세요"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="public">공개 설정</Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            취소
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !title.trim()}
          >
            {isPublishing ? '공유 중...' : '공유하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 