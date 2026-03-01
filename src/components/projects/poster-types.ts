// ============================================================
// 포스터 관리 - 타입, 상수, 유효성 검증 규칙
// ============================================================

import type { PosterVersion, PosterVersionStatus } from "@/types";

// ── 상수 ─────────────────────────────────────────────────────

export const STATUS_LABELS: Record<PosterVersionStatus, string> = {
  draft: "초안",
  review: "검토 중",
  approved: "승인됨",
  rejected: "반려됨",
  final: "최종 확정",
};

export const STATUS_NEXT: Partial<
  Record<PosterVersionStatus, PosterVersionStatus[]>
> = {
  draft: ["review"],
  review: ["approved", "rejected"],
  approved: ["final"],
  rejected: ["draft"],
};

// ── 유효성 검증 규칙 ──────────────────────────────────────────

export const VALIDATION = {
  VERSION_TITLE_MIN_LENGTH: 1,
  DESIGNER_MIN_LENGTH: 1,
  DESCRIPTION_MIN_LENGTH: 1,
  POSTER_NAME_MIN_LENGTH: 1,
} as const;

// ── 헬퍼 함수 ─────────────────────────────────────────────────

export function statusBadgeClass(status: PosterVersionStatus): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "final":
      return "bg-purple-100 text-purple-700 border-purple-200";
  }
}

export function avgRating(votes: PosterVersion["votes"]): number | null {
  if (votes.length === 0) return null;
  return votes.reduce((sum, v) => sum + v.rating, 0) / votes.length;
}
