export default function CommentSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-neutral-800 rounded-lg w-1/3" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-neutral-700 rounded-full" />
              <div className="h-4 bg-neutral-700 rounded w-32" />
            </div>
            <div className="h-4 bg-neutral-700 rounded w-full mb-2" />
            <div className="h-4 bg-neutral-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
} 