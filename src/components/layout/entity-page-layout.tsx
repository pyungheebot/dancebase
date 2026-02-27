"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import type { EntityContext } from "@/types/entity-context";

type EntityPageLayoutProps = {
  ctx: EntityContext | null;
  loading: boolean;
  notFoundMessage?: string;
  children: (ctx: EntityContext) => React.ReactNode;
};

export function EntityPageLayout({
  ctx,
  loading,
  notFoundMessage,
  children,
}: EntityPageLayoutProps) {
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 space-y-4">
          {/* 헤더 스켈레톤 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {/* 네비게이션 스켈레톤 */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 w-14" />
            ))}
          </div>
          {/* 콘텐츠 스켈레톤 (멤버 행 형태) */}
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border px-3 py-2 flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!ctx) {
    return (
      <AppLayout>
        <div className="px-3 md:px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {notFoundMessage ?? "찾을 수 없습니다"}
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-6">
        <ErrorBoundary>
          {children(ctx)}
        </ErrorBoundary>
      </div>
    </AppLayout>
  );
}
