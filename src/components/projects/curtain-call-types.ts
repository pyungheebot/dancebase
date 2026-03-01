// ============================================================
// 커튼콜 카드 - 타입, 상수, 유틸
// ============================================================

import type { CurtainCallStep } from "@/types";

// ── 인사 유형 레이블 ──────────────────────────────────────────

export const BOW_TYPE_LABELS: Record<
  NonNullable<CurtainCallStep["bowType"]>,
  string
> = {
  individual: "개인",
  group: "그룹",
  lead: "리드",
  all: "전체",
};

export const BOW_TYPE_COLORS: Record<
  NonNullable<CurtainCallStep["bowType"]>,
  string
> = {
  individual: "bg-blue-100 text-blue-700 border-blue-300",
  group: "bg-green-100 text-green-700 border-green-300",
  lead: "bg-purple-100 text-purple-700 border-purple-300",
  all: "bg-orange-100 text-orange-700 border-orange-300",
};

export const BOW_TYPE_OPTIONS: NonNullable<CurtainCallStep["bowType"]>[] = [
  "individual",
  "group",
  "lead",
  "all",
];

// ── 포맷 유틸 ─────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ── 폼 타입 ───────────────────────────────────────────────────

export type PlanFormData = {
  planName: string;
  musicTrack: string;
  notes: string;
};

export type StepFormData = {
  description: string;
  performers: string[];
  position: string;
  durationSeconds: string;
  bowType: NonNullable<CurtainCallStep["bowType"]> | "";
};

export function emptyPlanForm(): PlanFormData {
  return { planName: "", musicTrack: "", notes: "" };
}

export function emptyStepForm(): StepFormData {
  return {
    description: "",
    performers: [],
    position: "",
    durationSeconds: "",
    bowType: "",
  };
}
