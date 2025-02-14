"use server";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import getSession from "@/lib/session";



export async function likePost(id:number){
    const session = await getSession();
    if (!session?.id) {
      throw new Error("로그인이 필요합니다.");
    }
    try {
      await db.like.create({
        data: {
          postId: id,
          userId: session.id!,
        },
      });
      revalidateTag(`like-status-${id}`); 
    } catch{
      throw new Error("좋아요 추가에 실패했습니다. 다시 시도해 주세요.");
    }
  };


export async function dislikePost(id:number){
  const session = await getSession();
  if (!session?.id) {
    throw new Error("로그인이 필요합니다.");
  }
    try {
      await db.like.delete({
        where: {
          userId_postId: {
            postId: id,
            userId: session.id!,
          },
        },
      });
      revalidateTag(`like-status-${id}`);
    } catch{
      throw new Error("좋아요 취소에 실패했습니다. 다시 시도해 주세요.");
    }
  };


//comment
export async function createComment(postId: number, content: string) {
    const session = await getSession();
    if (!session.id) return;
  
    await db.comment.create({
      data: {
        content,
        postId,
        userId: session.id,
      },
    });
  
    revalidateTag(`post-${postId}-comments`);
  }
  
  export async function getComments(postId: number) {
    const comments = await db.comment.findMany({
      where: {
        postId,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });
  
    return comments;
  }
  
  export async function getCachedComments(postId: number) {
    return nextCache(getComments, ["post-comments"], {
      tags: [`post-${postId}-comments`]
    })(postId); 
  }

export async function getLikeStatus(postId: number) {
  const session = await getSession();
  if (!session?.id) return false;

  const like = await db.like.findUnique({
    where: {
      userId_postId: {
        userId: session.id,
        postId
      }
    }
  });

  return !!like;
}