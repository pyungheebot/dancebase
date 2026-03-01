"use client";

import { UNIFIED_EVENT_TYPE_COLORS, UNIFIED_EVENT_TYPE_LABELS } from "@/hooks/use-unified-calendar";
import type { UnifiedEventType } from "@/types";

interface TypeBadgeProps {
  type: UnifiedEventType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const c = UNIFIED_EVENT_TYPE_COLORS[type];
  return (
    <span
      role="img"
      aria-label={`유형: ${UNIFIED_EVENT_TYPE_LABELS[type]}`}
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${c.badge}`}
    >
      {UNIFIED_EVENT_TYPE_LABELS[type]}
    </span>
  );
}
