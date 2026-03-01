"use client";

import { Badge } from "@/components/ui/badge";
import type { CostumeDesignStatus } from "@/types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

// ============================================================
// 상태 배지
// ============================================================

interface StatusBadgeProps {
  status: CostumeDesignStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
