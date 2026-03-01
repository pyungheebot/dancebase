"use client";

import {
  COMPETITION_TEAM_OR_SOLO_LABELS,
  COMPETITION_TEAM_OR_SOLO_COLORS,
} from "@/hooks/use-dance-competition";
import type { DanceCompetitionRecord } from "@/types";

// ============================================================
// 참가 유형 배지
// ============================================================

export function TeamOrSoloBadge({
  value,
}: {
  value: DanceCompetitionRecord["teamOrSolo"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${COMPETITION_TEAM_OR_SOLO_COLORS[value]}`}
      aria-label={`참가 유형: ${COMPETITION_TEAM_OR_SOLO_LABELS[value]}`}
    >
      {COMPETITION_TEAM_OR_SOLO_LABELS[value]}
    </span>
  );
}
