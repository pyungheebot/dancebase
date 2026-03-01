/**
 * 섹션 편집 카드 컴포넌트
 *
 * 섹션의 제목/유형/본문 인라인 편집 + FAQ 목록 관리를 담당한다.
 * 접기/펼치기 가능한 Collapsible 구조.
 */

"use client";

import React, { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { SECTION_TYPE_LABELS } from "@/hooks/use-audience-guide";
import { SectionTypeBadge, ALL_SECTION_TYPES } from "./audience-guide-types";
import { FAQEditItem } from "./faq-edit-item";
import type {
  AudienceGuideSection,
  AudienceGuideSectionType,
  AudienceGuideFAQ,
} from "@/types";

// ============================================================
// Props
// ============================================================

export interface SectionEditCardProps {
  section: AudienceGuideSection;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<AudienceGuideSection, "type" | "title" | "content" | "isVisible">
    >
  ) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onAddFAQ: (sectionId: string, q: string, a: string) => void;
  onUpdateFAQ: (
    sectionId: string,
    faqId: string,
    patch: Partial<Pick<AudienceGuideFAQ, "question" | "answer">>
  ) => void;
  onRemoveFAQ: (sectionId: string, faqId: string) => void;
  onMoveFAQUp: (sectionId: string, faqId: string) => void;
  onMoveFAQDown: (sectionId: string, faqId: string) => void;
}

// ============================================================
// 컴포넌트
// ============================================================

