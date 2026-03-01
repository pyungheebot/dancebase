"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2 } from "lucide-react";

// ============================================
// Props
// ============================================

type MemberBulkActionsProps = {
  /** 전체 멤버 선택 여부 */
  allSelected: boolean;
  /** 하나 이상 선택된 여부 */
  someSelected: boolean;
  /** 선택된 멤버 수 */
  selectedCount: number;
  /** 일괄 작업 처리 중 여부 */
  bulkLoading: boolean;
  /** 전체 선택/해제 핸들러 */
  onToggleSelectAll: () => void;
  /** 일괄 역할 변경 핸들러 */
  onBulkRoleChange: (role: "leader" | "sub_leader" | "member") => void;
  /** 일괄 제거 다이얼로그 열기 핸들러 */
  onBulkRemoveOpen: () => void;
};

// ============================================
// 컴포넌트
// ============================================

/**
 * 멤버 목록의 일괄 선택 툴바.
 * 전체 선택 체크박스, 선택 수 표시, 일괄 역할 변경/삭제 드롭다운을 포함합니다.
 */
export function MemberBulkActions({
  allSelected,
  someSelected,
  selectedCount,
  bulkLoading,
  onToggleSelectAll,
  onBulkRoleChange,
  onBulkRemoveOpen,
}: MemberBulkActionsProps) {
  return (
    <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded border bg-muted/40">
      {/* 전체 선택 체크박스 */}
      <Checkbox
        checked={allSelected}
        onCheckedChange={onToggleSelectAll}
        className="shrink-0"
        aria-label="전체 선택"
      />

      {/* 선택 수 표시 */}
      <span className="text-xs text-muted-foreground flex-1">
        {someSelected ? `${selectedCount}명 선택됨` : "전체 선택"}
      </span>

      {/* 일괄 작업 드롭다운 — 하나 이상 선택된 경우에만 표시 */}
      {someSelected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2"
              disabled={bulkLoading}
            >
              일괄 작업
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {/* 역할 변경 서브메뉴 */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                역할 변경
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="text-xs"
                  onSelect={() => onBulkRoleChange("leader")}
                >
                  그룹장
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onSelect={() => onBulkRoleChange("sub_leader")}
                >
                  부그룹장
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onSelect={() => onBulkRoleChange("member")}
                >
                  멤버
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* 멤버 제거 */}
            <DropdownMenuItem
              className="text-xs"
              variant="destructive"
              onSelect={onBulkRemoveOpen}
            >
              <Trash2 className="h-3 w-3" />
              멤버 제거
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
