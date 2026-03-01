"use client";

import { lazyLoad } from "@/lib/dynamic-import";

// 버튼 클릭 전까지 불필요한 시트/패널 컴포넌트 - dynamic import로 초기 번들 분리
const BoardTrash              = lazyLoad(() => import("@/components/board/board-trash").then(m => ({ default: m.BoardTrash })), { noLoading: true });
const ContentModerationPanel  = lazyLoad(() => import("@/components/board/content-moderation-panel").then(m => ({ default: m.ContentModerationPanel })), { noLoading: true });
const BookmarkedPostsSheet    = lazyLoad(() => import("@/components/board/bookmarked-posts-sheet").then(m => ({ default: m.BookmarkedPostsSheet })), { noLoading: true });
const PollDecisionLog         = lazyLoad(() => import("@/components/board/poll-decision-log").then(m => ({ default: m.PollDecisionLog })), { noLoading: true });

import { BoardPostList } from "@/components/board/board-post-list";
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
