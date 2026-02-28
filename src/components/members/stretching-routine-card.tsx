"use client";

import { useState } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Star,
  TrendingUp,
  Clock,
  Dumbbell,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStretchingRoutine } from "@/hooks/use-stretching-routine";
import type { StretchingBodyPart, StretchingRoutine } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const BODY_PART_LABELS: Record<StretchingBodyPart, string> = {
  neck: "목",
  shoulders: "어깨",
  back: "등/허리",
  hips: "고관절",
  legs: "다리",
  ankles: "발목",
  wrists: "손목",
  full_body: "전신",
};

const BODY_PART_COLORS: Record<StretchingBodyPart, string> = {
  neck: "bg-blue-100 text-blue-700",
  shoulders: "bg-purple-100 text-purple-700",
  back: "bg-orange-100 text-orange-700",
  hips: "bg-pink-100 text-pink-700",
  legs: "bg-green-100 text-green-700",
  ankles: "bg-cyan-100 text-cyan-700",
  wrists: "bg-yellow-100 text-yellow-700",
  full_body: "bg-indigo-100 text-indigo-700",
};

const BODY_PARTS: StretchingBodyPart[] = [
  "neck",
  "shoulders",
  "back",
  "hips",
  "legs",
  "ankles",
  "wrists",
  "full_body",
];

const FLEXIBILITY_LABELS: Record<number, string> = {
  1: "매우 경직",
  2: "경직",
  3: "보통",
  4: "유연",
  5: "매우 유연",
};

// ─── 날짜 유틸 ───────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDayLabel(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

function getWeekDates(): string[] {
  const d = new Date(today + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().split("T")[0];
  });
}

// ─── 루틴 추가 폼 ────────────────────────────────────────────

interface AddRoutineFormProps {
  onAdd: (input: { routineName: string }) => boolean;
  onClose: () => void;
}

function AddRoutineForm({ onAdd, onClose }: AddRoutineFormProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const ok = onAdd({ routineName: name });
    if (ok) {
      setName("");
      onClose();
    }
  }

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 space-y-2">
      <p className="text-xs font-semibold text-teal-700">새 루틴 추가</p>
      <div className="space-y-1">
        <Label className="text-xs">루틴 이름</Label>
        <Input
          className="h-7 text-xs"
          placeholder="예: 연습 전 기본 스트레칭"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleSubmit}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 운동 추가 폼 ────────────────────────────────────────────

interface AddExerciseFormProps {
  routineId: string;
  onAdd: (
    routineId: string,
    input: {
      name: string;
      bodyPart: StretchingBodyPart;
      durationSeconds: number;
      sets: number;
      description?: string;
    }
  ) => boolean;
  onClose: () => void;
}

