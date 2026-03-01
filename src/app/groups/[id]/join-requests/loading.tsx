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

      {/* 가입 신청 관리 카드 */}
      <Card className="max-w-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
