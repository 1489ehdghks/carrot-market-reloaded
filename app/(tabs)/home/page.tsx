"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPostsForList, type PostType, type PostCategory, type PostSummary } from "./actions";
import { PencilIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import PostCard from "./components/PostCard";
import PostFilter from "./components/PostFilter";

// 게시글 목록 컴포넌트
export default function HomePage() {
  const [type, setType] = useState<PostType>("general");
  const [category, setCategory] = useState<PostCategory>("general");
  const [showAdult, setShowAdult] = useState(false);
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <Link
          href="/home/write"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PencilIcon className="w-5 h-5" />
          글쓰기
        </Link>
      </div>

      {/* 필터 섹션 */}
      <div className="flex gap-4 flex-wrap">
        <PostFilter
          type={type}
          onTypeChange={setType}
          category={category}
          onCategoryChange={setCategory}
          showAdult={showAdult}
          onShowAdultChange={setShowAdult}
        />
      </div>

      {/* 게시글 목록 - 별도 컴포넌트로 분리 */}
      <PostList 
        type={type} 
        category={category} 
        showAdult={showAdult} 
      />
    </div>
  );
}

// 게시글 목록만 담당하는 컴포넌트
function PostList({ type, category, showAdult }: { 
  type: PostType; 
  category: PostCategory; 
  showAdult: boolean;
}) {
  const { data: posts, isLoading } = useQuery<PostSummary[]>({
    queryKey: ['posts', type, category],
    queryFn: () => getPostsForList({ type, category }),
  });

  const filteredPosts = posts?.filter(post => 
    showAdult || !post.isAdult
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-neutral-800 rounded-lg mb-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
} 