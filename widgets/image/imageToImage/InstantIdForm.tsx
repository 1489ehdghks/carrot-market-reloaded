"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/widgets/elements/sub/button';
import { CollapsiblePanel } from '../shared/CollapsiblePanel';
import PromptTextarea from '../shared/PromptTextarea';
import ImageUploader from '../../shared/custom-ImageUploader';
import { ModelParamsConfig } from '../shared/ModelParamsConfig';
import { INSTANTID_MODEL } from '../../../shared/models/image/model-params';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';

// 이미지 업로드 함수
async function uploadImage(file: File): Promise<{ url: string, key: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/features/image/api/image-upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이미지 업로드에 실패했습니다');
    }
    
    const data = await response.json();
    return { url: data.url, key: data.key };
  } catch (error: any) {
    throw new Error(`이미지 업로드 오류: ${error.message}`);
  }
}

export default function InstantIdForm() {
  const router = useRouter();
  
  // 상태 관리
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string>('');
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string>('');
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(768);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 모델 매개변수 상태
  const [modelParams, setModelParams] = useState<Record<string, any>>({});
  
  // 초기 매개변수 설정
  useEffect(() => {
    const initialParams: Record<string, any> = {};
    INSTANTID_MODEL.params.forEach(param => {
      initialParams[param.name] = param.default;
    });
    setModelParams(initialParams);
  }, []);
  
  // 이미지 크기 옵션
  const sizeOptions = useMemo(() => [
    { value: '512x512', label: '512 x 512' },
    { value: '768x768', label: '768 x 768' },
    { value: '1024x1024', label: '1024 x 1024' },
    { value: '768x1024', label: '768 x 1024' },
    { value: '1024x768', label: '1024 x 768' }
  ], []);
  
  // 이미지 크기 변경 처리
  const handleSizeChange = (sizeStr: string) => {
    const [w, h] = sizeStr.split('x').map(Number);
    setWidth(w);
    setHeight(h);
  };
  
  // 얼굴 이미지 업로드 처리
  const handleFaceImageUpload = (file: File, previewUrl: string) => {
    setFaceImage(file);
    setFaceImagePreview(previewUrl);
  };
  
  // 얼굴 이미지 제거
  const handleClearFaceImage = () => {
    if (faceImagePreview) {
      URL.revokeObjectURL(faceImagePreview);
    }
    setFaceImage(null);
    setFaceImagePreview('');
  };
  
  // 소스 이미지 업로드 처리
  const handleSourceImageUpload = (file: File, previewUrl: string) => {
    setSourceImage(file);
    setSourceImagePreview(previewUrl);
  };
  
  // 소스 이미지 제거
  const handleClearSourceImage = () => {
    if (sourceImagePreview) {
      URL.revokeObjectURL(sourceImagePreview);
    }
    setSourceImage(null);
    setSourceImagePreview('');
  };
  
  // 매개변수 변경 처리
  const handleParamChange = (name: string, value: any) => {
    setModelParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 이미지 생성 처리
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('프롬프트를 입력해주세요');
      return;
    }
    
    if (!faceImage) {
      toast.error('얼굴 참조 이미지를 업로드해주세요');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadingStatus('이미지 업로드 중...');
      
      // 얼굴 이미지 업로드
      const faceImageData = await uploadImage(faceImage);
      
      // 소스 이미지 업로드 (있는 경우)
      let sourceImageData = null;
      if (sourceImage) {
        setLoadingStatus('소스 이미지 업로드 중...');
        sourceImageData = await uploadImage(sourceImage);
      }
      
      // API 요청 데이터 준비
      const requestData: Record<string, any> = {
        prompt: prompt,
        negative_prompt: negativePrompt,
        face_image_url: faceImageData.url,
        width: width,
        height: height,
        seed: Math.floor(Math.random() * 2147483647)
      };
      
      // 소스 이미지가 있는 경우 추가
      if (sourceImageData) {
        requestData.image_url = sourceImageData.url;
      }
      
      // 모델 매개변수 추가
      Object.entries(modelParams).forEach(([key, value]) => {
        requestData[key] = value;
      });
      
      // InstantID API 호출
      setLoadingStatus('얼굴 특성 추출 중...');
      const response = await fetch('/api/image-to-image/instant-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '이미지 생성에 실패했습니다');
      }
      
      setLoadingStatus('이미지 생성 완료!');
      const data = await response.json();
      
      // 생성된 이미지 페이지로 이동
      router.push(`/image/view/${data.id}`);
      
    } catch (error: any) {
      toast.error(`오류: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 프롬프트 입력 */}
      <PromptTextarea
        prompt={prompt}
        negativePrompt={negativePrompt}
        onPromptChange={setPrompt}
        onNegativePromptChange={setNegativePrompt}
      />
      
      {/* 얼굴 이미지 업로드 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">얼굴 참조 이미지</h3>
          <CustomTooltip 
            title="얼굴 참조 이미지"
            content="대상 얼굴의 특성을 추출할 참조 이미지입니다. 얼굴이 명확히 보이는 사진을 사용하세요."
          >
            <div className="text-sm text-neutral-400 cursor-help">?</div>
          </CustomTooltip>
        </div>
        
        {faceImagePreview ? (
          <div className="relative">
            <img
              src={faceImagePreview}
              alt="Face Reference"
              className="w-full h-48 object-contain border border-neutral-800 rounded-md"
            />
            <button
              onClick={handleClearFaceImage}
              className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black/90"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        ) : (
          <ImageUploader onImageUploaded={handleFaceImageUpload} isDisabled={isLoading} />
        )}
      </div>
      
      {/* 소스 이미지 업로드 (선택사항) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">소스 이미지 (선택사항)</h3>
          <CustomTooltip 
            title="소스 이미지"
            content="얼굴 특성을 적용할 기본 이미지입니다. 제공하지 않으면 프롬프트에 따라 새 이미지가 생성됩니다."
          >
            <div className="text-sm text-neutral-400 cursor-help">?</div>
          </CustomTooltip>
        </div>
        
        {sourceImagePreview ? (
          <div className="relative">
            <img
              src={sourceImagePreview}
              alt="Source Image"
              className="w-full h-48 object-contain border border-neutral-800 rounded-md"
            />
            <button
              onClick={handleClearSourceImage}
              className="absolute top-2 right-2 bg-black/70 p-1 rounded-full hover:bg-black/90"
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          </div>
        ) : (
          <ImageUploader onImageUploaded={handleSourceImageUpload} isDisabled={isLoading} />
        )}
      </div>
      
      {/* 고급 설정 패널 */}
      <CollapsiblePanel title="고급 설정" defaultOpen={false}>
        <div className="space-y-4">
          {/* 이미지 크기 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">이미지 크기</label>
            <select
              value={`${width}x${height}`}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-full p-2 rounded-md bg-neutral-800 border border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
              disabled={isLoading}
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 매개변수 설정 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">모델 매개변수</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-neutral-400 hover:text-white"
              >
                {showAdvanced ? '기본 설정만 보기' : '고급 설정 보기'}
              </button>
            </div>
            
            <ModelParamsConfig
              model={INSTANTID_MODEL}
              params={modelParams}
              onChange={handleParamChange}
              showAdvanced={showAdvanced}
            />
          </div>
        </div>
      </CollapsiblePanel>
      
      {/* 이미지 생성 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim() || !faceImage}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-2 rounded-md"
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin mr-2" />
              {loadingStatus || '이미지 생성 중...'}
            </>
          ) : (
            <>
              <PlusCircle size={18} className="mr-2" />
              이미지 생성하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 