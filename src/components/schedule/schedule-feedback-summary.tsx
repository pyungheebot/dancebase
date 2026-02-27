"use client";

import { useState } from "react";
import { Star, MessageSquare, Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScheduleFeedback } from "@/hooks/use-schedule-feedback";

type Props = {
  scheduleId: string;
  /** true이면 코멘트 익명 처리 */
  anonymous?: boolean;
};

export function ScheduleFeedbackSummary({ scheduleId, anonymous = true }: Props) {
  const { feedbacks, loading, averageRating, ratingDistribution } =
    useScheduleFeedback(scheduleId);

  const [showComments, setShowComments] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">아직 평가가 없습니다</p>
      </div>
    );
  }

  const commentsWithText = feedbacks.filter((f) => f.comment);

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const starSize = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 평균 별점 요약 */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
          <span className="text-2xl font-bold tabular-nums">
            {averageRating.toFixed(1)}
          </span>
          {renderStars(averageRating, "lg")}
        </div>

        <div className="flex-1 space-y-1">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-4 text-right tabular-nums shrink-0">
                {star}
              </span>
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 shrink-0" />
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-5 text-right tabular-nums shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users className="h-3 w-3" />
          <span>{feedbacks.length}명</span>
        </div>
      </div>

      {/* 별점 배지 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ratingDistribution
          .filter(({ count }) => count > 0)
          .map(({ star, count }) => (
            <Badge
              key={star}
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-0.5"
            >
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              {star}점 {count}명
            </Badge>
          ))}
      </div>

      {/* 코멘트 섹션 */}
      {commentsWithText.length > 0 && (
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-1.5 gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageSquare className="h-3 w-3" />
            코멘트 {commentsWithText.length}개{" "}
            {showComments ? "숨기기" : "보기"}
          </Button>

          {showComments && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {commentsWithText.map((f) => (
                <div
                  key={f.id}
                  className="rounded-md border bg-background p-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    {renderStars(f.rating)}
                    {anonymous ? (
                      <span className="text-[10px] text-muted-foreground">
                        익명
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">
                    {f.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
