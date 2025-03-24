'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ClipboardIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/dataDisplay/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/dataDisplay/tabs';
import { useRouter } from 'next/navigation';
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

interface AIImageDetailProps {
  image: {
    id: number;
    title: string;
    fileUrl: string;
    thumbnailUrl?: string;
    settings: ImageSettings;
    createdAt: string;
  };
}

export default function AIImageDetail({ image }: AIImageDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const router = useRouter();
  
  // 이미지 다운로드 함수
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // 이미지 URL에서 파일 다운로드
      const response = await fetch(image.fileUrl);
      if (!response.ok) {
        throw new Error('이미지를 불러오는데 실패했습니다');
      }
      
      const blob = await response.blob();
      
      // 다운로드 링크 생성
      const fileName = `${image.title || 'ai-image'}_${Date.now()}.${selectedFormat}`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // 리소스 정리
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success("이미지가 다운로드되었습니다");
    } catch (error: any) {
      console.error("이미지 다운로드 오류:", error);
      toast.error(error.message || "이미지 다운로드에 실패했습니다");
    } finally {
      setIsDownloading(false);
    }
  };
  
  // 텍스트 복사 함수
  const copyToClipboard = (text: string, message: string = '텍스트가 복사되었습니다') => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error('복사에 실패했습니다'));
  };
  
  // 이미지 편집하기 함수
  const handleEditImage = () => {
    // 설정을 로컬 스토리지에 저장
    if (image.settings.prompt) localStorage.setItem('textPrompt', image.settings.prompt);
    if (image.settings.negativePrompt) localStorage.setItem('negativePrompt', image.settings.negativePrompt);
    if (image.settings.size) localStorage.setItem('size', image.settings.size);
    if (image.settings.model) localStorage.setItem('model', image.settings.model);
    if (image.settings.steps) localStorage.setItem('steps', image.settings.steps.toString());
    if (image.settings.cfgScale) localStorage.setItem('cfgScale', image.settings.cfgScale.toString());
    if (image.settings.sampler) localStorage.setItem('sampler', image.settings.sampler);
    if (image.settings.vae) localStorage.setItem('vae', image.settings.vae);
    
    // 이미지 생성 페이지로 이동
    router.push('/image');
    toast.success('이미지 설정이 적용되었습니다');
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
        <Card className="overflow-hidden border-neutral-800 bg-neutral-900">
          <CardContent className="p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={image.fileUrl}
                alt={image.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between bg-neutral-800/50 p-4">
            <div>
              <h3 className="font-medium text-lg">{image.title}</h3>
              <p className="text-sm text-neutral-400">{formatDate(image.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {isDownloading ? '다운로드 중...' : '다운로드'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditImage}
                className="bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border-blue-800"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                설정 적용
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* 이미지 설정 표시 영역 */}
      <div className="lg:col-span-5">
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>이미지 설정 정보</CardTitle>
          </CardHeader>
          <CardContent>
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
                
                <div className="pt-4">
                  <Button 
                    onClick={handleEditImage}
                    className="w-full bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border-blue-800"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    이 설정으로 새 이미지 생성하기
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 