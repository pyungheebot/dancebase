import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* 뒤로가기 버튼 */}
      <Skeleton className="h-7 w-14 mb-3" />

      {/* 게시글 헤더 */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      <Skeleton className="h-px w-full my-3" />

      {/* 댓글 섹션 */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
