"use client";

import { BoardPostList } from "@/components/board/board-post-list";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import type { EntityContext } from "@/types/entity-context";

type BoardContentProps = {
  ctx: EntityContext;
};

export function BoardContent({ ctx }: BoardContentProps) {
  return (
    <>
      <IndependentToggle ctx={ctx} feature="board" featureLabel="게시판" />
      <BoardPostList
        groupId={ctx.groupId}
        projectId={ctx.projectId}
        basePath={`${ctx.basePath}/board`}
        nicknameMap={ctx.nicknameMap}
      />
    </>
  );
}
