"use client";

import { useState, useRef, useEffect } from "react";
import { createComment, getCommentsForPost } from "../actions";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

export default function CommentSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // 댓글 데이터 가져오기 (페이지네이션 적용)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam = 0 }) => 
      getCommentsForPost(postId, pageParam as number, 10),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: 0,
  });
  
  // 모든 댓글을 하나의 배열로 평탄화
  const comments = data?.pages.flatMap(page => page.comments) || [];
  
  // 댓글 작성 후 자동 스크롤
  useEffect(() => {
    if (comments.length > 0 && !isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments.length, isLoading]);

  // 폴링 설정 (10초마다 새 댓글 확인)
  useEffect(() => {
    const interval = setInterval(() => {
      // 첫 페이지만 조용히 갱신
      queryClient.invalidateQueries({ 
        queryKey: ['comments', postId],
        refetchPage: (_: any, index: number) => index === 0,
        exact: true
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [postId, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // 현재 시간 생성
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content: content,
      created_at: new Date(),
      userId: -1, // 임시 ID
      user: {
        id: -1,
        username: "나", // 또는 실제 사용자 이름
        avatar: null
      }
    };
    
    // 낙관적 업데이트
    queryClient.setQueryData(['comments', postId], (old: any) => {
      const firstPage = old.pages[0];
      return {
        ...old,
        pages: [
          {
            ...firstPage,
            comments: [optimisticComment, ...firstPage.comments]
          },
          ...old.pages.slice(1)
        ]
      };
    });
    
    try {
      const newComment = await createComment(postId, content);
      setContent("");
      
      // 실제 데이터로 교체
      queryClient.setQueryData(['comments', postId], (old: any) => {
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) => {
            if (i === 0) {
              return {
                ...page,
                comments: page.comments.map((c: any) => 
                  c.id === tempId ? newComment : c
                )
              };
            }
            return page;
          })
        };
      });
      
      commentInputRef.current?.focus();
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      
      // 실패 시 낙관적 업데이트 롤백
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">댓글 {comments.length}개</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          ref={commentInputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full h-24 bg-neutral-800 rounded-lg p-4 resize-none"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
      </form>

      {isLoading ? (
        // 로딩 상태 표시
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-neutral-800 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-neutral-700 rounded-full" />
                <div className="h-4 bg-neutral-700 rounded w-32" />
              </div>
              <div className="h-4 bg-neutral-700 rounded w-full mb-2" />
              <div className="h-4 bg-neutral-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        // 댓글 목록
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {comments.length === 0 ? (
            <p className="text-neutral-500 text-center py-4">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <span className="font-medium">{comment.user.username}</span>
                    <span className="text-neutral-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-neutral-300">{comment.content}</p>
                </div>
              ))}
              
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {isFetchingNextPage ? "댓글 불러오는 중..." : "더 보기"}
                </button>
              )}
              
              <div ref={bottomRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
} 