"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Loader2 } from "lucide-react";
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
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!ctx) {
    return (
      <AppLayout>
        <div className="px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {notFoundMessage ?? "찾을 수 없습니다"}
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        {children(ctx)}
      </div>
    </AppLayout>
  );
}
