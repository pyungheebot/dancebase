"use client";

// ─── 다이어리 항목 카드 & 작성/수정 폼 서브컴포넌트 ──────────────────────────
// DiaryEntryItem: 저장된 항목 표시
// DiaryEntryEditor: 인라인 작성/수정 폼

import { memo } from "react";
import { Pencil, Trash2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { DiaryCardEntry } from "@/types";
import { EMOTION_MAP, CONDITION_LABELS, CONDITION_COLORS } from "./dance-diary-types";
import type { DiaryForm } from "./dance-diary-types";
import { EmotionPicker, ConditionSlider, TagInput } from "./diary-emotion-selector";

// ─── 일기 항목 카드 ───────────────────────────────────────────────────────────

interface DiaryEntryItemProps {
  entry: DiaryCardEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryCardEntry) => void;
}

/**
 * 저장된 일기 항목 카드
 * - 감정 이모지, 제목, 날짜, 컨디션 배지 표시
 * - 수정/삭제 아이콘 버튼에 aria-label 제공
 */
export const DiaryEntryItem = memo(function DiaryEntryItem({
  entry,
  onDelete,
  onEdit,
}: DiaryEntryItemProps) {
  const em = EMOTION_MAP[entry.emotion];
  const dateLabel = formatYearMonthDay(entry.date);

  return (
    <article
      className="rounded-lg border bg-card p-3 space-y-2"
      aria-label={`일기: ${entry.title || dateLabel}`}
    >
      {/* 헤더: 감정 + 제목/날짜 + 컨디션 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base shrink-0" aria-label={`감정: ${em.label}`}>
            {em.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {entry.title || dateLabel}
            </p>
            <p className="text-[10px] text-muted-foreground">{dateLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 컨디션 배지 */}
          <div
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] text-white font-medium",
              CONDITION_COLORS[entry.condition]
            )}
            aria-label={`컨디션: ${CONDITION_LABELS[entry.condition]}`}
          >
            {CONDITION_LABELS[entry.condition]}
          </div>

          {/* 수정 버튼 */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(entry)}
            aria-label={`"${entry.title || dateLabel}" 일기 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>

          {/* 삭제 버튼 */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
            aria-label={`"${entry.title || dateLabel}" 일기 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 내용 (있을 경우만) */}
      {entry.content && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {entry.content}
        </p>
      )}

      {/* 오늘의 발견 (있을 경우만) */}
      {entry.discovery && (
        <div className="flex items-start gap-1.5 text-xs rounded bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1.5">
          <span className="text-indigo-500 shrink-0 mt-0.5" aria-hidden="true">
            💡
          </span>
          <span className="text-indigo-700 dark:text-indigo-300 text-[11px] leading-relaxed">
            {entry.discovery}
          </span>
        </div>
      )}

      {/* 태그 목록 (있을 경우만) */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" role="list" aria-label="태그">
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
              role="listitem"
            >
              <Tag className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
});

// ─── 작성/수정 폼 ─────────────────────────────────────────────────────────────

interface DiaryEntryEditorProps {
  form: DiaryForm;
  isEditing: boolean;
  onChange: (patch: Partial<DiaryForm>) => void;
  onSave: () => void;
  onClose: () => void;
}

/**
 * 일기 작성 및 수정 인라인 폼
 * - 날짜, 제목, 내용, 감정, 컨디션, 오늘의 발견, 태그 입력
 * - 저장/닫기 버튼에 aria-label 포함
 */
export const DiaryEntryEditor = memo(function DiaryEntryEditor({
  form,
  isEditing,
  onChange,
  onSave,
  onClose,
}: DiaryEntryEditorProps) {
  return (
    <div
      className="rounded-lg border bg-muted/20 p-3 space-y-3"
      role="form"
      aria-label={isEditing ? "일기 수정 폼" : "새 일기 작성 폼"}
    >
      {/* 폼 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">{isEditing ? "일기 수정" : "새 일기"}</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onClose}
          aria-label="폼 닫기"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>

      {/* 날짜 */}
      <div className="space-y-1">
        <label
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
          htmlFor="diary-date"
        >
          날짜
        </label>
        <Input
          id="diary-date"
          type="date"
          value={form.date}
          onChange={(e) => onChange({ date: e.target.value })}
          className="h-7 text-xs"
        />
      </div>

      {/* 제목 */}
      <div className="space-y-1">
        <label
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
          htmlFor="diary-title"
        >
          제목
        </label>
        <Input
          id="diary-title"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="오늘의 연습 한 줄 요약"
          className="h-7 text-xs"
        />
      </div>

      {/* 내용 */}
      <div className="space-y-1">
        <label
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
          htmlFor="diary-content"
        >
          내용
        </label>
        <Textarea
          id="diary-content"
          value={form.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="오늘의 연습을 자유롭게 기록해보세요..."
          className="text-xs resize-none min-h-[72px]"
        />
      </div>

      {/* 감정 선택 */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          오늘 감정
        </p>
        <EmotionPicker
          value={form.emotion}
          onChange={(v) => onChange({ emotion: v })}
        />
      </div>

      {/* 컨디션 선택 */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          컨디션
        </p>
        <ConditionSlider
          value={form.condition}
          onChange={(v) => onChange({ condition: v })}
        />
      </div>

      {/* 오늘의 발견 */}
      <div className="space-y-1">
        <label
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1"
          htmlFor="diary-discovery"
        >
          <span aria-hidden="true">💡</span>
          오늘의 발견
        </label>
        <Input
          id="diary-discovery"
          value={form.discovery}
          onChange={(e) => onChange({ discovery: e.target.value })}
          placeholder="새롭게 깨달은 점이나 발견을 짧게..."
          className="h-7 text-xs"
        />
      </div>

      {/* 태그 */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
          <Tag className="h-3 w-3" aria-hidden="true" />
          태그
        </p>
        <TagInput
          tags={form.tags}
          onAdd={(tag) => onChange({ tags: [...form.tags, tag] })}
          onRemove={(tag) =>
            onChange({ tags: form.tags.filter((t) => t !== tag) })
          }
          placeholder="태그 입력 후 Enter (예: 웨이킹, 턴, 커버댄스)"
        />
      </div>

      {/* 저장 버튼 */}
      <Button
        className="w-full h-8 text-xs"
        onClick={onSave}
        aria-label={isEditing ? "일기 수정 완료" : "일기 저장"}
      >
        {isEditing ? "수정 완료" : "저장"}
      </Button>
    </div>
  );
});
