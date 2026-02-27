"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { useAuth } from "@/hooks/use-auth";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { MembersContent } from "@/components/members/members-content";
import { toEntityMember } from "@/lib/entity-utils";

export default function ProjectMembersPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading, refetch } = useProjectEntity(id, projectId);
  const { user } = useAuth();

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="멤버 관리자" />
          <EntityNav ctx={ctx} />
          <MembersContent
            ctx={ctx}
            currentUserId={user?.id || ""}
            parentMembers={ctx.raw.groupMembers.map(toEntityMember)}
            onUpdate={refetch}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
