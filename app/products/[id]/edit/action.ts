"use server"

import db from "@/lib/db";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { productSchema } from "../../add/schema";
import getSession from "@/lib/session";

export async function getProduct(id: string) {
  const product = await db.product.findUnique({
    where: {
      id: +id,
    },
    select: {
      title: true,
      price: true,
      description: true,
      photo: true,
    },
  });
  return product;
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await getSession();
  if (!session.id) return { error: "권한이 없습니다." };
  
  const data = {
    photo: formData.get("photo"),
    title: formData.get("title"),
    price: formData.get("price"),
    description: formData.get("description"),
  };

  const result = productSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  }
  await db.product.update({
    where: {
      id: +id,
      userId: session.id,
    },
    data: {
      title: result.data.title,
      price: result.data.price,
      description: result.data.description,
      photo: result.data.photo,
    },
  });

  revalidateTag('products');
  return { success: true };
}