"use client";

import { useState } from "react";
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
  Circle,
  CalendarDays,
  Flag,
  X,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDanceMilestone, calcGoalProgress } from "@/hooks/use-dance-milestone";
import type { DanceMilestoneCategory, DanceMilestoneGoal } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 레이블 상수
// ============================================================

const CATEGORY_LABELS: Record<DanceMilestoneCategory, string> = {
  genre: "장르 마스터",
  technique: "테크닉",
  flexibility: "유연성",
  stamina: "체력/지구력",
  performance: "무대 퍼포먼스",
  freestyle: "프리스타일",
  choreography: "안무 창작",
  other: "기타",
};

const CATEGORY_COLORS: Record<DanceMilestoneCategory, string> = {
  genre: "bg-purple-100 text-purple-700 border-purple-200",
  technique: "bg-blue-100 text-blue-700 border-blue-200",
  flexibility: "bg-pink-100 text-pink-700 border-pink-200",
  stamina: "bg-orange-100 text-orange-700 border-orange-200",
  performance: "bg-cyan-100 text-cyan-700 border-cyan-200",
  freestyle: "bg-green-100 text-green-700 border-green-200",
  choreography: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

// ============================================================
// 유틸
// ============================================================

function progressBarColor(progress: number): string {
  if (progress <= 30) return "bg-red-400";
  if (progress <= 70) return "bg-yellow-400";
  return "bg-green-500";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 목표 추가 다이얼로그
// ============================================================

type AddGoalDialogProps = {
  memberId: string;
  onAdd: (params: {
    title: string;
    description?: string;
    category: DanceMilestoneCategory;
    targetDate?: string;
  }) => void;
};

function AddGoalDialog({ onAdd }: AddGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<DanceMilestoneCategory>("genre");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const resetForm = () => {
    setCategory("genre");
    setTitle("");
    setDescription("");
    setTargetDate("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.MEMBERS.GOAL_TITLE_REQUIRED);
      return;
    }
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      targetDate: targetDate || undefined,
    });
    toast.success(TOAST.MEMBERS.GOAL_ADDED);
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          목표 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 댄스 목표 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">카테고리</label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DanceMilestoneCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as DanceMilestoneCategory[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 목표 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              목표 제목 <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 팝핑 마스터"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">설명 (선택)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="목표에 대한 간단한 설명"
              className="text-xs min-h-[60px] resize-none"
              maxLength={200}
            />
          </div>

          {/* 목표 기한 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">목표 기한 (선택)</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={todayStr()}
              className="h-8 text-xs"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => { resetForm(); setOpen(false); }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleSubmit}
            >
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단계 추가 인라인 폼
// ============================================================

type AddStepFormProps = {
  onAdd: (title: string, description?: string) => void;
  onCancel: () => void;
};

function AddStepForm({ onAdd, onCancel }: AddStepFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.MEMBERS.MILESTONE_TITLE_REQUIRED);
      return;
    }
    onAdd(title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="border border-dashed border-muted-foreground/30 rounded-md p-2.5 space-y-2 bg-muted/20">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="단계 제목 (예: 기초 아이솔레이션)"
        className="h-7 text-xs"
        maxLength={50}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        autoFocus
      />
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        className="h-7 text-xs"
        maxLength={100}
      />
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={handleSubmit}
        >
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 목표 카드 (단일)
// ============================================================

type GoalCardProps = {
  goal: DanceMilestoneGoal;
  onToggleStep: (goalId: string, stepId: string) => void;
  onAddStep: (goalId: string, title: string, description?: string) => void;
  onDeleteStep: (goalId: string, stepId: string) => void;
  onDeleteGoal: (goalId: string) => void;
};

function GoalCard({
  goal,
  onToggleStep,
  onAddStep,
  onDeleteStep,
  onDeleteGoal,
}: GoalCardProps) {
  const [open, setOpen] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);

  const progress = calcGoalProgress(goal);
  const completedCount = goal.steps.filter((s) => s.isCompleted).length;
  const isExpired =
    goal.targetDate ? goal.targetDate < todayStr() && progress < 100 : false;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            {/* 아이콘 */}
            <div className="mt-0.5 shrink-0">
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium truncate">{goal.title}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${CATEGORY_COLORS[goal.category]}`}
                >
                  {CATEGORY_LABELS[goal.category]}
                </Badge>
                {progress === 100 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500 text-white shrink-0">
                    완료
                  </Badge>
                )}
                {isExpired && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200 shrink-0"
                  >
                    기한 초과
                  </Badge>
                )}
              </div>

              {goal.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {goal.description}
                </p>
              )}

              {/* 진행률 바 */}
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {goal.steps.length > 0
                      ? `${completedCount} / ${goal.steps.length} 단계 완료`
                      : "단계 없음"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressBarColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 기한 */}
              {goal.targetDate && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>목표 기한: {formatYearMonthDay(goal.targetDate)}</span>
                </div>
              )}
            </div>

            {/* 열림 화살표 */}
            <div className="shrink-0 text-muted-foreground">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t bg-muted/10">
            {/* 마일스톤 단계 목록 */}
            {goal.steps.length > 0 && (
              <ul className="space-y-1 pt-2">
                {[...goal.steps]
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <li
                      key={step.id}
                      className="flex items-start gap-2 group"
                    >
                      {/* 완료 토글 */}
                      <button
                        onClick={() => onToggleStep(goal.id, step.id)}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-600 transition-colors"
                      >
                        {step.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs ${
                            step.isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {step.title}
                        </span>
                        {step.description && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {step.description}
                          </p>
                        )}
                        {step.isCompleted && step.completedAt && (
                          <p className="text-[10px] text-green-600">
                            {formatYearMonthDay(step.completedAt.slice(0, 10))} 완료
                          </p>
                        )}
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => onDeleteStep(goal.id, step.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {/* 단계 추가 폼 */}
            {showAddStep ? (
              <AddStepForm
                onAdd={(title, desc) => {
                  onAddStep(goal.id, title, desc);
                  setShowAddStep(false);
                  toast.success(TOAST.MEMBERS.MILESTONE_ADDED);
                }}
                onCancel={() => setShowAddStep(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddStep(true)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <Plus className="h-3 w-3" />
                단계 추가
              </button>
            )}

            {/* 목표 삭제 */}
            <div className="flex justify-end pt-1 border-t border-muted/40">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2 text-muted-foreground hover:text-red-500"
                onClick={() => {
                  onDeleteGoal(goal.id);
                  toast.success(TOAST.MEMBERS.GOAL_DELETED);
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                목표 삭제
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type DanceMilestoneCardProps = {
  memberId: string;
  memberName?: string;
};

export function DanceMilestoneCard({
  memberId,
  memberName,
}: DanceMilestoneCardProps) {
  const {
    goals,
    loading,
    activeGoalsCount,
    completedGoalsCount,
    overallProgress,
    addGoal,
    deleteGoal,
    addStep,
    toggleStep,
    deleteStep,
  } = useDanceMilestone(memberId);

  if (loading) {
    return (
      <div className="border rounded-xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold">
            댄스 목표 마일스톤
            {memberName && (
              <span className="text-muted-foreground font-normal ml-1">
                — {memberName}
              </span>
            )}
          </span>
        </div>
        <AddGoalDialog memberId={memberId} onAdd={addGoal} />
      </div>

      {/* 요약 통계 */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/40 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-foreground">{goals.length}</div>
            <div className="text-[10px] text-muted-foreground">전체 목표</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-blue-600">{activeGoalsCount}</div>
            <div className="text-[10px] text-muted-foreground">진행 중</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-green-600">{completedGoalsCount}</div>
            <div className="text-[10px] text-muted-foreground">완료</div>
          </div>
        </div>
      )}

      {/* 전체 진행률 */}
      {goals.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>전체 평균 진행률</span>
            </div>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressBarColor(overallProgress)}`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 목표 목록 */}
      {goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">아직 등록된 댄스 목표가 없습니다</p>
          <p className="text-[11px] mt-0.5 opacity-70">
            상단의 &quot;목표 추가&quot; 버튼을 눌러 시작하세요
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleStep={toggleStep}
              onAddStep={(goalId, title, description) =>
                addStep(goalId, { title, description })
              }
              onDeleteStep={deleteStep}
              onDeleteGoal={deleteGoal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
