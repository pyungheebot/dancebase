"use client";

/**
 * 사운드체크 선택된 시트 헤더 컴포넌트
 * 시트명, 엔지니어, 날짜, 메모, 완료율 Progress 바를 표시하고
 * 편집/삭제 버튼을 제공합니다.
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, User, Calendar, AlignLeft } from "lucide-react";
import type { SoundcheckSheet } from "@/types";

// ============================================================
// Props 타입
// ============================================================

type SheetHeaderProps = {
  sheet: SoundcheckSheet;
  /** 체크된 채널 수 */
  checkedCount: number;
  /** 전체 채널 수 */
  totalCount: number;
  /** 완료율 (0~100) */
  rate: number;
  onEdit: () => void;
  onDelete: () => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export const SheetHeader = memo(function SheetHeader({
  sheet,
  checkedCount,
  totalCount,
  rate,
  onEdit,
  onDelete,
}: SheetHeaderProps) {
  return (
    <div className="flex items-start justify-between rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
      <div className="space-y-1 flex-1 min-w-0">
        <p className="text-xs font-semibold text-cyan-800">{sheet.sheetName}</p>

        {/* 엔지니어 + 날짜 */}
        <div className="flex flex-wrap gap-3">
          {sheet.engineer && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-cyan-500" aria-hidden="true" />
              <span className="text-[10px] text-cyan-600">{sheet.engineer}</span>
            </div>
          )}
          {sheet.checkDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-cyan-500" aria-hidden="true" />
              <span className="text-[10px] text-cyan-600">{sheet.checkDate}</span>
            </div>
          )}
        </div>

        {/* 전체 메모 */}
        {sheet.overallNotes && (
          <div className="flex items-start gap-1">
            <AlignLeft
              className="h-3 w-3 text-cyan-500 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-[10px] text-cyan-600">{sheet.overallNotes}</p>
          </div>
        )}

        {/* 시트별 완료율 */}
        {totalCount > 0 && (
          <div className="space-y-0.5 pt-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-cyan-600">
                완료율 {checkedCount}/{totalCount}채널
              </span>
              <span className="text-[10px] font-semibold text-cyan-700">
                {rate}%
              </span>
            </div>
            <Progress
              value={rate}
              className="h-1.5"
              aria-label={`시트 완료율 ${rate}%`}
            />
          </div>
        )}
      </div>

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onEdit}
          aria-label="시트 편집"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="시트 삭제"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