/** 관객 안내 섹션 편집 카드 (제목/유형/본문/FAQ 관리) */
export const SectionEditCard = memo(function SectionEditCard({
  section,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onAddFAQ,
  onUpdateFAQ,
  onRemoveFAQ,
  onMoveFAQUp,
  onMoveFAQDown,
}: SectionEditCardProps) {
  // 섹션 접기/펼치기
  const [open, setOpen] = useState(false);

  // 제목 인라인 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  // 본문 인라인 편집
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState(section.content);

  // FAQ 추가 폼
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");

  // order 기준 정렬된 FAQ 목록
  const sortedFaqs = [...section.faqs].sort((a, b) => a.order - b.order);

  /** 섹션 제목 저장 */
  function handleTitleSave() {
    if (!titleDraft.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.SECTION_TITLE_REQUIRED);
      return;
    }
    onUpdate(section.id, { title: titleDraft.trim() });
    setEditingTitle(false);
    toast.success(TOAST.AUDIENCE_GUIDE.TITLE_UPDATED);
  }

  /** 섹션 본문 저장 */
  function handleContentSave() {
    onUpdate(section.id, { content: contentDraft });
    setEditingContent(false);
    toast.success(TOAST.AUDIENCE_GUIDE.CONTENT_SAVED);
  }

  /** FAQ 추가 */
  function handleAddFAQ() {
    if (!faqQ.trim() || !faqA.trim()) {
      toast.error(TOAST.AUDIENCE_GUIDE.QA_REQUIRED);
      return;
    }
    onAddFAQ(section.id, faqQ, faqA);
    setFaqQ("");
    setFaqA("");
    setShowFAQForm(false);
    toast.success(TOAST.AUDIENCE_GUIDE.FAQ_ADDED);
  }

  /** 섹션 삭제 */
  function handleRemove() {
    onRemove(section.id);
    toast.success(TOAST.AUDIENCE_GUIDE.SECTION_DELETED);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={`border rounded-lg ${
          section.isVisible ? "bg-card" : "bg-muted/30 opacity-70"
        }`}
      >
        {/* ── 섹션 헤더 ── */}
        <div className="flex items-center gap-1 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              aria-expanded={open}
              className="flex-1 flex items-center gap-2 text-left"
            >
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <SectionTypeBadge type={section.type} />
              <span className="text-sm font-medium truncate">
                {section.title}
              </span>
              {section.faqs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  FAQ {section.faqs.length}
                </Badge>
              )}
            </button>
          </CollapsibleTrigger>

          {/* 섹션 액션 버튼들 */}
          <div className="flex shrink-0 gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isFirst}
              onClick={() => onMoveUp(section.id)}
              aria-label="섹션 위로 이동"
            >
              <ArrowUp className="h-3 w-3" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={isLast}
              onClick={() => onMoveDown(section.id)}
              aria-label="섹션 아래로 이동"
            >
              <ArrowDown className="h-3 w-3" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleVisibility(section.id)}
              aria-label={section.isVisible ? "섹션 숨기기" : "섹션 표시"}
            >
              {section.isVisible ? (
                <Eye className="h-3 w-3" aria-hidden />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={handleRemove}
              aria-label="섹션 삭제"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
            </Button>
          </div>
        </div>

        {/* ── 섹션 본문 (펼쳐진 경우) ── */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* 제목 편집 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                섹션 제목
              </Label>
              {editingTitle ? (
                <div className="flex gap-1">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTitleDraft(section.title);
                        setEditingTitle(false);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleTitleSave}
                  >
                    저장
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      setTitleDraft(section.title);
                      setEditingTitle(false);
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm flex-1">{section.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setEditingTitle(true)}
                    aria-label="섹션 제목 수정"
                  >
                    <Pencil className="h-3 w-3" aria-hidden />
                  </Button>
                </div>
              )}
            </div>

            {/* 유형 변경 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                섹션 유형
              </Label>
              <Select
                value={section.type}
                onValueChange={(val) =>
                  onUpdate(section.id, {
                    type: val as AudienceGuideSectionType,
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SECTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {SECTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 본문 내용 */}
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                내용
              </Label>
              {editingContent ? (
                <div className="space-y-1">
                  <Textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    rows={4}
                    placeholder="관객 안내 내용을 입력하세요..."
                    className="text-xs resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={handleContentSave}
                    >
                      <Check className="h-3 w-3 mr-1" aria-hidden />
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2"
                      onClick={() => {
                        setContentDraft(section.content);
                        setEditingContent(false);
                      }}
                    >
                      <X className="h-3 w-3 mr-1" aria-hidden />
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  className="rounded-md border px-3 py-2 text-xs min-h-[48px] cursor-pointer hover:bg-muted/30 transition-colors group relative"
                  onClick={() => setEditingContent(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setEditingContent(true);
                  }}
                  aria-label="내용 클릭하여 편집"
                >
                  {section.content ? (
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  ) : (
                    <p className="text-muted-foreground/50 italic">
                      클릭하여 내용을 입력하세요...
                    </p>
                  )}
                  <Pencil
                    className="h-3 w-3 absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity"
                    aria-hidden
                  />
                </div>
              )}
            </div>

            {/* FAQ 목록 (type === faq 또는 FAQ가 있을 때 표시) */}
            {(section.type === "faq" || section.faqs.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-[10px] text-muted-foreground">
                    FAQ 목록
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setShowFAQForm((v) => !v)}
                    aria-label="FAQ 추가 폼 열기"
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden />
                    FAQ 추가
                  </Button>
                </div>

                {/* FAQ 추가 폼 */}
                {showFAQForm && (
                  <div className="border rounded-md p-2 space-y-1.5 mb-2 bg-muted/30">
                    <Input
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      placeholder="질문을 입력하세요"
                      className="h-7 text-xs"
                    />
                    <Textarea
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      placeholder="답변을 입력하세요"
                      rows={2}
                      className="text-xs resize-none"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={handleAddFAQ}
                      >
                        <Check className="h-3 w-3 mr-1" aria-hidden />
                        추가
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          setFaqQ("");
                          setFaqA("");
                          setShowFAQForm(false);
                        }}
                      >
                        <X className="h-3 w-3 mr-1" aria-hidden />
                        취소
                      </Button>
                    </div>
                  </div>
                )}

                {/* FAQ 아이템 목록 */}
                <div role="list" className="space-y-1">
                  {sortedFaqs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      FAQ가 없습니다. 추가 버튼을 눌러 FAQ를 등록하세요.
                    </p>
                  ) : (
                    sortedFaqs.map((faq, idx) => (
                      <FAQEditItem
                        key={faq.id}
                        sectionId={section.id}
                        faq={faq}
                        isFirst={idx === 0}
                        isLast={idx === sortedFaqs.length - 1}
                        onUpdate={onUpdateFAQ}
                        onRemove={onRemoveFAQ}
                        onMoveUp={onMoveFAQUp}
                        onMoveDown={onMoveFAQDown}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