function AddExerciseForm({ routineId, onAdd, onClose }: AddExerciseFormProps) {
  const [form, setForm] = useState({
    name: "",
    bodyPart: "full_body" as StretchingBodyPart,
    durationSeconds: 30,
    sets: 3,
    description: "",
  });

  function handleSubmit() {
    const ok = onAdd(routineId, {
      name: form.name,
      bodyPart: form.bodyPart,
      durationSeconds: Number(form.durationSeconds),
      sets: Number(form.sets),
      description: form.description || undefined,
    });
    if (ok) onClose();
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 mt-2">
      <p className="text-xs font-semibold text-emerald-700">운동 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">운동 이름</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예: 목 좌우 돌리기"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">신체 부위</Label>
          <Select
            value={form.bodyPart}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, bodyPart: v as StretchingBodyPart }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BODY_PARTS.map((bp) => (
                <SelectItem key={bp} value={bp} className="text-xs">
                  {BODY_PART_LABELS[bp]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">유지 시간 (초)</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={5}
            max={300}
            value={form.durationSeconds}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                durationSeconds: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">세트 수</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            max={20}
            value={form.sets}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sets: parseInt(e.target.value, 10) || 0,
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">설명 (선택)</Label>
          <Input
            className="h-7 text-xs"
            placeholder="자세 설명..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleSubmit}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 로그 추가 폼 ────────────────────────────────────────────

interface AddLogFormProps {
  routines: StretchingRoutine[];
  onAdd: (input: {
    routineId: string;
    date: string;
    completedExercises: string[];
    flexibilityRating?: number;
    notes?: string;
  }) => boolean;
  onClose: () => void;
}

function AddLogForm({ routines, onAdd, onClose }: AddLogFormProps) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    routines[0]?.id ?? ""
  );
  const [date, setDate] = useState(today);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [flexibilityRating, setFlexibilityRating] = useState<number | "">(3);
  const [notes, setNotes] = useState("");

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId);

  function toggleExercise(exerciseId: string) {
    setCompletedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  }

  function handleRoutineChange(routineId: string) {
    setSelectedRoutineId(routineId);
    setCompletedExercises([]);
  }

  function handleSubmit() {
    const ok = onAdd({
      routineId: selectedRoutineId,
      date,
      completedExercises,
      flexibilityRating:
        flexibilityRating !== "" ? Number(flexibilityRating) : undefined,
      notes: notes || undefined,
    });
    if (ok) onClose();
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-3">
      <p className="text-xs font-semibold text-violet-700">운동 기록 추가</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">루틴 선택</Label>
          <Select value={selectedRoutineId} onValueChange={handleRoutineChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="루틴 선택" />
            </SelectTrigger>
            <SelectContent>
              {routines.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.routineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            className="h-7 text-xs"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {selectedRoutine && selectedRoutine.exercises.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs">완료한 운동</Label>
          <div className="space-y-1 rounded-md border border-violet-100 bg-white p-2">
            {selectedRoutine.exercises.map((ex) => {
              const checked = completedExercises.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  className="flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-violet-50 text-left"
                  onClick={() => toggleExercise(ex.id)}
                >
                  {checked ? (
                    <CheckSquare className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs">{ex.name}</span>
                  <span
                    className={`ml-auto text-[10px] rounded-full px-1.5 py-0 ${BODY_PART_COLORS[ex.bodyPart]}`}
                  >
                    {BODY_PART_LABELS[ex.bodyPart]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {completedExercises.length}/{selectedRoutine.exercises.length}개 완료
          </p>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">유연성 평가 (1~5)</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`h-7 w-7 rounded text-xs font-medium border transition-colors ${
                flexibilityRating === n
                  ? "bg-violet-600 text-white border-violet-600"
                  : "border-gray-200 text-muted-foreground hover:border-violet-300"
              }`}
              onClick={() =>
                setFlexibilityRating(flexibilityRating === n ? "" : n)
              }
            >
              {n}
            </button>
          ))}
          {flexibilityRating !== "" && (
            <span className="ml-1 self-center text-[10px] text-violet-600 font-medium">
              {FLEXIBILITY_LABELS[flexibilityRating as number]}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">메모 (선택)</Label>
        <Textarea
          className="min-h-[40px] text-xs resize-none"
          placeholder="오늘 스트레칭 소감..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
          onClick={handleSubmit}
        >
          저장
        </Button>
      </div>
    </div>
  );
}

// ─── 루틴 상세 뷰 ────────────────────────────────────────────

interface RoutineDetailProps {
  routine: StretchingRoutine;
  onAddExercise: AddExerciseFormProps["onAdd"];
  onDeleteExercise: (routineId: string, exerciseId: string) => boolean;
  onDeleteRoutine: (routineId: string) => boolean;
}

function RoutineDetail({
  routine,
  onAddExercise,
  onDeleteExercise,
  onDeleteRoutine,
}: RoutineDetailProps) {
  const [showExForm, setShowExForm] = useState(false);

  // 부위별 그룹핑
  const byBodyPart: Partial<Record<StretchingBodyPart, typeof routine.exercises>> =
    {};
  routine.exercises.forEach((ex) => {
    if (!byBodyPart[ex.bodyPart]) byBodyPart[ex.bodyPart] = [];
    byBodyPart[ex.bodyPart]!.push(ex);
  });

  return (
    <div className="space-y-2">
      {routine.exercises.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          아직 운동이 없습니다.
        </p>
      ) : (
        <div className="space-y-1.5">
          {(Object.entries(byBodyPart) as [StretchingBodyPart, typeof routine.exercises][]).map(
            ([bp, exercises]) => (
              <div key={bp}>
                <p
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0 text-[10px] font-medium mb-1 ${BODY_PART_COLORS[bp]}`}
                >
                  {BODY_PART_LABELS[bp]}
                </p>
                <div className="space-y-0.5 pl-1">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium truncate">
                          {ex.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {ex.durationSeconds}초 x {ex.sets}세트
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {ex.description && (
                          <span
                            className="text-[10px] text-muted-foreground max-w-[80px] truncate"
                            title={ex.description}
                          >
                            {ex.description}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => onDeleteExercise(routine.id, ex.id)}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {showExForm ? (
        <AddExerciseForm
          routineId={routine.id}
          onAdd={onAddExercise}
          onClose={() => setShowExForm(false)}
        />
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] flex-1 border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            onClick={() => setShowExForm(true)}
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            운동 추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDeleteRoutine(routine.id)}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" />
            루틴 삭제
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export function StretchingRoutineCard({ memberId }: { memberId: string }) {
  const {
    routines,
    logs,
    addRoutine,
    deleteRoutine,
    addExercise,
    deleteExercise,
    addLog,
    deleteLog,
    stats,
  } = useStretchingRoutine(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"routines" | "logs">("routines");

  // 주간 완료율 차트 데이터
  const weekDates = getWeekDates();
  const weekLogMap: Record<string, number> = {};
  weekDates.forEach((d) => {
    weekLogMap[d] = logs.filter((l) => l.date === d).length;
  });
  const maxWeekLogs = Math.max(1, ...Object.values(weekLogMap));

  // 최근 로그 5개
  const recentLogs = logs.slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-500" />
            <span className="text-sm font-semibold">스트레칭 루틴</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 border-0">
              {stats.totalRoutines}개 루틴
            </Badge>
            {stats.streakDays > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-0 flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5" />
                {stats.streakDays}일 연속
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-teal-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">총 루틴</p>
              <p className="text-sm font-bold text-teal-600">
                {stats.totalRoutines}개
              </p>
            </div>
            <div className="rounded-lg bg-violet-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">총 기록</p>
              <p className="text-sm font-bold text-violet-600">
                {stats.totalLogs}회
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">평균 유연성</p>
              <p className="text-sm font-bold text-amber-600">
                {stats.averageFlexibility > 0
                  ? `${stats.averageFlexibility}/5`
                  : "-"}
              </p>
            </div>
          </div>

          {/* 주간 완료율 차트 */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                이번 주 스트레칭 현황
              </span>
            </div>
            <div className="h-16">
              <div className="flex h-full items-end gap-1">
                {weekDates.map((date) => {
                  const count = weekLogMap[date] ?? 0;
                  const heightPct =
                    count > 0 ? Math.min((count / maxWeekLogs) * 100, 100) : 0;
                  const isToday = date === today;
                  return (
                    <div
                      key={date}
                      className="flex flex-1 flex-col items-center gap-0.5"
                    >
                      <div className="relative w-full flex-1">
                        {count > 0 ? (
                          <div
                            className={`absolute bottom-0 w-full rounded-t ${isToday ? "bg-teal-500" : "bg-teal-300"}`}
                            style={{ height: `${Math.max(heightPct, 15)}%` }}
                            title={`${count}회`}
                          />
                        ) : (
                          <div className="absolute bottom-0 w-full rounded-t bg-gray-100 h-1" />
                        )}
                      </div>
                      <span
                        className={`text-[9px] ${isToday ? "font-bold text-teal-600" : "text-muted-foreground"}`}
                      >
                        {getDayLabel(date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex rounded-md border border-gray-200 p-0.5 bg-muted/30">
            <button
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                activeTab === "routines"
                  ? "bg-white shadow-sm text-teal-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("routines")}
            >
              <Dumbbell className="h-3 w-3 inline mr-1" />
              루틴 관리
            </button>
            <button
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                activeTab === "logs"
                  ? "bg-white shadow-sm text-violet-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("logs")}
            >
              <CheckSquare className="h-3 w-3 inline mr-1" />
              운동 기록
            </button>
          </div>

          {/* 루틴 탭 */}
          {activeTab === "routines" && (
            <div className="space-y-2">
              {routines.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  등록된 루틴이 없습니다.
                </p>
              ) : (
                routines.map((routine) => {
                  const isExpanded = expandedRoutineId === routine.id;
                  return (
                    <div
                      key={routine.id}
                      className="rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <button
                        className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedRoutineId(isExpanded ? null : routine.id)
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Activity className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {routine.routineName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {routine.totalMinutes}분
                          </span>
                          <Badge className="text-[10px] px-1 py-0 bg-gray-100 text-gray-600 border-0">
                            {routine.exercises.length}개
                          </Badge>
                          <ChevronRight
                            className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
                          <RoutineDetail
                            routine={routine}
                            onAddExercise={addExercise}
                            onDeleteExercise={deleteExercise}
                            onDeleteRoutine={deleteRoutine}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {showRoutineForm ? (
                <AddRoutineForm
                  onAdd={addRoutine}
                  onClose={() => setShowRoutineForm(false)}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full border-dashed border-teal-300 text-teal-600 hover:bg-teal-50"
                  onClick={() => setShowRoutineForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  루틴 추가
                </Button>
              )}
            </div>
          )}

          {/* 로그 탭 */}
          {activeTab === "logs" && (
            <div className="space-y-2">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  아직 운동 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-1">
                  {recentLogs.map((log) => {
                    const routine = routines.find((r) => r.id === log.routineId);
                    const completionRate =
                      routine && routine.exercises.length > 0
                        ? Math.round(
                            (log.completedExercises.length /
                              routine.exercises.length) *
                              100
                          )
                        : 0;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start justify-between rounded-md bg-muted/40 px-2 py-1.5 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium">
                              {formatDate(log.date)}({getDayLabel(log.date)})
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {routine?.routineName ?? "삭제된 루틴"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {routine && routine.exercises.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {log.completedExercises.length}/
                                {routine.exercises.length}개 ({completionRate}%)
                              </span>
                            )}
                            {log.flexibilityRating !== undefined && (
                              <span className="text-[10px] flex items-center gap-0.5 text-amber-600">
                                <Star className="h-2.5 w-2.5" />
                                {log.flexibilityRating}/5
                              </span>
                            )}
                            {log.notes && (
                              <span
                                className="text-[10px] text-muted-foreground truncate max-w-[100px]"
                                title={log.notes}
                              >
                                {log.notes}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0"
                          onClick={() => deleteLog(log.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {showLogForm ? (
                routines.length > 0 ? (
                  <AddLogForm
                    routines={routines}
                    onAdd={addLog}
                    onClose={() => setShowLogForm(false)}
                  />
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-700">
                      먼저 루틴을 등록해주세요.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-amber-600 mt-1"
                      onClick={() => {
                        setShowLogForm(false);
                        setActiveTab("routines");
                      }}
                    >
                      루틴 탭으로 이동
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
                  onClick={() => setShowLogForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  운동 기록 추가
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
