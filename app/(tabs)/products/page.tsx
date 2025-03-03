"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ProductType, ProductCategory, getProducts } from "@/app/products/actions";
import ProductGrid from "@/components/product-grid";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ProductsPage() {
  const [type, setType] = useState<ProductType>("image");
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [isAdult, setIsAdult] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, error } = 
    useInfiniteQuery({
      initialPageParam: 1,
      queryKey: ["products", type, category, isAdult],
      queryFn: ({ pageParam = 1 }) => 
        getProducts({ type, category, isAdult, page: pageParam }),
      getNextPageParam: (lastPage: any[], allPages) => 
        lastPage.length === 20 ? allPages.length + 1 : undefined,
    });

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI 작품</h1>
        <Link
          href="/products/add"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          작품 등록
        </Link>
      </div>

      <Tabs defaultValue="image" onValueChange={(v: string) => setType(v as ProductType)}>
        <TabsList>
          <TabsTrigger value="image">이미지</TabsTrigger>
          <TabsTrigger value="video">비디오</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="all" onValueChange={(v: string) => 
        setCategory(v === "all" ? undefined : v as ProductCategory)
      }>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="2d">2D</TabsTrigger>
          <TabsTrigger value="2.5d">2.5D</TabsTrigger>
          <TabsTrigger value="realistic">실사</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-end">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            className="rounded"
          />
          <span>nsfw</span>
        </label>
      </div>

      <div className="flex justify-end gap-4 text-black">
        <select className="rounded-lg border p-2 w-24">
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="price">가격순</option>
        </select>
      </div>

      <ProductGrid
        products={data?.pages.flat() ?? []}
        onLoadMore={() => fetchNextPage()}
        hasMore={hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}