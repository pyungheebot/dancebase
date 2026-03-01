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
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Plus,
  Flag,
  CheckCircle2,
  XCircle,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { usePersonalGoals } from "@/hooks/use-personal-goals";
import type { PersonalGoalItem, PersonalGoalStatus } from "@/types";

// ============================================
// 유틸
// ============================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

function formatIso(isoStr: string): string {
  return isoStr.slice(0, 10).replace(/-/g, ".");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(targetDate: string, status: PersonalGoalStatus): boolean {
  if (status !== "active") return false;
  return targetDate < todayStr();
}

// ============================================
// 상태 배지
// ============================================

function StatusBadge({ status, isOver }: { status: PersonalGoalStatus; isOver?: boolean }) {
  if (status === "completed") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 shrink-0">
        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
        완료
      </Badge>
    );
  }
  if (status === "abandoned") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200 shrink-0">
        <XCircle className="h-2.5 w-2.5 mr-0.5" />
        포기
      </Badge>
    );
  }
  if (isOver) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-600 border-red-200 shrink-0">
        기한 초과
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 shrink-0">
      진행 중
    </Badge>
  );
}

// ============================================
// 목표 추가 다이얼로그
// ============================================

type AddGoalDialogProps = {
  canAddMore: boolean;
  maxGoals: number;
  onAdd: (params: {
    title: string;
    description: string;
    targetDate: string;
  }) => void;
};

