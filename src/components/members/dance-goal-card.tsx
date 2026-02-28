"use client";

import { useState, useCallback } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Flag,
  TrendingUp,
  Layers,
  Pencil,
  PlayCircle,
  PauseCircle,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useDanceGoal } from "@/hooks/use-dance-goal";
import type {
  DanceGoal,
  DanceGoalCategory,
  DanceGoalPriority,
  DanceGoalStatus,
} from "@/types";

// ============================================
// 상수 및 유틸
// ============================================

const CATEGORY_LABELS: Record<DanceGoalCategory, string> = {
  technique: "기술",
  flexibility: "유연성",
  strength: "체력",
  performance: "퍼포먼스",
  choreography: "안무",
  other: "기타",
};

const CATEGORY_COLORS: Record<DanceGoalCategory, string> = {
  technique: "bg-blue-100 text-blue-700",
  flexibility: "bg-green-100 text-green-700",
  strength: "bg-orange-100 text-orange-700",
  performance: "bg-purple-100 text-purple-700",
  choreography: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

const PRIORITY_LABELS: Record<DanceGoalPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLORS: Record<DanceGoalPriority, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-400",
};

const STATUS_LABELS: Record<DanceGoalStatus, string> = {
  active: "진행 중",
  completed: "완료",
  paused: "일시중지",
};

const STATUS_COLORS: Record<DanceGoalStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
};

const PROGRESS_BAR_COLORS: Record<DanceGoalStatus, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  paused: "bg-yellow-400",
};

