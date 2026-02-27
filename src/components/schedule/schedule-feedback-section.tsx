"use client";

import { useState, useCallback } from "react";
import { Star, Trash2, MessageSquare, BarChart2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useScheduleFeedbackLocal } from "@/hooks/use-schedule-feedback-local";
import {
  SCHEDULE_FEEDBACK_MOOD_LABELS,
  SCHEDULE_FEEDBACK_MOOD_EMOJI,
} from "@/types";
import type { ScheduleFeedbackMood } from "@/types";

const MOODS: ScheduleFeedbackMood[] = ["great", "good", "ok", "bad"];

type Props = {
  groupId: string;
  scheduleId: string;
};

// ─── 별점 선택 컴포넌트 ───────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star}점`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── 별점 표시 (읽기 전용) ────────────────────────────────────────────────────
function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── 무드 분포 바 ────────────────────────────────────────────────────────────
function MoodBar({
  mood,
  percentage,
  count,
}: {
  mood: ScheduleFeedbackMood;
  percentage: number;
  count: number;
}) {
  const colorMap: Record<ScheduleFeedbackMood, string> = {
    great: "bg-green-400",
    good:  "bg-blue-400",
    ok:    "bg-yellow-400",
    bad:   "bg-red-400",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-6 shrink-0 text-center">
        {SCHEDULE_FEEDBACK_MOOD_EMOJI[mood]}
      </span>
      <span className="text-[10px] text-muted-foreground w-8 shrink-0">
        {SCHEDULE_FEEDBACK_MOOD_LABELS[mood]}
      </span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorMap[mood]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums shrink-0">
        {count}명 ({percentage}%)
      </span>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function ScheduleFeedbackSection({ groupId, scheduleId }: Props) {
  const { feedbacks, averageRating, moodDistribution, addFeedback, removeFeedback } =
    useScheduleFeedbackLocal(groupId, scheduleId);

  // 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState<ScheduleFeedbackMood | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRating(0);
    setMood(null);
    setContent("");
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      toast.error("별점을 선택해주세요");
      return;
    }
    if (!mood) {
      toast.error("무드를 선택해주세요");
      return;
    }

    setSubmitting(true);
    try {
      addFeedback(rating, mood, content);
      toast.success("후기가 등록되었습니다");
      resetForm();
    } catch {
      toast.error("후기 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }, [rating, mood, content, addFeedback, resetForm]);

  const handleRemove = useCallback(
    (id: string) => {
      removeFeedback(id);
      toast.success("후기가 삭제되었습니다");
    },
    [removeFeedback]
  );

  const totalCount = feedbacks.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            일정 피드백 / 후기
          </CardTitle>
          {!showForm && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowForm(true)}
            >
              <PlusCircle className="h-3 w-3" />
              후기 작성
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── 요약: 평균 별점 + 총 피드백 수 ── */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <span className="text-2xl font-bold tabular-nums leading-none">
                {averageRating.toFixed(1)}
              </span>
              <StarDisplay rating={averageRating} size="lg" />
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              총 <span className="font-semibold text-foreground">{totalCount}</span>개
              후기 기준
            </div>
          </div>
        )}

        {totalCount === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-4">
            아직 등록된 후기가 없습니다
          </p>
        )}

        {/* ── 무드 분포 차트 ── */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <BarChart2 className="h-3.5 w-3.5" />
              무드 분포
            </div>
            <div className="space-y-1.5">
              {moodDistribution.map(({ mood: m, count, percentage }) => (
                <MoodBar
                  key={m}
                  mood={m}
                  count={count}
                  percentage={percentage}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 피드백 작성 폼 ── */}
        {showForm && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <p className="text-xs font-medium">후기 작성</p>

            {/* 별점 */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">별점 *</p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            {/* 무드 */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">무드 *</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-colors focus:outline-none ${
                      mood === m
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-muted-foreground/30 hover:border-muted-foreground/60 text-muted-foreground"
                    }`}
                  >
                    <span>{SCHEDULE_FEEDBACK_MOOD_EMOJI[m]}</span>
                    <span>{SCHEDULE_FEEDBACK_MOOD_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">
                내용 <span className="font-normal">(선택)</span>
              </p>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이번 일정에 대한 후기를 자유롭게 적어주세요"
                className="text-xs resize-none h-20"
                maxLength={300}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {content.length}/300
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={resetForm}
                disabled={submitting}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || !mood}
              >
                등록
              </Button>
            </div>
          </div>
        )}

        {/* ── 피드백 목록 (최신순 최대 10개) ── */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              최근 후기 {totalCount}개
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {feedbacks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border bg-background p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={item.rating} />
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 gap-0.5"
                      >
                        {SCHEDULE_FEEDBACK_MOOD_EMOJI[item.mood]}
                        {SCHEDULE_FEEDBACK_MOOD_LABELS[item.mood]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-0.5 rounded hover:bg-muted transition-colors focus:outline-none"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                      </button>
                    </div>
                  </div>
                  {item.content && (
                    <p className="text-xs text-foreground leading-relaxed">
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
