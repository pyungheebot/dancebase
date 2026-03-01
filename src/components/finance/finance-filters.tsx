"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinanceExportButton } from "@/components/finance/finance-export-button";
import { Download, Search, X, CalendarClock } from "lucide-react";
import type { FinanceTransactionWithDetails, FinanceDueDateSettingValue } from "@/types";

// 월 레이블 포맷: "2026-02" → "2026년 2월"
export function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

type FinanceFiltersProps = {
  // 월 필터
  selectedMonth: string;
  monthOptions: string[];
  onMonthChange: (month: string) => void;
  // 유형 필터
  typeFilter: "all" | "income" | "expense";
  onTypeFilterChange: (type: "all" | "income" | "expense") => void;
  // 검색
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  // 납부 기한
  canManage: boolean;
  dueDateSetting: FinanceDueDateSettingValue;
  onDueDateChange: (day: string) => void;
  // CSV/내보내기
  filteredTransactions: FinanceTransactionWithDetails[];
  groupName: string;
  nicknameMap: Record<string, string>;
  onDownloadCsv: () => void;
};

export const FinanceFilters = React.memo(function FinanceFilters({
  selectedMonth,
  monthOptions,
  onMonthChange,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
  canManage,
  dueDateSetting,
  onDueDateChange,
  filteredTransactions,
  groupName,
  nicknameMap,
  onDownloadCsv,
}: FinanceFiltersProps) {
  return (
    <div className="space-y-2">
      {/* 헤더: 제목 + 월 필터 드롭다운 + CSV 다운로드 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">거래 내역</h2>
        <div className="flex items-center gap-1.5">
          <FinanceExportButton
            transactions={filteredTransactions}
            groupName={groupName}
            periodLabel={selectedMonth === "all" ? "전체" : formatMonthLabel(selectedMonth)}
            nicknameMap={nicknameMap}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 gap-1"
            onClick={onDownloadCsv}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-3 w-3" />
            CSV 다운로드
          </Button>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="h-6 w-28 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {monthOptions.map((ym) => (
                <SelectItem key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 납부 기한 설정 영역 (관리자만 설정, 전체 멤버에게 표시) */}
      <div className="flex items-center gap-2">
        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground shrink-0">납부 기한</span>
        {canManage ? (
          <Select value={String(dueDateSetting.day)} onValueChange={onDueDateChange}>
            <SelectTrigger className="h-6 w-32 text-[11px]">
              <SelectValue placeholder="기한 없음" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">기한 없음</SelectItem>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  매월 {day}일까지
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : dueDateSetting.day > 0 ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40 gap-1"
          >
            매월 {dueDateSetting.day}일까지
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">미설정</span>
        )}
      </div>

      {/* 거래 유형 필터 탭 + 검색바 */}
      <div className="flex items-center gap-2">
        {/* 유형 필터 버튼 그룹 */}
        <div className="flex items-center rounded-md border overflow-hidden shrink-0">
          {(
            [
              { value: "all", label: "전체" },
              { value: "income", label: "수입" },
              { value: "expense", label: "지출" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onTypeFilterChange(opt.value)}
              className={`px-2.5 h-6 text-[11px] transition-colors ${
                typeFilter === opt.value
                  ? opt.value === "income"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 font-medium"
                    : opt.value === "expense"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-medium"
                    : "bg-muted text-foreground font-medium"
                  : "bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 검색바 */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="거래 제목 검색"
            className="h-6 pl-6 pr-6 text-[11px]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="검색어 지우기"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
