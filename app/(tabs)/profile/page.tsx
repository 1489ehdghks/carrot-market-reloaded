"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircleIcon, CameraIcon, PencilIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { getUser, logout, updateAvatar, updateUsername, getUploadUrl, getUserBadges, getUserWorks } from "./actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatToWon } from "@/lib/utils";
import BadgeSection from "./components/BadgeSection";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getUser
  });

  // 탭 데이터 별도 조회
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['profile', 'badges'],
    queryFn: getUserBadges,
    enabled: false, // 탭 클릭시에만 로드
  });

  const { data: works, isLoading: worksLoading } = useQuery({
    queryKey: ['profile', 'works'],
    queryFn: getUserWorks,
    enabled: false,
  });

  // 아바타 업로드시 로딩 상태 관리
  const [isUploading, setIsUploading] = useState(false);

  // 아바타 업로드 처리
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Cloudflare 업로드 URL 받기
      const { success, result } = await getUploadUrl();
      if (!success) throw new Error("Failed to get upload URL");

      // 2. Cloudflare에 이미지 업로드
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(result.uploadURL, {
        method: "POST",
        body: formData,
      });
      if (response.status !== 200) throw new Error("Upload failed");

      // 3. DB에 이미지 URL 업데이트
      const imageId = result.id;
      const avatarUrl = `https://imagedelivery.net/qFmkldEesZWwLcDQ2Xdj7w/${imageId}`;
      await updateAvatar(avatarUrl);
      
      // 4. 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // 닉네임 변경 처리
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await updateUsername(newUsername);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditingUsername(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "닉네임 변경 실패");
    }
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full bg-neutral-800/50 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-48 bg-neutral-800/50 rounded animate-pulse" />
          <div className="h-6 w-24 bg-neutral-800/50 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {isUploading ? (
            <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : (
            user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <UserCircleIcon className="w-32 h-32 text-neutral-600" />
            )
          )}
          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full text-white hover:bg-orange-600 transition-colors cursor-pointer">
            <CameraIcon className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        
        <div>
          {isEditingUsername ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-neutral-800/50 backdrop-blur-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder={user.username}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-orange-600 transition-all"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="px-4 py-2 bg-neutral-800/50 backdrop-blur-sm rounded-lg hover:bg-neutral-700 transition-all"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <button
                onClick={() => {
                  setNewUsername(user.username);
                  setIsEditingUsername(true);
                }}
                className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-4 py-1.5 bg-orange-500 text-white text-md rounded-full">
              Lv.{user.level}
            </span>
            <span className="px-4 py-1.5 bg-neutral-800/80 backdrop-blur-sm text-md rounded-full capitalize">
              {user.rank}
            </span>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="포인트" value={formatToWon(user.points)} />
        <StatCard title="작품" value={user.totalCreated} />
        <StatCard title="좋아요" value={user.totalLikes} />
        <StatCard title="조회수" value={user.totalViews} />
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="works">
        <TabsList>
          <TabsTrigger value="works">작품</TabsTrigger>
          <TabsTrigger value="badges">뱃지</TabsTrigger>
          <TabsTrigger value="history">거래내역</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="works">
            {/* 작품 섹션 컴포넌트 */}
          </TabsContent>
          <TabsContent value="badges">
            <BadgeSection />
          </TabsContent>
          <TabsContent value="history">
            {/* 거래내역 섹션 컴포넌트 */}
          </TabsContent>
        </div>
      </Tabs>

      {/* 설정 & 로그아웃 */}
      <div className="space-y-4 mt-8 pt-8 border-t border-neutral-800">
        <button 
          className="w-full bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl hover:bg-neutral-700 transition-all"
          onClick={() => router.push('/settings')}
        >
          설정
        </button>
        <form action={logout}>
          <button 
            className="w-full bg-red-500/80 backdrop-blur-sm text-white p-4 rounded-xl hover:bg-red-600 transition-all"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-neutral-800/50 backdrop-blur-sm p-4 rounded-xl text-center hover:bg-neutral-800 transition-all">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="text-xl font-bold mt-2 text-white">{value}</div>
    </div>
  );
}

