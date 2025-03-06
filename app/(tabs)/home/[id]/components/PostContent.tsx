"use client";

import { formatDate } from "@/lib/utils";
import UserProfileCard from "@/components/user-profile-card";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { Post } from "@/app/(tabs)/home/actions";
import Image from "next/image";

// HTML 태그 제거 함수
function stripHtmlTags(html: string) {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

export default function PostContent({ post }: { post: Post }) {
  // 이미지 URL 추출 (마크다운 또는 HTML에서)
  const imageUrls = extractImagesFromContent(post.content);
  
  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <span className="text-sm text-neutral-400">
          {formatDate(post.created_at)}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-neutral-800 rounded-full overflow-hidden">
          {post.user.avatar && (
            <Image 
              src={post.user.avatar} 
              alt={post.user.username}
              width={40}
              height={40}
              className="object-cover"
              loading="lazy" // 지연 로딩
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJcULXR7AAAAABJRU5ErkJggg=="
            />
          )}
        </div>
        <div>
          <p className="font-medium">{post.user.username}</p>
          <p className="text-sm text-neutral-400">Lv.{post.user.level} · {post.user.rank}</p>
        </div>
      </div>
      
      {/* 게시글 내용 */}
      <div className="py-4 prose prose-invert max-w-none">
        {/* 이미지 최적화 적용 */}
        {renderContentWithOptimizedImages(post.content, imageUrls)}
      </div>
    </article>
  );
}

// 게시글 내용에서 이미지 URL 추출
function extractImagesFromContent(content: string): string[] {
  const imgRegex = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["'].*?>/g;
  const urls: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    urls.push(match[1] || match[2]);
  }
  
  return urls;
}

// 최적화된 이미지로 콘텐츠 렌더링
function renderContentWithOptimizedImages(content: string, imageUrls: string[]): React.ReactNode {
  if (imageUrls.length === 0) {
    // 이미지가 없으면 그대로 렌더링
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  
  // 이미지가 있으면 최적화된 이미지로 교체
  let optimizedContent = content;
  imageUrls.forEach(url => {
    const imgTag = `<img src="${url}"`;
    const optimizedImgTag = `
      <div class="relative w-full aspect-video my-4">
        <img 
          src="${url}" 
          alt="게시글 이미지" 
          class="object-contain w-full h-full"
          loading="lazy"
        />
      </div>
    `;
    
    optimizedContent = optimizedContent.replace(imgTag, optimizedImgTag);
    
    // 마크다운 이미지도 교체
    const markdownImg = `![](${url})`;
    optimizedContent = optimizedContent.replace(markdownImg, optimizedImgTag);
  });
  
  return <div dangerouslySetInnerHTML={{ __html: optimizedContent }} />;
} 