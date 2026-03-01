import type {
  DanceGroupChallengeCategory,
  DanceGroupChallengeParticipantStatus,
} from "@/types";

// ─── 카테고리 상수 ────────────────────────────────────────────

export const CATEGORY_LABELS: Record<DanceGroupChallengeCategory, string> = {
  choreography: "안무도전",
  freestyle: "프리스타일",
  cover: "커버댄스",
  fitness: "체력챌린지",
};

export const CATEGORY_BADGE_CLASS: Record<DanceGroupChallengeCategory, string> = {
  choreography: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  freestyle: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  cover: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  fitness: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
};

export const CATEGORY_BAR_CLASS: Record<DanceGroupChallengeCategory, string> = {
  choreography: "bg-purple-400",
  freestyle: "bg-orange-400",
  cover: "bg-pink-400",
  fitness: "bg-cyan-400",
};

// ─── 참여자 상태 상수 ─────────────────────────────────────────

export const PARTICIPANT_STATUS_LABELS: Record<
  DanceGroupChallengeParticipantStatus,
  string
> = {
  not_started: "미시작",
  in_progress: "진행중",
  completed: "완료",
};

export const PARTICIPANT_STATUS_CLASS: Record<
  DanceGroupChallengeParticipantStatus,
  string
> = {
  not_started: "text-gray-500",
  in_progress: "text-blue-600",
  completed: "text-green-600",
};

// ─── 폼 기본값 ────────────────────────────────────────────────

export const EMPTY_FORM = {
  title: "",
  description: "",
  category: "choreography" as DanceGroupChallengeCategory,
  startDate: "",
  endDate: "",
};

export type ChallengeFormValues = typeof EMPTY_FORM;

// ─── 날짜 유틸 ────────────────────────────────────────────────

export function calcStatus(
  startDate: string,
  endDate: string
): "upcoming" | "active" | "completed" {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

export function daysRemaining(endDate: string): number {
  const diff = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 0);
}

export function progressPercent(startDate: string, endDate: string): number {
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  if (total <= 0) return 100;
  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
}

// ─── 탭 타입 ──────────────────────────────────────────────────

export type ChallengeTab = "active" | "upcoming" | "completed";
