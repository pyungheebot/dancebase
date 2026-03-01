"use client";

// ============================================================
// 댄스 수업 수강 기록 - 수업 등록/편집 폼
// ============================================================

import { GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_ORDER,
  CLASS_LOG_LEVEL_COLORS,
  CLASS_LOG_SOURCE_LABELS,
  CLASS_LOG_SOURCE_COLORS,
  SUGGESTED_CLASS_GENRES,
} from "@/hooks/use-dance-class-log";
import type { DanceClassLogSource } from "@/types";
import type { FormState } from "./dance-class-log-types";
import { StarRating } from "./dance-class-log-star-rating";

interface ClassLogFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}

export function ClassLogForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: ClassLogFormProps) {
  // 단일 필드 업데이트 헬퍼
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      className="rounded-lg border bg-muted/30 p-3 space-y-3"
      role="form"
      aria-label={title}
    >
      {/* 폼 타이틀 & 닫기 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onCancel}
          aria-label="폼 닫기"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 수업명 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="class-name">
          수업명 *
        </label>
        <Input
          id="class-name"
          placeholder="수업 또는 클래스 이름"
          value={form.className}
          onChange={(e) => setField("className", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 강사 / 날짜 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="instructor">
            강사 *
          </label>
          <Input
            id="instructor"
            placeholder="강사 이름"
            value={form.instructor}
            onChange={(e) => setField("instructor", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="class-date">
            날짜 *
          </label>
          <Input
            id="class-date"
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 시작 시간 / 수업 시간 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="start-time">
            시작 시간
          </label>
          <Input
            id="start-time"
            type="time"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="duration-min">
            수업 시간 (분)
          </label>
          <Input
            id="duration-min"
            type="number"
            min={1}
            placeholder="예: 60"
            value={form.durationMin}
            onChange={(e) => setField("durationMin", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 수업 출처 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">수업 출처 *</label>
        <div className="flex gap-2" role="group" aria-label="수업 출처">
          {(["internal", "external"] as DanceClassLogSource[]).map((src) => (
            <button
              key={src}
              type="button"
              aria-pressed={form.source === src}
              onClick={() => setField("source", src)}
              className={`text-[11px] px-3 py-1 rounded-md border font-medium transition-colors ${
                form.source === src
                  ? `${CLASS_LOG_SOURCE_COLORS[src].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {CLASS_LOG_SOURCE_LABELS[src]}
            </button>
          ))}
        </div>
      </div>

      {/* 장르 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">장르 *</label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="장르 선택">
          {SUGGESTED_CLASS_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={form.genre === g}
              onClick={() => {
                setField("genre", g);
                setField("customGenre", "");
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                form.genre === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
          {/* 직접 입력 버튼 */}
          <button
            type="button"
            aria-pressed={form.genre === "__custom__"}
            onClick={() => setField("genre", "__custom__")}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              form.genre === "__custom__"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            직접 입력
          </button>
        </div>
        {/* 직접 입력 텍스트 필드 */}
        {form.genre === "__custom__" && (
          <Input
            id="custom-genre"
            placeholder="장르 직접 입력"
            value={form.customGenre}
            onChange={(e) => setField("customGenre", e.target.value)}
            className="h-8 text-xs mt-1"
            aria-label="장르 직접 입력"
          />
        )}
      </div>

      {/* 레벨 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">레벨 *</label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="레벨 선택">
          {CLASS_LOG_LEVEL_ORDER.map((lv) => (
            <button
              key={lv}
              type="button"
              aria-pressed={form.level === lv}
              onClick={() => setField("level", lv)}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.level === lv
                  ? `${CLASS_LOG_LEVEL_COLORS[lv].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {CLASS_LOG_LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>
      </div>

      {/* 수업 내용 요약 (선택) */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="summary">
          수업 내용 요약 (선택)
        </label>
        <Textarea
          id="summary"
          placeholder="오늘 수업에서 다룬 주요 내용을 요약하세요."
          value={form.summary}
          onChange={(e) => setField("summary", e.target.value)}
          className="min-h-[52px] text-xs resize-none"
        />
      </div>

      {/* 배운 기술 태그 (선택) */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="skills-input">
          배운 기술 (선택, 쉼표로 구분)
        </label>
        <Input
          id="skills-input"
          placeholder="예: 힙합 기초, 웨이브, 슬라이드"
          value={form.skillsInput}
          onChange={(e) => setField("skillsInput", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 자가 평가 별점 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">자가 평가 *</label>
        <div className="flex items-center gap-2">
          <StarRating
            value={form.selfRating}
            onChange={(v) => setField("selfRating", v)}
          />
          {form.selfRating > 0 && (
            <span className="text-xs text-muted-foreground">
              {form.selfRating} / 5
            </span>
          )}
        </div>
      </div>

      {/* 추가 메모 (선택) */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="notes">
          추가 메모 (선택)
        </label>
        <Textarea
          id="notes"
          placeholder="느낀 점, 개선할 점, 다음에 연습할 내용 등을 자유롭게 적으세요."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          className="min-h-[52px] text-xs resize-none"
        />
      </div>

      {/* 제출 / 취소 버튼 */}
      <div className="flex gap-2 justify-end pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting}
        >
          <GraduationCap className="h-3 w-3 mr-1" aria-hidden="true" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
