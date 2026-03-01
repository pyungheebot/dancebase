"use client";

import { BookOpen, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  DIFFICULTY_COLORS,
  SUGGESTED_GENRES,
} from "@/hooks/use-dance-class-review";
import { StarRating } from "./star-rating";
import type { ReviewFormProps } from "./types";

// ============================================================
// 리뷰 폼 컴포넌트
// ============================================================

export function ReviewForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: ReviewFormProps) {
  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const formId = `review-form-${title.replace(/\s+/g, "-")}`;

  return (
    <div
      className="rounded-lg border bg-muted/30 p-3 space-y-3"
      role="form"
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          id={`${formId}-title`}
        >
          {title}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onCancel}
          aria-label="폼 닫기"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>

      {/* 수업명 */}
      <div className="space-y-1">
        <label htmlFor={`${formId}-className`} className="text-xs text-muted-foreground">
          수업명 *
        </label>
        <Input
          id={`${formId}-className`}
          placeholder="수업 또는 워크숍 이름"
          value={form.className}
          onChange={(e) => setField("className", e.target.value)}
          className="h-8 text-xs"
          aria-required="true"
        />
      </div>

      {/* 강사 / 날짜 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor={`${formId}-instructorName`} className="text-xs text-muted-foreground">
            강사명
          </label>
          <Input
            id={`${formId}-instructorName`}
            placeholder="강사 이름 (선택)"
            value={form.instructorName}
            onChange={(e) => setField("instructorName", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${formId}-date`} className="text-xs text-muted-foreground">
            수강 날짜 *
          </label>
          <Input
            id={`${formId}-date`}
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            className="h-8 text-xs"
            aria-required="true"
          />
        </div>
      </div>

      {/* 비용 */}
      <div className="space-y-1">
        <label htmlFor={`${formId}-cost`} className="text-xs text-muted-foreground">
          수업료 (원)
        </label>
        <Input
          id={`${formId}-cost`}
          type="number"
          min={0}
          placeholder="0 (무료) 또는 비워두기"
          value={form.cost}
          onChange={(e) => setField("cost", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 난이도 선택 */}
      <fieldset className="space-y-1">
        <legend className="text-xs text-muted-foreground">난이도 *</legend>
        <div
          className="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="난이도 선택"
        >
          {DIFFICULTY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setField("difficulty", d)}
              aria-pressed={form.difficulty === d}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.difficulty === d
                  ? `${DIFFICULTY_COLORS[d].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 장르 선택 */}
      <fieldset className="space-y-1">
        <legend className="text-xs text-muted-foreground">장르 (선택)</legend>
        <div
          className="flex flex-wrap gap-1"
          role="radiogroup"
          aria-label="장르 선택"
        >
          {SUGGESTED_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setField("genre", g);
                setField("customGenre", "");
              }}
              aria-pressed={form.genre === g}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                form.genre === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setField("genre", "__custom__")}
            aria-pressed={form.genre === "__custom__"}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              form.genre === "__custom__"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            직접 입력
          </button>
        </div>
        {form.genre === "__custom__" && (
          <Input
            id={`${formId}-customGenre`}
            placeholder="장르 직접 입력"
            value={form.customGenre}
            onChange={(e) => setField("customGenre", e.target.value)}
            className="h-8 text-xs mt-1"
            aria-label="장르 직접 입력"
          />
        )}
      </fieldset>

      {/* 별점 */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground" id={`${formId}-rating-label`}>
          별점 *
        </p>
        <div
          className="flex items-center gap-2"
          aria-labelledby={`${formId}-rating-label`}
        >
          <StarRating
            value={form.rating}
            onChange={(v) => setField("rating", v)}
          />
          {form.rating > 0 && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {form.rating} / 5
            </span>
          )}
        </div>
      </div>

      {/* 재수강 의향 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setField("wouldRepeat", !form.wouldRepeat)}
          aria-pressed={form.wouldRepeat}
          aria-label={form.wouldRepeat ? "재수강 의향 있음 (클릭하여 해제)" : "재수강 의향 없음 (클릭하여 설정)"}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
            form.wouldRepeat
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-background text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          {form.wouldRepeat ? (
            <ThumbsUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ThumbsDown className="h-3 w-3" aria-hidden="true" />
          )}
          {form.wouldRepeat ? "재수강 의향 있음" : "재수강 의향 없음"}
        </button>
      </div>

      {/* 배운 점 */}
      <div className="space-y-1">
        <label htmlFor={`${formId}-takeaways`} className="text-xs text-muted-foreground">
          배운 점 / 핵심 메모 *
        </label>
        <Textarea
          id={`${formId}-takeaways`}
          placeholder="수업에서 배운 핵심 내용, 느낀 점, 개선할 점 등을 기록하세요."
          value={form.takeaways}
          onChange={(e) => setField("takeaways", e.target.value)}
          className="min-h-[70px] text-xs resize-none"
          aria-required="true"
        />
      </div>

      {/* 버튼 */}
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
          aria-busy={submitting}
        >
          <BookOpen className="h-3 w-3 mr-1" aria-hidden="true" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
