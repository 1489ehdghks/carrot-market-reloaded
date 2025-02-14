"use server"
import {db} from "@/lib/db";

// 기본 제품 조회 함수
export async function getProduct(id: number) {
  return await db.product.findUnique({
    where: { id },
  });
}

// ID만 선택하여 조회
export async function selectProductId(id: number) {
  return await db.product.findUnique({
    where: { id },
    select: { id: true }
  });
}

// 제품과 사용자 정보 함께 조회
export async function selectProductWithUser(id: number) {
  return await db.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
}

// 제품 기본 정보만 조회 (상품 목록용)
export async function selectProductBasic(id: number) {
  return await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      price: true,
      photo: true,
    }
  });
}

export async function getMoreProducts(page:number){
    const products = await db.product.findMany({
        select: {
          title: true,
          price: true,
          created_at: true,
          photo: true,
          id: true,
        },
        skip:page*1,
        take:1,
        orderBy: {
          created_at: "desc",
        },
      });
    return products;
}