import type {
  GroupWishCategory,
  GroupWishPriority,
  GroupWishStatus,
} from "@/types";

// ─── 카테고리 메타 ────────────────────────────────────────────

export type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  badge: string;
  barColor: string;
};

export type PriorityMeta = { label: string; badge: string };

export type StatusMeta = {
  label: string;
  badge: string;
  icon: React.ReactNode;
};

// ─── 상수 ─────────────────────────────────────────────────────

export const ALL_CATEGORIES = [
  "practice_song",
  "equipment",
  "costume",
  "venue",
  "event",
  "other",
] as GroupWishCategory[];

export const ALL_PRIORITIES = [
  "high",
  "medium",
  "low",
] as GroupWishPriority[];

export const ALL_STATUSES = [
  "proposed",
  "reviewing",
  "approved",
  "completed",
  "rejected",
] as GroupWishStatus[];

// ─── 유틸 ─────────────────────────────────────────────────────

export function formatCost(cost: number): string {
  if (cost === 0) return "";
  if (cost >= 10000) return `${(cost / 10000).toFixed(cost % 10000 === 0 ? 0 : 1)}만원`;
  return `${cost.toLocaleString()}원`;
}
