import db from "@/lib/db";
import { unstable_cache as nextCache } from "next/cache";

export async function getProduct(id: number) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          username: true,
          avatar: true,
        },
      },
    },
  });
  return product;
}

export const getCachedProduct = nextCache(getProduct, ["product-detail"], {
  tags: ["product", "list"],
}); 