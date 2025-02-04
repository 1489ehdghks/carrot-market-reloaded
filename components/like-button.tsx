"use client";
import { HandThumbUpIcon } from "@heroicons/react/24/solid";
import { HandThumbUpIcon as OutlineHandThumbUpIcon } from "@heroicons/react/24/outline";
import { useOptimistic, useTransition } from "react";
import { dislikePost } from "@/app/life/[id]/actions";
import { likePost } from "@/app/life/[id]/actions";


interface LikeButtonProps{
    isLiked:boolean;
    likeCount:number;
    postId:number;
}

export default function LikeButton({
    isLiked,
    likeCount,
    postId,
  }: LikeButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [state, reducerFn] = useOptimistic(
        { isLiked, likeCount },
        (state) => ({
          isLiked: !state.isLiked,
          likeCount: state.isLiked ? state.likeCount - 1 : state.likeCount + 1,
        })
      );

  const onClick = () => {
    startTransition(async () => {
      reducerFn(undefined);
      if (state.isLiked) {
        await dislikePost(postId);
      } else {
        await likePost(postId);
      }
    });
  };

    return(
        <button
        onClick={onClick}
        disabled={isPending}
        className={`flex items-center gap-2 text-neutral-400 text-sm border border-neutral-400 rounded-full p-2 transition-colors ${isLiked ? "bg-orange-500 text-white border-orange-500" : "hover:bg-neutral-800"}`}
        >

        {state.isLiked ? (
          <HandThumbUpIcon className="size-5" />
        ) : (
          <OutlineHandThumbUpIcon className="size-5" />
        )}
        {state.isLiked ? (
          <span> {state.likeCount}</span>
        ) : (
          <span>공감하기 ({state.likeCount})</span>
        )}
        </button>

    )
}