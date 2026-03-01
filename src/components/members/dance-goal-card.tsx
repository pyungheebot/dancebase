"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDanceGoal } from "@/hooks/use-dance-goal";
import type { DanceGoalCategory, DanceGoalPriority } from "@/types";
import { CATEGORY_LABELS } from "./dance-goal-types";
import { GoalFormDialog } from "./dance-goal-form-dialog";
import { GoalItem } from "./dance-goal-item";
import { OverallProgressChart } from "./dance-goal-overall-chart";
import type { FilterCategory, FilterStatus } from "./dance-goal-types";

// ============================================
// DanceGoalCard — 메인 컨테이너
// ============================================

const STATUS_FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행" },
  { value: "completed", label: "완료" },
  { value: "paused", label: "중지" },
];

export function DanceGoalCard({ memberId }: { memberId: string }) {
  const {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    updateProgress,
    changeStatus,
    totalGoals,
    activeGoals,
    completedGoals,
    pausedGoals,
    averageProgress,
    categoryDistribution,
  } = useDanceGoal(memberId);

  const [open, setOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // 필터링
  const filteredGoals = goals.filter((g) => {
    const catOk = filterCategory === "all" || g.category === filterCategory;
    const statusOk = filterStatus === "all" || g.status === filterStatus;
    return catOk && statusOk;
  });

  // 우선순위 정렬: high > medium > low, 그 다음 최신순
  const priorityOrder: Record<DanceGoalPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const cardRegionId = "dance-goal-card-content";
  const cardHeaderId = "dance-goal-card-header";

  return (
    <>
      <GoalFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => {
          createGoal({
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority,
            targetDate: data.targetDate || null,
          });
          toast.success(TOAST.MEMBERS.GOAL_ADDED_DOT);
        }}
        mode="create"
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        <section
          className="border rounded-xl overflow-hidden"
          aria-labelledby={cardHeaderId}
        >
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Target
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              <h2
                id={cardHeaderId}
                className="text-sm font-semibold"
              >
                댄스 목표 트래커
              </h2>
              {totalGoals > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
                  aria-label={`총 ${totalGoals}개 목표`}
                >
                  {totalGoals}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCreateOpen(true)}
                aria-label="새 목표 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                목표 추가
              </Button>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  aria-expanded={open}
                  aria-controls={cardRegionId}
                  aria-label={`댄스 목표 트래커 ${open ? "접기" : "펼치기"}`}
                >
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <div
              id={cardRegionId}
              role="region"
              aria-labelledby={cardHeaderId}
              className="p-4 space-y-4"
            >
              {/* 달성률 요약 */}
              {totalGoals > 0 && (
                <OverallProgressChart
                  averageProgress={averageProgress}
                  totalGoals={totalGoals}
                  activeGoals={activeGoals}
                  completedGoals={completedGoals}
                  pausedGoals={pausedGoals}
                  categoryDistribution={categoryDistribution}
                />
              )}

              {/* 필터 */}
              {totalGoals > 0 && (
                <div
                  className="flex items-center gap-2 flex-wrap"
                  role="group"
                  aria-label="목표 필터"
                >
                  {/* 카테고리 필터 */}
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[11px] text-muted-foreground"
                      id="filter-category-label"
                    >
                      카테고리:
                    </span>
                    <div
                      role="group"
                      aria-labelledby="filter-category-label"
                      className="flex gap-0.5 flex-wrap"
                    >
                      <button
                        onClick={() => setFilterCategory("all")}
                        aria-pressed={filterCategory === "all"}
                        className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          filterCategory === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        전체
                      </button>
                      {(
                        Object.keys(CATEGORY_LABELS) as DanceGoalCategory[]
                      ).map((c) => (
                        <button
                          key={c}
                          onClick={() => setFilterCategory(c)}
                          aria-pressed={filterCategory === c}
                          className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                            filterCategory === c
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {CATEGORY_LABELS[c]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 상태 필터 */}
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[11px] text-muted-foreground"
                      id="filter-status-label"
                    >
                      상태:
                    </span>
                    <div
                      role="group"
                      aria-labelledby="filter-status-label"
                      className="flex gap-0.5"
                    >
                      {STATUS_FILTER_OPTIONS.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setFilterStatus(item.value)}
                          aria-pressed={filterStatus === item.value}
                          className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                            filterStatus === item.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 로딩 */}
              {loading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-center py-6 text-xs text-muted-foreground"
                >
                  불러오는 중...
                </div>
              )}

              {/* 빈 상태 */}
              {!loading && totalGoals === 0 && (
                <div className="text-center py-8 space-y-2">
                  <TrendingUp
                    className="h-8 w-8 text-muted-foreground mx-auto"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted-foreground">
                    아직 등록된 목표가 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    목표를 추가하고 댄스 성장을 추적해보세요.
                  </p>
                  <Button
                    size="sm"
                    className="h-7 text-xs mt-1"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    첫 목표 추가
                  </Button>
                </div>
              )}

              {/* 필터 결과 없음 */}
              {!loading && totalGoals > 0 && sortedGoals.length === 0 && (
                <div
                  role="status"
                  aria-live="polite"
                  className="text-center py-6 text-xs text-muted-foreground"
                >
                  해당 조건의 목표가 없습니다.
                </div>
              )}

              {/* 목표 목록 */}
              {!loading && sortedGoals.length > 0 && (
                <ul
                  role="list"
                  aria-label={`목표 목록 (${sortedGoals.length}개)`}
                  aria-live="polite"
                  className="space-y-2"
                >
                  {sortedGoals.map((goal) => (
                    <li key={goal.id} role="listitem">
                      <GoalItem
                        goal={goal}
                        onUpdate={(patch) => updateGoal(goal.id, patch)}
                        onDelete={() => deleteGoal(goal.id)}
                        onChangeStatus={(status) =>
                          changeStatus(goal.id, status)
                        }
                        onToggleMilestone={(milestoneId) =>
                          toggleMilestone(goal.id, milestoneId)
                        }
                        onAddMilestone={(title) =>
                          addMilestone(goal.id, title)
                        }
                        onRemoveMilestone={(milestoneId) =>
                          removeMilestone(goal.id, milestoneId)
                        }
                        onUpdateProgress={(progress) =>
                          updateProgress(goal.id, progress)
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    </>
  );
}
