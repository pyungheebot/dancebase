import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 포트폴리오 헤더 */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* 프로필 배너 */}
      <Skeleton className="h-40 w-full rounded-xl" />

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-3 pb-3 text-center space-y-1">
              <Skeleton className="h-6 w-10 mx-auto" />
              <Skeleton className="h-3 w-14 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 프로젝트/공연 목록 */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24 mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
