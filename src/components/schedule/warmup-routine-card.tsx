"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Dumbbell,
  X,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
// 유틸
// ============================================

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const EXERCISE_TYPE_LABELS: Record<WarmupExerciseType, string> = {
  stretch: "스트레칭",
  cardio: "유산소",
  strength: "근력",
  balance: "밸런스",
  isolation: "아이솔레이션",
  cooldown: "쿨다운",
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
// 타이머 로직 훅 (setInterval 기반)
// ============================================

type TimerState =
  | { phase: "idle" }
  | { phase: "running"; exerciseIndex: number; remaining: number }
  | { phase: "paused"; exerciseIndex: number; remaining: number }
  | { phase: "finished" };

function useRoutineTimer(exercises: WarmupExercise[]) {
  const [state, setState] = useState<TimerState>({ phase: "idle" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<TimerState>({ phase: "idle" });

  const setStateSync = useCallback((next: TimerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startFrom = useCallback(
    (index: number, remaining: number) => {
      clearTick();
      const runningState: TimerState = { phase: "running", exerciseIndex: index, remaining };
      stateRef.current = runningState;
      setState(runningState);
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.phase !== "running") return prev;
          if (prev.remaining > 1) {
            const next: TimerState = { ...prev, remaining: prev.remaining - 1 };
            stateRef.current = next;
            return next;
          }
          const nextIndex = prev.exerciseIndex + 1;
          if (nextIndex >= exercises.length) {
            const finished: TimerState = { phase: "finished" };
            stateRef.current = finished;
            return finished;
          }
          const next: TimerState = {
            phase: "running",
            exerciseIndex: nextIndex,
            remaining: exercises[nextIndex].duration,
          };
          stateRef.current = next;
          return next;
        });
      }, 1000);
    },
    [clearTick, exercises]
  );

  useEffect(() => {
    clearTick();
    setStateSync({ phase: "idle" });
  }, [exercises, clearTick, setStateSync]);

  useEffect(() => {
    if (state.phase === "finished") clearTick();
  }, [state.phase, clearTick]);

  useEffect(() => () => clearTick(), [clearTick]);

  const start = useCallback(() => {
    if (exercises.length === 0) return;
    startFrom(0, exercises[0].duration);
  }, [exercises, startFrom]);

  const pause = useCallback(() => {
    clearTick();
    const cur = stateRef.current;
    if (cur.phase === "running") {
      setStateSync({ phase: "paused", exerciseIndex: cur.exerciseIndex, remaining: cur.remaining });
    }
  }, [clearTick, setStateSync]);

  const resume = useCallback(() => {
    const cur = stateRef.current;
    if (cur.phase === "paused") {
      startFrom(cur.exerciseIndex, cur.remaining);
    }
  }, [startFrom]);

  const skip = useCallback(() => {
    const cur = stateRef.current;
    if (cur.phase !== "running" && cur.phase !== "paused") return;
    const nextIndex = cur.exerciseIndex + 1;
    if (nextIndex >= exercises.length) {
      clearTick();
      setStateSync({ phase: "finished" });
      return;
    }
    startFrom(nextIndex, exercises[nextIndex].duration);
  }, [exercises, clearTick, setStateSync, startFrom]);

  const reset = useCallback(() => {
    clearTick();
    setState({ phase: "idle" });
  }, [clearTick]);

  return { state, start, pause, resume, skip, reset };
}

// ============================================
// 타이머 패널 서브 컴포넌트
// ============================================

type TimerPanelProps = {
  exercises: WarmupExercise[];
  onClose: () => void;
};

