"use client";

import { useTransition } from "react";
import { createComment } from "@/app/life/[id]/actions";

interface CommentFormProps {
  postId: number;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form 
      action={async (formData: FormData) => {
        const content = formData.get("content") as string;
        startTransition(async () => {
          await createComment(postId, content);
        });
      }}
      className="mt-5"
    >
      <textarea
        name="content"
        placeholder="댓글을 작성해주세요"
        required
        rows={3}
        className="w-full p-3 rounded-lg bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-neutral-500"
        >
          {isPending ? "등록 중..." : "댓글 작성"}
        </button>
      </div>
    </form>
  );
}