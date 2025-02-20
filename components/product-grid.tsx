import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatToWon } from "@/lib/utils";

interface ProductGridProps {
  products: any[];
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
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
          <div className="mt-2 space-y-1">
            <h3 className="font-medium truncate">{product.title}</h3>
            <p className="text-sm text-neutral-500">
              ₩{formatToWon(product.price)}
            </p>
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