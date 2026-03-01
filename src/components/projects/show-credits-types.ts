// ============================================================
// show-credits 공유 상수 & 유틸
// ============================================================

import type { CreditSectionType } from "@/types";

export const SECTION_TYPE_OPTIONS: { value: CreditSectionType; label: string }[] = [
  { value: "cast", label: "출연진" },
  { value: "choreography", label: "안무" },
  { value: "music", label: "음악" },
  { value: "lighting", label: "조명" },
  { value: "costume", label: "의상" },
  { value: "stage", label: "무대" },
  { value: "planning", label: "기획" },
  { value: "special_thanks", label: "특별 감사" },
];

export const SECTION_TYPE_COLORS: Record<CreditSectionType, string> = {
  cast: "bg-purple-100 text-purple-700 border-purple-200",
  choreography: "bg-pink-100 text-pink-700 border-pink-200",
  music: "bg-blue-100 text-blue-700 border-blue-200",
  lighting: "bg-yellow-100 text-yellow-700 border-yellow-200",
  costume: "bg-orange-100 text-orange-700 border-orange-200",
  stage: "bg-green-100 text-green-700 border-green-200",
  planning: "bg-indigo-100 text-indigo-700 border-indigo-200",
  special_thanks: "bg-red-100 text-red-700 border-red-200",
};
