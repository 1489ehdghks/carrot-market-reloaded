"use client";

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageUploaded: (file: File, previewUrl: string) => void;
  className?: string;
  maxSizeMB?: number;
  isDisabled?: boolean;
}

export default function ImageUploader({
  onImageUploaded,
  className = '',
  maxSizeMB = 5,
  isDisabled = false
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDisabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    validateAndProcessFile(file);
    // 같은 파일 선택 가능하도록 값 초기화
    e.target.value = '';
  };
  
  const validateAndProcessFile = (file: File) => {
    // 이미지 파일 형식 확인
    if (!file.type.match('image/(jpeg|jpg|png|webp)')) {
      toast.error('지원되지 않는 파일 형식입니다. JPG, PNG, 또는 WEBP 이미지만 업로드 가능합니다.');
      return;
    }
    
    // 파일 크기 확인 (maxSizeMB MB)
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`파일 크기가 너무 큽니다. ${maxSizeMB}MB 이하의 이미지만 업로드 가능합니다.`);
      return;
    }
    
    // 이미지 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    
    // 부모 컴포넌트에 파일 전달
    onImageUploaded(file, previewUrl);
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors
          ${isDragging 
            ? 'border-orange-500 bg-orange-500/10' 
            : isDisabled
              ? 'border-neutral-700 bg-neutral-800/30 opacity-50 cursor-not-allowed'
              : 'border-neutral-700 hover:bg-neutral-800/30'
          }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mb-1 text-sm text-neutral-400">
            <span className="font-medium">클릭하여 이미지 업로드</span> 또는 드래그앤드롭
          </p>
          <p className="text-xs text-neutral-500">PNG, JPG, WEBP (최대 {maxSizeMB}MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileSelect}
          disabled={isDisabled}
        />
      </div>
    </div>
  );
} 