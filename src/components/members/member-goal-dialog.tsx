"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMemberGoals } from "@/hooks/use-member-goals";
import { MEMBER_GOAL_TYPE_LABELS } from "@/types";
import type { MemberGoalType } from "@/types";

// ============================================
// 유틸
// ============================================

function currentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

// ============================================
// 목표 유형별 배지 색상
// ============================================

function goalTypeBadgeClass(goalType: MemberGoalType): string {
  if (goalType === "attendance") return "bg-blue-100 text-blue-700";
  if (goalType === "posts") return "bg-purple-100 text-purple-700";
  if (goalType === "payment") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

// ============================================
// 목표 유형별 단위
// ============================================

function goalUnit(goalType: MemberGoalType): string {
  if (goalType === "attendance") return "회";
  if (goalType === "posts") return "개";
  if (goalType === "payment") return "건";
  return "";
}

// ============================================
// Props
// ============================================

type MemberGoalDialogProps = {
  groupId: string;
  userId: string;
  trigger?: React.ReactNode;
};

// ============================================
// 컴포넌트
// ============================================

export function MemberGoalDialog({
  groupId,
  userId,
  trigger,
}: MemberGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [goalType, setGoalType] = useState<MemberGoalType>("attendance");
  const [targetValue, setTargetValue] = useState("");
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const { pending: submitting, execute } = useAsyncAction();

  const {
    goalsWithProgress,
    loading,
    progressLoading,
    createGoal,
    deleteGoal,
    refreshProgress,
  } = useMemberGoals(groupId, userId);

  const handleCreate = async () => {
    const value = parseInt(targetValue, 10);
    if (isNaN(value) || value <= 0) {
      toast.error(TOAST.MEMBERS.GOAL_DIALOG_VALUE_MIN);
      return;
    }
    if (!yearMonth) {
      toast.error(TOAST.MEMBERS.GOAL_DIALOG_MONTH_REQUIRED);
      return;
    }

    // 동일한 유형+월 중복 체크
    const duplicate = goalsWithProgress.find(
      (g) => g.goalType === goalType && g.yearMonth === yearMonth
    );
    if (duplicate) {
      toast.error(TOAST.MEMBERS.GOAL_DIALOG_DUPLICATE);
      return;
    }

    await execute(async () => {
      await createGoal(goalType, value, yearMonth);
      toast.success(TOAST.MEMBERS.GOAL_DIALOG_SET);
      setTargetValue("");
    });
  };

  const handleDelete = (goalId: string) => {
    deleteGoal(goalId);
    toast.success(TOAST.MEMBERS.GOAL_DIALOG_DELETED);
  };

  const handleRefresh = async () => {
    await refreshProgress();
    toast.success(TOAST.MEMBERS.ACHIEVEMENT_REFRESHED);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Target className="h-3 w-3 mr-1" />
            개인 목표
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <Target className="h-4 w-4 text-primary" />
            개인 목표 관리
          </DialogTitle>
        </DialogHeader>

        {/* 목표 추가 폼 */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">새 목표 추가</p>

          <div className="flex gap-1.5">
            <Select
              value={goalType}
              onValueChange={(v) => setGoalType(v as MemberGoalType)}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance" className="text-xs">출석 횟수</SelectItem>
                <SelectItem value="posts" className="text-xs">게시글 수</SelectItem>
                <SelectItem value="payment" className="text-xs">회비 납부</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="h-7 text-xs w-36"
            />
          </div>

          <div className="flex gap-1.5">
            <Input
              type="number"
              min={1}
              max={999}
              placeholder={`목표치 (${goalUnit(goalType)})`}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button
              size="sm"
              className="h-7 text-xs px-3 shrink-0"
              onClick={handleCreate}
              disabled={submitting || !targetValue}
            >
              <Plus className="h-3 w-3 mr-0.5" />
              추가
            </Button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t" />

        {/* 목표 목록 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">
              설정된 목표 ({goalsWithProgress.length})
            </p>
            {goalsWithProgress.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleRefresh}
                disabled={progressLoading}
                title="달성률 새로고침"
                aria-label="달성률 새로고침"
              >
                <RefreshCw
                  className={`h-3 w-3 text-muted-foreground ${progressLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>
          ) : goalsWithProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              설정된 목표가 없습니다
              <br />
              <span className="text-[11px]">위 폼에서 새 목표를 추가해보세요</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {goalsWithProgress.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border px-3 py-2.5 space-y-1.5"
                >
                  {/* 헤더 행 */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] px-1.5 py-0 rounded-full font-medium shrink-0 ${goalTypeBadgeClass(goal.goalType)}`}
                      >
                        {MEMBER_GOAL_TYPE_LABELS[goal.goalType]}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {formatYearMonth(goal.yearMonth)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {goal.isAchieved && (
                        <Badge
                          className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200"
                        >
                          <Trophy className="h-2.5 w-2.5 mr-0.5" />
                          달성
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(goal.id)}
                        aria-label="목표 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 달성률 행 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {progressLoading ? (
                          "계산 중..."
                        ) : (
                          <>
                            {goal.currentValue}{goalUnit(goal.goalType)} / {goal.targetValue}{goalUnit(goal.goalType)}
                          </>
                        )}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          goal.isAchieved ? "text-yellow-600" : "text-primary"
                        }`}
                      >
                        {progressLoading ? "-" : `${goal.achievementRate}%`}
                      </span>
                    </div>
                    <Progress
                      value={progressLoading ? 0 : goal.achievementRate}
                      className={`h-1.5 ${goal.isAchieved ? "[&>[data-slot=progress-indicator]]:bg-yellow-500" : ""}`}
                    />
                    {goal.isAchieved && (
                      <p className="text-[10px] text-yellow-600 font-medium">
                        목표를 달성했습니다! 수고하셨어요.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
