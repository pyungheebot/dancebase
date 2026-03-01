"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardErrorBoundary } from "@/components/shared/card-error-boundary";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { FileText } from "lucide-react";

function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <FileText className="h-4 w-4" aria-hidden="true" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 py-1" aria-label="최근 활동 불러오는 중" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSection({ groupIds }: { groupIds: string[] }) {
  return (
    <section aria-label="최근 활동 피드">
      <CardErrorBoundary cardName="RecentActivityFeed">
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <RecentActivityFeed groupIds={groupIds} limit={20} />
        </Suspense>
      </CardErrorBoundary>
    </section>
  );
}
