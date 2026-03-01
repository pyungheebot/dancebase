"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  Target,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useFundraisingGoal } from "@/hooks/use-fundraising-goal";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { FundraisingGoal } from "@/types";

// ── 금액 포맷 (만원 단위) ────────────────────────────────────

function formatAmount(amount: number): string {
  if (amount === 0) return "0원";
  const man = amount / 10000;
  if (Number.isInteger(man)) {
    return `${man.toLocaleString()}만원`;
  }
  const integer = Math.floor(man);
  const remainder = amount % 10000;
  if (integer === 0) {
    return `${remainder.toLocaleString()}원`;
  }
  return `${integer.toLocaleString()}만 ${remainder.toLocaleString()}원`;
}

// ── D-day 계산 ────────────────────────────────────────────────

function calcDday(deadline: string): { label: string; isOverdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return { label: "D-day", isOverdue: false };
  if (diff > 0) return { label: `D-${diff}`, isOverdue: false };
  return { label: `D+${Math.abs(diff)}`, isOverdue: true };
}

// ── 상태 배지 ────────────────────────────────────────────────

function getStatusBadgeClass(status: FundraisingGoal["status"]): string {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40";
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/40";
  }
}

const STATUS_LABELS: Record<FundraisingGoal["status"], string> = {
  active: "진행중",
  completed: "완료",
  cancelled: "취소",
};

// ── 마일스톤 ─────────────────────────────────────────────────

const MILESTONE_PERCENTS = [25, 50, 75, 100] as const;

// ── 목표 추가 폼 타입 ─────────────────────────────────────────

type AddGoalForm = {
  title: string;
  description: string;
  targetAmount: string;
  deadline: string;
};

const EMPTY_GOAL_FORM: AddGoalForm = {
  title: "",
  description: "",
  targetAmount: "",
  deadline: "",
};

// ── 기부 추가 폼 타입 ─────────────────────────────────────────

type AddContribForm = {
  donorName: string;
  amount: string;
  date: string;
  note: string;
};

