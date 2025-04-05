"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  selectedImage?: File;
  previewUrl?: string;
  maxSize?: number;
  accept?: string;
}

export default function ImageUploader({
  onImageSelect,
  onImageRemove,
  selectedImage,
  previewUrl,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = "image/*"
}: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0]);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  });

  return (
    <div className="w-full">
      {selectedImage ? (
        <div className="relative">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
            <Image
              src={previewUrl || URL.createObjectURL(selectedImage)}
              alt="Selected"
              fill
              className="object-cover"
            />
          </div>
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "이미지를 여기에 놓아주세요"
              : "이미지를 드래그하거나 클릭하여 업로드하세요"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            최대 {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}
    </div>
  );
} 