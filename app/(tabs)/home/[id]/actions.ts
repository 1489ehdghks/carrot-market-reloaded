"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PostType, PostCategory } from "../actions";

export async function getPost(id: number) {
  try {
    // 조회수 증가 (await 없이 실행하여 응답 속도 향상)
    db.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(error => console.error("조회수 증가 실패:", error));
    
    const session = await getSession();
    console.log("session:",session);
    
    const post = await db.post.findUnique({
      where: { id },
      include: {
        user: true,
        comments: {
          include: { user: true },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: { 
            comments: true,
            likes: true
          }
        },
        likes: session ? {
          where: { userId: session.id },
        } : false
      }
    });
    console.log("post:",post);
    if (!post) return null;

    return {
      ...post,
      type: post.type as PostType,
      category: post.category as PostCategory,
      isLiked: post.likes?.some(like => like.type === 'like') ?? false,
      isDisliked: post.likes?.some(like => like.type === 'dislike') ?? false,
      _count: {
        likes: post.likes?.filter(like => like.type === 'like').length ?? 0,
        dislikes: post.likes?.filter(like => like.type === 'dislike').length ?? 0,
        comments: post._count.comments
      },
      likes: undefined,
      views: post.views + 1
    };
  } catch (error) {
    console.error("게시글 조회 실패:", error);
    return null;
  }
}

export async function togglePostReaction(postId: number, type: 'like' | 'dislike' = 'like') {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");

  try {
    // 비동기 작업을 병렬로 처리
    const existingLikePromise = db.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.id
        }
      },
      select: {
        id: true,
        type: true
      }
    });

    const existingLike = await existingLikePromise;

    if (existingLike) {
      if (existingLike.type === type) {
        // 같은 타입이면 취소 (await 없이 실행)
        db.like.delete({
          where: { id: existingLike.id }
        }).catch(error => console.error("좋아요 취소 실패:", error));
        return false;
      } else {
        // 다른 타입이면 업데이트 (await 없이 실행)
        db.like.update({
          where: { id: existingLike.id },
          data: { type }
        }).catch(error => console.error("좋아요 업데이트 실패:", error));
        return true;
      }
    } else {
      // 새로 생성 (await 없이 실행)
      db.like.create({
        data: {
          type,
          post: { connect: { id: postId } },
          user: { connect: { id: session.id } }
        }
      }).catch(error => console.error("좋아요 생성 실패:", error));
      return true;
    }
  } catch (error) {
    console.error("좋아요 처리 실패:", error);
    throw error;
  }
}

export async function getComments(postId: number) {
  return await db.comment.findMany({
    where: { postId },
    include: { user: true },
    orderBy: { created_at: 'desc' }
  });
}

export async function createComment(postId: number, content: string) {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");

  // 댓글 생성 (await 없이 실행)
  const commentPromise = db.comment.create({
    data: {
      content,
      post: { connect: { id: postId } },
      user: { connect: { id: session.id } }
    },
    select: {
      id: true,
      content: true,
      created_at: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      }
    }
  });

  // 게시글 댓글 수 업데이트 (병렬 실행)
  const updatePostPromise = db.post.update({
    where: { id: postId },
    data: { commentsCount: { increment: 1 } }
  }).catch(error => console.error("댓글 수 업데이트 실패:", error));

  // 댓글 생성 결과 반환
  return await commentPromise;
}

// 게시글 상세 조회 (상세 화면용)
export async function getPostWithDetails(id: number) {
  try {
    // 조회수 증가 (await 없이 실행하여 응답 속도 향상)
    db.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(error => console.error("조회수 증가 실패:", error));
    
    const session = await getSession();
    
    const post = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        category: true,
        isAdult: true,
        created_at: true,
        updated_at: true,
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
        },
        likes: session ? {
          where: { userId: session.id },
          select: {
            type: true
          }
        } : false
      }
    });
    
    if (!post) return null;

    return {
      ...post,
      type: post.type as PostType,
      category: post.category as PostCategory,
      isLiked: post.likes?.some(like => like.type === 'like') ?? false,
      isDisliked: post.likes?.some(like => like.type === 'dislike') ?? false,
      _count: {
        likes: post.likes?.filter(like => like.type === 'like').length ?? 0,
        dislikes: post.likes?.filter(like => like.type === 'dislike').length ?? 0,
        comments: post._count.comments
      },
      likes: undefined,
      views: post.views + 1
    };
  } catch (error) {
    console.error("게시글 조회 실패:", error);
    return null;
  }
}

