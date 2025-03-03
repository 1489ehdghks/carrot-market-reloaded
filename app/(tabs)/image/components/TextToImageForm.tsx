"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { generateImageWithPony } from "../actions";
import ModelSelector from "./ModelSelector";
import { AI_MODELS } from "../data/models";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { encode } from "gpt-tokenizer";
import { VAE_OPTIONS } from "../data/models";

interface TextToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: number) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export default function TextToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false
}: TextToImageFormProps) {
  const [textPrompt, setTextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState("stable-diffusion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState(28);
  const [guidance, setGuidance] = useState(7);
  const [sampler, setSampler] = useState("DPM++ 2M SDE");
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [selectedVae, setSelectedVae] = useState("default");
  
  // 토큰 수 계산 함수
  const calculateTokens = useCallback((text: string) => {
    const tokens = encode(text);
    return tokens.length;
  }, []);

  // 선택된 모델 정보 가져오기
  const selectedModel = useMemo(
    () => AI_MODELS.find(m => m.id === model) || AI_MODELS[0],
    [model]
  );
  
  // 로컬 스토리지에서 이전 입력 데이터 복원
  useEffect(() => {
    const savedTextPrompt = localStorage.getItem('textPrompt');
    const savedNegativePrompt = localStorage.getItem('negativePrompt');
    const savedSize = localStorage.getItem('size');
    const savedModel = localStorage.getItem('model');
    const savedSteps = localStorage.getItem('steps');
    const savedGuidance = localStorage.getItem('guidance');
    const savedSampler = localStorage.getItem('sampler');
    const savedVae = localStorage.getItem('vae');
    
    if (savedTextPrompt) {
      setTextPrompt(savedTextPrompt);
      setPromptTokenCount(calculateTokens(savedTextPrompt));
    }
    
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
      setNegativeTokenCount(calculateTokens(savedNegativePrompt));
    }
    
    if (savedSize) setSize(savedSize);
    if (savedModel) setModel(savedModel);
    if (savedSteps) setSteps(Number(savedSteps));
    if (savedGuidance) setGuidance(Number(savedGuidance));
    if (savedSampler) setSampler(savedSampler);
    if (savedVae) setSelectedVae(savedVae);
  }, [calculateTokens]);
  
  // 프롬프트 변경 시 토큰 수 계산 및 제한
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newTokens = calculateTokens(newText);
    setTextPrompt(newText);
    setPromptTokenCount(newTokens);
  };

  // 네거티브 프롬프트 변경 시 토큰 수 계산 및 제한
  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newTokens = calculateTokens(newText);
  
    setNegativePrompt(newText);
    setNegativeTokenCount(newTokens);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPrompt.trim()) return;
    
    const totalTokens = calculateTokens(textPrompt) + calculateTokens(negativePrompt);
    if (totalTokens > 1000) {
      onError("긍정 프롬프트와 부정 프롬프트의 총 길이가 1000토큰을 초과합니다. 현재: " + totalTokens + "토큰");
      return;
    }
    
    setIsGenerating(true);
    onGenerationStart();
    
    try {
      const result = await generateImageWithPony(
        textPrompt, 
        size, 
        selectedModel.id, 
        negativePrompt,
        selectedModel.apiModel,
        selectedVae
      );
      
      // 입력 데이터 로컬 스토리지에 저장
      localStorage.setItem('textPrompt', textPrompt);
      localStorage.setItem('negativePrompt', negativePrompt);
      localStorage.setItem('size', size);
      localStorage.setItem('model', model);
      localStorage.setItem('steps', steps.toString());
      localStorage.setItem('guidance', guidance.toString());
      localStorage.setItem('sampler', sampler);
      localStorage.setItem('vae', selectedVae);
      
      onGenerationComplete(result.fileUrl, result.id);
    } catch (err: any) {
      onError(err.message || "이미지 생성 중 오류가 발생했습니다");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const sizePresets = [
    { label: "정사각형", value: "768x768" },
    { label: "와이드", value: "768x512" },
    { label: "세로", value: "512x768" },
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 프롬프트 입력 영역 - 탭 디자인 개선 */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2 border-b border-neutral-800">
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'prompt' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={() => setActiveTab('prompt')}
          >
            프롬프트
          </button>
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'negative' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={() => setActiveTab('negative')}
          >
            제외할 요소
          </button>
        </div>
        
        <div className="bg-neutral-800 p-0">
          {activeTab === 'prompt' ? (
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={handlePromptChange}
                className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
                placeholder="생성할 이미지를 상세히 설명해주세요..."
                required
              />
              <div className={`absolute bottom-2 right-2 text-xs ${promptTokenCount > 1000 ? 'text-red-500' : 'text-neutral-400'}`}>
                {promptTokenCount} / 350 토큰
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={negativePrompt}
                onChange={handleNegativePromptChange}
                className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
                placeholder="이미지에서 제외하고 싶은 요소를 입력하세요..."
              />
              <div className={`absolute bottom-2 right-2 text-xs ${negativeTokenCount > 1000 ? 'text-red-500' : 'text-neutral-400'}`}>
                {negativeTokenCount} / 350 토큰
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 모델 선택 */}
      <CollapsiblePanel title="AI 모델" defaultOpen={true}>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setModel}
        />
      </CollapsiblePanel>
      
      {/* 이미지 설정 */}
      <CollapsiblePanel title="이미지 설정" defaultOpen={true}>
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
          
          <div>
            <label className="flex justify-between text-sm mb-1">
              <span>샘플링 스텝</span>
              <span className="text-orange-500">{steps}</span>
            </label>
            <input
              type="range"
              min="20"
              max="50"
              step="1"
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
          
          <div>
            <label className="flex justify-between text-sm mb-1">
              <span>가이던스 스케일</span>
              <span className="text-orange-500">{guidance}</span>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="0.5"
              value={guidance}
              onChange={(e) => setGuidance(parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm">샘플러</label>
            <select
              value={sampler}
              onChange={(e) => setSampler(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
              <option value="DPM++ 2M SDE">DPM++ 2M SDE</option>
              <option value="DPM++ SDE">DPM++ SDE</option>
              <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
              <option value="Euler a">Euler a</option>
              <option value="Euler a">K_EULER</option>              
              <option value="DDIM">DDIM</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm">VAE 설정</label>
            <select
              value={selectedVae}
              onChange={(e) => setSelectedVae(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
              {VAE_OPTIONS.map(vae => (
                <option key={vae.id} value={vae.id} title={vae.description}>
                  {vae.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsiblePanel>
      
      {/* 생성 버튼 - 디자인 개선 */}
      <div className="fixed bottom-0 left-0 md:w-[400px] lg:w-[450px] p-4 bg-gradient-to-t from-black to-neutral-900/80 border-t border-neutral-800 z-10">
        <button
          type="submit"
          disabled={isGenerating || !textPrompt.trim()}
          className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin"></div>
              <span>이미지 생성 중...</span>
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