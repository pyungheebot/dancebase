"use client";

// ─── 감정 선택 & 컨디션 슬라이더 & 태그 입력 서브컴포넌트 ─────────────────────
// 다이어리 작성 폼에서 사용하는 입력 전용 컴포넌트 모음

import { memo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DiaryCardEmotion } from "@/types";
import { EMOTION_LIST, CONDITION_LABELS } from "./dance-diary-types";

// ─── 감정 선택 버튼 그룹 ──────────────────────────────────────────────────────

interface EmotionPickerProps {
  value: DiaryCardEmotion;
  onChange: (v: DiaryCardEmotion) => void;
}

/**
 * 감정 선택 버튼 그룹
 * - role="radiogroup" + role="radio" + aria-checked 로 접근성 준수
 */
export const EmotionPicker = memo(function EmotionPicker({
  value,
  onChange,
}: EmotionPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="오늘의 감정 선택"
      className="flex gap-1.5 flex-wrap"
    >
      {EMOTION_LIST.map((em) => (
        <button
          key={em.value}
          type="button"
          role="radio"
          aria-checked={value === em.value}
          aria-label={`${em.label} (${em.emoji})`}
          onClick={() => onChange(em.value)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 border text-center transition-all hover:scale-105",
            value === em.value
              ? "ring-2 ring-offset-1 border-transparent bg-muted ring-primary/60"
              : "border-border bg-background"
          )}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            {em.emoji}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
            {em.label}
          </span>
        </button>
      ))}
    </div>
  );
});

// ─── 컨디션 슬라이더 (1~5 버튼) ──────────────────────────────────────────────

interface ConditionSliderProps {
  value: number;
  onChange: (v: number) => void;
}

/**
 * 컨디션 1~5 단계 선택 버튼
 * - role="radiogroup" + role="radio" + aria-checked 로 접근성 준수
 */
export const ConditionSlider = memo(function ConditionSlider({
  value,
  onChange,
}: ConditionSliderProps) {
  return (
    <div className="space-y-1.5">
      <div
        role="radiogroup"
        aria-label="컨디션 선택 (1: 매우나쁨 ~ 5: 최상)"
        className="flex justify-between"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`컨디션 ${v}: ${CONDITION_LABELS[v]}`}
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 border text-center transition-all hover:scale-105 flex-1 mx-0.5",
              value === v
                ? "ring-2 ring-primary/60 border-transparent bg-muted"
                : "border-border bg-background"
            )}
          >
            <span className="text-xs font-bold leading-none">{v}</span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
              {CONDITION_LABELS[v]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── 태그 입력 컴포넌트 ───────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}

/**
 * 태그 추가/제거 입력 컴포넌트
 * - Enter 키 또는 + 버튼으로 태그 추가
 * - 중복 태그는 무시
 */
export const TagInput = memo(function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setInput("");
      return;
    }
    onAdd(trimmed);
    setInput("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          aria-label="태그 입력"
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={handleAdd}
          aria-label="태그 추가"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1" role="list" aria-label="추가된 태그 목록">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-0.5"
              role="listitem"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="ml-0.5 hover:opacity-70"
                aria-label={`태그 "${tag}" 제거`}
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
});
