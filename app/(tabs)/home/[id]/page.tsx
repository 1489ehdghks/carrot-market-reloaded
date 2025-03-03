import { Suspense } from 'react';
import { getPostWithDetailsOptimized } from "./actions";
import PostContent from "./components/PostContent";
import PostActions from "./components/PostActions";
import { PostType, PostCategory } from "../actions";
import { notFound } from "next/navigation";
import CommentSectionSkeleton from './components/CommentSectionSkeleton';
import PostContentSkeleton from './components/PostContentSkeleton';

// 댓글 섹션을 동적으로 임포트하여 지연 로딩
import dynamic from 'next/dynamic';
const CommentSection = dynamic(() => import('./components/CommentSection'), {
  loading: () => <CommentSectionSkeleton />
});

export default async function PostPage({ params }: { params: { id: string } }) {
  // params 객체 자체를 await
  params = await params;
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 게시글 내용 - 서스펜스 적용 */}
      <Suspense fallback={<PostContentSkeleton />}>
        <PostDetail id={parseInt(params.id)} />
      </Suspense>
    </div>
  );
}

// 게시글 상세 정보 컴포넌트 분리
async function PostDetail({ id }: { id: number }) {
  const post = await getPostWithDetailsOptimized(id);
  
  if (!post) {
    notFound();
  }
  
  const typedPost = {
    ...post,
    type: post.type as PostType,
    category: post.category as PostCategory
  };

  return (
    <>
      {/* 게시글 내용 */}
      <PostContent post={typedPost} />
      
      {/* 게시글 액션 (좋아요, 공유 등) */}
      <PostActions post={typedPost} />
      
      {/* 댓글 섹션 - 지연 로딩 */}
      <Suspense fallback={<CommentSectionSkeleton />}>
        <CommentSection postId={post.id} />
      </Suspense>
    </>
  );
} 