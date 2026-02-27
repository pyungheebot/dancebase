"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Calendar,
  CheckSquare,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAnalyticsExport } from "@/hooks/use-analytics-export";
import type { ExportPeriodPreset, ExportDateRange, ExportDataType } from "@/types";

// ============================================
// 기간 프리셋 설정
// ============================================

const PERIOD_PRESETS: { label: string; value: ExportPeriodPreset }[] = [
  { label: "이번 달", value: "this_month" },
  { label: "지난 달", value: "last_month" },
  { label: "최근 3개월", value: "last_3_months" },
  { label: "전체", value: "all" },
];

function getDateRange(preset: ExportPeriodPreset): ExportDateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (preset) {
    case "this_month": {
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      return { startDate: start, endDate: end };
    }
    case "last_month": {
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const start = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      return { startDate: start, endDate: end };
    }
    case "last_3_months": {
      const threeMonthsAgo = new Date(year, month - 2, 1);
      const start = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, "0")}-01`;
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      return { startDate: start, endDate: end };
    }
    case "all":
    default:
      return { startDate: null, endDate: null };
  }
}

// ============================================
// 내보내기 유형 설정
// ============================================

const EXPORT_TYPES: { label: string; value: ExportDataType; description: string }[] = [
  {
    label: "출석 데이터",
    value: "attendance",
    description: "일정별 멤버 출석/결석/지각 기록",
  },
  {
    label: "게시판 활동",
    value: "board",
    description: "게시글 제목·작성자·댓글 수",
  },
  {
    label: "재무 데이터",
    value: "finance",
    description: "수입/지출 거래 내역",
  },
];

// ============================================
// 메인 컴포넌트
// ============================================

interface AnalyticsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function AnalyticsExportDialog({
  open,
  onOpenChange,
  groupId,
}: AnalyticsExportDialogProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriodPreset>("this_month");
  const [selectedTypes, setSelectedTypes] = useState<Set<ExportDataType>>(
    new Set(["attendance", "board", "finance"])
  );

  const dateRange = getDateRange(selectedPeriod);

  const {
    exportAttendance,
    exportBoardActivity,
    exportFinances,
    exportAll,
    exportingAttendance,
    exportingBoard,
    exportingFinance,
    isExporting,
  } = useAnalyticsExport(groupId, dateRange);

  function toggleType(type: ExportDataType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function isTypeExporting(type: ExportDataType): boolean {
    if (type === "attendance") return exportingAttendance;
    if (type === "board") return exportingBoard;
    if (type === "finance") return exportingFinance;
    return false;
  }

  async function handleExportSelected() {
    const types = Array.from(selectedTypes);
    if (types.length === 0) return;
    await exportAll(types);
  }

  async function handleExportSingle(type: ExportDataType) {
    if (type === "attendance") await exportAttendance();
    else if (type === "board") await exportBoardActivity();
    else if (type === "finance") await exportFinances();
  }

  const hasSelection = selectedTypes.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            그룹 통계 내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기간 선택 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">기간 선택</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PERIOD_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPeriod === preset.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedPeriod(preset.value)}
                  disabled={isExporting}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {dateRange.startDate && dateRange.endDate && (
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {dateRange.startDate} ~ {dateRange.endDate.slice(0, 7)} 말
              </p>
            )}
            {!dateRange.startDate && (
              <p className="text-[10px] text-muted-foreground">전체 기간</p>
            )}
          </div>

          {/* 내보내기 유형 선택 */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">내보내기 유형</span>
            </div>
            <div className="space-y-2">
              {EXPORT_TYPES.map((type) => (
                <div
                  key={type.value}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`export-type-${type.value}`}
                      checked={selectedTypes.has(type.value)}
                      onCheckedChange={() => toggleType(type.value)}
                      disabled={isExporting}
                    />
                    <Label
                      htmlFor={`export-type-${type.value}`}
                      className="cursor-pointer space-y-0.5"
                    >
                      <span className="text-xs font-medium">{type.label}</span>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        {type.description}
                      </p>
                    </Label>
                  </div>
                  {/* 개별 다운로드 버튼 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    onClick={() => handleExportSingle(type.value)}
                    disabled={isExporting}
                    title={`${type.label} 개별 다운로드`}
                  >
                    {isTypeExporting(type.value) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 전체 내보내기 버튼 */}
          <Button
            className="w-full h-8 text-xs"
            onClick={handleExportSelected}
            disabled={!hasSelection || isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1.5" />
                선택한 항목 CSV 다운로드
                {selectedTypes.size > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({selectedTypes.size}개)</span>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
