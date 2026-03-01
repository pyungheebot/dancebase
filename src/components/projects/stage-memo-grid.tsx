"use client";

// ============================================================
// 무대 메모 카드 — 무대 그리드 컴포넌트
//  - StageZoneCell: 개별 구역 셀 (React.memo)
//  - StageGrid: 3x3 그리드
// ============================================================

import { memo } from "react";
import type { StageMemoNote, StageMemoZone } from "@/types";
import { ZONE_LABELS, ZONE_GRID } from "./stage-memo-types";

// ============================================================
// 무대 그리드 셀
// ============================================================

interface StageZoneCellProps {
  zone: StageMemoZone;
  notes: StageMemoNote[];
  isSelected: boolean;
  onClick: () => void;
}

export const StageZoneCell = memo(function StageZoneCell({
  zone,
  notes,
  isSelected,
  onClick,
}: StageZoneCellProps) {
  const unresolvedCount = notes.filter((n) => !n.isResolved).length;
  const hasHighPriority = notes.some(
    (n) => n.priority === "high" && !n.isResolved
  );
  const label = ZONE_LABELS[zone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`${label} 구역, 메모 ${notes.length}개${unresolvedCount > 0 ? `, 미해결 ${unresolvedCount}개` : ""}${hasHighPriority ? ", 고우선순위 포함" : ""}`}
      className={[
        "relative flex flex-col items-center justify-center rounded-md transition-all cursor-pointer select-none",
        "border text-[10px] font-medium py-2 px-1 min-h-[44px]",
        isSelected
          ? "bg-rose-50 border-rose-400 text-rose-700"
          : hasHighPriority
          ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100"
          : unresolvedCount > 0
          ? "bg-muted/40 border-muted-foreground/30 text-foreground hover:bg-muted/60"
          : "bg-background border-border/40 text-muted-foreground hover:bg-muted/20",
      ].join(" ")}
    >
      <span className="leading-tight text-center">{label}</span>
      {notes.length > 0 && (
        <span
          aria-hidden="true"
          className={[
            "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
            hasHighPriority
              ? "bg-red-500 text-white"
              : "bg-rose-400 text-white",
          ].join(" ")}
        >
          {notes.length}
        </span>
      )}
    </button>
  );
});

// ============================================================
// 무대 그리드 (3x3)
// ============================================================

interface StageGridProps {
  notesByZone: Record<StageMemoZone, StageMemoNote[]>;
  selectedZone: StageMemoZone | null;
  onZoneClick: (zone: StageMemoZone) => void;
}

export function StageGrid({
  notesByZone,
  selectedZone,
  onZoneClick,
}: StageGridProps) {
  return (
    <div className="space-y-1.5">
      {/* 상수석 레이블 */}
      <div
        className="flex items-center justify-center"
        aria-label="무대 위쪽 방향"
      >
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          상수석 (무대 뒤쪽)
        </span>
      </div>

      {/* 3x3 그리드 */}
      <div
        role="grid"
        aria-label="무대 구역 선택"
        className="grid grid-cols-3 gap-1.5"
      >
        {ZONE_GRID.map((row, rowIdx) => (
          <div key={rowIdx} role="row" className="contents">
            {row.map((zone) => (
              <div key={zone} role="gridcell">
                <StageZoneCell
                  zone={zone}
                  notes={notesByZone[zone] ?? []}
                  isSelected={selectedZone === zone}
                  onClick={() => onZoneClick(zone)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 하수석 레이블 */}
      <div
        className="flex items-center justify-center"
        aria-label="무대 아래쪽 방향"
      >
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          하수석 (관객 방향)
        </span>
      </div>
    </div>
  );
}
