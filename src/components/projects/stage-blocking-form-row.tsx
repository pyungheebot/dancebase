"use client";

// ============================================================
// 멤버 동선 폼 행 - 다이얼로그 내 멤버별 동선 입력 UI
// ============================================================

import { memo } from "react";
import { Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POSITION_CONFIG,
  DIRECTION_CONFIG,
  POSITION_OPTIONS,
  DIRECTION_OPTIONS,
} from "./stage-blocking-types";
import type { StageBlockingPosition, StageBlockingDirection } from "@/types";
import type { AddMemberMoveInput } from "@/hooks/use-stage-blocking";

type MemberMoveFormRowProps = {
  move: AddMemberMoveInput;
  index: number;
  onChange: (index: number, move: AddMemberMoveInput) => void;
  onRemove: (index: number) => void;
};

/**
 * 멤버 한 명의 동선을 입력하는 폼 행입니다.
 * 이름, 시작/종료 위치, 이동 방향, 메모를 입력할 수 있습니다.
 * React.memo 적용으로 다른 행 변경 시 불필요한 리렌더링을 방지합니다.
 */
export const MemberMoveFormRow = memo(function MemberMoveFormRow({
  move,
  index,
  onChange,
  onRemove,
}: MemberMoveFormRowProps) {
  // 특정 필드만 업데이트하는 헬퍼
  function setField<K extends keyof AddMemberMoveInput>(
    key: K,
    value: AddMemberMoveInput[K]
  ) {
    onChange(index, { ...move, [key]: value });
  }

  return (
    <div
      className="rounded-md border bg-muted/20 p-2 space-y-2"
      role="group"
      aria-label={`멤버 ${index + 1} 동선 입력`}
    >
      {/* 행 헤더: 번호 + 삭제 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span className="text-[11px] font-medium text-muted-foreground">
            멤버 {index + 1}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-600"
          onClick={() => onRemove(index)}
          aria-label={`멤버 ${index + 1} 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>

      {/* 멤버 이름 */}
      <Input
        placeholder="멤버 이름"
        value={move.memberName}
        onChange={(e) => setField("memberName", e.target.value)}
        className="h-7 text-xs"
        aria-label="멤버 이름"
      />

      {/* 시작/종료 위치 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground" id={`from-label-${index}`}>
            시작 위치
          </span>
          <Select
            value={move.fromPosition}
            onValueChange={(v) => setField("fromPosition", v as StageBlockingPosition)}
          >
            <SelectTrigger
              className="h-7 text-xs"
              aria-labelledby={`from-label-${index}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {POSITION_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground" id={`to-label-${index}`}>
            종료 위치
          </span>
          <Select
            value={move.toPosition}
            onValueChange={(v) => setField("toPosition", v as StageBlockingPosition)}
          >
            <SelectTrigger
              className="h-7 text-xs"
              aria-labelledby={`to-label-${index}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {POSITION_CONFIG[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 이동 방향 & 메모 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground" id={`dir-label-${index}`}>
            이동 방향
          </span>
          <Select
            value={move.direction ?? ""}
            onValueChange={(v) =>
              setField("direction", v ? (v as StageBlockingDirection) : undefined)
            }
          >
            <SelectTrigger
              className="h-7 text-xs"
              aria-labelledby={`dir-label-${index}`}
            >
              <SelectValue placeholder="선택 안함" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" className="text-xs">선택 안함</SelectItem>
              {DIRECTION_OPTIONS.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {DIRECTION_CONFIG[d].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground">메모</span>
          <Input
            placeholder="동선 메모"
            value={move.note ?? ""}
            onChange={(e) => setField("note", e.target.value || undefined)}
            className="h-7 text-xs"
            aria-label="동선 메모"
          />
        </div>
      </div>
    </div>
  );
});
