"use client";

import Link from "next/link";
import { formatKo } from "@/lib/date-utils";
import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { Megaphone, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoardPostWithDetails } from "@/types";

const NOTICE_KEYWORDS = ["공지사항", "notice"];
const MAX_NOTICES = 3;

interface BoardNoticeBannerProps {
  groupId: string;
  projectId?: string | null;
  basePath: string;
  nicknameMap?: Record<string, string>;
}

function useBoardNotices(groupId: string, projectId?: string | null) {
  const { data, isLoading } = useSWR(
    swrKeys.boardNotices(groupId, projectId),
    async () => {
      const supabase = createClient();

      // 현재 사용자 ID 조회 (예약 게시글 필터링에 사용)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      let query = supabase
        .from("board_posts")
        .select(
          "*, profiles(id, name, avatar_url), board_comments(count), board_post_likes(count), projects(id, name)",
        )
        .eq("group_id", groupId)
        .or(NOTICE_KEYWORDS.map((k) => `category.ilike.${k}`).join(","))
        .order("created_at", { ascending: false })
        .limit(MAX_NOTICES);

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        const { data: independentEntities } = await supabase.rpc(
          "get_independent_entity_ids",
          { p_group_id: groupId, p_feature: "board" },
        );
        const excludeIds = (independentEntities || []).map(
          (e: { entity_id: string }) => e.entity_id,
        );
        if (excludeIds.length > 0) {
          query = query.not(
            "project_id",
            "in",
            `(${excludeIds.join(",")})`,
          );
        }
      }

      // 예약 발행 필터 (즉시 발행 + 발행 시각 경과 + 내 예약 글)
      const nowIso = new Date().toISOString();
      if (userId) {
        query = query.or(
          `published_at.is.null,published_at.lte.${nowIso},author_id.eq.${userId}`,
        );
      } else {
        query = query.or(
          `published_at.is.null,published_at.lte.${nowIso}`,
        );
      }

      const { data: rows, error } = await query;
      if (error || !rows) return [] as BoardPostWithDetails[];

      return rows.map((post: Record<string, unknown>) => ({
        ...post,
        comment_count:
          (post.board_comments as { count: number }[])?.[0]?.count ?? 0,
        like_count:
          (post.board_post_likes as { count: number }[])?.[0]?.count ?? 0,
        board_comments: undefined,
        board_post_likes: undefined,
      })) as unknown as BoardPostWithDetails[];
    },
    { revalidateOnFocus: false },
  );

  return { notices: data ?? [], loading: isLoading };
}

export function BoardNoticeBanner({
  groupId,
  projectId,
  basePath,
  nicknameMap,
}: BoardNoticeBannerProps) {
  const { notices, loading } = useBoardNotices(groupId, projectId);
  const [collapsed, setCollapsed] = useState(false);

  const isIntegrated = !projectId;

  const getPostHref = (post: { id: string; project_id: string | null }) => {
    if (post.project_id && isIntegrated) {
      return `/groups/${groupId}/projects/${post.project_id}/board/${post.id}`;
    }
    return `${basePath}/${post.id}`;
  };

  // 공지 게시글이 없으면 배너 숨김
  if (loading || notices.length === 0) return null;

  return (
    <div
      className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 overflow-hidden"
      role="region"
      aria-label="공지사항 배너"
    >
      {/* 배너 헤더 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-1.5">
          <Megaphone
            className="h-3 w-3 text-yellow-600 dark:text-yellow-400 shrink-0"
            aria-hidden="true"
          />
          <span className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-300">
            공지사항
          </span>
          <span className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70">
            ({notices.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-5 px-1.5 text-[10px] gap-0.5",
            "text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100",
            "dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-900/50",
          )}
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls="notice-banner-list"
        >
          {collapsed ? (
            <>
              공지 펼치기
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </>
          ) : (
            <>
              공지 접기
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* 공지 목록 */}
      {!collapsed && (
        <div
          id="notice-banner-list"
          role="list"
          aria-label="공지사항 목록"
          className="divide-y divide-yellow-100 dark:divide-yellow-900/50"
        >
          {notices.map((post) => (
            <Link
              key={post.id}
              href={getPostHref(post)}
              role="listitem"
              aria-label={`공지: ${post.title}${post.comment_count > 0 ? `, 댓글 ${post.comment_count}개` : ""}`}
              className="flex flex-col px-3 py-1.5 gap-0.5 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/30 transition-colors text-xs"
            >
              {/* 제목 행 */}
              <div className="flex items-center gap-1.5">
                <span className="font-medium truncate text-yellow-900 dark:text-yellow-100">
                  {post.title}
                </span>
                {post.comment_count > 0 && (
                  <span
                    className="flex items-center gap-0.5 text-yellow-600/70 dark:text-yellow-400/70 shrink-0"
                    aria-label={`댓글 ${post.comment_count}개`}
                  >
                    <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" />
                    <span aria-hidden="true">{post.comment_count}</span>
                  </span>
                )}
              </div>
              {/* 작성자 + 날짜 행 */}
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-600/80 dark:text-yellow-400/70">
                <span className="truncate max-w-[8rem]">
                  {nicknameMap?.[post.author_id] || post.profiles?.name}
                </span>
                <span className="shrink-0 text-yellow-500/60">
                  {formatKo(new Date(post.created_at), "M/d")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
