export default function ProfileLoading() {
    return (
        <div className="p-5 max-w-xl mx-auto">
            {/* 프로필 헤더 스켈레톤 */}
            <div className="flex flex-col items-center gap-5 mb-8">
                {/* 프로필 이미지 스켈레톤 */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-neutral-800 animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-neutral-700 animate-pulse" />
                </div>
                
                {/* 사용자 이름 스켈레톤 */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-32 bg-neutral-800 rounded-lg animate-pulse" />
                    <div className="h-6 w-16 bg-neutral-800 rounded-full animate-pulse" />
                </div>
            </div>

            {/* 프로필 정보 스켈레톤 */}
            <div className="space-y-6">
                {/* 통계 스켈레톤 */}
                <div className="grid grid-cols-3 gap-4 bg-neutral-800 p-4 rounded-xl">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="text-center">
                            <div className="h-8 w-12 bg-neutral-700 rounded mx-auto mb-2 animate-pulse" />
                            <div className="h-4 w-16 bg-neutral-700 rounded mx-auto animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* 메뉴 버튼 스켈레톤 */}
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div 
                            key={i}
                            className="w-full h-14 bg-neutral-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>

                {/* 로그아웃 버튼 스켈레톤 */}
                <div className="w-full h-14 bg-neutral-700 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}