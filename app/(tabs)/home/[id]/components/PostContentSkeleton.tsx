export default function PostContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-neutral-800 rounded-lg w-3/4" />
        <div className="h-6 bg-neutral-800 rounded-lg w-20" />
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-neutral-800 rounded-full" />
        <div className="h-5 bg-neutral-800 rounded w-32" />
      </div>
      
      <div className="space-y-3 pt-4">
        <div className="h-4 bg-neutral-800 rounded w-full" />
        <div className="h-4 bg-neutral-800 rounded w-full" />
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-800 rounded w-5/6" />
        <div className="h-4 bg-neutral-800 rounded w-full" />
      </div>
    </div>
  );
} 