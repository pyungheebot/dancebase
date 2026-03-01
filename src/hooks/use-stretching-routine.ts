"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { loadFromStorage } from "@/lib/local-storage";
import type {
  StretchingRoutine,
  StretchingExercise,
  StretchingLog,
  StretchingBodyPart,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_ROUTINES_KEY = (memberId: string) =>
  `dancebase:stretching-routine:${memberId}:routines`;

const LS_LOGS_KEY = (memberId: string) =>
  `dancebase:stretching-routine:${memberId}:logs`;

interface StoredData {
  routines: StretchingRoutine[];
  logs: StretchingLog[];
}

function saveRoutines(memberId: string, routines: StretchingRoutine[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_ROUTINES_KEY(memberId), JSON.stringify(routines));
  } catch {
    /* ignore */
  }
}

function saveLogs(memberId: string, logs: StretchingLog[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_LOGS_KEY(memberId), JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}

// ─── 총 시간 계산 ─────────────────────────────────────────────

function calcTotalMinutes(exercises: StretchingExercise[]): number {
  const totalSeconds = exercises.reduce(
    (sum, ex) => sum + ex.durationSeconds * ex.sets,
    0
  );
  return Math.ceil(totalSeconds / 60);
}

// ─── 연속 기록 계산 ───────────────────────────────────────────

function calcStreakDays(logs: StretchingLog[]): number {
  if (logs.length === 0) return 0;
  const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let current = today;
  for (const date of dates) {
    if (date === current) {
      streak++;
      const d = new Date(current + "T00:00:00");
      d.setDate(d.getDate() - 1);
      current = d.toISOString().split("T")[0];
    } else if (date < current) {
      break;
    }
  }
  return streak;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useStretchingRoutine(memberId: string) {
  const { data, mutate } = useSWR(
    memberId ? swrKeys.stretchingRoutine(memberId) : null,
    () => loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] }),
    { revalidateOnFocus: false }
  );

  const routines = data?.routines ?? [];
  const logs = data?.logs ?? [];

  // ── 루틴 추가 ──────────────────────────────────────────────

  function addRoutine(input: { routineName: string }): boolean {
    if (!input.routineName.trim()) {
      toast.error("루틴 이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const newRoutine: StretchingRoutine = {
        id: crypto.randomUUID(),
        routineName: input.routineName.trim(),
        exercises: [],
        totalMinutes: 0,
        createdAt: new Date().toISOString(),
      };
      const nextRoutines = [...stored.routines, newRoutine];
      saveRoutines(memberId, nextRoutines);
      mutate({ ...stored, routines: nextRoutines }, false);
      toast.success("루틴이 추가되었습니다.");
      return true;
    } catch {
      toast.error("루틴 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 루틴 수정 ──────────────────────────────────────────────

  function updateRoutine(
    routineId: string,
    patch: Partial<Pick<StretchingRoutine, "routineName">>
  ): boolean {
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const idx = stored.routines.findIndex((r) => r.id === routineId);
      if (idx === -1) {
        toast.error("루틴을 찾을 수 없습니다.");
        return false;
      }
      const updated = { ...stored.routines[idx], ...patch };
      const nextRoutines = [
        ...stored.routines.slice(0, idx),
        updated,
        ...stored.routines.slice(idx + 1),
      ];
      saveRoutines(memberId, nextRoutines);
      mutate({ ...stored, routines: nextRoutines }, false);
      toast.success("루틴이 수정되었습니다.");
      return true;
    } catch {
      toast.error("루틴 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 루틴 삭제 ──────────────────────────────────────────────

  function deleteRoutine(routineId: string): boolean {
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const nextRoutines = stored.routines.filter((r) => r.id !== routineId);
      if (nextRoutines.length === stored.routines.length) return false;
      const nextLogs = stored.logs.filter((l) => l.routineId !== routineId);
      saveRoutines(memberId, nextRoutines);
      saveLogs(memberId, nextLogs);
      mutate({ routines: nextRoutines, logs: nextLogs }, false);
      toast.success("루틴이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("루틴 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 운동 추가 ──────────────────────────────────────────────

  function addExercise(
    routineId: string,
    input: {
      name: string;
      bodyPart: StretchingBodyPart;
      durationSeconds: number;
      sets: number;
      description?: string;
    }
  ): boolean {
    if (!input.name.trim()) {
      toast.error("운동 이름을 입력해주세요.");
      return false;
    }
    if (!input.durationSeconds || input.durationSeconds < 1) {
      toast.error("유지 시간을 1초 이상으로 입력해주세요.");
      return false;
    }
    if (!input.sets || input.sets < 1) {
      toast.error("세트 수를 1 이상으로 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const idx = stored.routines.findIndex((r) => r.id === routineId);
      if (idx === -1) {
        toast.error("루틴을 찾을 수 없습니다.");
        return false;
      }
      const newExercise: StretchingExercise = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        bodyPart: input.bodyPart,
        durationSeconds: input.durationSeconds,
        sets: input.sets,
        description: input.description?.trim(),
      };
      const updatedExercises = [
        ...stored.routines[idx].exercises,
        newExercise,
      ];
      const updatedRoutine: StretchingRoutine = {
        ...stored.routines[idx],
        exercises: updatedExercises,
        totalMinutes: calcTotalMinutes(updatedExercises),
      };
      const nextRoutines = [
        ...stored.routines.slice(0, idx),
        updatedRoutine,
        ...stored.routines.slice(idx + 1),
      ];
      saveRoutines(memberId, nextRoutines);
      mutate({ ...stored, routines: nextRoutines }, false);
      toast.success("운동이 추가되었습니다.");
      return true;
    } catch {
      toast.error("운동 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 운동 수정 ──────────────────────────────────────────────

  function updateExercise(
    routineId: string,
    exerciseId: string,
    patch: Partial<Omit<StretchingExercise, "id">>
  ): boolean {
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const routineIdx = stored.routines.findIndex((r) => r.id === routineId);
      if (routineIdx === -1) {
        toast.error("루틴을 찾을 수 없습니다.");
        return false;
      }
      const routine = stored.routines[routineIdx];
      const exIdx = routine.exercises.findIndex((e) => e.id === exerciseId);
      if (exIdx === -1) {
        toast.error("운동을 찾을 수 없습니다.");
        return false;
      }
      const updatedExercises = [
        ...routine.exercises.slice(0, exIdx),
        { ...routine.exercises[exIdx], ...patch },
        ...routine.exercises.slice(exIdx + 1),
      ];
      const updatedRoutine: StretchingRoutine = {
        ...routine,
        exercises: updatedExercises,
        totalMinutes: calcTotalMinutes(updatedExercises),
      };
      const nextRoutines = [
        ...stored.routines.slice(0, routineIdx),
        updatedRoutine,
        ...stored.routines.slice(routineIdx + 1),
      ];
      saveRoutines(memberId, nextRoutines);
      mutate({ ...stored, routines: nextRoutines }, false);
      toast.success("운동이 수정되었습니다.");
      return true;
    } catch {
      toast.error("운동 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 운동 삭제 ──────────────────────────────────────────────

  function deleteExercise(routineId: string, exerciseId: string): boolean {
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const routineIdx = stored.routines.findIndex((r) => r.id === routineId);
      if (routineIdx === -1) return false;
      const routine = stored.routines[routineIdx];
      const updatedExercises = routine.exercises.filter(
        (e) => e.id !== exerciseId
      );
      if (updatedExercises.length === routine.exercises.length) return false;
      const updatedRoutine: StretchingRoutine = {
        ...routine,
        exercises: updatedExercises,
        totalMinutes: calcTotalMinutes(updatedExercises),
      };
      const nextRoutines = [
        ...stored.routines.slice(0, routineIdx),
        updatedRoutine,
        ...stored.routines.slice(routineIdx + 1),
      ];
      saveRoutines(memberId, nextRoutines);
      mutate({ ...stored, routines: nextRoutines }, false);
      toast.success("운동이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("운동 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 로그 추가 ──────────────────────────────────────────────

  function addLog(input: {
    routineId: string;
    date: string;
    completedExercises: string[];
    flexibilityRating?: number;
    notes?: string;
  }): boolean {
    if (!input.routineId) {
      toast.error("루틴을 선택해주세요.");
      return false;
    }
    if (!input.date) {
      toast.error("날짜를 입력해주세요.");
      return false;
    }
    if (
      input.flexibilityRating !== undefined &&
      (input.flexibilityRating < 1 || input.flexibilityRating > 5)
    ) {
      toast.error("유연성 평가는 1~5 사이로 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const newLog: StretchingLog = {
        id: crypto.randomUUID(),
        routineId: input.routineId,
        date: input.date,
        completedExercises: input.completedExercises,
        flexibilityRating: input.flexibilityRating,
        notes: input.notes?.trim(),
        createdAt: new Date().toISOString(),
      };
      const nextLogs = [newLog, ...stored.logs];
      saveLogs(memberId, nextLogs);
      mutate({ ...stored, logs: nextLogs }, false);
      toast.success("운동 기록이 저장되었습니다.");
      return true;
    } catch {
      toast.error("운동 기록 저장에 실패했습니다.");
      return false;
    }
  }

  // ── 로그 삭제 ──────────────────────────────────────────────

  function deleteLog(logId: string): boolean {
    try {
      const stored = loadFromStorage<StoredData>(LS_ROUTINES_KEY(memberId), { routines: [], logs: [] });
      const nextLogs = stored.logs.filter((l) => l.id !== logId);
      if (nextLogs.length === stored.logs.length) return false;
      saveLogs(memberId, nextLogs);
      mutate({ ...stored, logs: nextLogs }, false);
      toast.success("운동 기록이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("운동 기록 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalRoutines = routines.length;
  const totalLogs = logs.length;

  const ratingsWithValue = logs.filter(
    (l) => l.flexibilityRating !== undefined
  );
  const averageFlexibility =
    ratingsWithValue.length > 0
      ? Math.round(
          (ratingsWithValue.reduce(
            (sum, l) => sum + (l.flexibilityRating ?? 0),
            0
          ) /
            ratingsWithValue.length) *
            10
        ) / 10
      : 0;

  const streakDays = calcStreakDays(logs);

  const stats = {
    totalRoutines,
    totalLogs,
    averageFlexibility,
    streakDays,
  };

  return {
    routines,
    logs,
    // 루틴 CRUD
    addRoutine,
    updateRoutine,
    deleteRoutine,
    // 운동 CRUD
    addExercise,
    updateExercise,
    deleteExercise,
    // 로그 CRUD
    addLog,
    deleteLog,
    // 통계
    stats,
    // SWR
    refetch: () => mutate(),
  };
}
