"use client";

import { useRef, useCallback } from "react";
import { Grid3X3 } from "lucide-react";
import type { FormationScene } from "@/types";
import { MemberBadge } from "./member-badge";

// ============================================
// 무대 캔버스 컴포넌트
// ============================================

interface StageCanvasProps {
  scene: FormationScene;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  onMoveToClick: (x: number, y: number) => void;
}

export function StageCanvas({
  scene,
  selectedMemberId,
  onSelectMember,
  onMoveToClick,
}: StageCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 멤버 배지 클릭이면 무시 (버블링 방지는 배지 쪽에서 처리)
      if ((e.target as HTMLElement).closest("[data-member-badge]")) return;

      if (!selectedMemberId) return;
      if (!stageRef.current) return;

      const rect = stageRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;
      onMoveToClick(relX, relY);
    },
    [selectedMemberId, onMoveToClick]
  );

  const stageLabel = selectedMemberId
    ? "포메이션 무대 - 클릭하여 선택된 멤버를 이동"
    : "포메이션 무대 - 멤버를 선택하면 클릭으로 이동 가능";

  return (
    <div className="space-y-1">
      {/* 객석 방향 표시 */}
      <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider px-1">
          객석 (앞)
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 무대 영역 */}
      <div
        ref={stageRef}
        role="application"
        aria-label={stageLabel}
        aria-live="polite"
        className="relative w-full bg-muted/40 border-2 border-dashed border-border rounded-md overflow-hidden select-none"
        style={{
          aspectRatio: "16/9",
          cursor: selectedMemberId ? "crosshair" : "default",
        }}
        onClick={handleStageClick}
      >
        {/* 무대 격자 가이드라인 */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
            backgroundSize: "25% 33.33%",
          }}
        />

        {/* 클릭 안내 */}
        {selectedMemberId && scene.positions.length > 0 && (
          <div
            className="absolute top-1.5 left-1/2 -translate-x-1/2 pointer-events-none z-10"
            aria-hidden="true"
          >
            <span className="text-[9px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full border">
              무대를 클릭해 이동
            </span>
          </div>
        )}

        {/* 멤버 위치 배지 목록 */}
        <div role="list" aria-label="무대 위 멤버 목록">
          {scene.positions.map((pos) => (
            <div key={pos.memberId} role="listitem">
              <MemberBadge
                position={pos}
                isSelected={selectedMemberId === pos.memberId}
                onSelect={() =>
                  onSelectMember(
                    selectedMemberId === pos.memberId ? null : pos.memberId
                  )
                }
              />
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {scene.positions.length === 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none"
            role="status"
          >
            <Grid3X3 className="h-6 w-6 mb-1.5 opacity-30" aria-hidden="true" />
            <p className="text-[11px] opacity-60">아래에서 멤버를 추가하세요</p>
          </div>
        )}
      </div>

      {/* 무대 뒤 표시 */}
      <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider px-1">
          무대 뒤
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
