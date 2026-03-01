"use client";

// ============================================================
// 멤버 동선 표시 행 - 저장된 동선을 읽기 전용으로 표시
// ============================================================

import { memo } from "react";
import { User, MoveRight } from "lucide-react";
import { PositionBadge } from "./stage-blocking-position-badge";
import { DIRECTION_CONFIG } from "./stage-blocking-types";
import type { StageBlockingMemberMove } from "@/types";

type MemberMoveRowProps = {
  move: StageBlockingMemberMove;
  memberColor: string;
};

/**
 * 멤버 한 명의 동선(시작 위치 → 종료 위치, 방향, 메모)을 한 줄로 표시합니다.
 * React.memo 적용으로 불필요한 리렌더링을 방지합니다.
 */
export const MemberMoveRow = memo(function MemberMoveRow({
  move,
  memberColor,
}: MemberMoveRowProps) {
  return (
    <div
      className="flex items-center gap-1.5 flex-wrap"
      role="listitem"
      aria-label={`${move.memberName} 동선`}
    >
      {/* 멤버 이름 배지 */}
      <span
        className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0 text-[10px] font-medium ${memberColor}`}
      >
        <User className="h-2 w-2" aria-hidden="true" />
        {move.memberName}
      </span>

      {/* 시작 위치 */}
      <PositionBadge position={move.fromPosition} />

      {/* 이동 화살표 */}
      <MoveRight
        className="h-2.5 w-2.5 text-muted-foreground shrink-0"
        aria-hidden="true"
      />

      {/* 종료 위치 */}
      <PositionBadge position={move.toPosition} />

      {/* 이동 방향 (선택사항) */}
      {move.direction && (
        <span className="text-[10px] text-muted-foreground">
          ({DIRECTION_CONFIG[move.direction].label})
        </span>
      )}

      {/* 동선 메모 (선택사항) */}
      {move.note && (
        <span className="text-[10px] text-muted-foreground italic">
          — {move.note}
        </span>
      )}
    </div>
  );
});