function AddGoalDialog({ canAddMore, maxGoals, onAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("목표 제목을 입력해주세요");
      return;
    }
    if (!targetDate) {
      toast.error("목표 날짜를 선택해주세요");
      return;
    }
    void execute(async () => {
      onAdd({ title, description, targetDate });
      setTitle("");
      setDescription("");
      setTargetDate("");
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
          disabled={!canAddMore}
          title={!canAddMore ? `최대 ${maxGoals}개까지 등록 가능합니다` : "목표 추가"}
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <Target className="h-4 w-4 text-primary" />
            목표 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              목표 제목 <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 백 텀블링 마스터하기"
              className="h-8 text-xs"
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
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
              placeholder="목표에 대한 상세 내용을 입력하세요"
              className="text-xs min-h-[64px] resize-none"
              maxLength={200}
            />
          </div>

          {/* 목표일 */}
          <div className="space-y-1">
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
              disabled={submitting || !title.trim() || !targetDate}
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
// 목표 항목
// ============================================

type GoalItemProps = {
  goal: PersonalGoalItem;
  onUpdateProgress: (id: string, progress: number) => void;
  onAbandon: (id: string) => void;
  onDelete: (id: string) => void;
};

function GoalItem({ goal, onUpdateProgress, onAbandon, onDelete }: GoalItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [localProgress, setLocalProgress] = useState(goal.progress);

  const over = isOverdue(goal.targetDate, goal.status);
  const isCompleted = goal.status === "completed";
  const isAbandoned = goal.status === "abandoned";
  const isInactive = isCompleted || isAbandoned;

  // 슬라이더 변경 시 로컬 상태만 업데이트 (onValueCommit에서 persist)
  const handleSliderChange = useCallback((value: number[]) => {
    setLocalProgress(value[0]);
  }, []);

  const handleSliderCommit = useCallback(
    (value: number[]) => {
      onUpdateProgress(goal.id, value[0]);
    },
    [goal.id, onUpdateProgress]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      const clamped = Math.min(100, Math.max(0, v));
      setLocalProgress(clamped);
      onUpdateProgress(goal.id, clamped);
    },
    [goal.id, onUpdateProgress]
  );

  const handleAbandon = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAbandon(goal.id);
      toast.success("목표를 포기 처리했습니다");
    },
    [goal.id, onAbandon]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(goal.id);
      toast.success("목표가 삭제되었습니다");
    },
    [goal.id, onDelete]
  );

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isAbandoned
          ? "bg-gray-50 border-gray-200 opacity-60"
          : "bg-background border-border"
      }`}
    >
      {/* 헤더 행 - 클릭으로 펼침/접기 */}
      <button
        type="button"
        className="w-full text-left px-3 py-2.5 flex items-start gap-2"
        onClick={() => !isInactive && setExpanded((v) => !v)}
        disabled={isInactive}
      >
        {/* 진행률 표시 아이콘 */}
        <div className="shrink-0 mt-0.5">
          {isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : isAbandoned ? (
            <XCircle className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <Flag
              className={`h-3.5 w-3.5 ${over ? "text-red-500" : "text-primary"}`}
            />
          )}
        </div>

        {/* 제목 + 날짜 */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p
            className={`text-xs font-medium leading-tight truncate ${
              isCompleted
                ? "line-through text-green-700"
                : isAbandoned
                ? "line-through text-gray-400"
                : ""
            }`}
          >
            {goal.title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CalendarDays className="h-2.5 w-2.5 shrink-0" />
            <span>{formatDate(goal.targetDate)}</span>
            {isCompleted && goal.completedAt && (
              <span className="text-green-600">
                · 완료 {formatIso(goal.completedAt)}
              </span>
            )}
          </div>
        </div>

        {/* 오른쪽: 상태 배지 + 진행률 + 펼침 버튼 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={goal.status} isOver={over} />
          <span
            className={`text-[11px] font-semibold w-7 text-right ${
              isCompleted ? "text-green-600" : over ? "text-red-500" : "text-primary"
            }`}
          >
            {goal.progress}%
          </span>
          {!isInactive && (
            <span className="text-muted-foreground">
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </button>

      {/* 프로그레스 바 */}
      <div className="px-3 pb-1.5">
        <Progress
          value={isCompleted ? 100 : goal.progress}
          className={`h-1 ${
            isCompleted
              ? "[&>[data-slot=progress-indicator]]:bg-green-500"
              : isAbandoned
              ? "[&>[data-slot=progress-indicator]]:bg-gray-400"
              : over
              ? "[&>[data-slot=progress-indicator]]:bg-red-400"
              : ""
          }`}
        />
      </div>

      {/* 펼쳐진 영역: 진행률 수정 + 액션 버튼 */}
      {expanded && !isInactive && (
        <div className="px-3 pb-3 space-y-3 border-t border-dashed pt-2.5">
          {/* 설명 */}
          {goal.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {goal.description}
            </p>
          )}

          {/* 진행률 수정 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                진행률 수정
              </span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={localProgress}
                  onChange={handleInputChange}
                  className="h-6 w-12 text-xs text-center px-1"
                />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[localProgress]}
              min={0}
              max={100}
              step={5}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-between pt-0.5">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={handleAbandon}
            >
              <XCircle className="h-2.5 w-2.5 mr-0.5" />
              포기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-2.5 w-2.5 mr-0.5" />
              삭제
            </Button>
          </div>
        </div>
      )}

      {/* 완료된 목표: 삭제 버튼만 노출 */}
      {isCompleted && (
        <div className="px-3 pb-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
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

type PersonalGoalsCardProps = {
  groupId: string;
  userId: string;
};

export function PersonalGoalsCard({ groupId, userId }: PersonalGoalsCardProps) {
  const [open, setOpen] = useState(true);

  const {
    goals,
    loading,
    activeCount,
    completedCount,
    canAddMore,
    maxGoals,
    addGoal,
    updateProgress,
    abandonGoal,
    deleteGoal,
  } = usePersonalGoals(groupId, userId);

  const handleAdd = useCallback(
    (params: { title: string; description: string; targetDate: string }) => {
      const result = addGoal(params);
      if (result.success) {
        toast.success("목표가 추가되었습니다");
      } else {
        toast.error(result.message ?? "목표 추가에 실패했습니다");
      }
    },
    [addGoal]
  );

  const handleUpdateProgress = useCallback(
    (id: string, progress: number) => {
      updateProgress(id, progress);
      if (progress === 100) {
        toast.success("목표를 완료했습니다! 수고하셨어요.");
      }
    },
    [updateProgress]
  );

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground text-center py-4">불러오는 중...</p>
      </div>
    );
  }

  // 표시 순서: active → completed → abandoned
  const sorted = [...goals].sort((a, b) => {
    const order: Record<string, number> = { active: 0, completed: 1, abandoned: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

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
              <span className="text-sm font-semibold">나의 목표</span>
              {activeCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                  진행 중 {activeCount}
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  완료 {completedCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AddGoalDialog
                canAddMore={canAddMore}
                maxGoals={maxGoals}
                onAdd={handleAdd}
              />
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* 목표 목록 */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {sorted.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <Target className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  아직 등록된 목표가 없습니다
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  상단 추가 버튼으로 목표를 설정해보세요
                </p>
              </div>
            ) : (
              sorted.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={handleUpdateProgress}
                  onAbandon={abandonGoal}
                  onDelete={deleteGoal}
                />
              ))
            )}

            {/* 목표 개수 안내 */}
            {goals.length > 0 && (
              <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
                {goals.filter((g) => g.status !== "abandoned").length} / {maxGoals}개 사용 중
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
