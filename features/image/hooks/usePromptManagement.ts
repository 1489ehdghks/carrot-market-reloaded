"use client";

import { useState, useEffect } from 'react';

interface PromptManagementHook {
  prompt: string;
  negativePrompt: string;
  promptTokenCount: number;
  negativeTokenCount: number;
  setPrompt: (text: string) => void;
  setNegativePrompt: (text: string) => void;
  resetPrompts: () => void;
  isValid: boolean;
}

export function usePromptManagement(
  maxPromptTokens: number = 1500,
  maxNegativeTokens: number = 500
): PromptManagementHook {
  // 상태 정의
  const [prompt, setPromptState] = useState("");
  const [negativePrompt, setNegativePromptState] = useState("");
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  
  // 로컬 스토리지에서 초기값 로드
  useEffect(() => {
    const savedPrompt = localStorage.getItem('textPrompt');
    const savedNegativePrompt = localStorage.getItem('negativePrompt');
    
    if (savedPrompt) {
      setPromptState(savedPrompt);
      setPromptTokenCount(calculateTokens(savedPrompt));
    }
    
    if (savedNegativePrompt) {
      setNegativePromptState(savedNegativePrompt);
      setNegativeTokenCount(calculateTokens(savedNegativePrompt));
    }
  }, []);
  
  // 토큰 수 계산 함수
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    // 대략적인 토큰 수 계산 (영어 기준 1토큰 = 4글자, 한글 기준 1토큰 = 2-3글자)
    const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
    const otherCharCount = text.length - koreanCharCount;
    return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
  };
  
  // 프롬프트 설정 함수
  const setPrompt = (text: string) => {
    setPromptState(text);
    setPromptTokenCount(calculateTokens(text));
    localStorage.setItem('textPrompt', text);
  };
  
  // 네거티브 프롬프트 설정 함수
  const setNegativePrompt = (text: string) => {
    setNegativePromptState(text);
    setNegativeTokenCount(calculateTokens(text));
    localStorage.setItem('negativePrompt', text);
  };
  
  // 프롬프트 초기화 함수
  const resetPrompts = () => {
    setPromptState("");
    setNegativePromptState("");
    setPromptTokenCount(0);
    setNegativeTokenCount(0);
    localStorage.removeItem('textPrompt');
    localStorage.removeItem('negativePrompt');
  };
  
  // 유효성 검사 결과
  const isValid = 
    prompt.trim().length > 0 && 
    promptTokenCount <= maxPromptTokens &&
    negativeTokenCount <= maxNegativeTokens;
  
  return {
    prompt,
    negativePrompt,
    promptTokenCount,
    negativeTokenCount,
    setPrompt,
    setNegativePrompt,
    resetPrompts,
    isValid
  };
} 