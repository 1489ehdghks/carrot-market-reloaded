"use client";

import React, { useState } from 'react';
import { 
  CustomDialog as Dialog, 
  CustomDialogContent as DialogContent, 
  CustomDialogHeader as DialogHeader, 
  CustomDialogTitle as DialogTitle, 
  CustomDialogDescription as DialogDescription,
  CustomDialogFooter as DialogFooter
} from '@/widgets/shared/custom-dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/widgets/elements/sub/button';
import { CustomInput } from '@/widgets/elements/custom-input';
import { CustomLabel } from '@/widgets/elements/custom-label';
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectGroup,
  CustomSelectItem, 
  CustomSelectLabel,
  CustomSelectTrigger, 
  CustomSelectValue,
  CustomSelectSeparator
} from '@/widgets/elements/custom-select';
import { toast } from 'sonner';
import { publishImageWithTitle } from '@/app/(tabs)/image/actions';
import { 
  IMAGE_CATEGORIES, 
  ImageCategory, 
  IMAGE_CATEGORY_GROUPS,
  getAllCategoryGroups
} from '@/shared/constants/imageCategories';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';
import { AlertCircle, Info, Lock, Image as ImageIcon, EyeOff } from 'lucide-react';

interface PublishDialogProps {
  imageId: number | string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (imageId: number, title: string, category: ImageCategory) => void;
  defaultCategory?: ImageCategory;
  imageUrl?: string;
}

export default function PublishDialog({ 
  imageId, 
  isOpen, 
  onOpenChange,
  onSuccess,
  defaultCategory = '2d',
  imageUrl
}: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ImageCategory>(defaultCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  
  // 카테고리 그룹 정보 가져오기
  const categoryGroups = getAllCategoryGroups();

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
      const imageIdNum = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId;
      // 카테고리 정보와 성인 콘텐츠 여부를 추가하여 API 호출
      const result = await publishImageWithTitle(imageIdNum, title, category, isAdult);
      
      if (result.success) {
        toast.success('이미지가 성공적으로 공개되었습니다');
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(imageIdNum, title, category);
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle('');
      setCategory(defaultCategory);
      setIsAdult(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800 text-white max-w-xl">
        <div className="absolute inset-0 rounded-lg overflow-hidden z-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-300/20"></div>
        </div>
        
        <DialogHeader className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="h-5 w-5 text-orange-500" />
            <DialogTitle className="text-xl font-bold text-gradient bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">이미지 공개하기</DialogTitle>
          </div>
          <DialogDescription className="text-neutral-400">
            이미지를 공개하면 다른 사용자들이 볼 수 있습니다. 적절한 제목과 카테고리를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        {imageUrl && (
          <div className="mb-4 flex justify-center relative z-10">
            <div className="relative rounded-lg overflow-hidden w-full max-w-xs shadow-lg border border-neutral-800">
              <img 
                src={imageUrl} 
                alt="공유할 이미지" 
                className="w-full h-auto object-contain"
                style={{ maxHeight: '200px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CustomLabel htmlFor="title" className="text-white font-medium">이미지 제목</CustomLabel>
              <CustomTooltip 
                title="이미지 제목" 
                description="다른 사용자들이 검색하고 찾을 수 있는 이미지 제목을 입력하세요. 제목은 최대 100자까지 입력할 수 있습니다."
              >
                <Info className="h-4 w-4 text-neutral-500" />
              </CustomTooltip>
            </div>
            <CustomInput 
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="이미지 제목을 입력하세요"
              className="bg-neutral-800/80 border-neutral-700 focus:border-orange-500 text-white transition-colors"
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CustomLabel htmlFor="category" className="text-white font-medium">카테고리</CustomLabel>
              <CustomTooltip 
                title="카테고리 선택" 
                description="이미지의 적절한 카테고리를 선택하세요. 올바른 카테고리를 선택하면 검색이 용이해집니다."
              >
                <Info className="h-4 w-4 text-neutral-500" />
              </CustomTooltip>
            </div>
            <CustomSelect 
              value={category} 
              onValueChange={(value: ImageCategory) => setCategory(value)}
            >
              <CustomSelectTrigger 
                id="category"
                className="w-full bg-neutral-800/80 border-neutral-700 focus:border-orange-500 hover:border-orange-500 text-white transition-colors"
                disabled={isSubmitting}
              >
                <CustomSelectValue placeholder="카테고리 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent className="bg-neutral-800 border-neutral-700 text-white">
                {categoryGroups.map((group, groupIndex) => (
                  <React.Fragment key={group.group}>
                    {groupIndex > 0 && <CustomSelectSeparator className="bg-neutral-700" />}
                    <CustomSelectGroup>
                      <CustomSelectLabel className="text-neutral-400">
                        {group.group === 'STYLE' ? '스타일' : 
                         group.group === 'SUBJECT' ? '주제' : '기타'}
                      </CustomSelectLabel>
                      {group.categories.map((cat) => (
                        <CustomSelectItem 
                          key={cat.id} 
                          value={cat.id}
                          className="hover:bg-neutral-700 focus:bg-neutral-700 text-white"
                        >
                          {cat.name}
                          {cat.description && (
                            <span className="text-xs text-neutral-400 ml-2">
                              {cat.description}
                            </span>
                          )}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectGroup>
                  </React.Fragment>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="relative mt-1">
              <input
                type="checkbox"
                id="isAdult"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="sr-only peer"
              />
              <label
                htmlFor="isAdult"
                className="flex w-11 h-6 bg-neutral-700 rounded-full cursor-pointer transition-colors
                       peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                       after:bg-white after:border-neutral-300 after:border after:rounded-full 
                       after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
              ></label>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <CustomLabel htmlFor="isAdult" className="text-white font-medium cursor-pointer flex items-center gap-1.5">
                  <EyeOff className="h-4 w-4 text-red-500" />
                  성인 콘텐츠
                </CustomLabel>
                <CustomTooltip 
                  title="성인 콘텐츠 설정" 
                  description="이 이미지가 성인 콘텐츠인 경우 체크하세요. 선택하면 성인 인증된 사용자에게만 표시됩니다."
                >
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CustomTooltip>
              </div>
              <p className="text-xs text-neutral-500">성인 콘텐츠는 만 19세 이상의 사용자에게만 표시됩니다.</p>
            </div>
          </div>
          
          <DialogFooter className="pt-2 gap-2">
            <DialogPrimitive.Close asChild>
              <Button 
                type="button" 
                variant="ghost"
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </Button>
            </DialogPrimitive.Close>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  처리 중...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  공개하기
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 