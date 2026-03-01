"use client";

import { useState, useCallback, useId } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Target } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMemberGoal } from "@/hooks/use-member-goal";
import { AddGoalDialog } from "./add-goal-dialog";
import { GoalItemCard } from "./goal-item-card";
import { GoalStatsSummary, GoalCategoryChart } from "./goal-stats-chart";
import { ALL_CATEGORIES, CATEGORY_LABELS, sortGoalStatus } from "./member-goal-types";
import type { AddGoalFormData } from "./member-goal-types";

// ============================================
// 타입
// ============================================

type MemberGoalCardProps = {
  groupId: string;
  memberNames: string[];
};

// ============================================
// 메인 카드
// ============================================

export function MemberGoalCard({ groupId, memberNames }: MemberGoalCardProps) {
  const [open, setOpen] = useState(true);
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filterMemberSelectId = useId();
  const filterCategorySelectId = useId();
  const goalListId = useId();

  const {
    entries,
    totalGoals,
    activeGoals,
    completedGoals,
    averageProgress,
    categoryDistribution,
    addGoal,
    updateProgress,
    toggleMilestone,
    completeGoal,
    abandonGoal,
    deleteGoal,
  } = useMemberGoal(groupId);

  // ============================================
  // 필터링 & 정렬
  // ============================================

  const filtered = entries.filter((g) => {
    const memberOk = filterMember === "all" || g.memberName === filterMember;
    const categoryOk = filterCategory === "all" || g.category === filterCategory;
    return memberOk && categoryOk;
  });

  const sorted = [...filtered].sort((a, b) => {
    const so = sortGoalStatus(a.status) - sortGoalStatus(b.status);
    if (so !== 0) return so;
    return a.targetDate.localeCompare(b.targetDate);
  });

  const isFiltered = filterMember !== "all" || filterCategory !== "all";

  // ============================================
  // 핸들러
  // ============================================

  const handleAddGoal = useCallback(
    (params: AddGoalFormData) => {
      addGoal(params);
      toast.success(TOAST.MEMBERS.GOAL_ADDED);
    },
    [addGoal]
  );

  // ============================================
  // 렌더
  // ============================================

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors rounded-t-xl"
            aria-expanded={open}
            aria-controls={goalListId}
            aria-label={`멤버 목표 설정 섹션 ${open ? "접기" : "펼치기"}`}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">멤버 목표 설정</span>
              {activeGoals > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                  진행중 {activeGoals}
                </Badge>
              )}
              {completedGoals > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  완료 {completedGoals}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AddGoalDialog memberNames={memberNames} onAdd={handleAddGoal} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div id={goalListId} className="px-4 pb-4 space-y-3">
            {/* 통계 요약 */}
            <GoalStatsSummary
              totalGoals={totalGoals}
              activeGoals={activeGoals}
              completedGoals={completedGoals}
              averageProgress={averageProgress}
            />

            {/* 카테고리 분포 차트 */}
            {totalGoals > 0 && (
              <GoalCategoryChart categoryDistribution={categoryDistribution} />
            )}

            {/* 필터 */}
            <div className="flex gap-2" role="group" aria-label="목표 목록 필터">
              <div className="flex-1">
                <label htmlFor={filterMemberSelectId} className="sr-only">
                  멤버 필터
                </label>
                <Select value={filterMember} onValueChange={setFilterMember}>
                  <SelectTrigger
                    id={filterMemberSelectId}
                    className="h-7 text-xs"
                    aria-label={`멤버 필터: 현재 ${filterMember === "all" ? "전체" : filterMember}`}
                  >
                    <SelectValue placeholder="멤버 전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      멤버 전체
                    </SelectItem>
                    {memberNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label htmlFor={filterCategorySelectId} className="sr-only">
                  카테고리 필터
                </label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger
                    id={filterCategorySelectId}
                    className="h-7 text-xs"
                    aria-label={`카테고리 필터: 현재 ${filterCategory === "all" ? "전체" : CATEGORY_LABELS[filterCategory as keyof typeof CATEGORY_LABELS] ?? filterCategory}`}
                  >
                    <SelectValue placeholder="카테고리 전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      카테고리 전체
                    </SelectItem>
                    {ALL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 목표 목록 */}
            {sorted.length === 0 ? (
              <div
                className="text-center py-8 space-y-1"
                role="status"
                aria-live="polite"
                aria-label={
                  totalGoals === 0
                    ? "등록된 목표 없음"
                    : "해당 조건의 목표 없음"
                }
              >
                <Target
                  className="h-8 w-8 text-muted-foreground/30 mx-auto"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">
                  {totalGoals === 0
                    ? "아직 등록된 목표가 없습니다"
                    : "해당 조건의 목표가 없습니다"}
                </p>
                {totalGoals === 0 && (
                  <p className="text-[11px] text-muted-foreground/70">
                    상단 목표 추가 버튼으로 목표를 설정해보세요
                  </p>
                )}
              </div>
            ) : (
              <ul
                role="list"
                className="space-y-2"
                aria-label={`목표 목록 (${sorted.length}개)`}
                aria-live="polite"
              >
                {sorted.map((goal) => (
                  <li key={goal.id} role="listitem">
                    <GoalItemCard
                      goal={goal}
                      onUpdateProgress={updateProgress}
                      onToggleMilestone={toggleMilestone}
                      onComplete={completeGoal}
                      onAbandon={abandonGoal}
                      onDelete={deleteGoal}
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* 필터 적용 시 카운트 */}
            {isFiltered && totalGoals > 0 && (
              <p
                className="text-[10px] text-muted-foreground/60 text-right"
                aria-live="polite"
                aria-label={`전체 ${totalGoals}개 중 ${sorted.length}개 표시 중`}
              >
                {sorted.length} / {totalGoals}개 표시 중
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
