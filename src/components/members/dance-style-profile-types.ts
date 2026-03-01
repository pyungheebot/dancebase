import type {
  DanceProfilePosition,
  DanceProfilePracticeTime,
  DanceProfileSkillStar,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const PRESET_GENRES = [
  "힙합",
  "팝핑",
  "왁킹",
  "보깅",
  "브레이킹",
  "크럼프",
  "하우스",
  "컨템포러리",
  "재즈",
  "락킹",
  "소울",
  "비보잉",
] as const;

export const POSITION_META: Record<DanceProfilePosition, { label: string; color: string }> = {
  center: { label: "센터", color: "bg-amber-100 text-amber-700 border-amber-200" },
  side: { label: "사이드", color: "bg-sky-100 text-sky-700 border-sky-200" },
  back: { label: "백", color: "bg-green-100 text-green-700 border-green-200" },
};

export const PRACTICE_TIME_META: Record<
  DanceProfilePracticeTime,
  { label: string; icon: string; color: string }
> = {
  morning: { label: "아침", icon: "🌅", color: "bg-orange-100 text-orange-700 border-orange-200" },
  afternoon: { label: "오후", icon: "☀️", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  evening: { label: "저녁", icon: "🌆", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  midnight: { label: "심야", icon: "🌙", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const PRACTICE_TIME_ORDER: DanceProfilePracticeTime[] = [
  "morning",
  "afternoon",
  "evening",
  "midnight",
];

export const STAR_COLORS: Record<DanceProfileSkillStar, string> = {
  1: "text-slate-400",
  2: "text-blue-400",
  3: "text-green-400",
  4: "text-amber-400",
  5: "text-rose-500",
};

export const STAR_LABELS: Record<DanceProfileSkillStar, string> = {
  1: "입문",
  2: "초급",
  3: "중급",
  4: "고급",
  5: "전문가",
};

export const GENRE_BAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-emerald-500",
] as const;
