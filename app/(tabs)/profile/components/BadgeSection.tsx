"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserBadges } from "../actions";
import { Tooltip } from "@/components/ui/tooltip";
import { 
  TrophyIcon, 
  HeartIcon, 
  SparklesIcon,
  StarIcon,
  GiftIcon,
  RocketLaunchIcon 
} from "@heroicons/react/24/solid";
import { CustomTooltip } from "@/components/ui/custom-tooltip";

const ALL_BADGES = [
  {
    id: 1,
    name: "인기 크리에이터",
    description: "작품이 100개 이상의 좋아요를 받은 크리에이터",
    icon: HeartIcon,
    color: "text-pink-500",
    stats: {
      totalLikes: 100,
      currentLikes: 0,
    }
  },
  {
    id: 2,
    name: "후원자",
    description: "지속적인 후원으로 커뮤니티에 기여",
    icon: SparklesIcon,
    color: "text-yellow-500",
    stats: {
      totalMonths: 12,
      consecutiveMonths: 6,
      currentTotal: 0,
      currentConsecutive: 0,
    }
  },
  {
    id: 3,
    name: "1st Winner",
    description: "공식 대회/이벤트 1위 달성",
    icon: TrophyIcon,
    color: "text-amber-500",
    stats: {
      totalWins: 3,
      currentWins: 0,
      recentEvent: "Summer Art Contest 2024",
    }
  },
  {
    id: 4,
    name: "Grand Master",
    description: "모든 카테고리에서 다이아몬드 랭크 달성",
    icon: StarIcon,
    color: "text-blue-500",
    stats: {
      categories: [
        "2D 이미지", "2.5D 이미지", "실사 이미지",
        "2D 비디오", "2.5D 비디오", "실사 비디오"
      ],
      progress: 0,
    }
  },
  {
    id: 5,
    name: "Innovation Pioneer",
    description: "새로운 스타일과 기법으로 트렌드를 선도",
    icon: RocketLaunchIcon,
    color: "text-purple-500",
    stats: {
      innovations: 3, // 혁신적인 작품 수
      current: 0,
      followers: 0, // 해당 스타일을 따르는 작품 수
    }
  },
  {
    id: 6,
    name: "Community Angel",
    description: "고품질 에셋 기증으로 커뮤니티 발전에 기여",
    icon: GiftIcon,
    color: "text-emerald-500",
    stats: {
      donations: 10, // 필요한 기증 작품 수
      current: 0,
      helped: 0, // 도움 받은 사용자 수
    }
  }
];

export default function BadgeSection() {
  const { data: userBadges, isLoading } = useQuery({
    queryKey: ['profile', 'badges'],
    queryFn: getUserBadges,
  });

  if (isLoading) {
    return <div className="grid grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-square animate-pulse bg-neutral-800 rounded-lg" />
      ))}
    </div>;
  }

  const earnedBadgeIds = userBadges?.badges.map(b => b.badgeId) || [];

  return (
    <div className="space-y-8">
      {/* 획득한 뱃지 */}
      <div>
        <h3 className="text-lg font-medium mb-6 text-neutral-200 border-b border-neutral-800 pb-4">획득한 뱃지</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ALL_BADGES.filter(badge => earnedBadgeIds.includes(badge.id)).map(badge => (
            <Badge
              key={badge.id}
              {...badge}
              earned={true}
            />
          ))}
        </div>
      </div>

      {/* 도전 과제 */}
      <div>
        <h3 className="text-lg font-medium mb-6 text-neutral-200 border-b border-neutral-800 pb-4">도전 과제</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ALL_BADGES.filter(badge => !earnedBadgeIds.includes(badge.id)).map(badge => (
            <Badge
              key={badge.id}
              {...badge}
              earned={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Badge({ name, description, icon: Icon, color, earned, stats }: {
  name: string;
  description: string;
  icon: any;
  color: string;
  earned: boolean;
  stats: any;
}) {
  const tooltipContent = (
    <>
      {name === "Innovation Pioneer" && (
        <div className="text-sm space-y-1">
          <div className="text-neutral-300">
            혁신적 작품: {stats.current}/{stats.innovations}
          </div>
          <div className="text-neutral-400">
            영감을 준 크리에이터: {stats.followers}명
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full mt-1">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${(stats.current/stats.innovations)*100}%` }}
            />
          </div>
        </div>
      )}
      {name === "Community Angel" && (
        <div className="text-sm space-y-1">
          <div className="text-neutral-300">
            에셋 기증: {stats.current}/{stats.donations}
          </div>
          <div className="text-neutral-400">
            도움 받은 크리에이터: {stats.helped}명
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full mt-1">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(stats.current/stats.donations)*100}%` }}
            />
          </div>
        </div>
      )}
      {name === "인기 크리에이터" && (
        <div className="text-sm">
          <div className="text-neutral-300">좋아요 {stats.currentLikes}/100</div>
          <div className="w-full h-2 bg-neutral-800 rounded-full mt-1">
            <div 
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${(stats.currentLikes/stats.totalLikes)*100}%` }}
            />
          </div>
        </div>
      )}
      {name === "후원자" && (
        <div className="text-sm space-y-1">
          <div className="text-neutral-300">
            총 후원: {stats.currentTotal}/{stats.totalMonths}개월
          </div>
          <div className="text-neutral-300">
            연속 후원: {stats.currentConsecutive}/{stats.consecutiveMonths}개월
          </div>
        </div>
      )}
      {name === "1st Winner" && (
        <div className="text-sm space-y-1">
          <div className="text-neutral-300">
            우승 횟수: {stats.currentWins}/{stats.totalWins}
          </div>
          {stats.currentWins > 0 && (
            <div className="text-neutral-400">
              최근 우승: {stats.recentEvent}
            </div>
          )}
        </div>
      )}
      {name === "Grand Master" && (
        <div className="text-sm space-y-1">
          <div className="text-neutral-300">
            달성 진행도: {stats.progress}/6
          </div>
          <div className="text-xs text-neutral-400">
            {stats.categories.join(", ")}
          </div>
        </div>
      )}
    </>
  );

  return (
    <CustomTooltip
      title={name}
      description={description}
      content={tooltipContent}
    >
      <div className={`w-16 h-16 relative rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 ${
        earned 
          ? `bg-neutral-800 hover:bg-neutral-700 ${color} hover:scale-105` 
          : 'bg-neutral-900'
      }`}>
        <Icon className={`w-8 h-8 ${earned ? color : 'text-neutral-700'}`} />
        {!earned && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-sm text-neutral-400">?</div>
          </div>
        )}
      </div>
    </CustomTooltip>
  );
} 