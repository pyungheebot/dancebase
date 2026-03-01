"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import type { FormationPosition } from "@/types";

// ============================================
// 선택된 멤버 컨트롤 패널
// ============================================

const STEP = 2; // 2% 씩 이동

interface SelectedMemberControlProps {
  position: FormationPosition;
  onMove: (dx: number, dy: number) => void;
  onRemove: () => void;
  onDeselect: () => void;
}

export function SelectedMemberControl({
  position,
  onMove,
  onRemove,
  onDeselect,
}: SelectedMemberControlProps) {
  return (
    <div
      className="border rounded-md p-2.5 bg-muted/30 space-y-2"
      role="region"
      aria-label={`${position.memberName} 위치 조정 패널`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: position.color }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium truncate max-w-[120px]">
            {position.memberName}
          </span>
          <span
            className="text-[10px] text-muted-foreground"
            aria-label={`현재 위치 좌 ${Math.round(position.x)}퍼센트, 상 ${Math.round(position.y)}퍼센트`}
          >
            ({Math.round(position.x)}%, {Math.round(position.y)}%)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`${position.memberName} 무대에서 제거`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={onDeselect}
            aria-label="멤버 선택 닫기"
          >
            닫기
          </Button>
        </div>
      </div>

      {/* 방향키 버튼 */}
      <fieldset>
        <legend className="sr-only">
          {position.memberName} 위치 방향 이동 (한 번에 {STEP}% 이동)
        </legend>
        <div className="flex flex-col items-center gap-0.5" role="group">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(0, -STEP)}
            aria-label="위로 이동"
          >
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          </Button>
          <div className="flex gap-0.5">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMove(-STEP, 0)}
              aria-label="왼쪽으로 이동"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMove(0, STEP)}
              aria-label="아래로 이동"
            >
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMove(STEP, 0)}
              aria-label="오른쪽으로 이동"
            >
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
