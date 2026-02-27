"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { SubgroupList } from "@/components/subgroups/subgroup-list";
import { SubgroupPerformanceSection } from "@/components/subgroups/subgroup-performance";

export default function SubgroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="그룹장" />
          <EntityNav ctx={ctx} />
          <SubgroupList groupId={id} canManage={ctx.permissions.canEdit} />
          {ctx.permissions.canEdit && (
            <SubgroupPerformanceSection groupId={id} />
          )}
        </>
      )}
    </EntityPageLayout>
  );
}
