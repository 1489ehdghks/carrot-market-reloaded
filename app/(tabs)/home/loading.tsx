import React from 'react';

export default function HomeLoading() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 헤더 섹션 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-10 w-24 bg-neutral-800 rounded-lg animate-pulse" />
      </div>

      {/* 필터 섹션 스켈레톤 */}
      <div className="flex gap-4 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-neutral-800 rounded-lg animate-pulse" />
        ))}
      </div>

      {/* 게시글 목록 스켈레톤 */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-neutral-800 rounded-lg p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-neutral-700" />
              <div className="h-4 w-24 bg-neutral-700 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-neutral-700 rounded" />
            <div className="h-4 w-1/2 bg-neutral-700 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-neutral-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 