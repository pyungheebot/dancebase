"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useBoard, useBoardCategories } from "@/hooks/use-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Pin, FolderOpen, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { BoardPostForm } from "./board-post-form";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface BoardPostListProps {
  groupId: string;
  projectId?: string | null;
  basePath: string;
  nicknameMap?: Record<string, string>;
  /** 헤더(제목+글쓰기)를 숨기고 목록만 표시 */
  hideHeader?: boolean;
  /** 현재 보고 있는 글 ID (하이라이트용) */
  activePostId?: string;
}

export function BoardPostList({
  groupId,
  projectId,
  basePath,
  nicknameMap,
  hideHeader,
  activePostId,
}: BoardPostListProps) {
  const { posts, loading, category, setCategory, search, setSearch, page, setPage, totalPages, refetch } = useBoard(groupId, projectId);
  const { filterCategories } = useBoardCategories(groupId);

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
          <BoardPostForm groupId={groupId} projectId={projectId} onCreated={refetch} />
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

      {/* 글 목록 — 한줄 컴팩트 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-muted-foreground">게시글이 없습니다</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={getPostHref(post)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 hover:bg-accent transition-colors text-xs",
                activePostId === post.id && "bg-accent"
              )}
            >
              {post.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
              <Badge variant="secondary" className="text-[10px] px-1 py-0 font-normal shrink-0">
                {post.category}
              </Badge>
              {isIntegrated && post.project_id && post.projects && (
                <span className="flex items-center gap-0.5 text-primary/70 shrink-0">
                  <FolderOpen className="h-3 w-3" />
                  <span className="text-[10px]">{post.projects.name}</span>
                </span>
              )}
              <span className="font-medium truncate">{post.title}</span>
              {post.comment_count > 0 && (
                <span className="flex items-center gap-0.5 text-muted-foreground shrink-0">
                  <MessageSquare className="h-2.5 w-2.5" />
                  {post.comment_count}
                </span>
              )}
              <span className="ml-auto shrink-0 text-muted-foreground">
                {nicknameMap?.[post.author_id] || post.profiles?.name}
              </span>
              <span className="shrink-0 text-muted-foreground/50">
                {format(new Date(post.created_at), "M/d", { locale: ko })}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
