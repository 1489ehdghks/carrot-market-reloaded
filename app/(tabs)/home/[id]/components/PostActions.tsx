"use client";

import { useState, useTransition, useEffect } from "react";
import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";
import { HandThumbUpIcon as HandThumbUpSolidIcon, HandThumbDownIcon as HandThumbDownSolidIcon } from "@heroicons/react/24/solid";
import { togglePostReaction, getPostLikes } from "../actions";
import { Post } from "@/app/(tabs)/home/actions";
import { useQuery } from "@tanstack/react-query";

export default function PostActions({ post }: { post: Post }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useState(post.isLiked ?? false);
  const [optimisticDisliked, setOptimisticDisliked] = useState(post.isDisliked ?? false);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number>(post._count?.likes ?? 0);
  const [optimisticDislikeCount, setOptimisticDislikeCount] = useState<number>(post._count?.dislikes ?? 0);

  // 좋아요 정보 실시간 업데이트
  const { data: likeInfo } = useQuery({
    queryKey: ['postLikes', post.id],
    queryFn: () => getPostLikes(post.id),
    enabled: !!post.id,
    refetchInterval: 30000, // 30초마다 갱신
  });

  // 서버에서 가져온 좋아요 정보로 UI 업데이트
  useEffect(() => {
    if (likeInfo) {
      setOptimisticLiked(likeInfo.isLiked);
      setOptimisticDisliked(likeInfo.isDisliked);
      setOptimisticLikeCount(likeInfo.likesCount);
      setOptimisticDislikeCount(likeInfo.dislikesCount);
    }
  }, [likeInfo]);

  const handleLike = async () => {
    try {
      const newIsLiked = !optimisticLiked;
      const newIsDisliked = optimisticDisliked ? false : optimisticDisliked;
      
      // 낙관적 UI 업데이트
      setOptimisticLiked(newIsLiked);
      setOptimisticDisliked(newIsDisliked);
      setOptimisticLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      if (optimisticDisliked && !newIsDisliked) {
        setOptimisticDislikeCount(prev => prev - 1);
      }
      
      startTransition(async () => {
        try {
          await togglePostReaction(post.id, newIsLiked ? 'like' : 'dislike');
        } catch (error) {
          // 실패시 원상복구
          setOptimisticLiked(post.isLiked ?? false);
          setOptimisticDisliked(post.isDisliked ?? false);
          setOptimisticLikeCount(post._count?.likes ?? 0);
          setOptimisticDislikeCount(post._count?.dislikes ?? 0);
          console.error("Failed to like post:", error);
        }
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDislike = async () => {
    try {
      const newIsDisliked = !optimisticDisliked;
      const newIsLiked = optimisticLiked ? false : optimisticLiked;
      
      setOptimisticDisliked(newIsDisliked);
      setOptimisticLiked(newIsLiked);
      setOptimisticDislikeCount(prev => newIsDisliked ? prev + 1 : prev - 1);
      
      // 좋아요 취소되었다면 좋아요 수 감소
      if (optimisticLiked && !newIsLiked) {
        setOptimisticLikeCount(prev => prev - 1);
      }

      startTransition(async () => {
        try {
          await togglePostReaction(post.id, newIsDisliked ? 'dislike' : 'like');
        } catch (error) {
          // 실패시 원상복구
          setOptimisticLiked(post.isLiked ?? false);
          setOptimisticDisliked(post.isDisliked ?? false);
          setOptimisticLikeCount(post._count?.likes ?? 0);
          setOptimisticDislikeCount(post._count?.dislikes ?? 0);
          console.error("Failed to dislike post:", error);
        }
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={handleLike}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
      >
        {optimisticLiked ? (
          <HandThumbUpSolidIcon className="w-5 h-5 text-blue-500" />
        ) : (
          <HandThumbUpIcon className="w-5 h-5" />
        )}
        <span>{optimisticLikeCount.toString()}</span>
      </button>
      
      <button
        onClick={handleDislike}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
      >
        {optimisticDisliked ? (
          <HandThumbDownSolidIcon className="w-5 h-5 text-red-500" />
        ) : (
          <HandThumbDownIcon className="w-5 h-5" />
        )}
        <span>{optimisticDislikeCount.toString()}</span>
      </button>
    </div>
  );
} 