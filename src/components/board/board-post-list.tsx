"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useBoard, useBoardCategories } from "@/hooks/use-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Heart, Pin, FolderOpen, Search, ChevronLeft, ChevronRight, FileText, SearchX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BoardPostForm } from "./board-post-form";
import { BoardNoticeBanner } from "./board-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** 검색어 하이라이트 컴포넌트 */
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  const trimmed = keyword.trim();
  if (!trimmed) return <>{text}</>;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-[2px] px-px">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface BoardPostListProps {
  groupId: string;
  projectId?: string | null;
  basePath: string;
  nicknameMap?: Record<string, string>;
  /** 헤더(제목+글쓰기)를 숨기고 목록만 표시 */
  hideHeader?: boolean;
  /** 현재 보고 있는 글 ID (하이라이트용) */
  activePostId?: string;
  /** 글 작성 권한 여부 (EmptyState CTA 표시 제어) */
  canWrite?: boolean;
}

export function BoardPostList({
  groupId,
  projectId,
  basePath,
  nicknameMap,
  hideHeader,
  activePostId,
  canWrite,
}: BoardPostListProps) {
  const { posts, loading, category, setCategory, search, setSearch, page, setPage, totalPages, refetch } = useBoard(groupId, projectId);
  const { filterCategories } = useBoardCategories(groupId);

  // 글쓰기 폼 오픈 상태 (EmptyState CTA와 공유)
  const [formOpen, setFormOpen] = useState(false);

  // 검색어 debounce
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  };
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // 통합 게시판 여부 (그룹 게시판에서 프로젝트 글도 보여줄 때)
  const isIntegrated = !projectId;

  const getPostHref = (post: { id: string; project_id: string | null }) => {
    if (post.project_id && isIntegrated) {
      return `/groups/${groupId}/projects/${post.project_id}/board/${post.id}`;
    }
    return `${basePath}/${post.id}`;
  };

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xs font-semibold">게시판</h1>
          <BoardPostForm
            groupId={groupId}
            projectId={projectId}
            onCreated={refetch}
            open={formOpen}
            onOpenChange={setFormOpen}
          />
        </div>
      )}

      {/* 검색창 */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="제목 또는 내용 검색"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-6 h-7 text-xs"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-1 mb-2">
        {filterCategories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* 공지사항 배너 */}
      <BoardNoticeBanner
        groupId={groupId}
        projectId={projectId}
        basePath={basePath}
        nicknameMap={nicknameMap}
      />

      {/* 글 목록 — 한줄 컴팩트 */}
      <div aria-live="polite" aria-atomic="false">
        {loading ? (
          <div className="rounded-lg border divide-y" aria-label="게시글 목록 불러오는 중" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="h-4 w-10 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12 shrink-0" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          search.trim() ? (
            <EmptyState
              icon={SearchX}
              title="검색 결과 없음"
              description={`"${search.trim()}"에 해당하는 게시글이 없습니다.`}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="게시글이 없습니다"
              description="첫 번째 게시글을 작성해보세요."
              action={
                canWrite && !hideHeader
                  ? { label: "글 작성", onClick: () => setFormOpen(true) }
                  : undefined
              }
            />
          )
        ) : (
          <div className="rounded-lg border divide-y" role="list" aria-label="게시글 목록">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={getPostHref(post)}
                role="listitem"
                aria-label={`${post.title}${post.is_pinned ? ", 고정 게시글" : ""}${post.comment_count > 0 ? `, 댓글 ${post.comment_count}개` : ""}${post.like_count > 0 ? `, 좋아요 ${post.like_count}개` : ""}`}
                className={cn(
                  "flex flex-col px-3 py-1.5 hover:bg-accent transition-colors text-xs gap-0.5",
                  activePostId === post.id && "bg-accent"
                )}
              >
                {/* 상단 행: 핀 + 카테고리 + 프로젝트 + 제목 + 댓글 수 */}
                <div className="flex items-center gap-1.5">
                  {post.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />}
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal shrink-0">
                    {post.category}
                  </Badge>
                  {isIntegrated && post.project_id && post.projects && (
                    <span className="flex items-center gap-0.5 text-primary/70 shrink-0">
                      <FolderOpen className="h-3 w-3" aria-hidden="true" />
                      <span className="text-[10px] hidden sm:inline">{post.projects.name}</span>
                    </span>
                  )}
                  <span className="font-medium truncate">
                    <HighlightText text={post.title} keyword={search} />
                  </span>
                  {post.comment_count > 0 && (
                    <span
                      className="flex items-center gap-0.5 text-muted-foreground shrink-0"
                      aria-label={`댓글 ${post.comment_count}개`}
                    >
                      <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" />
                      <span aria-hidden="true">{post.comment_count}</span>
                    </span>
                  )}
                  {post.like_count > 0 && (
                    <span
                      className="flex items-center gap-0.5 text-rose-400 shrink-0"
                      aria-label={`좋아요 ${post.like_count}개`}
                    >
                      <Heart className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                      <span aria-hidden="true">{post.like_count}</span>
                    </span>
                  )}
                </div>
                {/* 하단 행: 작성자 + 날짜 */}
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                  <span className="truncate max-w-[8rem]">
                    {nicknameMap?.[post.author_id] || post.profiles?.name}
                  </span>
                  <span className="text-muted-foreground/50 shrink-0">
                    {format(new Date(post.created_at), "M/d", { locale: ko })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-3" aria-label="게시글 페이지 탐색">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
          <span className="text-[11px] text-muted-foreground" aria-live="polite" aria-atomic="true">
            <span className="sr-only">현재 페이지: </span>{page}<span className="sr-only"> / 전체 {totalPages}페이지</span>
            <span aria-hidden="true"> / {totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}
