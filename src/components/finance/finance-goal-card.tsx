"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, Trophy, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useFinanceGoal } from "@/hooks/use-finance-goal";

type FinanceGoalCardProps = {
  groupId: string;
  projectId?: string | null;
  canManage: boolean; // 리더/매니저 여부
};

export function FinanceGoalCard({
  groupId,
  projectId,
  canManage,
}: FinanceGoalCardProps) {
  const {
    goal,
    currentIncome,
    achievementRate,
    daysLeft,
    dailyRequired,
    loadingIncome,
    createGoal,
    deleteGoal,
  } = useFinanceGoal(groupId, projectId);

  // 목표 설정 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTargetAmount, setFormTargetAmount] = useState("");
  const [formDeadline, setFormDeadline] = useState("");

  const handleCreate = () => {
    const title = formTitle.trim();
    if (!title) {
      toast.error(TOAST.FINANCE.GOAL_NAME_REQUIRED);
      return;
    }
    const targetAmount = parseInt(formTargetAmount.replace(/,/g, ""), 10);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error(TOAST.FINANCE.GOAL_AMOUNT_REQUIRED);
      return;
    }

    createGoal({
      title,
      targetAmount,
      deadline: formDeadline || null,
    });

    toast.success(TOAST.FINANCE.GOAL_SAVED);
    setShowForm(false);
    setFormTitle("");
    setFormTargetAmount("");
    setFormDeadline("");
  };

  const handleDelete = () => {
    deleteGoal();
    toast.success(TOAST.FINANCE.GOAL_DELETED);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormTitle("");
    setFormTargetAmount("");
    setFormDeadline("");
  };

  // 목표 없음 + 관리자 → 설정 버튼 표시
  if (!goal && !showForm) {
    if (!canManage) return null;
    return (
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 w-full"
          onClick={() => setShowForm(true)}
        >
          <Target className="h-3 w-3" />
          수입 목표 설정
        </Button>
      </div>
    );
  }

  // 목표 설정 폼
  if (showForm && !goal) {
    return (
      <Card className="mb-3">
        <CardContent className="pt-3 pb-3 px-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">수입 목표 설정</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCancelForm}
              aria-label="취소"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="예: 이번 공연 비용 모으기"
            className="h-7 text-xs"
          />

          <Input
            type="number"
            value={formTargetAmount}
            onChange={(e) => setFormTargetAmount(e.target.value)}
            placeholder="목표 금액 (원)"
            className="h-7 text-xs"
            min={1}
          />

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">
              마감일 (선택)
            </label>
            <Input
              type="date"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          <div className="flex gap-1.5 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs flex-1 gap-1"
              onClick={handleCreate}
            >
              <Plus className="h-3 w-3" />
              목표 설정
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancelForm}
            >
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 목표 카드
  if (!goal) return null;

  const remaining = Math.max(0, goal.targetAmount - currentIncome);
  const isCompleted = goal.isAchieved || achievementRate >= 100;

  return (
    <Card
      className={`mb-3 ${
        isCompleted
          ? "border-yellow-300 bg-yellow-50/50 dark:border-yellow-700/40 dark:bg-yellow-950/20"
          : "border-border"
      }`}
    >
      <CardContent className="pt-3 pb-3 px-3">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isCompleted ? (
              <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            ) : (
              <Target className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
            <span className="text-xs font-medium truncate">{goal.title}</span>
            {isCompleted && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/40 shrink-0">
                달성!
              </Badge>
            )}
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDelete}
              aria-label="목표 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* 금액 현황 */}
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-sm font-bold text-green-600 tabular-nums">
            {loadingIncome ? "..." : currentIncome.toLocaleString()}원
          </span>
          <span className="text-[11px] text-muted-foreground">
            / {goal.targetAmount.toLocaleString()}원
          </span>
          <span
            className={`text-[11px] font-medium ml-auto tabular-nums ${
              isCompleted ? "text-yellow-600" : "text-blue-600"
            }`}
          >
            {achievementRate}%
          </span>
        </div>

        {/* 진행 바 */}
        <Progress
          value={achievementRate}
          className={`h-1.5 mb-2 ${
            isCompleted
              ? "[&>[data-slot=progress-indicator]]:bg-yellow-500"
              : "[&>[data-slot=progress-indicator]]:bg-blue-500"
          }`}
        />

        {/* 하단 정보 */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          {/* 남은 금액 */}
          {!isCompleted && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>
                {remaining.toLocaleString()}원 남음
              </span>
            </div>
          )}

          {/* 마감일 / 남은 일수 */}
          {goal.deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {daysLeft === null ? (
                <span>{goal.deadline}</span>
              ) : daysLeft < 0 ? (
                <span className="text-red-500">{Math.abs(daysLeft)}일 지남</span>
              ) : daysLeft === 0 ? (
                <span className="text-orange-500">오늘 마감</span>
              ) : (
                <span>D-{daysLeft}</span>
              )}
            </div>
          )}

          {/* 일별 필요 수입 */}
          {!isCompleted && dailyRequired !== null && dailyRequired > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-blue-500 font-medium">
                일 {dailyRequired.toLocaleString()}원
              </span>
              <span>필요</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
