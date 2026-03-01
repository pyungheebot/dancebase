"use client";

import type { DanceGoalStatus } from "@/types";
import { PROGRESS_BAR_COLORS, STATUS_LABELS } from "./dance-goal-types";

// ============================================
// GoalProgressBar — 단일 목표 진행률 바
// ============================================

export function GoalProgressBar({
  progress,
  status,
  goalTitle,
}: {
  progress: number;
  status: DanceGoalStatus;
  goalTitle: string;
}) {
  const barId = `progress-bar-${goalTitle.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span
          id={`${barId}-label`}
          className="text-[10px] text-muted-foreground"
        >
          진행률
        </span>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="text-[10px] font-medium"
        >
          {progress}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goalTitle} 진행률 ${progress}%, 상태: ${STATUS_LABELS[status]}`}
        aria-labelledby={`${barId}-label`}
        className="h-1.5 bg-muted rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${PROGRESS_BAR_COLORS[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
