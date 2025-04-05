'use client';

import React from 'react';
import Image from 'next/image';
import { CustomCard, CustomCardContent, CustomCardFooter, CustomCardHeader, CustomCardTitle } from '@/widgets/elements/custom-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/widgets/shared/custom-tabs';
import { Button } from '@/widgets/elements/sub/button';
import { ClipboardIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ImageSettings {
  prompt: string;
  negativePrompt?: string;
  model: string;
  size: string;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae?: string;
}

interface ImageDetailProps {
  image: {
    id: number;
    title: string;
    fileUrl: string;
    thumbnailUrl?: string;
    settings: ImageSettings;
    createdAt: string;
  };
}

export default function ImageDetailForm({ image }: ImageDetailProps) {
  // 텍스트 복사 함수
  const copyToClipboard = (text: string, message: string = '텍스트가 복사되었습니다') => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error('복사에 실패했습니다'));
  };

  // 시간 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 이미지 표시 영역 */}
      <div className="lg:col-span-7">
        <CustomCard className="overflow-hidden border-neutral-800 bg-neutral-900">
          <CustomCardContent className="p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={image.fileUrl}
                alt={image.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </CustomCardContent>
          <CustomCardFooter className="flex items-center justify-between bg-neutral-800/50 p-4">
            <div>
              <h3 className="font-medium text-lg">{image.title}</h3>
              <p className="text-sm text-neutral-400">{formatDate(image.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = image.fileUrl;
                  link.download = `${image.title || 'image'}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success('이미지 다운로드가 시작되었습니다');
                }}
                className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              >
                <Download className="w-4 h-4 mr-2" />
                다운로드
              </Button>
            </div>
          </CustomCardFooter>
        </CustomCard>
      </div>
      
      {/* 이미지 설정 표시 영역 */}
      <div className="lg:col-span-5">
        <CustomCard className="border-neutral-800 bg-neutral-900">
          <CustomCardHeader>
            <CustomCardTitle>이미지 설정 정보</CustomCardTitle>
          </CustomCardHeader>
          <CustomCardContent>
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="prompt">프롬프트</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prompt" className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-300">프롬프트</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(image.settings.prompt, '프롬프트가 복사되었습니다')}
                      className="h-6 px-2 text-xs"
                    >
                      <ClipboardIcon className="w-3 h-3 mr-1" />
                      복사
                    </Button>
                  </div>
                  <div className="bg-neutral-800 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {image.settings.prompt}
                  </div>
                </div>
                
                {image.settings.negativePrompt && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-neutral-300">네거티브 프롬프트</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(image.settings.negativePrompt || '', '네거티브 프롬프트가 복사되었습니다')}
                        className="h-6 px-2 text-xs"
                      >
                        <ClipboardIcon className="w-3 h-3 mr-1" />
                        복사
                      </Button>
                    </div>
                    <div className="bg-neutral-800 rounded-md p-3 text-sm whitespace-pre-wrap">
                      {image.settings.negativePrompt}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400 mb-1">모델</h3>
                    <p className="text-sm">{image.settings.model}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400 mb-1">크기</h3>
                    <p className="text-sm">{image.settings.size}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400 mb-1">스텝 수</h3>
                    <p className="text-sm">{image.settings.steps}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400 mb-1">CFG 스케일</h3>
                    <p className="text-sm">{image.settings.cfgScale}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400 mb-1">샘플러</h3>
                    <p className="text-sm">{image.settings.sampler}</p>
                  </div>
                  {image.settings.vae && image.settings.vae !== 'default' && (
                    <div>
                      <h3 className="text-xs font-medium text-neutral-400 mb-1">VAE</h3>
                      <p className="text-sm">{image.settings.vae}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CustomCardContent>
        </CustomCard>
      </div>
    </div>
  );
} 