"use client";

import { memo } from "react";
import { MapPin, Pencil, X, MoveUp, MoveDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { StageFormationScene, StageFormationPosition } from "@/types";

// ============================================================
// 무대 뷰 컴포넌트
// ============================================================

export interface StageViewProps {
  scene: StageFormationScene;
  stageWidth: number;
  stageDepth: number;
  onEditPosition: (pos: StageFormationPosition) => void;
  onRemovePosition: (posId: string) => void;
}

export const StageView = memo(function StageView({
  scene,
  stageWidth,
  stageDepth,
  onEditPosition,
  onRemovePosition,
}: StageViewProps) {
  // 무대 비율 기반 높이 계산 (최대 200px)
  const aspectRatio = stageDepth / stageWidth;
  const stageHeightPercent = Math.min(Math.max(aspectRatio * 100, 40), 80);

  return (
    <div className="space-y-1.5">
      {/* 무대 크기 라벨 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          무대: {stageWidth}m x {stageDepth}m
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            관객석
          </span>
        </div>
      </div>

      {/* 관객석 방향 표시 */}
      <div className="flex items-center gap-1 mb-0.5">
        <div className="flex-1 h-px bg-dashed border-t border-dashed border-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground px-1 flex-shrink-0">
          -- 앞 (관객석 방향) --
        </span>
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
      </div>

      {/* 무대 영역 */}
      <div
        className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-md overflow-hidden"
        style={{ paddingBottom: `${stageHeightPercent}%` }}
      >
        {/* 격자 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }}
        />

        {/* 중앙선 */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-200/60 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-200/60 -translate-y-1/2" />

        {/* 빈 상태 */}
        {scene.positions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin className="h-5 w-5 text-muted-foreground/40 mb-1" />
            <p className="text-[10px] text-muted-foreground/60">
              멤버 포지션을 추가하세요
            </p>
          </div>
        )}

        {/* 멤버 마커 */}
        {scene.positions.map((pos) => (
          <div
            key={pos.id}
            className="absolute group"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* 마커 원 */}
            <div
              className="relative w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: pos.color }}
              title={pos.memberName}
            >
              <span className="text-[8px] text-white font-bold leading-none text-center px-0.5 break-all max-w-[28px] overflow-hidden">
                {pos.memberName.slice(0, 3)}
              </span>
            </div>

            {/* 호버 툴팁 & 액션 */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-gray-900/90 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                {pos.memberName}
                <br />
                <span className="text-gray-400">
                  X:{Math.round(pos.x)} Y:{Math.round(pos.y)}
                </span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-900/90 rotate-45 -mt-0.5" />
            </div>

            {/* 수정/삭제 버튼 (항상 보임 on hover) */}
            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-0.5 pointer-events-auto">
              <button
                className="w-4 h-4 bg-background border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPosition(pos);
                }}
                title="수정"
              >
                <Pencil className="h-2 w-2 text-blue-600" />
              </button>
              <button
                className="w-4 h-4 bg-background border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePosition(pos.id);
                }}
                title="삭제"
              >
                <X className="h-2 w-2 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 뒤 방향 라벨 */}
      <div className="flex items-center gap-1 mt-0.5">
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground px-1 flex-shrink-0">
          -- 뒤 --
        </span>
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
      </div>

      {/* 범례 */}
      {scene.positions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {scene.positions.map((pos) => (
            <div key={pos.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: pos.color }}
              />
              <span className="text-[10px] text-muted-foreground">
                {pos.memberName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ============================================================
// 씬 행 (사이드 목록용)
// ============================================================

export interface SceneRowProps {
  scene: StageFormationScene;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const SceneRow = memo(function SceneRow({
  scene,
  isActive,
  isFirst,
  isLast,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SceneRowProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
        isActive
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/60"
      }`}
      onClick={onClick}
    >
      {/* 순서 번호 */}
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {scene.order}
      </div>

      {/* 씬 정보 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate ${
            isActive ? "text-primary" : "text-foreground"
          }`}
        >
          {scene.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {scene.positions.length}명
          {scene.durationSec != null && ` · ${scene.durationSec}초`}
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={isFirst}
          title="위로"
        >
          <MoveUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={isLast}
          title="아래로"
        >
          <MoveDown className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="수정"
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="삭제"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
});
