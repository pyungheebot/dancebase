import type { CostumeDesignStatus } from "@/types";

// ============================================================
// 상수
// ============================================================

export const STATUS_LABELS: Record<CostumeDesignStatus, string> = {
  idea: "아이디어",
  sketched: "스케치 완료",
  approved: "승인됨",
  in_production: "제작 중",
  completed: "완성",
};

export const STATUS_COLORS: Record<CostumeDesignStatus, string> = {
  idea: "bg-gray-100 text-gray-600",
  sketched: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

export const STATUS_NEXT: Record<CostumeDesignStatus, CostumeDesignStatus | null> = {
  idea: "sketched",
  sketched: "approved",
  approved: "in_production",
  in_production: "completed",
  completed: null,
};

export const CATEGORY_OPTIONS = ["상의", "하의", "소품", "전체 세트", "신발", "액세서리"];

export const STATUS_FILTER_OPTIONS: Array<{
  value: CostumeDesignStatus | "all";
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "idea", label: "아이디어" },
  { value: "sketched", label: "스케치" },
  { value: "approved", label: "승인됨" },
  { value: "in_production", label: "제작 중" },
  { value: "completed", label: "완성" },
];
