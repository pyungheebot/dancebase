"use client";

// ============================================================
// 위치 배지 - 무대 위치를 약어로 표시하는 소형 배지
// ============================================================

import { POSITION_CONFIG } from "./stage-blocking-types";
import type { StageBlockingPosition } from "@/types";

type PositionBadgeProps = {
  position: StageBlockingPosition;
};

/**
 * 무대 위치를 약어(UL, C, DR 등)로 표시하는 작은 배지 컴포넌트.
 * title 속성으로 전체 이름을 툴팁으로 제공합니다.
 */
export function PositionBadge({ position }: PositionBadgeProps) {
  const cfg = POSITION_CONFIG[position];
  return (
    <span
      className={`inline-flex items-center rounded border px-1 py-0 text-[9px] font-bold ${cfg.color}`}
      title={cfg.label}
      aria-label={`위치: ${cfg.label}`}
    >
      {cfg.short}
    </span>
  );
}
