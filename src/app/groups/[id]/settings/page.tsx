"use client";

import { use } from "react";
import Link from "next/link";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { SettingsContent } from "@/components/settings/settings-content";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);

  if (!loading && ctx && !ctx.permissions.canManageSettings) {
    return (
      <AppLayout>
        <div className="px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">접근 권한이 없습니다</p>
          <Button asChild size="sm" className="mt-2 h-7 text-xs">
            <Link href={`/groups/${id}`}>그룹으로 돌아가기</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} />
          <EntityNav ctx={ctx} />
          <SettingsContent ctx={ctx} group={ctx.raw.group!} />
        </>
      )}
    </EntityPageLayout>
  );
}
