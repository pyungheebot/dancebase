"use client";

import { Badge } from "@/components/ui/badge";
import type { SafetyCheckItem, SafetyInspection } from "@/types";
import {
  ITEM_STATUS_CONFIGS,
  STATUS_LABELS,
  OVERALL_STATUS_LABELS,
  OVERALL_STATUS_BADGE_CLASSES,
} from "./types";

// ============================================================
// 점검 항목 상태 배지
// ============================================================

export function ItemStatusBadge({
  status,
}: {
  status: SafetyCheckItem["status"];
}) {
  const config = ITEM_STATUS_CONFIGS[status];
  const Icon = config.icon;
  return (
    <span
      role="status"
      aria-label={`상태: ${STATUS_LABELS[status]}`}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ============================================================
// 전체 결과 배지
// ============================================================

export function OverallStatusBadge({
  status,
}: {
  status: SafetyInspection["overallStatus"];
}) {
  return (
    <Badge
      variant="outline"
      aria-label={`전체 결과: ${OVERALL_STATUS_LABELS[status]}`}
      className={`text-[10px] px-1.5 py-0 ${OVERALL_STATUS_BADGE_CLASSES[status]}`}
    >
      {OVERALL_STATUS_LABELS[status]}
    </Badge>
  );
}
