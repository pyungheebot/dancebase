// ============================================================
// 무대 평면도 - 타입, 상수, 유효성 검증
// ============================================================

import type { StageLayoutItemType } from "@/types";
import {
  Volume2,
  Lightbulb,
  Package,
  Monitor,
  Mic,
  Camera,
  Table2,
  Armchair,
  HelpCircle,
} from "lucide-react";
import React from "react";

// ── 라벨 ──────────────────────────────────────────────────
export const ITEM_TYPE_LABELS: Record<StageLayoutItemType, string> = {
  speaker: "스피커",
  light: "조명",
  prop: "소품",
  screen: "스크린",
  mic: "마이크",
  camera: "카메라",
  table: "테이블",
  chair: "의자",
  other: "기타",
};

// ── 아이콘 ────────────────────────────────────────────────
export const ITEM_TYPE_ICONS: Record<StageLayoutItemType, React.ReactNode> = {
  speaker: React.createElement(Volume2, { className: "h-3.5 w-3.5" }),
  light: React.createElement(Lightbulb, { className: "h-3.5 w-3.5" }),
  prop: React.createElement(Package, { className: "h-3.5 w-3.5" }),
  screen: React.createElement(Monitor, { className: "h-3.5 w-3.5" }),
  mic: React.createElement(Mic, { className: "h-3.5 w-3.5" }),
  camera: React.createElement(Camera, { className: "h-3.5 w-3.5" }),
  table: React.createElement(Table2, { className: "h-3.5 w-3.5" }),
  chair: React.createElement(Armchair, { className: "h-3.5 w-3.5" }),
  other: React.createElement(HelpCircle, { className: "h-3.5 w-3.5" }),
};

// ── 캔버스 아이템 색상 ─────────────────────────────────────
export const ITEM_TYPE_COLORS: Record<StageLayoutItemType, string> = {
  speaker: "bg-blue-500 border-blue-600 text-white",
  light: "bg-yellow-400 border-yellow-500 text-yellow-900",
  prop: "bg-purple-500 border-purple-600 text-white",
  screen: "bg-gray-600 border-gray-700 text-white",
  mic: "bg-green-500 border-green-600 text-white",
  camera: "bg-orange-500 border-orange-600 text-white",
  table: "bg-amber-600 border-amber-700 text-white",
  chair: "bg-teal-500 border-teal-600 text-white",
  other: "bg-slate-500 border-slate-600 text-white",
};

// ── 배지 색상 ─────────────────────────────────────────────
export const ITEM_TYPE_BADGE_COLORS: Record<StageLayoutItemType, string> = {
  speaker: "bg-blue-100 text-blue-700",
  light: "bg-yellow-100 text-yellow-700",
  prop: "bg-purple-100 text-purple-700",
  screen: "bg-gray-100 text-gray-700",
  mic: "bg-green-100 text-green-700",
  camera: "bg-orange-100 text-orange-700",
  table: "bg-amber-100 text-amber-700",
  chair: "bg-teal-100 text-teal-700",
  other: "bg-slate-100 text-slate-700",
};

// ── 유형 목록 ─────────────────────────────────────────────
export const ITEM_TYPES: StageLayoutItemType[] = [
  "speaker",
  "light",
  "prop",
  "screen",
  "mic",
  "camera",
  "table",
  "chair",
  "other",
];

// ── 기본값 ────────────────────────────────────────────────
export const DEFAULT_ITEM_SIZE = 8;

// ── 폼 상태 타입 ──────────────────────────────────────────

export interface ItemFormState {
  type: StageLayoutItemType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  notes: string;
}

export const DEFAULT_ITEM_FORM: ItemFormState = {
  type: "speaker",
  label: "",
  x: 50,
  y: 50,
  width: DEFAULT_ITEM_SIZE,
  height: DEFAULT_ITEM_SIZE,
  rotation: 0,
  notes: "",
};

export interface PlanFormState {
  planName: string;
  stageWidth: string;
  stageDepth: string;
}

export const DEFAULT_PLAN_FORM: PlanFormState = {
  planName: "",
  stageWidth: "",
  stageDepth: "",
};

// ── 유효성 검증 ───────────────────────────────────────────

export const VALIDATION = {
  POSITION_MIN: 0,
  POSITION_MAX: 100,
  SIZE_MIN: 1,
  SIZE_MAX: 50,
  ROTATION_MIN: 0,
  ROTATION_MAX: 359,
} as const;

export function clampPosition(value: number): number {
  return Math.min(VALIDATION.POSITION_MAX, Math.max(VALIDATION.POSITION_MIN, value));
}

export function clampSize(value: number): number {
  return Math.min(VALIDATION.SIZE_MAX, Math.max(VALIDATION.SIZE_MIN, value));
}

export function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}
