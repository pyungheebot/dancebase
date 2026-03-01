"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardErrorBoundary } from "@/components/shared/card-error-boundary";
import { StaleBanner } from "@/components/shared/stale-banner";
import { useSwrWithStale } from "@/hooks/use-swr-with-stale";
import { swrKeys } from "@/lib/swr/keys";
import { formatRelative } from "@/lib/date-utils";
import type { Notification } from "@/types";
import { Bell } from "lucide-react";
import Link from "next/link";

function RecentNotificationsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Bell className="h-4 w-4" aria-hidden="true" />
          최근 알림
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 py-1" aria-label="알림 불러오는 중" aria-busy="true">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

function RecentNotificationsContent() {
  const {
    data: notificationsData,
    error: notificationsError,
    isValidating: notificationsValidating,
    isLoading: notificationsLoading,
    isStale: notificationsStale,
    retry: retryNotifications,
  } = useSwrWithStale<Notification[]>(swrKeys.notifications());

  const notifications = (notificationsData ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Bell className="h-4 w-4" aria-hidden="true" />
          최근 알림
        </CardTitle>
      </CardHeader>
      <CardContent aria-live="polite" aria-atomic="false" className="space-y-3">
        {notificationsStale && (
          <StaleBanner
            error={notificationsError}
            isValidating={notificationsValidating}
            onRetry={retryNotifications}
          />
        )}
        {notificationsLoading ? (
          <div className="space-y-2 py-1" aria-label="알림 불러오는 중" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">새 알림이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-2">
                {!n.is_read && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"
                    aria-label="읽지 않은 알림"
                  />
                )}
                <div className={`min-w-0 ${n.is_read ? "ml-3.5" : ""}`}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="text-xs font-medium hover:underline truncate block"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-xs font-medium truncate">{n.title}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {formatRelative(new Date(n.created_at))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentNotificationsSection() {
  return (
    <section aria-label="최근 알림">
      <CardErrorBoundary cardName="RecentNotifications">
        <Suspense fallback={<RecentNotificationsSkeleton />}>
          <RecentNotificationsContent />
        </Suspense>
      </CardErrorBoundary>
    </section>
  );
}
