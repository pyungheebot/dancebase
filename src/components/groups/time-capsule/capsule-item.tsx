"use client";

import React, { useState } from "react";
import {
  Lock,
  LockOpen,
  ChevronDown,
  ChevronRight,
  Trash2,
  PackageOpen,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { calcDaysLeft } from "@/hooks/use-time-capsule";
import type { TimeCapsule } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { DDayBadge } from "./time-capsule-utils";

// ============================================
// 메시지 추가 폼 (인라인)
// ============================================

function AddMessageForm({
  capsuleId,
  onAdd,
}: {
  capsuleId: string;
  onAdd: (capsuleId: string, authorName: string, content: string) => boolean;
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
    const success = onAdd(capsuleId, authorName.trim(), content.trim());
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
// 개별 캡슐 아이템 (기본)
// ============================================

type CapsuleItemProps = {
  capsule: TimeCapsule;
  onDelete: (id: string) => void;
  onSeal: (id: string) => boolean;
  onOpen: (id: string) => boolean;
  onAddMessage: (
    capsuleId: string,
    authorName: string,
    content: string
  ) => boolean;
};

export const CapsuleItem = React.memo(function CapsuleItem({
  capsule,
  onDelete,
  onSeal,
  onOpen,
  onAddMessage,
}: CapsuleItemProps) {
  const [expanded, setExpanded] = useState(false);

  const daysLeft = calcDaysLeft(capsule.openDate);
  const canOpen = daysLeft <= 0 && !capsule.isOpened;

  if (capsule.isOpened) {
    return (
      <div className="rounded-md border border-green-200/70 bg-green-50/50 p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <LockOpen className="h-3 w-3 text-green-600 shrink-0" />
          <span className="text-xs font-medium text-green-800 flex-1 truncate">
            {capsule.title}
          </span>
          <span className="text-[10px] text-green-600 shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        {capsule.messages.length > 0 ? (
          <div className="space-y-1.5">
            {capsule.messages.map((msg) => (
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
        ) : (
          <p className="text-[10px] text-green-600 text-center py-1">
            메시지가 없습니다.
          </p>
        )}
      </div>
    );
  }

  if (canOpen) {
    return (
      <div className="rounded-md border border-amber-200/70 bg-amber-50/50 p-2.5 space-y-2">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-4deg); }
            40% { transform: rotate(4deg); }
            60% { transform: rotate(-3deg); }
            80% { transform: rotate(3deg); }
          }
          .shake-anim { animation: shake 0.6s ease-in-out infinite; }
        `}</style>
        <div className="flex items-center gap-1.5">
          <PackageOpen className="h-3 w-3 text-amber-600 shrink-0 shake-anim" />
          <span className="text-xs font-medium text-amber-800 flex-1 truncate">
            {capsule.title}
          </span>
          <span className="text-[10px] text-amber-600 shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉 가능
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => {
            const ok = onOpen(capsule.id);
            if (ok) toast.success(TOAST.TIME_CAPSULE.OPENED);
            else toast.error(TOAST.TIME_CAPSULE.OPEN_ERROR);
          }}
        >
          <LockOpen className="h-3 w-3 mr-1" />
          지금 개봉하기
        </Button>
      </div>
    );
  }

  if (capsule.isSealed) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground flex-1 truncate">
            {capsule.title}
          </span>
          <DDayBadge openDate={capsule.openDate} />
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatYearMonthDay(capsule.openDate)} 개봉
          </span>
          <button
            type="button"
            onClick={() => onDelete(capsule.id)}
            className="shrink-0"
            aria-label="캡슐 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-2.5 w-2.5 shrink-0" />
          <span>
            봉인됨 · 메시지 {capsule.messages.length}개 · 개봉일까지
            잠겨있습니다
          </span>
        </div>
      </div>
    );
  }

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
            {capsule.title}
          </span>
        </button>
        <DDayBadge openDate={capsule.openDate} />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {formatYearMonthDay(capsule.openDate)}
        </span>
        <button
          type="button"
          onClick={() => onDelete(capsule.id)}
          className="shrink-0"
          aria-label="캡슐 삭제"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground pl-5">
        메시지 {capsule.messages.length}개 작성됨
      </p>

      {expanded && (
        <div className="pl-5 space-y-2">
          {capsule.messages.length > 0 && (
            <div className="space-y-1">
              {capsule.messages.map((msg) => (
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

          <AddMessageForm capsuleId={capsule.id} onAdd={onAddMessage} />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
            onClick={() => {
              const ok = onSeal(capsule.id);
              if (ok) toast.success(TOAST.TIME_CAPSULE.SEALED);
              else toast.error(TOAST.TIME_CAPSULE_CARD.SEAL_ERROR);
            }}
          >
            <Lock className="h-3 w-3 mr-1" />
            봉인하기 (봉인 후 메시지 추가 불가)
          </Button>
        </div>
      )}
    </div>
  );
});
