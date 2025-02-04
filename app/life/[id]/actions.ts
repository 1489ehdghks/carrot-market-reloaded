"use server";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import getSession from "@/lib/session";



export async function likePost(id:number){
    const session = await getSession();
    try {
      await db.like.create({
        data: {
          postId: id,
          userId: session.id!,
        },
      });
      revalidateTag(`like-status-${id}`); 
    } catch (e) {}
  };


export async function dislikePost(id:number){
    try {
      const session = await getSession();
      await db.like.delete({
        where: {
          id: {
            postId: id,
            userId: session.id!,
          },
        },
      });
      revalidateTag(`like-status-${id}`);
    } catch (e) {}
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