// 댓글 조회 (페이지네이션 적용)
export async function getCommentsForPost(postId: number, cursor = 0, limit = 10) {
  const comments = await db.comment.findMany({
    where: { postId },
    select: {
      id: true,
      content: true,
      created_at: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit + 1, // 다음 페이지 확인을 위해 하나 더 가져옴
    skip: cursor,
  });

  const hasMore = comments.length > limit;
  const nextCursor = hasMore ? cursor + limit : undefined;
  
  return {
    comments: comments.slice(0, limit),
    hasMore,
    nextCursor
  };
}

// 게시글 상세 조회 함수 최적화
export async function getPostWithDetailsOptimized(id: number) {
  try {
    // 조회수 증가는 별도 비동기 작업으로 처리 (await 없이)
    db.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(error => console.error("조회수 증가 실패:", error));
    
    const session = await getSession();
    
    // 필요한 데이터만 선택적으로 가져오기
    const post = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        category: true,
        isAdult: true,
        created_at: true,
        updated_at: true,
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
            comments: true
          }
        }
      }
    });
    
    if (!post) return null;

    // 좋아요 정보는 별도로 가져오기 (병렬 처리)
    let likeInfo = { isLiked: false, isDisliked: false, likesCount: 0, dislikesCount: 0 };
    
    if (session) {
      // 좋아요 정보 가져오기 (비동기 처리)
      const likeInfoPromise = getLikeInfo(id, session.id);
      
      // 좋아요 정보가 없어도 UI 렌더링 가능하도록 기본값 반환
      likeInfoPromise.then(info => {
        likeInfo = info;
      }).catch(error => {
        console.error("좋아요 정보 조회 실패:", error);
      });
    }

    return {
      ...post,
      type: post.type as PostType,
      category: post.category as PostCategory,
      isLiked: likeInfo.isLiked,
      isDisliked: likeInfo.isDisliked,
      _count: {
        likes: likeInfo.likesCount,
        dislikes: likeInfo.dislikesCount,
        comments: post._count.comments
      },
      views: post.views + 1 // UI에 즉시 반영
    };
  } catch (error) {
    console.error("게시글 조회 실패:", error);
    return null;
  }
}

// 좋아요 정보만 별도로 가져오는 함수
async function getLikeInfo(postId: number, userId: number) {
  try {
    const [userLike, likeCounts] = await Promise.all([
      db.like.findUnique({
        where: {
          postId_userId: {
            postId,
            userId
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
    
    return {
      isLiked: userLike?.type === 'like',
      isDisliked: userLike?.type === 'dislike',
      likesCount: likeCounts.find(c => c.type === 'like')?._count || 0,
      dislikesCount: likeCounts.find(c => c.type === 'dislike')?._count || 0
    };
  } catch (error) {
    console.error("좋아요 정보 조회 실패:", error);
    return { isLiked: false, isDisliked: false, likesCount: 0, dislikesCount: 0 };
  }
}

// 이미지 URL 최적화 함수
export async function optimizeImageUrl(url: string) {
  // 이미지 URL이 외부 URL인 경우 이미지 프록시 사용
  if (url.startsWith('http') && !url.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
    // Cloudinary나 Imgix 같은 이미지 최적화 서비스 사용 예시
    return `https://res.cloudinary.com/your-account/image/fetch/f_auto,q_auto,w_800/${encodeURIComponent(url)}`;
  }
  
  // 내부 이미지인 경우 그대로 반환
  return url;
}

// 게시글 좋아요 정보 가져오기
export async function getPostLikes(postId: number) {
  const session = await getSession();
  
  try {
    // 좋아요 정보 가져오기
    return await getLikeInfo(postId, session?.id || -1);
  } catch (error) {
    console.error("좋아요 정보 조회 실패:", error);
    return { isLiked: false, isDisliked: false, likesCount: 0, dislikesCount: 0 };
  }
} 