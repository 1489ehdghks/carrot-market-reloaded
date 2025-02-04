import { db } from "@/lib/db";
import getSession from "@/lib/session";
import { EyeIcon, HandThumbUpIcon } from "@heroicons/react/24/solid";
import { notFound } from "next/navigation";
import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import LikeButton from "@/components/like-button";
import CommentForm from "@/components/comment-form";
import CommentList from "@/components/comment-list";
import {getCachedComments} from "@/app/life/[id]/actions";

async function getPost(id: number) {
  try {
    const post = await db.post.update({
      where: {
        id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    return post;
  } catch (e) {
    return null;
  }
}

const getCachedPost = nextCache(getPost, ["post-detail"], {
  tags: ["post-detail"],
  revalidate: 60,
});



async function getLikeStatus(postId:number, userId: number | undefined){
  const isLiked = await db.like.findUnique({
    where: {
      id: {
        postId,
        userId: userId!,

      },
    },
  });
  const likeCount = await db.like.count({
    where: {
      postId,
    },
  });
  return {
    likeCount,
    isLiked: Boolean(isLiked),
  };
}

function getCachedLikeStatus(postId:number, userId: number | undefined){
  const cachedOperation = nextCache(getLikeStatus, ["post-like-status"], {
    tags: [`like-status-${postId}`],
  });
  return cachedOperation(postId, userId);
}




export default async function PostDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id: paramId } = await params; 
  const id = Number(paramId);
  if (isNaN(id)) {
    return notFound();
  }
  const session = await getSession();
  const post = await getCachedPost(id);
  if (!post) {
    return notFound();
  }




  const { likeCount, isLiked } = await getCachedLikeStatus(id, session.id);
  const comments = await getCachedComments(id);
    return(
        <div className="p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Image
            width={28}
            height={28}
            className="size-7 rounded-full"
            src={post.user.avatar!}
            alt={post.user.username}
          />
          <div>
            <span className="text-sm font-semibold">{post.user.username}</span>
            <div className="text-xs">
              <span>{formatToTimeAgo(post.created_at.toString())}</span>
            </div>
          </div>
        </div>
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="mb-5">{post.description}</p>
        <div className="flex flex-col gap-5 items-start">
          <div className="flex items-center gap-2 text-neutral-400 text-sm">
            <EyeIcon className="size-5" />
            <span>조회 {post.views}</span>
          </div>
            <LikeButton isLiked={isLiked} likeCount={likeCount} postId={id} />
        </div>
        <CommentForm postId={id} />
        <CommentList comments={comments} />
      </div>
    )
}