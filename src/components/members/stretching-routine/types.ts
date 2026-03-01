// ─── 타입/인터페이스 ─────────────────────────────────────────

import type { StretchingBodyPart, StretchingRoutine } from "@/types";

// AddRoutineForm props
export interface AddRoutineFormProps {
  onAdd: (input: { routineName: string }) => boolean;
  onClose: () => void;
}

// AddExerciseForm props
export interface AddExerciseFormProps {
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

// AddLogForm props
export interface AddLogFormProps {
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

// RoutineDetail props
export interface RoutineDetailProps {
  routine: StretchingRoutine;
  onAddExercise: AddExerciseFormProps["onAdd"];
  onDeleteExercise: (routineId: string, exerciseId: string) => boolean;
  onDeleteRoutine: (routineId: string) => boolean;
}

// ─── 상수 ────────────────────────────────────────────────────

export const BODY_PART_LABELS: Record<StretchingBodyPart, string> = {
  neck: "목",
  shoulders: "어깨",
  back: "등/허리",
  hips: "고관절",
  legs: "다리",
  ankles: "발목",
  wrists: "손목",
  full_body: "전신",
};

export const BODY_PART_COLORS: Record<StretchingBodyPart, string> = {
  neck: "bg-blue-100 text-blue-700",
  shoulders: "bg-purple-100 text-purple-700",
  back: "bg-orange-100 text-orange-700",
  hips: "bg-pink-100 text-pink-700",
  legs: "bg-green-100 text-green-700",
  ankles: "bg-cyan-100 text-cyan-700",
  wrists: "bg-yellow-100 text-yellow-700",
  full_body: "bg-indigo-100 text-indigo-700",
};

export const BODY_PARTS: StretchingBodyPart[] = [
  "neck",
  "shoulders",
  "back",
  "hips",
  "legs",
  "ankles",
  "wrists",
  "full_body",
];

export const FLEXIBILITY_LABELS: Record<number, string> = {
  1: "매우 경직",
  2: "경직",
  3: "보통",
  4: "유연",
  5: "매우 유연",
};

// ─── 날짜 유틸 ───────────────────────────────────────────────

export const today = new Date().toISOString().split("T")[0];

export function getDayLabel(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

export function getWeekDates(): string[] {
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
