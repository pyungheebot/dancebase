"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  MessageSquare,
  Trash2,
  Filter,
  Square,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { BackstageLogSession, BackstageLogCategory } from "@/types";
import { LogEntryItem } from "./log-entry-item";
import { EntryForm } from "./entry-form";
import { ResolveEntryDialog } from "./resolve-entry-dialog";

// ============================================================
// 세션 카드
// ============================================================

type SessionCardProps = {
  session: BackstageLogSession;
  onEnd: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onAddEntry: (
    sessionId: string,
    params: {
      senderName: string;
      message: string;
      category: BackstageLogCategory;
    }
  ) => void;
  onResolveEntry: (
    sessionId: string,
    entryId: string,
    resolvedBy: string
  ) => void;
  onDeleteEntry: (sessionId: string, entryId: string) => void;
};

export function SessionCard({
  session,
  onEnd,
  onDelete,
  onAddEntry,
  onResolveEntry,
  onDeleteEntry,
}: SessionCardProps) {
  const [expanded, setExpanded] = useState(session.isActive);
  const [filterUnresolved, setFilterUnresolved] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [resolveEntryId, setResolveEntryId] = useState<string | null>(null);
  const [resolvedBy, setResolvedBy] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  const entries = session.entries;
  const displayedEntries = filterUnresolved
    ? entries.filter((e) => !e.isResolved)
    : entries;
  const unresolvedCount = entries.filter((e) => !e.isResolved).length;

  useEffect(() => {
    if (expanded && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length, expanded]);

  const handleEnd = () => {
    onEnd(session.id);
    toast.success(TOAST.BACKSTAGE_LOG.SESSION_ENDED);
  };

  const handleResolveConfirm = useCallback(() => {
    if (resolveEntryId) {
      onResolveEntry(session.id, resolveEntryId, resolvedBy.trim());
      setResolveEntryId(null);
      setResolvedBy("");
      toast.success(TOAST.BACKSTAGE_LOG.ITEM_RESOLVED);
    }
  }, [resolveEntryId, resolvedBy, session.id, onResolveEntry]);

  const handleOpenResolve = useCallback((entryId: string) => {
    setResolveEntryId(entryId);
    setResolvedBy("");
  }, []);

  const headingId = `session-heading-${session.id}`;
  const contentId = `session-content-${session.id}`;

  return (
    <article
      className="border rounded-lg overflow-hidden"
      aria-labelledby={headingId}
    >
      {/* 세션 헤더 */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer ${
          session.isActive
            ? "bg-blue-50 border-b border-blue-100"
            : "bg-gray-50 border-b"
        }`}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={contentId}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {session.isActive ? (
            <span
              className="relative flex h-2 w-2 shrink-0"
              role="img"
              aria-label="진행 중"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          ) : (
            <span
              className="h-2 w-2 rounded-full bg-gray-300 shrink-0"
              role="img"
              aria-label="종료됨"
            />
          )}
          <h3
            id={headingId}
            className="text-xs font-medium truncate"
          >
            {session.showName}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0 flex items-center gap-0.5"
          >
            <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
            <time dateTime={session.showDate}>{session.showDate}</time>
          </Badge>
          {unresolvedCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200 shrink-0"
              aria-live="polite"
              aria-label={`미해결 ${unresolvedCount}건`}
            >
              미해결 {unresolvedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-gray-400" aria-label={`총 ${entries.length}건`}>
            {entries.length}건
          </span>
          {session.isActive && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2"
              aria-label="세션 종료"
              onClick={(e) => {
                e.stopPropagation();
                handleEnd();
              }}
            >
              <Square className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              종료
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            aria-label={`"${session.showName}" 세션 삭제`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteSessionOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* 세션 내용 */}
      {expanded && (
        <div id={contentId} className="p-3 space-y-3">
          {/* 필터 */}
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="로그 필터"
          >
            <Button
              size="sm"
              variant={filterUnresolved ? "default" : "outline"}
              className="h-6 text-[10px] px-2"
              aria-pressed={filterUnresolved}
              onClick={() => setFilterUnresolved((v) => !v)}
            >
              <Filter className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              미해결만
            </Button>
            <span
              className="text-[10px] text-gray-400"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayedEntries.length}건 표시 중
            </span>
          </div>

          {/* 로그 피드 */}
          {displayedEntries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-6 text-gray-400"
              role="status"
              aria-live="polite"
            >
              <MessageSquare className="h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
              <p className="text-xs">
                {filterUnresolved
                  ? "미해결 항목이 없습니다."
                  : "로그가 없습니다."}
              </p>
            </div>
          ) : (
            <ul
              className="space-y-1.5 max-h-64 overflow-y-auto pr-1"
              role="list"
              aria-label={`${session.showName} 로그 목록`}
              aria-live="polite"
            >
              {displayedEntries.map((entry) => (
                <LogEntryItem
                  key={entry.id}
                  entry={entry}
                  sessionId={session.id}
                  onResolve={handleOpenResolve}
                  onDelete={onDeleteEntry}
                />
              ))}
              <div ref={feedEndRef} aria-hidden="true" />
            </ul>
          )}

          {/* 항목 입력 폼 (활성 세션만) */}
          {session.isActive && (
            <EntryForm sessionId={session.id} onAdd={onAddEntry} />
          )}

          {!session.isActive && (
            <p
              className="text-[10px] text-center text-gray-400"
              role="status"
            >
              종료된 세션입니다.
            </p>
          )}
        </div>
      )}

      {/* 세션 삭제 확인 */}
      <ConfirmDialog
        open={deleteSessionOpen}
        onOpenChange={(open) => !open && setDeleteSessionOpen(false)}
        title="세션 삭제"
        description={`"${session.showName}" 세션과 모든 로그 항목(${entries.length}건)이 영구 삭제됩니다. 계속하시겠습니까?`}
        onConfirm={() => {
          onDelete(session.id);
          setDeleteSessionOpen(false);
          toast.success(TOAST.BACKSTAGE_LOG.SESSION_DELETED);
        }}
        destructive
      />

      {/* 해결 처리 다이얼로그 */}
      <ResolveEntryDialog
        open={resolveEntryId !== null}
        resolvedBy={resolvedBy}
        onResolvedByChange={setResolvedBy}
        onOpenChange={(open) => !open && setResolveEntryId(null)}
        onConfirm={handleResolveConfirm}
      />
    </article>
  );
}
