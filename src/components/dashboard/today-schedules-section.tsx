"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardErrorBoundary } from "@/components/shared/card-error-boundary";
import { useTodaySchedules } from "@/hooks/use-schedule";
import { formatTime } from "@/lib/date-utils";
import { Calendar } from "lucide-react";

function TodaySchedulesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          오늘의 일정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 py-1" aria-label="일정 불러오는 중" aria-busy="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </CardContent>
    </Card>
  );
}

function TodaySchedulesContent() {
  const { schedules: todaySchedules, loading } = useTodaySchedules();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          오늘의 일정
        </CardTitle>
      </CardHeader>
      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <div className="space-y-2 py-1" aria-label="일정 불러오는 중" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : todaySchedules.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">오늘 예정된 일정이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {todaySchedules.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <span
                  className="text-xs text-muted-foreground shrink-0 pt-0.5 w-10"
                  aria-label={`시간: ${formatTime(new Date(s.starts_at))}`}
                >
                  {formatTime(new Date(s.starts_at))}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.title}</p>
                  {s.location && (
                    <p className="text-[10px] text-muted-foreground truncate">{s.location}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TodaySchedulesSection() {
  return (
    <section aria-label="오늘의 일정">
      <CardErrorBoundary cardName="TodaySchedules">
        <Suspense fallback={<TodaySchedulesSkeleton />}>
          <TodaySchedulesContent />
        </Suspense>
      </CardErrorBoundary>
    </section>
  );
}
