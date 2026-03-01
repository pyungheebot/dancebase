import type { SafetyCheckItem, SafetyInspection } from "@/types";
import {
  Zap,
  Building2,
  Flame,
  Ambulance,
  Wrench,
  MoreHorizontal,
} from "lucide-react";
import { CheckCircle2, XCircle, Clock, MinusCircle } from "lucide-react";

// ============================================================
// 카테고리 레이블 / 아이콘
// ============================================================

export const CATEGORY_LABELS: Record<SafetyCheckItem["category"], string> = {
  electrical: "전기",
  structural: "구조",
  fire: "화재",
  emergency: "비상",
  equipment: "장비",
  other: "기타",
};

export const CATEGORY_ICONS: Record<
  SafetyCheckItem["category"],
  React.ComponentType<{ className?: string }>
> = {
  electrical: Zap,
  structural: Building2,
  fire: Flame,
  emergency: Ambulance,
  equipment: Wrench,
  other: MoreHorizontal,
};

// ============================================================
// 상태 레이블
// ============================================================

export const STATUS_LABELS: Record<SafetyCheckItem["status"], string> = {
  pass: "통과",
  fail: "실패",
  pending: "보류",
  na: "해당없음",
};

export const OVERALL_STATUS_LABELS: Record<
  SafetyInspection["overallStatus"],
  string
> = {
  approved: "승인",
  conditional: "조건부 승인",
  rejected: "불승인",
};

// ============================================================
// 상태 배지 설정
// ============================================================

export const ITEM_STATUS_CONFIGS: Record<
  SafetyCheckItem["status"],
  { className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pass: {
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  fail: {
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
  pending: {
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  na: {
    className: "bg-gray-100 text-gray-500 border-gray-200",
    icon: MinusCircle,
  },
};

export const OVERALL_STATUS_BADGE_CLASSES: Record<
  SafetyInspection["overallStatus"],
  string
> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  conditional: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};
