"use client";

import { useState } from "react";
import {
  Flame,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWarmupRoutine } from "@/hooks/use-warmup-routine";
import type { WarmupExercise, WarmupExerciseType } from "@/types";

// ============================================
// 유형 관련 상수
// ============================================

const EXERCISE_TYPE_LABELS: Record<WarmupExerciseType, string> = {
  stretch: "스트레칭",
  cardio: "유산소",
  strength: "근력",
  balance: "밸런스",
  isolation: "아이솔레이션",
  cooldown: "쿨다운",
};

const EXERCISE_TYPE_COLORS: Record<WarmupExerciseType, string> = {
  stretch: "bg-green-100 text-green-700 border-green-200",
  cardio: "bg-red-100 text-red-700 border-red-200",
  strength: "bg-orange-100 text-orange-700 border-orange-200",
  balance: "bg-blue-100 text-blue-700 border-blue-200",
  isolation: "bg-purple-100 text-purple-700 border-purple-200",
  cooldown: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const ALL_TYPES: WarmupExerciseType[] = [
  "stretch",
  "cardio",
  "strength",
  "balance",
  "isolation",
  "cooldown",
];

// ============================================
// 시간 포맷 유틸
// ============================================

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ============================================
// 유형 배지
// ============================================

function TypeBadge({ type }: { type: WarmupExerciseType }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${EXERCISE_TYPE_COLORS[type]}`}
    >
      {EXERCISE_TYPE_LABELS[type]}
    </span>
  );
}

// ============================================
// 루틴 생성 다이얼로그
// ============================================

interface CreateRoutineDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, createdBy: string) => void;
}

function CreateRoutineDialog({
  open,
  onClose,
  onCreate,
}: CreateRoutineDialogProps) {
  const [name, setName] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("루틴 이름을 입력해주세요.");
      return;
    }
    onCreate(trimmed, createdBy);
    setName("");
    setCreatedBy("");
    onClose();
    toast.success("루틴이 생성되었습니다.");
  };

  const handleClose = () => {
    setName("");
    setCreatedBy("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">새 워밍업 루틴</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              루틴 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 기본 스트레칭, 힙합 워밍업"
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              작성자
            </Label>
            <Input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="이름 (미입력 시 '나')"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 운동 추가 다이얼로그
// ============================================

const DEFAULT_EXERCISE_FORM = {
  name: "",
  type: "stretch" as WarmupExerciseType,
  durationStr: "",
  repetitionsStr: "",
  description: "",
  bodyPart: "",
};

interface AddExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    type: WarmupExerciseType,
    duration: number,
    repetitions?: number,
    description?: string,
    bodyPart?: string
  ) => void;
}

function AddExerciseDialog({ open, onClose, onAdd }: AddExerciseDialogProps) {
  const [form, setForm] = useState(DEFAULT_EXERCISE_FORM);

  const set = <K extends keyof typeof DEFAULT_EXERCISE_FORM>(
    key: K,
    value: (typeof DEFAULT_EXERCISE_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("운동 이름을 입력해주세요.");
      return;
    }
    const duration = parseInt(form.durationStr, 10);
    if (!form.durationStr || isNaN(duration) || duration <= 0) {
      toast.error("올바른 시간(초)을 입력해주세요.");
      return;
    }
    const repetitions = form.repetitionsStr
      ? parseInt(form.repetitionsStr, 10)
      : undefined;
    onAdd(
      form.name,
      form.type,
      duration,
      repetitions && !isNaN(repetitions) ? repetitions : undefined,
      form.description || undefined,
      form.bodyPart || undefined
    );
    setForm(DEFAULT_EXERCISE_FORM);
    onClose();
    toast.success("운동이 추가되었습니다.");
  };

  const handleClose = () => {
    setForm(DEFAULT_EXERCISE_FORM);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">운동 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 이름 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              운동 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="예: 목 돌리기, 버피, 플랭크"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 유형 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              유형 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as WarmupExerciseType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          t === "stretch"
                            ? "bg-green-500"
                            : t === "cardio"
                            ? "bg-red-500"
                            : t === "strength"
                            ? "bg-orange-500"
                            : t === "balance"
                            ? "bg-blue-500"
                            : t === "isolation"
                            ? "bg-purple-500"
                            : "bg-cyan-500"
                        }`}
                      />
                      {EXERCISE_TYPE_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시간 + 횟수 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                시간(초) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.durationStr}
                onChange={(e) =>
                  set("durationStr", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="30"
                className="h-7 text-xs"
                type="number"
                min={1}
              />
            </div>
            <div className="w-24">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                횟수
              </Label>
              <Input
                value={form.repetitionsStr}
                onChange={(e) =>
                  set("repetitionsStr", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="10"
                className="h-7 text-xs"
                type="number"
                min={1}
              />
            </div>
          </div>

          {/* 부위 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              신체 부위
            </Label>
            <Input
              value={form.bodyPart}
              onChange={(e) => set("bodyPart", e.target.value)}
              placeholder="예: 목, 어깨, 하체, 전신"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              설명
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="운동 방법, 주의사항 등"
              className="min-h-[56px] resize-none text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.durationStr}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 운동 행
// ============================================

interface ExerciseRowProps {
  exercise: WarmupExercise;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ExerciseRow({
  exercise,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ExerciseRowProps) {
  return (
    <div className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 group hover:bg-muted/30 transition-colors">
      {/* 순번 */}
      <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
        {exercise.order}
      </span>

      {/* 이름 + 설명 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">
          {exercise.name}
        </p>
        {exercise.description && (
          <p className="text-[10px] text-muted-foreground/70 truncate italic">
            {exercise.description}
          </p>
        )}
      </div>

      {/* 배지 영역 */}
      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
        <TypeBadge type={exercise.type} />
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatSeconds(exercise.duration)}
        </span>
        {exercise.repetitions && (
          <span className="inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium bg-gray-50 text-gray-600 border-gray-200">
            {exercise.repetitions}회
          </span>
        )}
        {exercise.bodyPart && (
          <span className="inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-600 border-indigo-200">
            {exercise.bodyPart}
          </span>
        )}
      </div>

      {/* 순서 이동 버튼 */}
      <div className="flex flex-col gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="위로"
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="아래로"
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* 삭제 */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface WarmupRoutineCardProps {
  groupId: string;
}

export function WarmupRoutineCard({ groupId }: WarmupRoutineCardProps) {
  const {
    routines,
    totalRoutines,
    totalExercises,
    createRoutine,
    deleteRoutine,
    addExercise,
    removeExercise,
    moveExercise,
  } = useWarmupRoutine(groupId);

  const [open, setOpen] = useState(true);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);

  // 선택된 루틴 (없으면 첫 번째)
  const selectedRoutine =
    routines.find((r) => r.id === selectedRoutineId) ??
    routines[0] ??
    null;

  // order 기준 정렬
  const sortedExercises = selectedRoutine
    ? [...selectedRoutine.exercises].sort((a, b) => a.order - b.order)
    : [];

  const handleDeleteRoutine = (id: string) => {
    deleteRoutine(id);
    if (selectedRoutineId === id) setSelectedRoutineId("");
    toast.success("루틴이 삭제되었습니다.");
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!selectedRoutine) return;
    removeExercise(selectedRoutine.id, exerciseId);
    toast.success("운동이 삭제되었습니다.");
  };

  const handleMoveExercise = (
    exerciseId: string,
    direction: "up" | "down"
  ) => {
    if (!selectedRoutine) return;
    moveExercise(selectedRoutine.id, exerciseId, direction);
  };

  const handleAddExercise = (
    name: string,
    type: WarmupExerciseType,
    duration: number,
    repetitions?: number,
    description?: string,
    bodyPart?: string
  ) => {
    if (!selectedRoutine) return;
    addExercise(
      selectedRoutine.id,
      name,
      type,
      duration,
      repetitions,
      description,
      bodyPart
    );
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-800">
              워밍업 루틴
            </span>
            {totalRoutines > 0 && (
              <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100">
                {totalRoutines}개 루틴
              </Badge>
            )}
            {totalExercises > 0 && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-100">
                {totalExercises}개 운동
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 gap-0.5"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3 w-3" />
                새 루틴
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-gray-200 bg-card p-4">
            {/* 루틴 없을 때 */}
            {routines.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                <Dumbbell className="h-8 w-8 opacity-30" />
                <p className="text-xs">아직 워밍업 루틴이 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  루틴 만들기
                </Button>
              </div>
            ) : (
              <>
                {/* 루틴 탭 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {routines.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoutineId(r.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        selectedRoutine?.id === r.id
                          ? "bg-orange-100 text-orange-700 border-orange-300 font-medium"
                          : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                      }`}
                    >
                      {r.name}
                      <span className="ml-1 text-[10px] opacity-60">
                        ({r.exercises.length})
                      </span>
                    </button>
                  ))}
                </div>

                {/* 선택된 루틴 상단 정보 + 버튼 */}
                {selectedRoutine && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {selectedRoutine.name}
                      </span>
                      {selectedRoutine.totalDuration > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          총 {formatSeconds(selectedRoutine.totalDuration)}
                        </span>
                      )}
                      {selectedRoutine.createdBy && (
                        <span className="text-[10px] text-muted-foreground/60">
                          by {selectedRoutine.createdBy}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-0.5"
                        onClick={() => setShowAddExerciseDialog(true)}
                      >
                        <Plus className="h-3 w-3" />
                        운동 추가
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteRoutine(selectedRoutine.id)}
                        title="루틴 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 운동 목록 */}
                {selectedRoutine && sortedExercises.length === 0 ? (
                  <div className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground">
                    <Flame className="h-7 w-7 opacity-30" />
                    <p className="text-xs">아직 등록된 운동이 없습니다.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAddExerciseDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      운동 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedExercises.map((exercise, idx) => (
                      <ExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        isFirst={idx === 0}
                        isLast={idx === sortedExercises.length - 1}
                        onRemove={() => handleRemoveExercise(exercise.id)}
                        onMoveUp={() => handleMoveExercise(exercise.id, "up")}
                        onMoveDown={() =>
                          handleMoveExercise(exercise.id, "down")
                        }
                      />
                    ))}
                  </div>
                )}

                {/* 하단 통계 요약 */}
                {totalRoutines > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-muted-foreground">
                    <span>
                      루틴{" "}
                      <strong className="text-foreground">
                        {totalRoutines}
                      </strong>
                      개
                    </span>
                    <span>
                      전체 운동{" "}
                      <strong className="text-foreground">
                        {totalExercises}
                      </strong>
                      개
                    </span>
                    {selectedRoutine && selectedRoutine.totalDuration > 0 && (
                      <span>
                        현재 루틴{" "}
                        <strong className="text-foreground">
                          {formatSeconds(selectedRoutine.totalDuration)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 다이얼로그 */}
      <CreateRoutineDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={createRoutine}
      />
      {selectedRoutine && (
        <AddExerciseDialog
          open={showAddExerciseDialog}
          onClose={() => setShowAddExerciseDialog(false)}
          onAdd={handleAddExercise}
        />
      )}
    </>
  );
}
