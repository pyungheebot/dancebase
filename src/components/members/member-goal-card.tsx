"use client";

import { useState, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Flag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMemberGoal } from "@/hooks/use-member-goal";
import type {
  MemberGoalEntry,
  MemberGoalCategory,
  MemberGoalPriority,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 레이블 상수
// ============================================

const CATEGORY_LABELS: Record<MemberGoalCategory, string> = {
  technique: "테크닉",
  flexibility: "유연성",
  stamina: "체력",
  performance: "퍼포먼스",
  attendance: "출석",
  leadership: "리더십",
  other: "기타",
};

const CATEGORY_COLORS: Record<MemberGoalCategory, string> = {
  technique: "bg-purple-100 text-purple-700 border-purple-200",
  flexibility: "bg-pink-100 text-pink-700 border-pink-200",
  stamina: "bg-orange-100 text-orange-700 border-orange-200",
  performance: "bg-cyan-100 text-cyan-700 border-cyan-200",
  attendance: "bg-blue-100 text-blue-700 border-blue-200",
  leadership: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_LABELS: Record<MemberGoalPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLORS: Record<MemberGoalPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

// ============================================
// 유틸
// ============================================

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function progressBarColor(progress: number): string {
  if (progress <= 30) return "bg-red-400";
  if (progress <= 70) return "bg-yellow-400";
  return "bg-green-500";
}

// ============================================
// 목표 추가 다이얼로그
// ============================================

type AddGoalDialogProps = {
  memberNames: string[];
  onAdd: (params: {
    memberName: string;
    category: MemberGoalCategory;
    title: string;
    description: string;
    priority: MemberGoalPriority;
    targetDate: string;
    milestones: string[];
  }) => void;
};

function AddGoalDialog({ memberNames, onAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState(memberNames[0] ?? "");
  const [category, setCategory] = useState<MemberGoalCategory>("technique");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MemberGoalPriority>("medium");
  const [targetDate, setTargetDate] = useState("");
  const [milestoneInput, setMilestoneInput] = useState("");
  const [milestones, setMilestones] = useState<string[]>([]);
  const { pending: submitting, execute } = useAsyncAction();

  const resetForm = () => {
    setMemberName(memberNames[0] ?? "");
    setCategory("technique");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setTargetDate("");
    setMilestoneInput("");
    setMilestones([]);
  };

  const handleAddMilestone = () => {
    const trimmed = milestoneInput.trim();
    if (!trimmed) return;
    if (milestones.length >= 10) {
      toast.error(TOAST.MEMBERS.GOAL_MILESTONE_MAX);
      return;
    }
    setMilestones((prev) => [...prev, trimmed]);
    setMilestoneInput("");
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!memberName) {
      toast.error(TOAST.MEMBERS.GOAL_MEMBER_REQUIRED);
      return;
    }
    if (!title.trim()) {
      toast.error(TOAST.MEMBERS.GOAL_TITLE_REQUIRED);
      return;
    }
    if (!targetDate) {
      toast.error(TOAST.MEMBERS.GOAL_DATE_REQUIRED);
      return;
    }
    void execute(async () => {
      onAdd({
        memberName,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
        targetDate,
        milestones,
      });
      resetForm();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3 mr-1" />
          목표 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <Target className="h-4 w-4 text-primary" />
            멤버 목표 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              멤버 <span className="text-destructive">*</span>
            </label>
            <Select value={memberName} onValueChange={setMemberName}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              카테고리 <span className="text-destructive">*</span>
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as MemberGoalCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [MemberGoalCategory, string][]).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              목표 제목 <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 백 텀블링 완성하기"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              설명 (선택)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="목표에 대한 상세 내용"
              className="text-xs min-h-[56px] resize-none"
              maxLength={200}
            />
          </div>

          {/* 우선순위 + 목표일 */}
          <div className="flex gap-2">
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                우선순위
              </label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as MemberGoalPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high" className="text-xs">높음</SelectItem>
                  <SelectItem value="medium" className="text-xs">보통</SelectItem>
                  <SelectItem value="low" className="text-xs">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                목표 날짜 <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={todayStr()}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 마일스톤 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">
              마일스톤 (선택, 최대 10개)
            </label>
            <div className="flex gap-1.5">
              <Input
                value={milestoneInput}
                onChange={(e) => setMilestoneInput(e.target.value)}
                placeholder="마일스톤 입력 후 Enter"
                className="h-7 text-xs flex-1"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleAddMilestone}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {milestones.length > 0 && (
              <div className="space-y-1">
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border px-2 py-1 bg-muted/40"
                  >
                    <span className="text-[11px] truncate">{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(i)}
                      className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !targetDate || !memberName}
            >
              목표 추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 목표 카드 아이템
// ============================================

type GoalItemCardProps = {
  goal: MemberGoalEntry;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onComplete: (id: string) => void;
  onAbandon: (id: string) => void;
  onDelete: (id: string) => void;
};

function GoalItemCard({
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
  const isOverdue =
    goal.status === "active" && goal.targetDate < todayStr();

  const barColor = progressBarColor(goal.progress);

  const handleProgressCommit = useCallback(() => {
    const v = parseInt(progressInput, 10);
    if (isNaN(v)) return;
    const clamped = Math.min(100, Math.max(0, v));
    setProgressInput(String(clamped));
    onUpdateProgress(goal.id, clamped);
    if (clamped === 100) toast.success(TOAST.MEMBERS.GOAL_FINISHED);
  }, [progressInput, goal.id, onUpdateProgress]);

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isAbandoned
          ? "bg-gray-50 border-gray-200 opacity-60"
          : isOverdue
          ? "bg-red-50 border-red-200"
          : "bg-background border-border"
      }`}
    >
      {/* 헤더 */}
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 flex items-start gap-2"
        onClick={() => !isInactive && setExpanded((v) => !v)}
        disabled={isInactive}
      >
        <div className="shrink-0 mt-0.5">
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
          {/* 제목 행 */}
          <div className="flex items-start justify-between gap-1.5">
            <p
              className={`text-xs font-medium leading-tight ${
                isCompleted
                  ? "line-through text-green-700"
                  : isAbandoned
                  ? "line-through text-gray-400"
                  : ""
              }`}
            >
              {goal.title}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {/* 카테고리 배지 */}
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${CATEGORY_COLORS[goal.category]}`}
              >
                {CATEGORY_LABELS[goal.category]}
              </Badge>
              {/* 우선순위 배지 */}
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${PRIORITY_COLORS[goal.priority]}`}
              >
                {PRIORITY_LABELS[goal.priority]}
              </Badge>
            </div>
          </div>

          {/* 멤버명 + 목표일 */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground/70">{goal.memberName}</span>
            <span className="flex items-center gap-0.5">
              <CalendarDays className="h-2.5 w-2.5" />
              {formatYearMonthDay(goal.targetDate)}
              {isOverdue && (
                <span className="ml-0.5 text-red-500 font-medium">기한 초과</span>
              )}
            </span>
            {goal.milestones.length > 0 && (
              <span>
                마일스톤{" "}
                {goal.milestones.filter((m) => m.completed).length}/
                {goal.milestones.length}
              </span>
            )}
          </div>
        </div>

        {/* 진행률 + 펼침 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[11px] font-semibold w-7 text-right ${
              isCompleted
                ? "text-green-600"
                : isOverdue
                ? "text-red-500"
                : "text-primary"
            }`}
          >
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

      {/* 진행률 CSS 바 */}
      <div className="px-3 pb-1.5">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? "bg-green-500"
                : isAbandoned
                ? "bg-gray-400"
                : barColor
            }`}
            style={{ width: `${isCompleted ? 100 : goal.progress}%` }}
          />
        </div>
      </div>

      {/* 펼쳐진 상세 */}
      {expanded && !isInactive && (
        <div className="px-3 pb-3 space-y-3 border-t border-dashed pt-2.5">
          {/* 설명 */}
          {goal.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {goal.description}
            </p>
          )}

          {/* 진행률 직접 입력 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
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
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
            </div>
            {/* 빠른 선택 버튼 */}
            <div className="flex gap-1">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setProgressInput(String(v));
                    onUpdateProgress(goal.id, v);
                    if (v === 100) toast.success(TOAST.MEMBERS.GOAL_FINISHED);
                  }}
                  className={`flex-1 text-[10px] py-0.5 rounded border transition-colors ${
                    goal.progress === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* 마일스톤 체크리스트 */}
          {goal.milestones.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                마일스톤
              </span>
              <div className="space-y-1">
                {goal.milestones.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => onToggleMilestone(goal.id, m.id)}
                      className="h-3 w-3 rounded accent-primary"
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
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => {
                  onComplete(goal.id);
                  toast.success(TOAST.MEMBERS.GOAL_FINISHED_PROCESS);
                }}
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                완료
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => {
                  onAbandon(goal.id);
                  toast.success(TOAST.MEMBERS.GOAL_ABANDONED);
                }}
              >
                <XCircle className="h-2.5 w-2.5 mr-0.5" />
                포기
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
              onClick={() => {
                onDelete(goal.id);
                toast.success(TOAST.MEMBERS.GOAL_DELETED);
              }}
            >
              <Trash2 className="h-2.5 w-2.5 mr-0.5" />
              삭제
            </Button>
          </div>
        </div>
      )}

      {/* 완료/포기 상태: 삭제만 노출 */}
      {isInactive && (
        <div className="px-3 pb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
            onClick={() => {
              onDelete(goal.id);
              toast.success(TOAST.MEMBERS.GOAL_DIALOG_DELETED);
            }}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" />
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type MemberGoalCardProps = {
  groupId: string;
  memberNames: string[];
};

const ALL_CATEGORIES: MemberGoalCategory[] = [
  "technique",
  "flexibility",
  "stamina",
  "performance",
  "attendance",
  "leadership",
  "other",
];

export function MemberGoalCard({ groupId, memberNames }: MemberGoalCardProps) {
  const [open, setOpen] = useState(true);
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

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
  // 필터링
  // ============================================

  const filtered = entries.filter((g) => {
    const memberOk =
      filterMember === "all" || g.memberName === filterMember;
    const categoryOk =
      filterCategory === "all" || g.category === filterCategory;
    return memberOk && categoryOk;
  });

  // 정렬: active -> completed -> abandoned, 그 안에서 targetDate 오름차순
  const sorted = [...filtered].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      active: 0,
      completed: 1,
      abandoned: 2,
    };
    const so =
      (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (so !== 0) return so;
    return a.targetDate.localeCompare(b.targetDate);
  });

  // ============================================
  // 카테고리 분포 차트 데이터
  // ============================================

  const maxCategoryCount = Math.max(
    1,
    ...Object.values(categoryDistribution)
  );

  const handleAddGoal = useCallback(
    (params: Parameters<typeof addGoal>[0]) => {
      addGoal(params);
      toast.success(TOAST.MEMBERS.GOAL_ADDED);
    },
    [addGoal]
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
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
              <AddGoalDialog
                memberNames={memberNames}
                onAdd={handleAddGoal}
              />
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* 통계 요약 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "전체", value: totalGoals, color: "text-foreground" },
                {
                  label: "진행중",
                  value: activeGoals,
                  color: "text-blue-600",
                },
                {
                  label: "완료",
                  value: completedGoals,
                  color: "text-green-600",
                },
                {
                  label: "평균진행률",
                  value: `${averageProgress}%`,
                  color:
                    averageProgress >= 71
                      ? "text-green-600"
                      : averageProgress >= 31
                      ? "text-yellow-600"
                      : "text-red-500",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg border bg-muted/30 px-2 py-1.5 text-center"
                >
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* 카테고리 분포 bar chart */}
            {totalGoals > 0 && (
              <div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  카테고리 분포
                </p>
                <div className="space-y-1">
                  {ALL_CATEGORIES.filter(
                    (cat) => categoryDistribution[cat] > 0
                  ).map((cat) => {
                    const count = categoryDistribution[cat];
                    const pct = Math.round(
                      (count / maxCategoryCount) * 100
                    );
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${CATEGORY_COLORS[cat].split(" ")[0].replace("bg-", "bg-").replace("-100", "-400")}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-4 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 필터 */}
            <div className="flex gap-2">
              <Select value={filterMember} onValueChange={setFilterMember}>
                <SelectTrigger className="h-7 text-xs flex-1">
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

              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
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

            {/* 목표 목록 */}
            {sorted.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <Target className="h-8 w-8 text-muted-foreground/30 mx-auto" />
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
              <div className="space-y-2">
                {sorted.map((goal) => (
                  <GoalItemCard
                    key={goal.id}
                    goal={goal}
                    onUpdateProgress={updateProgress}
                    onToggleMilestone={toggleMilestone}
                    onComplete={completeGoal}
                    onAbandon={abandonGoal}
                    onDelete={deleteGoal}
                  />
                ))}
              </div>
            )}

            {/* 필터 적용 시 카운트 */}
            {(filterMember !== "all" || filterCategory !== "all") &&
              totalGoals > 0 && (
                <p className="text-[10px] text-muted-foreground/60 text-right">
                  {sorted.length} / {totalGoals}개 표시 중
                </p>
              )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
