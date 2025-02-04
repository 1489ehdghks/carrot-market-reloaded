import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";

interface Comment {
  id: number;
  content: string;
  created_at: Date;
  updated_at?: Date;
  user: {
    username: string;
    avatar: string;
  };
}

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  console.log(comments);
  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-lg font-semibold">댓글 {comments.length}개</h3>
      
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Image
            width={60}
            height={40}
            src={comment.user.avatar!}
            alt={comment.user.username}
            className="rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.user.username}</span>
              <span className="text-sm text-neutral-400">
                {formatToTimeAgo(comment.created_at.toString())}
              </span>
            </div>
            <p className="mt-1 text-neutral-200">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}