function formatDate(isoStr: string): string {
  if (!isoStr) return "";
  return isoStr.slice(0, 10).replace(/-/g, ".");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(targetDate: string | null, status: DanceGoalStatus): boolean {
  if (!targetDate || status !== "active") return false;
  return targetDate < todayStr();
}

// ============================================
// 목표 폼 다이얼로그
// ============================================

type GoalFormData = {
  title: string;
  description: string;
  category: DanceGoalCategory;
  priority: DanceGoalPriority;
  targetDate: string;
};

const DEFAULT_FORM: GoalFormData = {
  title: "",
  description: "",
  category: "technique",
  priority: "medium",
  targetDate: "",
};

function GoalFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<GoalFormData>;
  onSubmit: (data: GoalFormData) => void;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState<GoalFormData>({
    ...DEFAULT_FORM,
    ...initial,
  });

  const handleOpen = useCallback(() => {
    setForm({ ...DEFAULT_FORM, ...initial });
  }, [initial]);

  // 다이얼로그 열릴 때 폼 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) handleOpen();
    else onClose();
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("목표 제목을 입력하세요.");
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "create" ? "목표 추가" : "목표 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">제목 *</label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 스플릿 완성하기"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">설명</label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="목표에 대한 간단한 설명"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          {/* 카테고리 / 우선순위 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">카테고리</label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as DanceGoalCategory }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as DanceGoalCategory[]).map(
                    (c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">우선순위</label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as DanceGoalPriority }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as DanceGoalPriority[]).map(
                    (p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* 목표 날짜 */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">목표 날짜</label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.targetDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetDate: e.target.value }))
              }
            />
          </div>
          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "create" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 단일 목표 카드
// ============================================

function GoalItem({
  goal,
  onUpdate,
  onDelete,
  onChangeStatus,
  onToggleMilestone,
  onAddMilestone,
  onRemoveMilestone,
  onUpdateProgress,
}: {
  goal: DanceGoal;
  onUpdate: (patch: Partial<DanceGoal>) => void;
  onDelete: () => void;
  onChangeStatus: (status: DanceGoalStatus) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onAddMilestone: (title: string) => void;
  onRemoveMilestone: (milestoneId: string) => void;
  onUpdateProgress: (progress: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [progressInput, setProgressInput] = useState(String(goal.progress));

  const overdue = isOverdue(goal.targetDate, goal.status);

  const handleAddMilestone = () => {
    if (!milestoneInput.trim()) return;
    onAddMilestone(milestoneInput.trim());
    setMilestoneInput("");
    toast.success("마일스톤이 추가되었습니다.");
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
          toast.success("목표가 수정되었습니다.");
        }}
        mode="edit"
      />

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="border rounded-lg p-3 space-y-2">
          {/* 헤더 */}
          <div className="flex items-start gap-2">
            <CollapsibleTrigger asChild>
              <button className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0 space-y-1">
              {/* 제목 행 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Flag
                  className={`h-3 w-3 shrink-0 ${PRIORITY_COLORS[goal.priority]}`}
                />
                <span className="text-sm font-medium truncate">{goal.title}</span>
                {goal.status === "completed" && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
              </div>

              {/* 배지 행 */}
              <div className="flex items-center gap-1 flex-wrap">
                <span
                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${CATEGORY_COLORS[goal.category]}`}
                >
                  {CATEGORY_LABELS[goal.category]}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}
                >
                  {STATUS_LABELS[goal.status]}
                </span>
                {goal.targetDate && (
                  <span
                    className={`text-[10px] flex items-center gap-0.5 ${
                      overdue ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(goal.targetDate)}
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
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                  수정
                </DropdownMenuItem>
                {goal.status !== "active" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("active");
                      toast.success("목표를 진행 중으로 변경했습니다.");
                    }}
                  >
                    <PlayCircle className="h-3 w-3" />
                    진행 중으로
                  </DropdownMenuItem>
                )}
                {goal.status !== "paused" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("paused");
                      toast.success("목표를 일시중지했습니다.");
                    }}
                  >
                    <PauseCircle className="h-3 w-3" />
                    일시중지
                  </DropdownMenuItem>
                )}
                {goal.status !== "completed" && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => {
                      onChangeStatus("completed");
                      toast.success("목표를 완료로 표시했습니다.");
                    }}
                  >
                    <CheckSquare className="h-3 w-3" />
                    완료로 표시
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-xs gap-2 text-red-600 focus:text-red-600"
                  onClick={() => {
                    onDelete();
                    toast.success("목표가 삭제되었습니다.");
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 진행률 바 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">진행률</span>
              <span className="text-[10px] font-medium">{goal.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${PROGRESS_BAR_COLORS[goal.status]}`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          {/* 펼쳐진 내용 */}
          <CollapsibleContent>
            <div className="space-y-3 pt-1 border-t mt-1">
              {/* 설명 */}
              {goal.description && (
                <p className="text-xs text-muted-foreground">
                  {goal.description}
                </p>
              )}

              {/* 진행률 직접 입력 (마일스톤 없을 때만) */}
              {goal.milestones.length === 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    진행률 직접 입력
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={parseInt(progressInput, 10) || 0}
                      className="flex-1 accent-primary"
                      onChange={(e) => {
                        setProgressInput(e.target.value);
                        onUpdateProgress(parseInt(e.target.value, 10));
                      }}
                    />
                    <div className="flex items-center">
                      <Input
                        className="h-6 w-14 text-xs text-center p-1"
                        value={progressInput}
                        onChange={(e) => setProgressInput(e.target.value)}
                        onBlur={handleProgressBlur}
                      />
                      <span className="text-xs ml-1">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 마일스톤 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">마일스톤</span>
                  {goal.milestones.length > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {goal.milestones.filter((m) => m.isCompleted).length}/
                      {goal.milestones.length} 완료
                    </span>
                  )}
                </div>

                {goal.milestones.length === 0 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    마일스톤을 추가하면 진행률이 자동 계산됩니다.
                  </p>
                )}

                <div className="space-y-1">
                  {goal.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 group"
                    >
                      <button
                        onClick={() => {
                          onToggleMilestone(m.id);
                        }}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {m.isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
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
                          {formatDate(m.completedAt)}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          onRemoveMilestone(m.id);
                          toast.success("마일스톤이 제거되었습니다.");
                        }}
                        className="h-4 w-4 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 마일스톤 추가 입력 */}
                <div className="flex items-center gap-1">
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder="마일스톤 추가..."
                    value={milestoneInput}
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
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </>
  );
}

// ============================================
// 전체 달성률 요약 차트 (CSS div 기반)
// ============================================

function OverallProgressChart({
  averageProgress,
  totalGoals,
  activeGoals,
  completedGoals,
  pausedGoals,
  categoryDistribution,
}: {
  averageProgress: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  pausedGoals: number;
  categoryDistribution: { category: DanceGoalCategory; label: string; count: number; percent: number }[];
}) {
  return (
    <div className="space-y-4">
      {/* 원형 진행률 (CSS 기반) */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - averageProgress / 100)}`}
              transform="rotate(-90 32 32)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{averageProgress}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">전체</span>
          <span className="font-medium">{totalGoals}개</span>
          <span className="text-green-600">진행 중</span>
          <span className="font-medium">{activeGoals}개</span>
          <span className="text-blue-600">완료</span>
          <span className="font-medium">{completedGoals}개</span>
          <span className="text-yellow-600">일시중지</span>
          <span className="font-medium">{pausedGoals}개</span>
        </div>
      </div>

      {/* 카테고리 분포 바 */}
      {categoryDistribution.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">카테고리 분포</span>
          <div className="space-y-1.5">
            {categoryDistribution.map((item) => (
              <div key={item.category} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.count}개 ({item.percent}%)
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      CATEGORY_COLORS[item.category].split(" ")[0].replace(
                        "bg-",
                        "bg-"
                      )
                    }`}
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: getCategoryBarColor(item.category),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryBarColor(category: DanceGoalCategory): string {
  const map: Record<DanceGoalCategory, string> = {
    technique: "#3b82f6",
    flexibility: "#22c55e",
    strength: "#f97316",
    performance: "#a855f7",
    choreography: "#ec4899",
    other: "#9ca3af",
  };
  return map[category];
}

// ============================================
// 메인 컴포넌트
// ============================================

type FilterCategory = DanceGoalCategory | "all";
type FilterStatus = DanceGoalStatus | "all";

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
  const sortedGoals = [...filteredGoals].sort((a, b) => {
    const priorityOrder: Record<DanceGoalPriority, number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return b.createdAt.localeCompare(a.createdAt);
  });

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
          toast.success("목표가 추가되었습니다.");
        }}
        mode="create"
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="border rounded-xl overflow-hidden">
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">댄스 목표 트래커</span>
              {totalGoals > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
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
              >
                <Plus className="h-3 w-3 mr-1" />
                목표 추가
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <div className="p-4 space-y-4">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">카테고리:</span>
                    <div className="flex gap-0.5 flex-wrap">
                      <button
                        onClick={() => setFilterCategory("all")}
                        className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          filterCategory === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        전체
                      </button>
                      {(Object.keys(CATEGORY_LABELS) as DanceGoalCategory[]).map(
                        (c) => (
                          <button
                            key={c}
                            onClick={() => setFilterCategory(c)}
                            className={`text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
                              filterCategory === c
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            {CATEGORY_LABELS[c]}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">상태:</span>
                    <div className="flex gap-0.5">
                      {(
                        [
                          { value: "all", label: "전체" },
                          { value: "active", label: "진행" },
                          { value: "completed", label: "완료" },
                          { value: "paused", label: "중지" },
                        ] as { value: FilterStatus; label: string }[]
                      ).map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setFilterStatus(item.value)}
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
                <div className="text-center py-6 text-xs text-muted-foreground">
                  불러오는 중...
                </div>
              )}

              {/* 빈 상태 */}
              {!loading && totalGoals === 0 && (
                <div className="text-center py-8 space-y-2">
                  <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
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
                    <Plus className="h-3 w-3 mr-1" />
                    첫 목표 추가
                  </Button>
                </div>
              )}

              {/* 필터 결과 없음 */}
              {!loading && totalGoals > 0 && sortedGoals.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  해당 조건의 목표가 없습니다.
                </div>
              )}

              {/* 목표 목록 */}
              {!loading && sortedGoals.length > 0 && (
                <div className="space-y-2">
                  {sortedGoals.map((goal) => (
                    <GoalItem
                      key={goal.id}
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
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </>
  );
}
