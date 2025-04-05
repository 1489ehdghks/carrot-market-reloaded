import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  thumbnailUrl: string;
  category?: string;
  user?: {
    username: string;
    avatar?: string;
  };
  isAdult?: boolean;
}

interface ProductGridProps {
  products: Product[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export default function ProductGrid({
  products,
  onLoadMore,
  hasMore,
  isLoading,
}: ProductGridProps) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  // 이미지 로딩 에러 처리를 위한 상태
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  // 이미지 로드 실패 핸들러
  const handleImageError = (id: number) => {
    setFailedImages(prev => ({
      ...prev,
      [id]: true
    }));
    console.log(`이미지 로드 실패: ID ${id}`);
  };

  return (
    <div>
      {products.length === 0 && !isLoading ? (
        <div className="col-span-full text-center py-10 text-neutral-500">
          표시할 이미지가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="relative">
                <div className="aspect-square relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                  {product.isAdult && (
                    <span className="absolute top-2 right-2 z-10 px-1 py-0.5 text-xs bg-red-500 text-white rounded">
                      19+
                    </span>
                  )}
                  <Image
                    src={failedImages[product.id] ? '/images/placeholder.png' : product.thumbnailUrl}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    onError={() => handleImageError(product.id)}
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium line-clamp-1">{product.title}</h3>
                  {product.user && (
                    <p className="text-xs text-neutral-500 mt-1">{product.user.username}</p>
                  )}
                  {product.category && (
                    <span className="text-xs bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {product.category}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {hasMore && (
            <div ref={ref} className="col-span-full h-20 flex items-center justify-center">
              {isLoading && <div>Loading...</div>}
            </div>
          )}
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
} 