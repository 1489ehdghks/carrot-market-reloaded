"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateImageWithText, getImageUploadUrl, saveGeneratedImage, permanentlyStoreAIImage } from "../actions";
import ModelSelector from "./ModelSelector";
import { AI_MODELS, VAE_OPTIONS, getDefaultModel, getModelById } from "../data/models";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { encode } from "gpt-tokenizer";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { LoraOption, SelectedLora, LORA_OPTIONS, getCompatibleLoras, getLoraById } from "../data/loras";

interface TextToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
  modelId?: string;
  onModelChange?: (modelId: string) => void;
}

export default function TextToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false,
  modelId,
  onModelChange
}: TextToImageFormProps) {
  const [textPrompt, setTextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState("stable-diffusion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState(28);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState("DPM++ 2M SDE");
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [selectedVae, setSelectedVae] = useState("default");
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'uploading' | 'saving'>('idle');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // 토큰 수 계산 함수
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    // 대략적인 토큰 수 계산 (영어 기준 1토큰 = 4글자, 한글 기준 1토큰 = 2-3글자)
    const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
    const otherCharCount = text.length - koreanCharCount;
    return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
  };

  // 선택된 모델 정보 가져오기
  const selectedModel = useMemo(
    () => getModelById(modelId || model) || getModelById(getDefaultModel().id) || AI_MODELS[0],
    [model, modelId]
  );
  
  // 설정 값 관리를 위한 state
  const [modelSpecificSettings, setModelSpecificSettings] = useState<Record<string, any>>({});
  
  // 로컬 스토리지에서 이전 입력 데이터 복원
  useEffect(() => {
    // 모델 없으면 기본 모델 사용
    if (!model) {
      setModel(getDefaultModel().id);
    }
    
    // 로컬 스토리지에서 이전 입력 데이터 복원
    const savedPrompt = localStorage.getItem('textPrompt');
    const savedNegativePrompt = localStorage.getItem('negativePrompt');
    
    if (savedPrompt) {
      setTextPrompt(savedPrompt);
      setPromptTokenCount(calculateTokens(savedPrompt));
    }
    
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
      setNegativeTokenCount(calculateTokens(savedNegativePrompt));
    }
  }, []);
  
  // 모델 변경 시 모델별 설정 초기화
  useEffect(() => {
    const newSettings: Record<string, any> = {};
    
    if (selectedModel.configOptions) {
      // 모델별 설정 옵션의 기본값으로 초기화
      Object.entries(selectedModel.configOptions).forEach(([key, config]) => {
        // 기존 값 또는 기본값 설정
        if (key === 'steps') {
          setSteps(config.default);
        } else if (key === 'cfgScale') {
          setCfgScale(config.default);
        } else if (key === 'sampler') {
          setSampler(config.default);
        } else {
          newSettings[key] = config.default;
        }
      });
    }
    
    setModelSpecificSettings(newSettings);
  }, [selectedModel.id]);

  // 모델별 설정 변경 핸들러
  const handleSettingChange = (key: string, value: any) => {
    console.log(`설정 변경: ${key} = ${value}`);
    
    if (key === 'steps') {
      setSteps(Number(value));
      // 로컬 스토리지에 저장
      localStorage.setItem('steps', value.toString());
    } else if (key === 'cfgScale') {
      setCfgScale(Number(value));
      // 로컬 스토리지에 저장
      localStorage.setItem('cfgScale', value.toString());
    } else if (key === 'sampler') {
      setSampler(value);
      // 로컬 스토리지에 저장
      localStorage.setItem('sampler', value);
    } else {
      setModelSpecificSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // 모델별 설정도 로컬 스토리지에 저장
      const savedSettings = JSON.parse(localStorage.getItem('modelSpecificSettings') || '{}');
      savedSettings[model] = savedSettings[model] || {};
      savedSettings[model][key] = value;
      localStorage.setItem('modelSpecificSettings', JSON.stringify(savedSettings));
    }
  };

  // 응답에서 이미지 URL 추출 함수
  const extractImageUrl = (response: any): string | null => {
    console.log("API 응답 분석:", JSON.stringify(response, null, 2));
    
    // 새로운 API 응답 형식
    if (response && response.success && response.image && response.image.url) {
      console.log("이미지 URL 추출 성공 (표준 형식):", response.image.url);
      return response.image.url;
    }
    
    // 확장된 응답 검사
    if (response && response.success === false && response.image && response.image.url) {
      console.log("이미지 URL 추출 성공 (경고 형식):", response.image.url);
      return response.image.url;
    }
    
    // 중첩된 이미지 객체 검사
    if (response && response.image && typeof response.image === 'object') {
      const imgObj = response.image;
      
      // url, fileUrl, cloudflareUrl 등 다양한 필드명 검사
      const possibleUrlFields = ['url', 'fileUrl', 'cloudflareUrl', 'imageUrl', 'path', 'src'];
      for (const field of possibleUrlFields) {
        if (imgObj[field] && typeof imgObj[field] === 'string') {
          console.log(`이미지 URL 추출 성공 (${field} 필드):`, imgObj[field]);
          return imgObj[field];
        }
      }
    }
    
    // 직접 URL 필드 검사
    const directUrlFields = ['url', 'fileUrl', 'cloudflareUrl', 'imageUrl', 'path', 'src'];
    for (const field of directUrlFields) {
      if (response && response[field] && typeof response[field] === 'string') {
        console.log(`이미지 URL 추출 성공 (직접 ${field} 필드):`, response[field]);
        return response[field];
      }
    }
    
    // 응답이 직접 문자열 URL일 경우 (드문 경우)
    if (typeof response === 'string' && (response.startsWith('http://') || response.startsWith('https://'))) {
      console.log("이미지 URL 추출 성공 (직접 URL 문자열):", response);
      return response;
    }
    
    console.error("응답에서 이미지 URL을 찾을 수 없습니다:", response);
    return null;
  };

  // 모델 변경 핸들러
  const handleModelChange = (newModelId: string) => {
    setModel(newModelId);
    
    // 외부에서 제공된 콜백 실행
    if (onModelChange) {
      onModelChange(newModelId);
    }
    
    // 모델에 따른 기본 설정값 업데이트
    handleResetSettings(newModelId);
  };

  // Cloudflare에 이미지 업로드 함수
  const uploadToCloudflare = async (imageUrl: string): Promise<string> => {
    // 기존 API 호출 없이 바로 동일한 URL 반환 (테스트 환경)
    return imageUrl;
  };

  // 생성된 AI 이미지를 데이터베이스에 저장
  const permanentlyStoreAIImage = async (imageData: any): Promise<any> => {
    // 새 API는 이미 데이터베이스에 저장했으므로 단순히 ID와 URL 반환
    return {
      id: imageData.fileUrl.split('/').pop() || String(Date.now()),
      url: imageData.fileUrl
    };
  };

  // 모델 변경 시 설정 재설정
  const handleResetSettings = (newModelId?: string) => {
    const modelToUse = newModelId || model;
    const newModel = getModelById(modelToUse);
    
    if (newModel?.configOptions) {
      // 모델별 설정 옵션의 기본값으로 초기화
      const newSettings: Record<string, any> = {};
      
      // 기본 설정 업데이트
      if (newModel.configOptions.steps) {
        setSteps(newModel.configOptions.steps.default);
      }
      
      if (newModel.configOptions.cfgScale) {
        setCfgScale(newModel.configOptions.cfgScale.default);
      }
      
      if (newModel.configOptions.sampler) {
        setSampler(newModel.configOptions.sampler.default);
      }
      
      // 로컬 스토리지 저장
      localStorage.setItem('model', modelToUse);
      localStorage.setItem('steps', newModel.configOptions.steps?.default.toString() || '25');
      localStorage.setItem('cfgScale', newModel.configOptions.cfgScale?.default.toString() || '7');
      localStorage.setItem('sampler', newModel.configOptions.sampler?.default || 'DPM++ 2M SDE');
      
      // 기타 설정 업데이트
      Object.entries(newModel.configOptions).forEach(([key, config]) => {
        if (!['steps', 'cfgScale', 'sampler'].includes(key)) {
          newSettings[key] = config.default;
        }
      });
      
      setModelSpecificSettings(newSettings);
    }
  };

  // AI 프롬프트 개선 함수
  const handleAIPromptEnhancement = async () => {
    if (!textPrompt || textPrompt.trim().length < 5) {
      onError("AI 개선을 위해서는 최소 5글자 이상의 프롬프트를 입력해주세요.");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // AI 프롬프트 개선 요청
      const enhancedPrompt = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: textPrompt }),
      }).then(res => res.json());
      
      if (enhancedPrompt?.result) {
        setTextPrompt(enhancedPrompt.result);
        setPromptTokenCount(calculateTokens(enhancedPrompt.result));
        localStorage.setItem('textPrompt', enhancedPrompt.result);
      }
    } catch (error) {
      console.error('프롬프트 개선 중 오류 발생:', error);
      onError("프롬프트 개선에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 이미지 생성 요청 제출 핸들러
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!textPrompt) {
      onError("프롬프트를 입력해주세요.");
      return;
    }
    
    try {
      onGenerationStart();
      setIsGenerating(true);
      setLoadingState('generating');
      
      // 현재 선택된 모델 ID 가져오기 (외부에서 제공된 경우 그것을 우선 사용)
      const currentModelId = modelId || model;
      
      // API 요청 준비
      fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textPrompt,
          negativePrompt,
          modelId: currentModelId,
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1]),
          steps,
          cfgScale,
          sampler,
          vae: selectedVae,
        }),
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data?.error || `API 오류: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(result => {
        console.log("이미지 생성 응답:", result);
        
        // 임시 URL 유효성 검사
        const imageUrl = extractImageUrl(result);
        if (!imageUrl) {
          throw new Error("이미지 생성에 실패했습니다. 유효한 URL이 반환되지 않았습니다.");
        }
        
        // 이미지 ID 추출
        let imageId = '';
        
        // image.id가 있는 경우 (표준 형식)
        if (result.image && result.image.id) {
          imageId = String(result.image.id);
        }
        // id 직접 접근
        else if (result.id) {
          imageId = String(result.id);
        }
        // 다른 필드에서 ID 찾기 시도
        else if (result.image) {
          const possibleIdFields = ['id', 'imageId', 'cloudflareId', 'fileId'];
          for (const field of possibleIdFields) {
            if (result.image[field]) {
              imageId = String(result.image[field]);
              break;
            }
          }
        }
        
        // 여전히 ID가 없으면 타임스탬프로 생성
        if (!imageId) {
          imageId = String(Date.now());
          console.log("ID를 찾을 수 없어 타임스탬프로 대체:", imageId);
        }
        
        // 생성 완료 콜백 호출
        if (onGenerationComplete) {
          onGenerationComplete(imageUrl, imageId);
        }
        
        setIsGenerating(false);
        setLoadingState('idle');
      })
      .catch(error => {
        console.error("이미지 생성 오류:", error);
        setIsGenerating(false);
        setLoadingState('idle');
        onError(error.message || "이미지 생성 중 오류가 발생했습니다.");
      });
    } catch (error: any) {
      console.error("요청 준비 오류:", error);
      setIsGenerating(false);
      setLoadingState('idle');
      onError(error.message || "이미지 생성 요청 준비 중 오류가 발생했습니다.");
    }
  };
  
  const sizePresets = [
    { label: "정사각형", value: "768x768" },
    { label: "와이드", value: "1024x768" },
    { label: "세로", value: "768x1024" },
  ];
  
  // 설정 UI 렌더링 함수
  const renderSettingField = (key: string, config: any) => {
    const value = key === 'steps' 
      ? steps 
      : key === 'cfgScale' 
        ? cfgScale 
        : key === 'sampler' 
          ? sampler 
          : modelSpecificSettings[key];
    
    // 값이 정의되지 않은 경우 기본값 사용  
    const effectiveValue = value !== undefined ? value : config.default;
          
    const SettingLabel = () => (
      <label className="flex justify-between items-center text-sm mb-1">
        <div className="flex items-center gap-1">
          <span>{config.name}</span>
          <CustomTooltip title={config.name} description={config.description}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </CustomTooltip>
        </div>
        {config.type === 'number' && <span className="text-orange-500">{effectiveValue}</span>}
      </label>
    );

    switch (config.type) {
      case 'number':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step || 1}
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <select
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
              {config.options.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'boolean':
        return (
          <div key={key} className="mb-3 flex items-center justify-between">
            <SettingLabel />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={effectiveValue}
                onChange={(e) => handleSettingChange(key, e.target.checked)}
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        );
      
      case 'text':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <input
              type="text"
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* 프롬프트 입력 영역 - 완전 재구현 */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2 border-b border-neutral-800">
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'prompt' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('prompt');
            }}
          >
            프롬프트
          </button>
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'negative' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('negative');
            }}
          >
            제외할 요소
          </button>
        </div>
        
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              {activeTab === 'prompt' ? 'Prompt' : 'Negative Prompt'}
            </label>
            <span className="text-sm text-gray-500">
              {activeTab === 'prompt' ? `${promptTokenCount} tokens` : `${negativeTokenCount} tokens`}
            </span>
          </div>
          
          {activeTab === 'prompt' ? (
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = e.target.value;
                  setTextPrompt(newValue);
                  setPromptTokenCount(calculateTokens(newValue));
                  // 로컬 스토리지에 저장
                  localStorage.setItem('textPrompt', newValue);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe what you want to generate..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
                style={{zIndex: 10}}
              />
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={negativePrompt}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = e.target.value;
                  setNegativePrompt(newValue);
                  setNegativeTokenCount(calculateTokens(newValue));
                  // 로컬 스토리지에 저장
                  localStorage.setItem('negativePrompt', newValue);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe what you want to avoid in the generated image..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
                style={{zIndex: 10}}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 모델 선택 */}
      <CollapsiblePanel title="AI 모델" defaultOpen={true}>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </CollapsiblePanel>
      
      {/* 이미지 설정 */}
      <CollapsiblePanel title="이미지 설정" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="block mb-2 text-sm">이미지 비율</label>
            <div className="grid grid-cols-4 gap-2">
              {sizePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`p-2 rounded-lg border text-sm ${
                    size === preset.value 
                      ? 'border-orange-500 bg-orange-500/20 text-orange-500' 
                      : 'border-neutral-700 hover:border-neutral-600'
                  }`}
                  onClick={() => setSize(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* 모델별 설정 렌더링 */}
          {selectedModel.configOptions && 
            Object.entries(selectedModel.configOptions).map(([key, config]) => 
              renderSettingField(key, config)
            )
          }
          
          {/* VAE 설정 - 지원하는 모델에만 표시 */}
          {selectedModel.vae && (
          <div>
              <label className="flex items-center gap-1 text-sm mb-1">
                <span>VAE 설정</span>
                <CustomTooltip 
                  title="VAE 설정" 
                  description="Variational Auto-Encoder 설정. 이미지의 색상과 대비에 영향을 줍니다."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </CustomTooltip>
            </label>
            <select
              value={selectedVae}
              onChange={(e) => setSelectedVae(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
                {VAE_OPTIONS.map((vae: { id: string, name: string, description: string }) => (
                <option key={vae.id} value={vae.id} title={vae.description}>
                  {vae.name}
                </option>
              ))}
            </select>
          </div>
          )}
        </div>
      </CollapsiblePanel>
      
      {/* 생성 버튼 - 디자인 개선 */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={
            isGenerating || 
            !textPrompt.trim() || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500
          }
          className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin"></div>
              <span>
                {loadingState === 'generating' ? '이미지 생성 중...' :
                 loadingState === 'uploading' ? '이미지 영구 저장 중...' :
                 loadingState === 'saving' ? '정보 저장 중...' : '처리 중...'}
              </span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4z" />
                <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span>이미지 생성하기</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
} 