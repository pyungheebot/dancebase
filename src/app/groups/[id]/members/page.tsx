"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { useAuth } from "@/hooks/use-auth";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { MembersContent } from "@/components/members/members-content";

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ctx, loading, refetch } = useGroupEntity(id);
  const { user } = useAuth();

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="멤버 관리자" />
          <EntityNav ctx={ctx} />
          <MembersContent
            ctx={ctx}
            currentUserId={user?.id || ""}
            categories={ctx.raw.categories}
            inviteCode={ctx.inviteCode || undefined}
            onUpdate={refetch}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
