import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="max-w-lg mx-auto px-6 py-6">
      <Skeleton className="h-7 w-28 mb-4" />

      <Card>
        <CardHeader className="px-3 py-2">
          <Skeleton className="h-3 w-16" />
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          {/* 아바타 영역 */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>

          {/* 팔로워/팔로잉 */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* 폼 필드들 */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}

          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
