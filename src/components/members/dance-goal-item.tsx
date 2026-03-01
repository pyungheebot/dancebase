"use client";

import { memo, useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Trash2,
  CalendarDays,
  Flag,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  PlayCircle,
  PauseCircle,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { DanceGoal, DanceGoalStatus } from "@/types";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  isOverdue,
} from "./dance-goal-types";
import { GoalFormDialog } from "./dance-goal-form-dialog";
import { GoalProgressBar } from "./dance-goal-progress-bar";

// ============================================
// GoalItem — 단일 목표 아이템 (React.memo 적용)
// ============================================

type GoalItemProps = {
  goal: DanceGoal;
  onUpdate: (patch: Partial<DanceGoal>) => void;
  onDelete: () => void;
  onChangeStatus: (status: DanceGoalStatus) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onAddMilestone: (title: string) => void;
  onRemoveMilestone: (milestoneId: string) => void;
  onUpdateProgress: (progress: number) => void;
};

export const GoalItem = memo(function GoalItem({
  goal,
  onUpdate,
  onDelete,
  onChangeStatus,
  onToggleMilestone,
  onAddMilestone,
  onRemoveMilestone,
  onUpdateProgress,
}: GoalItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [progressInput, setProgressInput] = useState(String(goal.progress));

  const overdue = isOverdue(goal.targetDate, goal.status);
  const completedCount = goal.milestones.filter((m) => m.isCompleted).length;
  const expandTriggerId = `goal-expand-${goal.id}`;
  const detailsRegionId = `goal-details-${goal.id}`;

  const handleAddMilestone = () => {
    if (!milestoneInput.trim()) return;
    onAddMilestone(milestoneInput.trim());
    setMilestoneInput("");
    toast.success(TOAST.MEMBERS.MILESTONE_ADDED_DOT);
  };

  const handleProgressBlur = () => {
    const val = parseInt(progressInput, 10);
    if (isNaN(val)) {
      setProgressInput(String(goal.progress));
      return;
    }
    onUpdateProgress(val);
  };

  return (
    <>
      <GoalFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          title: goal.title,
          description: goal.description,
          category: goal.category,
          priority: goal.priority,
          targetDate: goal.targetDate ?? "",
        }}
        onSubmit={(data) => {
          onUpdate({
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority,
            targetDate: data.targetDate || null,
          });
          toast.success(TOAST.MEMBERS.GOAL_UPDATED_DOT);
        }}
        mode="edit"
      />

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <article
          className="border rounded-lg p-3 space-y-2"
          aria-label={`목표: ${goal.title}`}
        >
          {/* 헤더 */}
          <div className="flex items-start gap-2">
            <CollapsibleTrigger asChild>
              <button
                id={expandTriggerId}
                aria-expanded={expanded}
                aria-controls={detailsRegionId}
                aria-label={`${goal.title} 상세 ${expanded ? "접기" : "펼치기"}`}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0 space-y-1">
              {/* 제목 행 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Flag
                  className={`h-3 w-3 shrink-0 ${PRIORITY_COLORS[goal.priority]}`}
                  aria-label={`우선순위: ${goal.priority}`}
                />
                <span className="text-sm font-medium truncate">
                  {goal.title}
                </span>
                {goal.status === "completed" && (
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-blue-500 shrink-0"
                    aria-label="완료된 목표"
                  />
                )}
              </div>

              {/* 배지 행 */}
              <div
                className="flex items-center gap-1 flex-wrap"
                aria-label="목표 메타 정보"
              >
                <span
                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${CATEGORY_COLORS[goal.category]}`}
                  aria-label={`카테고리: ${CATEGORY_LABELS[goal.category]}`}
                >
                  {CATEGORY_LABELS[goal.category]}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}
                  aria-label={`상태: ${STATUS_LABELS[goal.status]}`}
                >
                  {STATUS_LABELS[goal.status]}
                </span>
                {goal.targetDate && (
                  <span
                    className={`text-[10px] flex items-center gap-0.5 ${
                      overdue ? "text-red-500" : "text-muted-foreground"
                    }`}
                    aria-label={`목표 날짜: ${formatYearMonthDay(goal.targetDate)}${overdue ? " (기한 초과)" : ""}`}
                  >
                    <CalendarDays className="h-3 w-3" aria-hidden="true" />
                    {formatYearMonthDay(goal.targetDate)}
                    {overdue && " (기한 초과)"}
                  </span>
                )}
              </div>
            </div>

            {/* 액션 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  aria-label={`${goal.title} 목표 옵션 메뉴`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  수정
                </DropdownMenuItem>
                {goal.status !== "active" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("active");
                      toast.success(TOAST.MEMBERS.GOAL_IN_PROGRESS);
                    }}
                  >
                    <PlayCircle className="h-3 w-3" aria-hidden="true" />
                    진행 중으로
                  </DropdownMenuItem>
                )}
                {goal.status !== "paused" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("paused");
                      toast.success(TOAST.MEMBERS.GOAL_PAUSED);
                    }}
                  >
                    <PauseCircle className="h-3 w-3" aria-hidden="true" />
                    일시중지
                  </DropdownMenuItem>
                )}
                {goal.status !== "completed" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("completed");
                      toast.success(TOAST.MEMBERS.GOAL_MARKED_DONE);
                    }}
                  >
                    <CheckSquare className="h-3 w-3" aria-hidden="true" />
                    완료로 표시
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-xs gap-2 text-red-600 focus:text-red-600"
                  onClick={() => {
                    onDelete();
                    toast.success(TOAST.MEMBERS.GOAL_DELETED_DOT);
                  }}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 진행률 바 */}
          <GoalProgressBar
            progress={goal.progress}
            status={goal.status}
            goalTitle={goal.title}
          />

          {/* 펼쳐진 내용 */}
          <CollapsibleContent>
            <div
              id={detailsRegionId}
              role="region"
              aria-labelledby={expandTriggerId}
              className="space-y-3 pt-1 border-t mt-1"
            >
              {/* 설명 */}
              {goal.description && (
                <p className="text-xs text-muted-foreground">
                  {goal.description}
                </p>
              )}

              {/* 진행률 직접 입력 (마일스톤 없을 때만) */}
              {goal.milestones.length === 0 && (
                <div className="space-y-1">
                  <label
                    htmlFor={`progress-range-${goal.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    진행률 직접 입력
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`progress-range-${goal.id}`}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={parseInt(progressInput, 10) || 0}
                      className="flex-1 accent-primary"
                      aria-label="진행률 슬라이더"
                      aria-valuenow={parseInt(progressInput, 10) || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      onChange={(e) => {
                        setProgressInput(e.target.value);
                        onUpdateProgress(parseInt(e.target.value, 10));
                      }}
                    />
                    <div className="flex items-center">
                      <Input
                        id={`progress-input-${goal.id}`}
                        className="h-6 w-14 text-xs text-center p-1"
                        value={progressInput}
                        aria-label="진행률 직접 입력 (0~100)"
                        onChange={(e) => setProgressInput(e.target.value)}
                        onBlur={handleProgressBlur}
                      />
                      <span className="text-xs ml-1" aria-hidden="true">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 마일스톤 */}
              <section aria-label="마일스톤 목록" className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Layers
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium" id={`milestone-heading-${goal.id}`}>
                    마일스톤
                  </span>
                  {goal.milestones.length > 0 && (
                    <span
                      className="text-[10px] text-muted-foreground ml-auto"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {completedCount}/{goal.milestones.length} 완료
                    </span>
                  )}
                </div>

                {goal.milestones.length === 0 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    마일스톤을 추가하면 진행률이 자동 계산됩니다.
                  </p>
                )}

                <ul
                  role="list"
                  aria-labelledby={`milestone-heading-${goal.id}`}
                  className="space-y-1"
                >
                  {goal.milestones.map((m) => (
                    <li
                      key={m.id}
                      role="listitem"
                      className="flex items-center gap-1.5 group"
                    >
                      <button
                        onClick={() => onToggleMilestone(m.id)}
                        aria-pressed={m.isCompleted}
                        aria-label={`마일스톤 "${m.title}" ${m.isCompleted ? "완료 취소" : "완료로 표시"}`}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {m.isCompleted ? (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-green-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                      <span
                        className={`text-xs flex-1 ${
                          m.isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {m.title}
                      </span>
                      {m.completedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatYearMonthDay(m.completedAt)}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          onRemoveMilestone(m.id);
                          toast.success(TOAST.MEMBERS.MILESTONE_REMOVED_DOT);
                        }}
                        aria-label={`마일스톤 "${m.title}" 삭제`}
                        className="h-4 w-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* 마일스톤 추가 입력 */}
                <div className="flex items-center gap-1">
                  <Input
                    id={`milestone-input-${goal.id}`}
                    className="h-7 text-xs flex-1"
                    placeholder="마일스톤 추가..."
                    value={milestoneInput}
                    aria-label="새 마일스톤 제목 입력"
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMilestone();
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleAddMilestone}
                    aria-label="마일스톤 추가"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </section>
            </div>
          </CollapsibleContent>
        </article>
      </Collapsible>
    </>
  );
});
