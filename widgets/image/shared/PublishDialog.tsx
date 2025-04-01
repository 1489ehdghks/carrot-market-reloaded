"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/widgets/elements/sub/button';
import { Input } from '@/components/ui/form/input';
import { Label } from '@/components/ui/form/label';
import { toast } from 'sonner';
import { publishImageWithTitle } from '../../actions';

interface PublishDialogProps {
  imageId: number | string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (imageId: number, title: string) => void;
}

export default function PublishDialog({ 
  imageId, 
  isOpen, 
  onOpenChange,
  onSuccess
}: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!imageId) {
      toast.error('이미지 ID가 없습니다');
      return;
    }
    
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 이미지 ID를 숫자로 변환
      const imageIdNum = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId;
      
      // 이미지 공개 및 제목 업데이트
      const result = await publishImageWithTitle(imageIdNum, title);
      
      if (result.success) {
        toast.success('이미지가 성공적으로 공개되었습니다');
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(imageIdNum, title);
        }
      } else {
        throw new Error(result.error || '이미지 공개에 실패했습니다');
      }
    } catch (error) {
      console.error('이미지 공개 오류:', error);
      toast.error(error instanceof Error ? error.message : '이미지 공개 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 다이얼로그가 닫힐 때 상태 초기화
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">이미지 공개하기</DialogTitle>
          <DialogDescription className="text-neutral-400">
            이미지를 공개하면 다른 사용자들이 볼 수 있습니다. 이미지에 적절한 제목을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">이미지 제목</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="이미지 제목을 입력하세요"
              className="bg-neutral-800 border-neutral-700 text-white"
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>
          
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="ghost"
                className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                disabled={isSubmitting}
              >
                취소
              </Button>
            </DialogClose>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  처리 중...
                </>
              ) : (
                '공개하기'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 