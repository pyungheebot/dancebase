import type { ChoreoVersionStatus } from "@/types";

// ============================================
// 상태 배지 색상/라벨
// ============================================

export const STATUS_CONFIG: Record<
  ChoreoVersionStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "초안",
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  },
  review: {
    label: "검토중",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
  approved: {
    label: "확정",
    className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  archived: {
    label: "보관",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
};

export const STATUS_ORDER: ChoreoVersionStatus[] = [
  "draft",
  "review",
  "approved",
  "archived",
];

// ============================================
// 로컬 폼 전용 타입
// ============================================

export type SectionDraft = {
  id: string;
  sectionName: string;
  content: string;
};