const EMPTY_CONTRIB_FORM: AddContribForm = {
  donorName: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

// ── 목표 상세 서브컴포넌트 ────────────────────────────────────

function GoalDetail({
  goal,
  onAddContribution,
}: {
  goal: FundraisingGoal;
  onAddContribution: (
    goalId: string,
    form: AddContribForm
  ) => void;
}) {
  const [form, setForm] = useState<AddContribForm>(EMPTY_CONTRIB_FORM);
  const [showForm, setShowForm] = useState(false);

  function updateForm<K extends keyof AddContribForm>(
    key: K,
    value: AddContribForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    onAddContribution(goal.id, form);
    setForm(EMPTY_CONTRIB_FORM);
    setShowForm(false);
  }

  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  return (
    <div className="mt-2 space-y-3 pl-1">
      {/* 마일스톤 진행 표시 */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium">마일스톤</p>
        <div className="flex items-center gap-1.5">
          {MILESTONE_PERCENTS.map((mp, idx) => {
            const milestone = goal.milestones.find((m) => m.percent === mp);
            const reached = !!milestone?.reachedAt;
            return (
              <div key={mp} className="flex items-center gap-1">
                {idx > 0 && (
                  <div
                    className={`h-px w-4 ${
                      reached ? "bg-emerald-500" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`flex flex-col items-center gap-0.5`}
                  title={
                    reached
                      ? `${mp}% - ${formatYearMonthDay(milestone!.reachedAt!)}`
                      : `${mp}% 미달성`
                  }
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                      reached
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : progressPercent >= mp
                        ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {mp === 100 ? (
                      reached ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        "100"
                      )
                    ) : (
                      `${mp}`
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground">%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 기부 내역 테이블 */}
      {goal.contributions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">
            기부 내역 ({goal.contributions.length}건)
          </p>
          <div className="rounded border overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-2 py-1 font-medium text-muted-foreground">
                    기부자
                  </th>
                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">
                    금액
                  </th>
                  <th className="text-center px-2 py-1 font-medium text-muted-foreground">
                    일자
                  </th>
                  <th className="text-left px-2 py-1 font-medium text-muted-foreground">
                    메모
                  </th>
                </tr>
              </thead>
              <tbody>
                {goal.contributions.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  >
                    <td className="px-2 py-1 font-medium">{c.donorName}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatAmount(c.amount)}
                    </td>
                    <td className="px-2 py-1 text-center text-muted-foreground">
                      {c.date}
                    </td>
                    <td className="px-2 py-1 text-muted-foreground truncate max-w-[80px]">
                      {c.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 기부 추가 폼 */}
      {goal.status === "active" && (
        <div className="space-y-2">
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3 w-3" />
              기부 추가
            </Button>
          ) : (
            <div className="rounded-md border bg-muted/20 px-2.5 py-2 space-y-2">
              <p className="text-[10px] font-medium text-muted-foreground">
                기부 정보 입력
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">
                    기부자 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={form.donorName}
                    onChange={(e) => updateForm("donorName", e.target.value)}
                    placeholder="홍길동"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">
                    금액 (원) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => updateForm("amount", e.target.value)}
                    placeholder="0"
                    className="h-7 text-xs"
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">
                    일자
                  </label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-muted-foreground">
                    메모
                  </label>
                  <Input
                    value={form.note}
                    onChange={(e) => updateForm("note", e.target.value)}
                    placeholder="특이사항"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setForm(EMPTY_CONTRIB_FORM);
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1 gap-1"
                  onClick={handleSubmit}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 목표 아이템 서브컴포넌트 ──────────────────────────────────

function GoalItem({
  goal,
  onDelete,
  onCancel,
  onAddContribution,
}: {
  goal: FundraisingGoal;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onAddContribution: (goalId: string, form: AddContribForm) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const progressPercent =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const dday = calcDday(goal.deadline);

  return (
    <div className="rounded-md border bg-card px-2.5 py-2 space-y-1.5">
      {/* 상단 행: 제목 + 상태 배지 + D-day + 삭제 */}
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs font-medium truncate">{goal.title}</span>
            <Badge
              className={`text-[10px] px-1.5 py-0 h-4 border ${getStatusBadgeClass(
                goal.status
              )}`}
            >
              {STATUS_LABELS[goal.status]}
            </Badge>
            <span
              className={`text-[10px] font-semibold tabular-nums ${
                dday.isOverdue
                  ? "text-red-500 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {dday.label}
            </span>
          </div>
          {goal.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              {goal.description}
            </p>
          )}
          {/* 금액 요약 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatAmount(goal.currentAmount)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              / {formatAmount(goal.targetAmount)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              ({progressPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {goal.status === "active" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-orange-500"
              onClick={() => onCancel(goal.id)}
              aria-label="모금 취소"
              title="모금 취소"
            >
              <XCircle className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(goal.id)}
            aria-label="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground"
            onClick={() => setExpanded((v) => !v)}
            aria-label="상세 보기"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="space-y-0.5">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              goal.status === "completed"
                ? "bg-emerald-500"
                : goal.status === "cancelled"
                ? "bg-gray-400"
                : dday.isOverdue && progressPercent < 100
                ? "bg-red-400"
                : "bg-emerald-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* 마일스톤 점 표시 */}
        <div className="relative h-1">
          {MILESTONE_PERCENTS.map((mp) => {
            const milestone = goal.milestones.find((m) => m.percent === mp);
            const reached = !!milestone?.reachedAt;
            return (
              <div
                key={mp}
                className={`absolute top-0 w-1 h-1 rounded-full -translate-x-1/2 ${
                  reached ? "bg-emerald-600" : "bg-border"
                }`}
                style={{ left: `${mp}%` }}
                title={`${mp}%`}
              />
            );
          })}
        </div>
      </div>

      {/* 상세 (확장 시) */}
      {expanded && (
        <GoalDetail goal={goal} onAddContribution={onAddContribution} />
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

type Props = {
  groupId: string;
};

export function FundraisingGoalCard({ groupId }: Props) {
  const {
    goals,
    addGoal,
    deleteGoal,
    cancelGoal,
    addContribution,
    activeGoals,
    overallProgress,
  } = useFundraisingGoal(groupId);

  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AddGoalForm>(EMPTY_GOAL_FORM);

  function updateForm<K extends keyof AddGoalForm>(
    key: K,
    value: AddGoalForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setForm(EMPTY_GOAL_FORM);
  }

  function handleAddGoal() {
    const targetAmount = parseInt(form.targetAmount.replace(/,/g, ""), 10);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error("올바른 목표 금액을 입력해주세요.");
      return;
    }
    const ok = addGoal({
      title: form.title,
      description: form.description,
      targetAmount,
      deadline: form.deadline,
    });
    if (ok) {
      handleCloseDialog();
    }
  }

  function handleDelete(goalId: string) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    deleteGoal(goalId);
  }

  function handleCancel(goalId: string) {
    cancelGoal(goalId);
  }

  function handleAddContribution(goalId: string, contribForm: AddContribForm) {
    const amount = parseInt(contribForm.amount.replace(/,/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("올바른 기부 금액을 입력해주세요.");
      return;
    }
    addContribution(goalId, {
      donorName: contribForm.donorName,
      amount,
      date: contribForm.date,
      note: contribForm.note,
    });
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="overflow-hidden">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors select-none">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">기금 모금</span>
                {activeGoals > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40 border">
                    활성 {activeGoals}개
                  </Badge>
                )}
                {goals.length > 0 && overallProgress > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/40 border">
                    {overallProgress.toFixed(0)}% 달성
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                  aria-label="모금 목표 추가"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-3 pb-3 pt-0 space-y-3">
              {/* 전체 진행률 바 */}
              {goals.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      전체 진행률
                    </span>
                    <span className="text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {overallProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 목표 목록 */}
              {goals.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-muted-foreground">
                  등록된 모금 목표가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      onDelete={handleDelete}
                      onCancel={handleCancel}
                      onAddContribution={handleAddContribution}
                    />
                  ))}
                </div>
              )}

              {/* 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                모금 목표 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 모금 목표 추가 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">모금 목표 추가</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* 제목 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                제목 <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="예: 2026 정기공연 의상 기금"
                className="h-7 text-xs"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">설명</label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="모금 목적 및 사용 계획을 입력하세요"
                className="text-xs min-h-[60px] resize-none"
                rows={3}
              />
            </div>

            {/* 목표 금액 + 마감일 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  목표 금액 (원) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => updateForm("targetAmount", e.target.value)}
                  placeholder="0"
                  className="h-7 text-xs"
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">
                  마감일 <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => updateForm("deadline", e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* 목표 금액 미리보기 */}
            {form.targetAmount && parseInt(form.targetAmount, 10) > 0 && (
              <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
                <p className="text-[10px] text-muted-foreground">
                  목표 금액:{" "}
                  <span className="font-semibold text-foreground">
                    {formatAmount(parseInt(form.targetAmount, 10))}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCloseDialog}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAddGoal}
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
