/**
 * FAQ 편집 아이템 컴포넌트
 *
 * - FAQPreviewItem: 접기/펼치기 가능한 미리보기 아이템
 * - FAQEditItem: 인라인 편집 + 순서 변경 + 삭제 가능한 편집 아이템
 */

"use client";

import React, { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Check,
  X,
  MessageCircleQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { AudienceGuideFAQ } from "@/types";

// ============================================================
// 미리보기 아이템
// ============================================================

/** FAQ 질문/답변 아코디언 미리보기 */
export const FAQPreviewItem = memo(function FAQPreviewItem({
  faq,
}: {
  faq: AudienceGuideFAQ;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <MessageCircleQuestion className="h-3 w-3 text-cyan-500 shrink-0" />
            {faq.question}
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="px-3 pb-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {faq.answer}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ============================================================
// 편집 아이템 Props
// ============================================================

export interface FAQEditItemProps {
  sectionId: string;
  faq: AudienceGuideFAQ;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    sectionId: string,
    faqId: string,
    patch: Partial<Pick<AudienceGuideFAQ, "question" | "answer">>
  ) => void;
  onRemove: (sectionId: string, faqId: string) => void;
  onMoveUp: (sectionId: string, faqId: string) => void;
  onMoveDown: (sectionId: string, faqId: string) => void;
}

// ============================================================
// 편집 아이템
// ============================================================

/** FAQ 인라인 편집 + 순서 이동 + 삭제 */
export const FAQEditItem = memo(function FAQEditItem({
  sectionId,
  faq,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: FAQEditItemProps) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(faq.question);
  const [a, setA] = useState(faq.answer);

  /** 수정 저장 */
  function handleSave() {
    if (!q.trim() || !a.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.QA_REQUIRED);
      return;
    }
    onUpdate(sectionId, faq.id, { question: q.trim(), answer: a.trim() });
    setEditing(false);
    toast.success(TOAST.AUDIENCE_GUIDE.FAQ_UPDATED);
  }

  /** 수정 취소 - 원본 값으로 복원 */
  function handleCancel() {
    setQ(faq.question);
    setA(faq.answer);
    setEditing(false);
  }

  /** FAQ 삭제 */
  function handleRemove() {
    onRemove(sectionId, faq.id);
    toast.success(TOAST.AUDIENCE_GUIDE.FAQ_DELETED);
  }

  // 인라인 편집 모드
  if (editing) {
    return (
      <div className="border rounded-md p-2 space-y-1.5 bg-muted/30">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="질문"
          className="h-7 text-xs"
        />
        <Textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="답변"
          rows={2}
          className="text-xs resize-none"
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={handleSave}
          >
            <Check className="h-3 w-3 mr-1" aria-hidden />
            저장
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2"
            onClick={handleCancel}
          >
            <X className="h-3 w-3 mr-1" aria-hidden />
            취소
          </Button>
        </div>
      </div>
    );
  }

  // 보기 모드
  return (
    <div
      role="listitem"
      className="border rounded-md px-2 py-1.5 flex items-start gap-1 group hover:bg-muted/20 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-1">{faq.question}</p>
        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
          {faq.answer}
        </p>
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isFirst}
          onClick={() => onMoveUp(sectionId, faq.id)}
          aria-label="FAQ 위로 이동"
        >
          <ArrowUp className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isLast}
          onClick={() => onMoveDown(sectionId, faq.id)}
          aria-label="FAQ 아래로 이동"
        >
          <ArrowDown className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setEditing(true)}
          aria-label="FAQ 수정"
        >
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={handleRemove}
          aria-label="FAQ 삭제"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  );
});
