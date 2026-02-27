"use client";

import { BoardPostList } from "@/components/board/board-post-list";
import { BoardTrash } from "@/components/board/board-trash";
import { ContentModerationPanel } from "@/components/board/content-moderation-panel";
import { BookmarkedPostsSheet } from "@/components/board/bookmarked-posts-sheet";
import { PollDecisionLog } from "@/components/board/poll-decision-log";
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
      <div className="flex justify-end gap-1.5 mb-2">
        <PollDecisionLog groupId={ctx.groupId} basePath={`${ctx.basePath}/board`} />
        <BookmarkedPostsSheet groupId={ctx.groupId} />
        {isLeader && (
          <>
            <ContentModerationPanel groupId={ctx.groupId} />
            <BoardTrash groupId={ctx.groupId} nicknameMap={ctx.nicknameMap} />
          </>
        )}
      </div>
      <BoardPostList
        groupId={ctx.groupId}
        projectId={ctx.projectId}
        basePath={`${ctx.basePath}/board`}
        nicknameMap={ctx.nicknameMap}
        canWrite={ctx.permissions.canEdit}
        canEdit={ctx.permissions.canEdit}
      />
    </>
  );
}
