"use client";

import { BoardPostList } from "@/components/board/board-post-list";
import { BoardTrash } from "@/components/board/board-trash";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import type { EntityContext } from "@/types/entity-context";

type BoardContentProps = {
  ctx: EntityContext;
};

export function BoardContent({ ctx }: BoardContentProps) {
  const isLeader = ctx.permissions.canEdit;

  return (
    <>
      <IndependentToggle ctx={ctx} feature="board" featureLabel="게시판" />
      {isLeader && (
        <div className="flex justify-end mb-2">
          <BoardTrash groupId={ctx.groupId} nicknameMap={ctx.nicknameMap} />
        </div>
      )}
      <BoardPostList
        groupId={ctx.groupId}
        projectId={ctx.projectId}
        basePath={`${ctx.basePath}/board`}
        nicknameMap={ctx.nicknameMap}
        canWrite={ctx.permissions.canEdit}
      />
    </>
  );
}
