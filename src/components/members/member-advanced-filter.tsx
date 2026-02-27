"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { MemberFilterState } from "@/hooks/use-member-filter";

// ============================================
// 역할 옵션 정의
// ============================================

const ROLE_OPTIONS: {
  value: "leader" | "sub_leader" | "member";
  label: string;
}[] = [
  { value: "leader", label: "리더" },
  { value: "sub_leader", label: "서브리더" },
  { value: "member", label: "멤버" },
];

// ============================================
// Props
// ============================================

type MemberAdvancedFilterProps = {
  filter: MemberFilterState;
  activeCount: number;
  onToggleRole: (role: "leader" | "sub_leader" | "member") => void;
  onSetJoinedFrom: (v: string) => void;
  onSetJoinedTo: (v: string) => void;
  onSetAttendanceMin: (v: string) => void;
  onSetAttendanceMax: (v: string) => void;
  onReset: () => void;
};

// ============================================
// 컴포넌트
// ============================================

export function MemberAdvancedFilter({
  filter,
  activeCount,
  onToggleRole,
  onSetJoinedFrom,
  onSetJoinedTo,
  onSetAttendanceMin,
  onSetAttendanceMax,
  onReset,
}: MemberAdvancedFilterProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 relative shrink-0"
        >
          <SlidersHorizontal className="h-3 w-3 mr-1" />
          고급 필터
          {activeCount > 0 && (
            <Badge
              className="ml-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-64 p-3 space-y-4"
        sideOffset={4}
      >
        {/* 역할 필터 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">역할</p>
          <div className="space-y-1">
            {ROLE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${opt.value}`}
                  checked={filter.roles.includes(opt.value)}
                  onCheckedChange={() => onToggleRole(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`role-${opt.value}`}
                  className="text-xs cursor-pointer leading-none"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 가입일 범위 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">가입일 범위</p>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={filter.joinedFrom}
              onChange={(e) => onSetJoinedFrom(e.target.value)}
              className="h-7 text-xs px-2 flex-1 min-w-0"
              aria-label="가입일 시작"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">~</span>
            <Input
              type="date"
              value={filter.joinedTo}
              onChange={(e) => onSetJoinedTo(e.target.value)}
              className="h-7 text-xs px-2 flex-1 min-w-0"
              aria-label="가입일 종료"
            />
          </div>
        </div>

        {/* 출석률 범위 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">출석률 범위 (%)</p>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="최소"
              value={filter.attendanceMin}
              onChange={(e) => onSetAttendanceMin(e.target.value)}
              className="h-7 text-xs px-2 flex-1 min-w-0"
              aria-label="최소 출석률"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">~</span>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="최대"
              value={filter.attendanceMax}
              onChange={(e) => onSetAttendanceMax(e.target.value)}
              className="h-7 text-xs px-2 flex-1 min-w-0"
              aria-label="최대 출석률"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            출석률 필터는 출석 통계가 있는 멤버에만 적용됩니다
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleReset}
            disabled={activeCount === 0}
          >
            초기화
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleApply}
          >
            필터 적용
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
