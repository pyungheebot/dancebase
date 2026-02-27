"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="프로젝트장" />
          <EntityNav ctx={ctx} />
          <DashboardContent ctx={ctx} />
        </>
      )}
    </EntityPageLayout>
  );
}
