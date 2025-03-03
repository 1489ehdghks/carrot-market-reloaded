import Image from "next/image";
import Link from "next/link";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

interface User {
  id: number;
  username: string;
  avatar: string | null;
  level: number;
  rank: string;
  badges?: { id: number; name: string; color: string; }[];
}

export default function UserProfileCard({ user }: { user: User }) {
  return (
    <div className="w-64 bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 shadow-xl z-[9999]">
      {/* 헤더 - 배경 & 프로필 */}
      <div className="relative h-16 bg-gradient-to-r from-orange-500/20 to-pink-500/20">
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 ring-4 ring-neutral-900">
          <Image
            src={user.avatar || ""}
            alt={user.username}
            width={64}
            height={64}
            className="rounded-full w-16 h-16 object-cover"
          />
        </div>
      </div>

      {/* 유저 정보 */}
      <div className="pt-10 px-4 pb-4 z-[9999]">
        <div className="flex items-start justify-center text-center">
          <div>
            <Link 
              href={`/profile/${user.id}`} 
              className="font-medium text-lg hover:text-orange-500 transition-colors"
            >
              {user.username}
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-sm text-neutral-400">
              <span>Lv.{user.level}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {user.rank}
                {user.rank === "관리자" && (
                  <CheckBadgeIcon className="w-4 h-4 text-orange-500" />
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 뱃지 */}
        {user.badges && user.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {user.badges.slice(0, 3).map((badge) => (
              <div 
                key={badge.id} 
                className={`px-2 py-0.5 rounded text-xs ${badge.color}`}
                title={badge.name}
              >
                {badge.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 