"use server"

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import getSession from "@/lib/session";

export type PostType = "general" | "notice" | "question" | "info" | "resource";
export type PostCategory = "general" | "2d" | "2.5d" | "realistic" | "other";
export type SortType = "general" |"recent" | "popular" | "comments";

export interface PostFilters {
  type?: PostType;
  category?: PostCategory;
}

interface GetPostsOptions {
  type?: PostType;
  category?: PostCategory;
  sort?: SortType;
  page?: number;
  limit?: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  type: PostType;
  category: PostCategory;
  isAdult: boolean;
  created_at: Date;
  updated_at: Date;
  userId: number;
  views: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  user: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
    rank: string;
  };
  _count: {
    likes: number;
    dislikes: number;
    comments: number;
  };
}

export async function getPosts({
  type,
  sort = "recent",
  page = 1,
  limit = 20,
  category,
}: GetPostsOptions = {}): Promise<Post[]> {
  const session = await getSession();
  
  const where: Prisma.PostWhereInput = {
    ...(type && { type }),
    ...(category && { category }),
  };
  
  const orderBy: Prisma.PostOrderByWithRelationInput = 
    sort === "recent" ? { created_at: "desc" } :
    sort === "popular" ? { likesCount: "desc" } :
    { commentsCount: "desc" };

  const posts = await db.post.findMany({
    where,
    include: {
      user: true,
      _count: {
        select: {
          comments: true,
          likes: true
        }
      },
      likes: session ? {
        where: { userId: session.id }
      } : false
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  return posts.map(post => {
    const likesCount = post.likes?.filter(like => like.type === 'like').length ?? 0;
    const dislikesCount = post.likes?.filter(like => like.type === 'dislike').length ?? 0;
    
    return {
      ...post,
      type: post.type as PostType,
      category: post.category as PostCategory,
      isLiked: post.likes?.some(like => like.type === 'like') ?? false,
      isDisliked: post.likes?.some(like => like.type === 'dislike') ?? false,
      _count: {
        ...post._count,
        likes: likesCount,
        dislikes: dislikesCount,
        comments: post._count.comments
      },
      likes: undefined
    };
  });
}

export async function getPostsForList({
  type,
  sort = "recent",
  page = 1,
  limit = 20,
  category,
}: GetPostsOptions = {}): Promise<PostSummary[]> {
  const session = await getSession();
  
  const where: Prisma.PostWhereInput = {
    ...(type && { type }),
    ...(category && { category }),
  };
  
  const orderBy: Prisma.PostOrderByWithRelationInput = 
    sort === "recent" ? { created_at: "desc" } :
    sort === "popular" ? { likesCount: "desc" } :
    { commentsCount: "desc" };

  const posts = await db.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      category: true,
      isAdult: true,
      created_at: true,
      views: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
          rank: true,
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      }
    },
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  });

  let userLikes: Record<number, string> = {};
  
  if (session) {
    const likes = await db.like.findMany({
      where: { 
        userId: session.id,
        postId: { in: posts.map(p => p.id) }
      },
      select: {
        postId: true,
        type: true
      }
    });
    
    userLikes = likes.reduce((acc, like) => {
      acc[like.postId] = like.type;
      return acc;
    }, {} as Record<number, string>);
  }

  return posts.map(post => {
    return {
      ...post,
      type: post.type as PostType,
      category: post.category as PostCategory,
      isLiked: userLikes[post.id] === 'like',
      isDisliked: userLikes[post.id] === 'dislike',
      _count: {
        ...post._count,
        likes: post._count.likes,
        dislikes: 0,
        comments: post._count.comments
      }
    };
  });
}

export interface PostSummary {
  id: number;
  title: string;
  type: PostType;
  category: PostCategory;
  isAdult: boolean;
  created_at: Date;
  views: number;
  userId: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  user: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
    rank: string;
  };
  _count: {
    likes: number;
    dislikes: number;
    comments: number;
  };
}

export async function createPost(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as PostType;
  const category = formData.get("category") as PostCategory;
  const isAdult = formData.get("isAdult") === "true";

  if (!title || !content || !type || !category) {
    throw new Error("필수 입력값이 누락되었습니다.");
  }

  const data: Prisma.PostCreateInput = {
    title,
    content,
    type,
    category,
    isAdult,
    created_at: new Date(),
    user: {
      connect: { id: session.id }
    }
  };

  return await db.post.create({ data });
}

export async function toggleLike(postId: number) {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const existingLike = await db.like.findUnique({
    where: {
      postId_userId: {
        postId,
        userId: session.id
      }
    }
  });

  if (existingLike) {
    await db.like.delete({
      where: { 
        postId_userId: { 
          postId,
          userId: session.id 
        }
      }
    });
    return false;
  } 

  await db.like.create({
    data: {
      userId: session.id,
      postId: postId
    }
  });
  return true;
}

export async function getPost(id: number) {
  const post = await db.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
          rank: true,
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            }
          }
        },
        orderBy: {
          created_at: "desc"
        }
      },
      _count: {
        select: {
          comments: true,
          likes: true
        }
      },
      likes: true
    }
  });

  if (!post) return null;

  return {
    ...post,
    isLiked: false,
    isDisliked: false,
    _count: {
      likes: post.likes.filter(like => like.type === 'like').length,
      dislikes: post.likes.filter(like => like.type === 'dislike').length,
      comments: post._count.comments
    },
    likes: undefined
  };
}

export async function checkAdmin() {
  const session = await getSession();
  if (!session) return false;
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true }
  });
  return user?.role === "admin";
}

export async function getPostLikes(postId: number) {
  const session = await getSession();
  if (!session) return { isLiked: false, isDisliked: false, likesCount: 0, dislikesCount: 0 };
  
  const [like, counts] = await Promise.all([
    db.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.id!
        }
      },
      select: { type: true }
    }),
    db.like.groupBy({
      by: ['type'],
      where: { postId },
      _count: true
    })
  ]);
  
  const likesCount = counts.find(c => c.type === 'like')?._count || 0;
  const dislikesCount = counts.find(c => c.type === 'dislike')?._count || 0;
  
  return {
    isLiked: like?.type === 'like',
    isDisliked: like?.type === 'dislike',
    likesCount,
    dislikesCount
  };
} 