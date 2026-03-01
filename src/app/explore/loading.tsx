import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <Skeleton className="h-7 w-16 mb-4" />

      {/* 탭 */}
      <div className="flex gap-1 mb-4">
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-7 w-24" />
      </div>

      {/* 검색바 */}
      <Skeleton className="h-7 w-full mb-2" />

      {/* 장르 필터 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-12 rounded-full" />
        ))}
      </div>

      {/* 그룹 목록 */}
      <div className="rounded border divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
