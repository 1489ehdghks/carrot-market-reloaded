"use server"

import { selectProductWithUser } from "../actions";
import { unstable_cache as nextCache } from "next/cache";

export async function getCachedProduct(id: number) {
  return nextCache(
    selectProductWithUser,
    [`product-${id}`],
    {
      tags: ["products", `product-${id}`],
      revalidate: 60, // 1시간
    }
  )(id);
} 