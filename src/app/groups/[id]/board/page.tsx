"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { BoardContent } from "@/components/board/board-content";

export default function GroupBoardPage({
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
          <EntityHeader ctx={ctx} leaderLabel="게시판 관리자" />
          <EntityNav ctx={ctx} />
          <BoardContent ctx={ctx} />
        </>
      )}
    </EntityPageLayout>
  );
}