function TimerPanel({ exercises, onClose }: TimerPanelProps) {
  const { state, start, pause, resume, skip, reset } = useRoutineTimer(exercises);

  const isIdle = state.phase === "idle";
  const isRunning = state.phase === "running";
  const isPaused = state.phase === "paused";
  const isFinished = state.phase === "finished";

  const currentExercise =
    (isRunning || isPaused) && "exerciseIndex" in state
      ? exercises[state.exerciseIndex]
      : null;

  const remaining =
    (isRunning || isPaused) && "remaining" in state ? state.remaining : 0;

  const totalDuration = exercises.reduce((s, e) => s + e.duration, 0);
  let elapsedSec = 0;
  if ((isRunning || isPaused) && "exerciseIndex" in state) {
    for (let i = 0; i < state.exerciseIndex; i++) {
      elapsedSec += exercises[i].duration;
    }
    elapsedSec += (exercises[state.exerciseIndex]?.duration ?? 0) - remaining;
  } else if (isFinished) {
    elapsedSec = totalDuration;
  }
  const progressPct = totalDuration > 0 ? Math.round((elapsedSec / totalDuration) * 100) : 0;

  return (
    <div className="rounded-lg border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Timer className="h-4 w-4 text-primary" />
          루틴 타이머
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            reset();
            onClose();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {isFinished ? (
        <div className="flex flex-col items-center gap-1 py-4 rounded-md bg-green-50 dark:bg-green-950/20">
          <span className="text-2xl">완료!</span>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            워밍업 루틴 완료
          </p>
          <p className="text-xs text-muted-foreground">
            총 {formatMMSS(totalDuration)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 py-4 rounded-md bg-muted/30">
          {currentExercise ? (
            <p className="text-xs text-muted-foreground">{currentExercise.name}</p>
          ) : (
            <p className="text-xs text-muted-foreground">시작 준비</p>
          )}
          <div
            className={[
              "font-mono text-5xl font-bold tabular-nums tracking-tight",
              isRunning ? "text-foreground" : "text-muted-foreground",
            ].join(" ")}
          >
            {isIdle ? formatMMSS(totalDuration) : formatMMSS(remaining)}
          </div>
          {currentExercise?.description && (
            <p className="text-xs text-muted-foreground text-center px-2">
              {currentExercise.description}
            </p>
          )}
        </div>
      )}

      {!isIdle && (
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {exercises.map((ex, idx) => {
          const isCurrent =
            (isRunning || isPaused) &&
            "exerciseIndex" in state &&
            state.exerciseIndex === idx;
          const isDone =
            (isRunning || isPaused || isFinished) &&
            ("exerciseIndex" in state ? state.exerciseIndex > idx : isFinished);
          return (
            <div
              key={ex.id}
              className={[
                "flex items-center justify-between rounded px-2 py-1 text-xs",
                isCurrent
                  ? "bg-primary/10 border border-primary/30 font-medium"
                  : isDone
                  ? "text-muted-foreground line-through"
                  : "text-muted-foreground/60",
              ].join(" ")}
            >
              <span>
                {idx + 1}. {ex.name}
              </span>
              <span className="font-mono">{formatMMSS(ex.duration)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        {isIdle && (
          <Button
            className="flex-1 h-8 text-xs gap-1"
            onClick={start}
            disabled={exercises.length === 0}
          >
            <Play className="h-3.5 w-3.5" />
            시작
          </Button>
        )}
        {isRunning && (
          <Button
            variant="outline"
            className="flex-1 h-8 text-xs gap-1"
            onClick={pause}
          >
            <Pause className="h-3.5 w-3.5" />
            일시정지
          </Button>
        )}
        {isPaused && (
          <Button className="flex-1 h-8 text-xs gap-1" onClick={resume}>
            <Play className="h-3.5 w-3.5" />
            재개
          </Button>
        )}
        {(isRunning || isPaused) && (
          <Button
            variant="outline"
            className="flex-1 h-8 text-xs gap-1"
            onClick={skip}
          >
            <SkipForward className="h-3.5 w-3.5" />
            건너뛰기
          </Button>
        )}
        {isFinished && (
          <Button
            variant="outline"
            className="flex-1 h-8 text-xs gap-1"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            다시 시작
          </Button>
        )}
        {(isRunning || isPaused) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 동작 추가 폼 서브 컴포넌트
// ============================================

type AddExerciseFormProps = {
  onAdd: (
    name: string,
    type: WarmupExerciseType,
    duration: number,
    repetitions?: number,
    description?: string,
    bodyPart?: string
  ) => void;
  onCancel: () => void;
};

function AddExerciseForm({ onAdd, onCancel }: AddExerciseFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WarmupExerciseType>("stretch");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("동작명을 입력해주세요.");
      return;
    }
    const sec = parseInt(duration, 10);
    if (isNaN(sec) || sec <= 0) {
      toast.error("올바른 시간(초)을 입력해주세요.");
      return;
    }
    onAdd(trimmedName, type, sec, undefined, description.trim() || undefined, undefined);
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">동작 추가</p>
      <div className="flex gap-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="동작명 (예: 목 돌리기)"
          className="h-7 text-xs flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={1}
            max={600}
            className="h-7 text-xs w-16 text-center"
          />
          <span className="text-xs text-muted-foreground shrink-0">초</span>
        </div>
      </div>
      <Select value={type} onValueChange={(v) => setType(v as WarmupExerciseType)}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_TYPES.map((t) => (
            <SelectItem key={t} value={t} className="text-xs">
              {EXERCISE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명 (선택)"
        className="text-xs resize-none h-14"
      />
      <div className="flex gap-1.5 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 루틴 탭 패널 서브 컴포넌트
// ============================================

type RoutineTabPanelProps = {
  routineId: string;
  exercises: WarmupExercise[];
  onAddExercise: (
    name: string,
    type: WarmupExerciseType,
    duration: number,
    repetitions?: number,
    description?: string,
    bodyPart?: string
  ) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onMoveExercise: (exerciseId: string, direction: "up" | "down") => void;
};

function RoutineTabPanel({
  exercises,
  onAddExercise,
  onRemoveExercise,
  onMoveExercise,
}: RoutineTabPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

  const handleAdd = (
    name: string,
    type: WarmupExerciseType,
    duration: number,
    repetitions?: number,
    description?: string,
    bodyPart?: string
  ) => {
    onAddExercise(name, type, duration, repetitions, description, bodyPart);
    setShowAddForm(false);
    toast.success("동작이 추가되었습니다.");
  };

  return (
    <div className="space-y-3 pt-2">
      {showTimer && (
        <TimerPanel exercises={sortedExercises} onClose={() => setShowTimer(false)} />
      )}

      {sortedExercises.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          아직 동작이 없습니다. 동작을 추가해주세요.
        </p>
      ) : (
        <div className="space-y-1">
          {sortedExercises.map((ex, idx) => (
            <div
              key={ex.id}
              className="flex items-start gap-2 rounded-md border px-2.5 py-2 bg-background text-xs"
            >
              <span className="text-muted-foreground shrink-0 w-4 text-center mt-0.5">
                {ex.order}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">{ex.name}</span>
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                    {formatMMSS(ex.duration)}
                  </Badge>
                  {ex.repetitions && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200" variant="outline">
                      {ex.repetitions}회
                    </Badge>
                  )}
                </div>
                {ex.description && (
                  <p className="text-muted-foreground mt-0.5 truncate">{ex.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-foreground"
                  onClick={() => onMoveExercise(ex.id, "up")}
                  disabled={idx === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-foreground"
                  onClick={() => onMoveExercise(ex.id, "down")}
                  disabled={idx === sortedExercises.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive shrink-0"
                onClick={() => {
                  onRemoveExercise(ex.id);
                  toast.success("동작이 삭제되었습니다.");
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <AddExerciseForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full gap-1"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-3 w-3" />
          동작 추가
        </Button>
      )}

      {!showTimer && sortedExercises.length > 0 && (
        <Button
          className="w-full h-8 text-xs gap-1"
          onClick={() => setShowTimer(true)}
        >
          <Play className="h-3.5 w-3.5" />
          루틴 시작
        </Button>
      )}
    </div>
  );
}

// ============================================
// 루틴 추가 폼 서브 컴포넌트
// ============================================

type AddRoutineFormProps = {
  onAdd: (name: string) => void;
  onCancel: () => void;
};

function AddRoutineForm({ onAdd, onCancel }: AddRoutineFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("루틴 이름을 입력해주세요.");
      return;
    }
    onAdd(trimmed);
  };

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="루틴 이름 (예: 기본 스트레칭)"
        className="h-7 text-xs flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
      />
      <Button
        size="sm"
        className="h-7 text-xs shrink-0"
        onClick={handleSubmit}
        disabled={!name.trim()}
      >
        추가
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type WarmupRoutineCardProps = {
  groupId: string;
};

export function WarmupRoutineCard({ groupId }: WarmupRoutineCardProps) {
  const [open, setOpen] = useState(false);
  const [showAddRoutineForm, setShowAddRoutineForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const {
    routines,
    createRoutine,
    deleteRoutine,
    addExercise,
    removeExercise,
    moveExercise,
  } = useWarmupRoutine(groupId);

  useEffect(() => {
    if (routines.length > 0 && !activeTab) {
      setActiveTab(routines[0].id);
    }
    if (activeTab && !routines.find((r) => r.id === activeTab)) {
      setActiveTab(routines[0]?.id);
    }
  }, [routines, activeTab]);

  const handleAddRoutine = (name: string) => {
    createRoutine(name, "");
    setShowAddRoutineForm(false);
    toast.success(`루틴 "${name}"이(가) 추가되었습니다.`);
  };

  const handleDeleteRoutine = (routineId: string, name: string) => {
    deleteRoutine(routineId);
    toast.success(`루틴 "${name}"이(가) 삭제되었습니다.`);
  };

  const activeRoutine = routines.find((r) => r.id === activeTab);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">워밍업 루틴</span>
              {routines.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                  {routines.length}개
                </Badge>
              )}
              {activeRoutine && open && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                  {formatMMSS(activeRoutine.totalDuration)}
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {routines.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                등록된 루틴이 없습니다.
              </p>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <div className="flex items-start gap-1.5 flex-wrap">
                  <TabsList className="h-auto flex-wrap gap-0.5 bg-muted/50 p-0.5">
                    {routines.map((r) => (
                      <TabsTrigger
                        key={r.id}
                        value={r.id}
                        className="h-6 text-xs px-2.5 data-[state=active]:bg-background"
                      >
                        {r.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {routines.map((r) => (
                  <TabsContent key={r.id} value={r.id} className="mt-0">
                    <div className="flex items-center justify-between pt-1 pb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {r.exercises.length}개 동작
                        </span>
                        <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                          {formatMMSS(r.totalDuration)}
                        </Badge>
                        {r.createdBy && (
                          <span className="text-[10px] text-muted-foreground/60">
                            by {r.createdBy}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-destructive"
                        onClick={() => handleDeleteRoutine(r.id, r.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <RoutineTabPanel
                      routineId={r.id}
                      exercises={r.exercises}
                      onAddExercise={(name, type, duration, repetitions, description, bodyPart) =>
                        addExercise(r.id, name, type, duration, repetitions, description, bodyPart)
                      }
                      onRemoveExercise={(exId) => removeExercise(r.id, exId)}
                      onMoveExercise={(exId, direction) => moveExercise(r.id, exId, direction)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {showAddRoutineForm ? (
              <AddRoutineForm
                onAdd={handleAddRoutine}
                onCancel={() => setShowAddRoutineForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => setShowAddRoutineForm(true)}
              >
                <Plus className="h-3 w-3" />
                루틴 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
