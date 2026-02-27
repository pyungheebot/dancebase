"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { SettingsContent } from "@/components/settings/settings-content";
import { AppLayout } from "@/components/layout/app-layout";

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);

  if (!loading && ctx && !ctx.permissions.canManageSettings) {
    return (
      <AppLayout>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">접근 권한이 없습니다</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} />
          <EntityNav ctx={ctx} />
          <SettingsContent ctx={ctx} project={ctx.raw.project!} />
        </>
      )}
    </EntityPageLayout>
  );
}
