// ============================================================
// 드레스 리허설 공유 상수 & 색상 맵
// ============================================================

import type {
  DressRehearsalCategory,
  DressRehearsalSeverity,
} from "@/types";

/** 카테고리 목록 */
export const CATEGORIES: DressRehearsalCategory[] = [
  "안무",
  "음악",
  "조명",
  "의상",
  "동선",
  "소품",
  "기타",
];

/** 심각도 목록 */
export const SEVERITIES: DressRehearsalSeverity[] = ["높음", "보통", "낮음"];

/** 카테고리 배지 색상 */
export const CATEGORY_COLORS: Record<DressRehearsalCategory, string> = {
  안무: "bg-purple-100 text-purple-700 border-purple-200",
  음악: "bg-blue-100 text-blue-700 border-blue-200",
  조명: "bg-yellow-100 text-yellow-700 border-yellow-200",
  의상: "bg-pink-100 text-pink-700 border-pink-200",
  동선: "bg-orange-100 text-orange-700 border-orange-200",
  소품: "bg-cyan-100 text-cyan-700 border-cyan-200",
  기타: "bg-gray-100 text-gray-700 border-gray-200",
};

/** 심각도 배지 색상 */
export const SEVERITY_COLORS: Record<DressRehearsalSeverity, string> = {
  높음: "bg-red-100 text-red-700 border-red-200",
  보통: "bg-yellow-100 text-yellow-700 border-yellow-200",
  낮음: "bg-green-100 text-green-700 border-green-200",
};

/** 심각도 점 색상 */
export const SEVERITY_DOT_COLORS: Record<DressRehearsalSeverity, string> = {
  높음: "bg-red-500",
  보통: "bg-yellow-500",
  낮음: "bg-green-500",
};
