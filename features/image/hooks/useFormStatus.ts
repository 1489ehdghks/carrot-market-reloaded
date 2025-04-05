"use client";

import { useState } from "react";

// 폼 상태와 관련된 데이터와 함수를 제공하는 훅
export function useFormStatus() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  return {
    isGenerating,
    error,
    setIsGenerating,
    setError
  };
} 