"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';
import { InfoIcon } from 'lucide-react';
import { calculateImageCost } from '../../data/tokenUtils';

interface TokenCostDisplayProps {
  modelId: string;
  width: number;
  height: number;
  count: number;
  faceSwapModelId?: string;
}

export default function TokenCostDisplay({ modelId, width, height, count, faceSwapModelId }: TokenCostDisplayProps) {
  const [cost, setCost] = useState<{
    total: number;
    breakdown: { name: string; tokens: number }[];
  }>({ total: 0, breakdown: [] });

  useEffect(() => {
    if (!modelId) return;

    try {
      // 토큰 비용 계산
      const costResult = calculateImageCost({
        modelId,
        width,
        height,
        faceSwapModelId
      });

      // 이미지 수량에 따른 총 비용 계산
      setCost({
        total: costResult.total * count,
        breakdown: costResult.breakdown.map(item => ({
          name: item.name,
          tokens: item.tokens * count
        }))
      });
    } catch (error) {
      console.error('토큰 비용 계산 오류:', error);
      setCost({ total: 0, breakdown: [] });
    }
  }, [modelId, width, height, count, faceSwapModelId]);

  if (cost.total <= 0) return null;

  return (
    <div className="inline-flex items-center text-sm">
      <CustomTooltip
        title="토큰 비용"
        description="이미지 생성에 사용되는 토큰 비용입니다."
        content={
          <div className="space-y-1">
            {cost.breakdown.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-neutral-400">{item.name}:</span>
                <span className="font-semibold text-white ml-2">{item.tokens} 토큰</span>
              </div>
            ))}
            <div className="border-t border-neutral-700 pt-1 mt-1 flex justify-between">
              <span className="text-white">총 토큰:</span>
              <span className="font-semibold text-white">{cost.total} 토큰</span>
            </div>
          </div>
        }
      >
        <div className="inline-flex items-center gap-1 text-orange-400 font-medium">
          <InfoIcon className="h-3.5 w-3.5" />
          <span>{cost.total} 토큰</span>
        </div>
      </CustomTooltip>
    </div>
  );
} 