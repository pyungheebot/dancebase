// ============================================================
// 앵콜 계획 공유 타입, 상수, 유틸
// ============================================================

import type { EncoreTriggerCondition } from "@/types";

// ── 트리거 조건 레이블 ──
export const TRIGGER_LABELS: Record<EncoreTriggerCondition, string> = {
  audience_request: "관객 요청",
  standing_ovation: "기립 박수",
  time_available: "시간 여유",
  planned: "사전 계획",
  spontaneous: "즉흥 결정",
};

// ── 트리거 조건 배지 색상 ──
export const TRIGGER_COLORS: Record<EncoreTriggerCondition, string> = {
  audience_request: "bg-blue-100 text-blue-700 border-blue-300",
  standing_ovation: "bg-purple-100 text-purple-700 border-purple-300",
  time_available: "bg-green-100 text-green-700 border-green-300",
  planned: "bg-orange-100 text-orange-700 border-orange-300",
  spontaneous: "bg-pink-100 text-pink-700 border-pink-300",
};

// ── 트리거 조건 선택 목록 ──
export const TRIGGER_OPTIONS: EncoreTriggerCondition[] = [
  "audience_request",
  "standing_ovation",
  "time_available",
  "planned",
  "spontaneous",
];

// ── 초 단위를 분/초 문자열로 포맷 ──
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ── 플랜 폼 데이터 타입 ──
export type PlanFormData = {
  planName: string;
  triggerCondition: EncoreTriggerCondition;
  maxEncores: string;
  signalCue: string;
  lightingNotes: string;
  notes: string;
};

// ── 곡 폼 데이터 타입 ──
export type SongFormData = {
  songTitle: string;
  artist: string;
  durationSeconds: string;
  performers: string[];
  notes: string;
};

// ── 빈 플랜 폼 초기값 ──
export function emptyPlanForm(): PlanFormData {
  return {
    planName: "",
    triggerCondition: "audience_request",
    maxEncores: "1",
    signalCue: "",
    lightingNotes: "",
    notes: "",
  };
}

// ── 빈 곡 폼 초기값 ──
export function emptySongForm(): SongFormData {
  return {
    songTitle: "",
    artist: "",
    durationSeconds: "",
    performers: [],
    notes: "",
  };
}
