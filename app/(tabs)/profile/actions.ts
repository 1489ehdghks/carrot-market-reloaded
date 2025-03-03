"use server"

import { db } from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";

export async function getUser() {
  const session = await getSession();
  if (!session.id) return null;

  return await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      avatar: true,
      role: true,
      level: true,
      exp: true,
      rank: true,
      rating: true,
      points: true,
      totalCreated: true,
      totalLikes: true,
      totalViews: true,
    }
  });
}

export async function logout() {
  const session = await getSession();
  await session.destroy();
  redirect("/");
}

export async function getUploadUrl() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
      }
    }
  );
  const { result, success } = await response.json();
  return { success, result };
}

export async function updateAvatar(avatarUrl: string) {
  const session = await getSession();
  if (!session.id) return null;

  return await db.user.update({
    where: { id: session.id },
    data: { 
      avatar: `${avatarUrl}/public` 
    }
  });
}

export async function updateUsername(username: string) {
  const session = await getSession();
  if (!session.id) return null;

  // 중복 체크
  const exists = await db.user.findUnique({
    where: { username }
  });

  if (exists) {
    throw new Error("이미 사용 중인 닉네임입니다.");
  }

  return await db.user.update({
    where: { id: session.id },
    data: { username }
  });
}

export async function getUserBadges() {
  const session = await getSession();
  if (!session.id) return null;

  return await db.user.findUnique({
    where: { id: session.id },
    select: {
      badges: {
        include: {
          badge: true
        }
      }
    }
  });
}

export async function getUserWorks() {
  const session = await getSession();
  if (!session.id) return null;

  return await db.user.findUnique({
    where: { id: session.id },
    select: {
      aiImages: {
        take: 12,
        orderBy: { created_at: 'desc' },
        select: { 
          id: true,
          title: true,
          thumbnailUrl: true 
        }
      },
      aiVideos: {
        take: 12,
        orderBy: { created_at: 'desc' },
        select: { 
          id: true,
          title: true,
          thumbnailUrl: true 
        }
      }
    }
  });
} 