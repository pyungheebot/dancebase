import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <Skeleton className="h-7 w-16 mb-4" />

      {/* 탭 */}
      <div className="flex gap-1 mb-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* 전체 요약 바 */}
      <div className="flex items-center gap-4 border rounded px-3 py-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>

      {/* 그룹별 통계 */}
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded border px-3 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex gap-4 mb-1.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-12" />
              ))}
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* 그룹 운영 현황 카드 */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-1">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-0.5">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-10" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-3 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
