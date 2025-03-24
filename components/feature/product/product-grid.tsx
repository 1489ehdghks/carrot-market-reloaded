import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: number;
  title: string;
  thumbnailUrl: string;
  isPublic: boolean;
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

  // 공개된 이미지만 필터링
  const publicProducts = products.filter(product => product.isPublic);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {publicProducts.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group"
        >
          <div className="aspect-square relative overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
            <Image
              src={product.thumbnailUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        </Link>
      ))}
      {hasMore && (
        <div ref={ref} className="col-span-full h-20 flex items-center justify-center">
          {isLoading && <div>Loading...</div>}
        </div>
      )}
      {isLoading && (
        <div className="col-span-full flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
} 