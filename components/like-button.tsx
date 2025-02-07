"use client";
import { HandThumbUpIcon } from "@heroicons/react/24/solid";
import { HandThumbUpIcon as OutlineHandThumbUpIcon } from "@heroicons/react/24/outline";
import { useOptimistic, useState, useTransition } from "react";
import { dislikePost } from "@/app/life/[id]/actions";
import { likePost } from "@/app/life/[id]/actions";
import Alert from '@/components/alert';

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
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
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
            try {
                reducerFn(undefined);
                await (state.isLiked ? dislikePost(postId) : likePost(postId));
            } catch (error) {
                // 실패 시 알림 표시
                setAlertMessage(error instanceof Error ? error.message : '오류가 발생했습니다.');
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
                // 상태 롤백
                reducerFn(undefined);
            }
        });
    };

    return (
      <>
          <button
              onClick={onClick}
              disabled={isPending}
              className={`flex items-center gap-2 text-neutral-400 text-sm border border-neutral-400 rounded-full p-2 transition-colors ${
                  state.isLiked ? "bg-orange-500 text-white border-orange-500" : "hover:bg-neutral-800"
              }`}
          >
              {state.isLiked ? (
                  <HandThumbUpIcon className="size-5" />
              ) : (
                  <OutlineHandThumbUpIcon className="size-5" />
              )}
              <span>
                  {state.isLiked ? state.likeCount : `공감하기 (${state.likeCount})`}
              </span>
          </button>
          {showAlert && (
              <Alert 
                  message={alertMessage} 
                  type="error" 
                  onClose={() => setShowAlert(false)} 
              />
          )}
      </>
  );
}