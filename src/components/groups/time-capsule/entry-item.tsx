"use client";

import React, { useState } from "react";
import {
  Lock,
  LockOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  PackageOpen,
  Target,
  Music2,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { calcDaysLeft } from "@/hooks/use-time-capsule";
import type { TimeCapsuleEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { DDayBadge } from "./time-capsule-utils";

// ============================================
// 메시지 추가 폼 (엔트리용 인라인)
// ============================================

function AddEntryMessageForm({
  entryId,
  onAdd,
}: {
  entryId: string;
  onAdd: (entryId: string, authorName: string, content: string) => boolean;
}) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.NAME_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MESSAGE_REQUIRED);
      return;
    }
    const success = onAdd(entryId, authorName.trim(), content.trim());
    if (!success) {
      toast.error(TOAST.TIME_CAPSULE_CARD.MESSAGE_ADD_ERROR);
      return;
    }
    toast.success(TOAST.TIME_CAPSULE_CARD.MESSAGE_ADDED);
    setAuthorName("");
    setContent("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded hover:bg-muted/40 transition-colors"
      >
        <MessageSquare className="h-3 w-3 shrink-0" />
        메시지 남기기
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1.5 pt-1">
      <Input
        placeholder="이름"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        className="h-7 text-xs"
        maxLength={30}
      />
      <Textarea
        placeholder="미래의 멤버들에게 전할 메시지를 작성해주세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-xs resize-none min-h-[72px]"
        maxLength={300}
      />
      <p className="text-[10px] text-muted-foreground text-right">
        {content.length}/300
      </p>
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => {
            setExpanded(false);
            setAuthorName("");
            setContent("");
          }}
        >
          취소
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          등록
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 스냅샷 엔트리 아이템 (확장)
// ============================================

type EntryItemProps = {
  entry: TimeCapsuleEntry;
  onDelete: (id: string) => boolean;
  onSeal: (id: string) => boolean;
  onOpen: (id: string) => boolean;
  onAddMessage: (entryId: string, authorName: string, content: string) => boolean;
};

