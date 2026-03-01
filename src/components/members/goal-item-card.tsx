"use client";

import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Flag,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { MemberGoalEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  todayStr,
  progressBarColor,
} from "./member-goal-types";

// ============================================
// 타입
// ============================================

type GoalItemCardProps = {
  goal: MemberGoalEntry;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onComplete: (id: string) => void;
  onAbandon: (id: string) => void;
  onDelete: (id: string) => void;
};

// ============================================
// 컴포넌트
// ============================================

export const GoalItemCard = memo(function GoalItemCard({
  goal,
  onUpdateProgress,
  onToggleMilestone,
  onComplete,
  onAbandon,
  onDelete,
}: GoalItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [progressInput, setProgressInput] = useState(String(goal.progress));

  const isCompleted = goal.status === "completed";
  const isAbandoned = goal.status === "abandoned";
  const isInactive = isCompleted || isAbandoned;
  const isOverdue = goal.status === "active" && goal.targetDate < todayStr();

  const barColor = progressBarColor(goal.progress);

  const progressBarWidth = isCompleted ? 100 : goal.progress;
  const progressBarClass = isCompleted
    ? "bg-green-500"
    : isAbandoned
    ? "bg-gray-400"
    : barColor;

  const cardClass = isCompleted
    ? "bg-green-50 border-green-200"
    : isAbandoned
    ? "bg-gray-50 border-gray-200 opacity-60"
    : isOverdue
    ? "bg-red-50 border-red-200"
    : "bg-background border-border";

  const titleClass = isCompleted
    ? "line-through text-green-700"
    : isAbandoned
    ? "line-through text-gray-400"
    : "";

  const progressTextClass = isCompleted
    ? "text-green-600"
    : isOverdue
    ? "text-red-500"
    : "text-primary";

  const handleProgressCommit = useCallback(() => {
    const v = parseInt(progressInput, 10);
    if (isNaN(v)) return;
    const clamped = Math.min(100, Math.max(0, v));
    setProgressInput(String(clamped));
    onUpdateProgress(goal.id, clamped);
    if (clamped === 100) toast.success(TOAST.MEMBERS.GOAL_FINISHED);
  }, [progressInput, goal.id, onUpdateProgress]);

  const handleQuickProgress = useCallback(
    (v: number) => {
      setProgressInput(String(v));
      onUpdateProgress(goal.id, v);
      if (v === 100) toast.success(TOAST.MEMBERS.GOAL_FINISHED);
    },
    [goal.id, onUpdateProgress]
  );

  const handleComplete = useCallback(() => {
    onComplete(goal.id);
    toast.success(TOAST.MEMBERS.GOAL_FINISHED_PROCESS);
  }, [goal.id, onComplete]);

  const handleAbandon = useCallback(() => {
    onAbandon(goal.id);
    toast.success(TOAST.MEMBERS.GOAL_ABANDONED);
  }, [goal.id, onAbandon]);

  const handleDelete = useCallback(() => {
    onDelete(goal.id);
    toast.success(TOAST.MEMBERS.GOAL_DELETED);
  }, [goal.id, onDelete]);

  const handleInactiveDelete = useCallback(() => {
    onDelete(goal.id);
    toast.success(TOAST.MEMBERS.GOAL_DIALOG_DELETED);
  }, [goal.id, onDelete]);

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;

  return (
    <article
      className={`rounded-lg border transition-colors ${cardClass}`}
      aria-label={`목표: ${goal.title}`}
    >
      {/* 헤더 토글 버튼 */}
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 flex items-start gap-2"
        onClick={() => !isInactive && setExpanded((v) => !v)}
        disabled={isInactive}
        aria-expanded={!isInactive ? expanded : undefined}
        aria-controls={!isInactive ? `goal-detail-${goal.id}` : undefined}
        aria-label={`${goal.title} - ${isCompleted ? "완료됨" : isAbandoned ? "포기됨" : isOverdue ? "기한 초과" : "진행 중"}${!isInactive ? (expanded ? ", 접기" : ", 펼치기") : ""}`}
      >
        {/* 상태 아이콘 */}
        <div className="shrink-0 mt-0.5" aria-hidden="true">
          {isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : isAbandoned ? (
            <XCircle className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <Flag
              className={`h-3.5 w-3.5 ${isOverdue ? "text-red-500" : "text-primary"}`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* 제목 + 배지 행 */}
          <div className="flex items-start justify-between gap-1.5">
            <p className={`text-xs font-medium leading-tight ${titleClass}`}>
              {goal.title}
            </p>
            <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${CATEGORY_COLORS[goal.category]}`}
              >
                {CATEGORY_LABELS[goal.category]}
              </Badge>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${PRIORITY_COLORS[goal.priority]}`}
              >
                {PRIORITY_LABELS[goal.priority]}
              </Badge>
            </div>
          </div>

          {/* 멤버명 + 목표일 + 마일스톤 요약 */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground/70">{goal.memberName}</span>
            <span className="flex items-center gap-0.5">
              <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
              <time dateTime={goal.targetDate}>
                {formatYearMonthDay(goal.targetDate)}
              </time>
              {isOverdue && (
                <span className="ml-0.5 text-red-500 font-medium" role="alert">
                  기한 초과
                </span>
              )}
            </span>
            {totalMilestones > 0 && (
              <span aria-label={`마일스톤 ${completedMilestones}/${totalMilestones} 완료`}>
                마일스톤 {completedMilestones}/{totalMilestones}
              </span>
            )}
          </div>
        </div>

        {/* 진행률 숫자 + 펼침 아이콘 */}
        <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
          <span className={`text-[11px] font-semibold w-7 text-right ${progressTextClass}`}>
            {goal.progress}%
          </span>
          {!isInactive &&
            (expanded ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ))}
        </div>
      </button>

      {/* 진행률 프로그레스 바 */}
      <div className="px-3 pb-1.5">
        <div
          role="progressbar"
          aria-valuenow={goal.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} 진행률 ${goal.progress}%`}
          className="h-1.5 rounded-full bg-muted overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarClass}`}
            style={{ width: `${progressBarWidth}%` }}
          />
        </div>
      </div>

      {/* 펼쳐진 상세 영역 */}
      {expanded && !isInactive && (
        <div
          id={`goal-detail-${goal.id}`}
          className="px-3 pb-3 space-y-3 border-t border-dashed pt-2.5"
          aria-live="polite"
        >
          {/* 설명 */}
          {goal.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {goal.description}
            </p>
          )}

          {/* 진행률 입력 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                id={`progress-label-${goal.id}`}
                className="text-[11px] font-medium text-muted-foreground"
              >
                진행률 수정
              </span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  onBlur={handleProgressCommit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleProgressCommit();
                  }}
                  className="h-6 w-12 text-xs text-center px-1"
                  aria-labelledby={`progress-label-${goal.id}`}
                  aria-label={`${goal.title} 진행률 직접 입력`}
                />
                <span className="text-[11px] text-muted-foreground" aria-hidden="true">
                  %
                </span>
              </div>
            </div>

            {/* 빠른 선택 버튼 */}
            <div
              className="flex gap-1"
              role="group"
              aria-label="진행률 빠른 선택"
            >
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickProgress(v)}
                  className={`flex-1 text-[10px] py-0.5 rounded border transition-colors ${
                    goal.progress === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  }`}
                  aria-pressed={goal.progress === v}
                  aria-label={`진행률 ${v}%로 설정`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* 마일스톤 체크리스트 */}
          {totalMilestones > 0 && (
            <div className="space-y-1">
              <span
                id={`milestone-label-${goal.id}`}
                className="text-[11px] font-medium text-muted-foreground"
              >
                마일스톤
              </span>
              <ul
                role="list"
                aria-labelledby={`milestone-label-${goal.id}`}
                className="space-y-1"
              >
                {goal.milestones.map((m) => (
                  <li key={m.id} role="listitem">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={m.completed}
                        onChange={() => onToggleMilestone(goal.id, m.id)}
                        className="h-3 w-3 rounded accent-primary"
                        aria-label={`마일스톤 "${m.title}"${m.completed ? " - 완료됨" : ""}`}
                      />
                      <span
                        className={`text-[11px] ${
                          m.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {m.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50"
                onClick={handleComplete}
                aria-label={`"${goal.title}" 목표 완료 처리`}
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                완료
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={handleAbandon}
                aria-label={`"${goal.title}" 목표 포기 처리`}
              >
                <XCircle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                포기
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              aria-label={`"${goal.title}" 목표 삭제`}
            >
              <Trash2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              삭제
            </Button>
          </div>
        </div>
      )}

      {/* 완료/포기 상태: 삭제 버튼만 노출 */}
      {isInactive && (
        <div className="px-3 pb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
            onClick={handleInactiveDelete}
            aria-label={`"${goal.title}" 목표 삭제`}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            삭제
          </Button>
        </div>
      )}
    </article>
  );
});
