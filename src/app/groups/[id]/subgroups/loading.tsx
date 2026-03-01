import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* 엔티티 헤더 */}
      <div className="space-y-1.5 mb-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-16" />
        ))}
      </div>

      {/* 서브그룹 목록 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>

      {/* 서브그룹 카드 목록 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-6 rounded-full border-2 border-background" />
                  ))}
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