export const EntryItem = React.memo(function EntryItem({
  entry,
  onDelete,
  onSeal,
  onOpen,
  onAddMessage,
}: EntryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const daysLeft = calcDaysLeft(entry.openDate);
  const canOpen = daysLeft <= 0 && !entry.isOpened;

  // 개봉 완료
  if (entry.isOpened) {
    return (
      <div className="rounded-md border border-green-200/70 bg-green-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {entry.title}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatYearMonthDay(entry.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>

        {/* 스냅샷 정보 */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-green-600">
            작성일: {formatYearMonthDay(entry.writtenAt)}
          </p>
          {entry.currentGoal && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-700">
                  목표
                </span>
              </div>
              <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
                {entry.currentGoal}
              </p>
            </div>
          )}
          {entry.currentRepertoire.length > 0 && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1">
                <Music2 className="h-2.5 w-2.5 text-purple-500" />
                <span className="text-[10px] font-semibold text-purple-700">
                  레퍼토리
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.currentRepertoire.map((r) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {entry.photoUrl && (
            <div className="bg-card/60 rounded px-2 py-1.5 space-y-1">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-[10px] font-semibold text-cyan-700">
                  그룹 사진
                </span>
              </div>
              <a
                href={entry.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 underline truncate block"
              >
                {entry.photoUrl}
              </a>
            </div>
          )}
        </div>

        {/* 멤버 메시지 */}
        {entry.messages.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-green-700">
              멤버 메시지 ({entry.messages.length})
            </p>
            {entry.messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-card/70 rounded px-2 py-1.5 space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-green-700">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] text-green-500">
                    {formatYearMonthDay(msg.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-green-900 leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 개봉 가능 (D-Day 도달)
  if (canOpen) {
    return (
      <div className="rounded-md border border-amber-200/70 bg-amber-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <PackageOpen className="h-3 w-3 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-800 flex-1 truncate">
            {entry.title}
          </span>
          <span className="text-[10px] text-amber-600 shrink-0">
            개봉 가능
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            const ok = onOpen(entry.id);
            if (ok) toast.success(TOAST.TIME_CAPSULE_CARD.OPENED);
            else toast.error(TOAST.TIME_CAPSULE_CARD.OPEN_ERROR);
          }}
        >
          <LockOpen className="h-3 w-3 mr-1" />
          지금 개봉하기
        </Button>
      </div>
    );
  }

  // 봉인 상태
  if (entry.isSealed) {
    return (
      <div className="rounded-md border border-indigo-200/60 bg-indigo-50/30 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-indigo-400 shrink-0" />
          <span className="text-xs font-medium text-foreground flex-1 truncate">
            {entry.title}
          </span>
          <DDayBadge openDate={entry.openDate} />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatYearMonthDay(entry.openDate)}
          </span>
          <button
            type="button"
            onClick={() => {
              const ok = onDelete(entry.id);
              if (ok) toast.success(TOAST.DELETE_SUCCESS);
            }}
            className="shrink-0"
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-indigo-500">
          <Lock className="h-2.5 w-2.5 shrink-0" />
          <span>
            봉인됨 · 메시지 {entry.messages.length}개
            {entry.currentRepertoire.length > 0 &&
              ` · 레퍼토리 ${entry.currentRepertoire.length}곡`}
          </span>
        </div>
      </div>
    );
  }

  // 미봉인 (편집 가능)
  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs font-medium text-foreground flex-1 truncate text-left">
            {entry.title}
          </span>
        </button>
        <DDayBadge openDate={entry.openDate} />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(entry.openDate)}
        </span>
        <button
          type="button"
          onClick={() => {
            const ok = onDelete(entry.id);
            if (ok) toast.success(TOAST.DELETE_SUCCESS);
          }}
          className="shrink-0"
          aria-label="삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      {/* 요약 정보 */}
      <div className="pl-5 flex flex-wrap gap-1.5">
        <span className="text-[10px] text-muted-foreground">
          메시지 {entry.messages.length}개
        </span>
        {entry.currentRepertoire.length > 0 && (
          <span className="text-[10px] text-purple-500">
            레퍼토리 {entry.currentRepertoire.length}곡
          </span>
        )}
        {entry.currentGoal && (
          <span className="text-[10px] text-orange-500">목표 있음</span>
        )}
        {entry.photoUrl && (
          <span className="text-[10px] text-cyan-500">사진 있음</span>
        )}
      </div>

      {expanded && (
        <div className="pl-5 space-y-2">
          {/* 스냅샷 상세 */}
          {entry.currentGoal && (
            <div className="bg-muted/30 rounded px-2 py-1.5 space-y-0.5">
              <div className="flex items-center gap-1">
                <Target className="h-2.5 w-2.5 text-orange-500" />
                <span className="text-[10px] font-semibold text-orange-600">
                  목표
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {entry.currentGoal}
              </p>
            </div>
          )}
          {entry.currentRepertoire.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Music2 className="h-2.5 w-2.5 text-purple-500" />
                <span className="text-[10px] font-semibold text-purple-600">
                  레퍼토리
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {entry.currentRepertoire.map((r) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {entry.photoUrl && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-[10px] font-semibold text-cyan-600">
                  그룹 사진
                </span>
              </div>
              <a
                href={entry.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 underline truncate block"
              >
                {entry.photoUrl}
              </a>
            </div>
          )}

          {/* 기존 메시지 미리보기 */}
          {entry.messages.length > 0 && (
            <div className="space-y-1">
              {entry.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-muted/40 rounded px-2 py-1.5 space-y-0.5"
                >
                  <span className="text-[10px] font-semibold text-foreground">
                    {msg.authorName}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 메시지 추가 폼 */}
          <AddEntryMessageForm entryId={entry.id} onAdd={onAddMessage} />

          {/* 봉인 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
            onClick={() => {
              const ok = onSeal(entry.id);
              if (ok) toast.success(TOAST.TIME_CAPSULE_CARD.SEALED);
              else toast.error(TOAST.TIME_CAPSULE_CARD.SEAL_ERROR);
            }}
          >
            <Lock className="h-3 w-3 mr-1" />
            봉인하기 (봉인 후 수정 불가)
          </Button>
        </div>
      )}
    </div>
  );
});
