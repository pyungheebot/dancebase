import { Skeleton } from "@/components/ui/skeleton";

function ScheduleRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-32 shrink-0 space-y-0.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-20 rounded" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <Skeleton className="h-7 w-24 mb-4" />

      {/* 진행 중 섹션 */}
      <div className="mb-4">
        <Skeleton className="h-4 w-24 mb-1" />
        <div className="divide-y border rounded-lg">
          {Array.from({ length: 2 }).map((_, i) => (
            <ScheduleRowSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* 다가오는 일정 섹션 */}
      <div className="mb-4">
        <Skeleton className="h-4 w-36 mb-1" />
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <ScheduleRowSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* 지난 일정 섹션 */}
      <div className="mb-4 opacity-60">
        <Skeleton className="h-4 w-28 mb-1" />
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <ScheduleRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
