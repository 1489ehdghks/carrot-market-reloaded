"use client";

import { formatToTimeAgo } from "@/lib/utils";
import { HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import dayjs from "dayjs";
import { PostSummary } from "../actions";

interface PostCardProps {
  post: PostSummary;
}

function getUsernameColor(rank: string) {
  switch (rank.toLowerCase()) {
    case 'admin':
      return 'text-orange-500';
    case '관리자':
      return 'text-blue-500';
    default:
      return 'text-white';
  }
}

function formatMobileDate(date: string) {
  const today = dayjs().startOf('day');
  const postDate = dayjs(date);
  
  if (postDate.isSame(today, 'day')) {
    return formatToTimeAgo(date);
  }
  return postDate.format('YYYY.MM.DD');
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/home/${post.id}`}>
      <article className="group flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3 hover:bg-neutral-800/30 transition-colors border-b border-neutral-800">
        {/* 게시글 타입 뱃지 - 모바일에서는 숨김 */}
        <div className="hidden md:block w-16 text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            post.type === "notice" ? "bg-blue-500/20 text-blue-400" :
            post.type === "question" ? "bg-orange-500/20 text-orange-400" :
            post.type === "info" ? "bg-green-500/20 text-green-400" :
            post.type === "resource" ? "bg-purple-500/20 text-purple-400" :
            "bg-neutral-500/20 text-neutral-400"
          }`}>
            {post.type === "notice" && "공지"}
            {post.type === "general" && "일반"}
            {post.type === "question" && "질문"}
            {post.type === "info" && "정보"}
            {post.type === "resource" && "자료"}
          </span>
        </div>

        {/* 제목 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium truncate group-hover:text-white transition-colors">
              {post.title}
            </h2>
          </div>
        </div>

        {/* 작성자 */}
        <div className="shrink-0 w-20 md:w-28 text-sm truncate">
          <CustomTooltip
            title={post.user.username}
            description={`Lv.${post.user.level} · ${post.user.rank}`}
          >
            <span className={`cursor-pointer ${getUsernameColor(post.user.rank)}`}>
              {post.user.username}
            </span>
          </CustomTooltip>
        </div>

        {/* 작성일 */}
        <div className="shrink-0 w-20 md:w-28 text-sm text-neutral-500">
          <span className="hidden md:inline">{formatToTimeAgo(post.created_at.toString())}</span>
          <span className="md:hidden">{formatMobileDate(post.created_at.toString())}</span>
        </div>

        {/* 상호작용 정보 */}
        <div className="shrink-0 flex items-center gap-2 md:gap-4 text-sm text-neutral-400">
          <div className="flex items-center gap-1">
            <HandThumbUpIcon className="w-4 h-4" />
            <span>{post._count.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
            <span>{post.views || 0}</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{post._count.comments}</span>
          </div>
        </div>
      </article>
    </Link>
  );
} 