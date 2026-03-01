"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Circle, Filter } from "lucide-react";
import type {
  SafetyChecklistCategory,
  SafetyChecklistStatus,
} from "@/types";
import { CATEGORIES, CATEGORY_LABELS } from "./types";

// ============================================================
// Props
// ============================================================

export interface ChecklistStats {
  totalCount: number;
  checkedCount: number;
  issueCount: number;
  pendingCount: number;
  progressRate: number;
  highPriorityPending: number;
  categoryBreakdown: Partial<Record<SafetyChecklistCategory, number>>;
}

export interface ChecklistFiltersProps {
  filterCategory: SafetyChecklistCategory | "all";
  filterStatus: SafetyChecklistStatus | "all";
  onFilterCategory: (v: SafetyChecklistCategory | "all") => void;
  onFilterStatus: (v: SafetyChecklistStatus | "all") => void;
  stats: ChecklistStats;
}

// ============================================================
// 컴포넌트
// ============================================================

export function ChecklistFilters({
  filterCategory,
  filterStatus,
  onFilterCategory,
  onFilterStatus,
  stats,
}: ChecklistFiltersProps) {
  return (
    <div
      role="group"
      aria-label="체크리스트 필터"
      className="flex items-center gap-2 flex-wrap"
    >
      <Filter className="h-3 w-3 text-gray-400" aria-hidden="true" />

      {/* 카테고리 필터 */}
      <Select
        value={filterCategory}
        onValueChange={(v) =>
          onFilterCategory(v as SafetyChecklistCategory | "all")
        }
      >
        <SelectTrigger
          className="h-7 text-xs w-32"
          aria-label="카테고리 필터"
          id="filter-category"
        >
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            전체 카테고리
          </SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="text-xs">
              {CATEGORY_LABELS[c]}{" "}
              {stats.categoryBreakdown[c] ? `(${stats.categoryBreakdown[c]})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 상태 필터 */}
      <Select
        value={filterStatus}
        onValueChange={(v) =>
          onFilterStatus(v as SafetyChecklistStatus | "all")
        }
      >
        <SelectTrigger
          className="h-7 text-xs w-28"
          aria-label="상태 필터"
          id="filter-status"
        >
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            전체 상태
          </SelectItem>
          <SelectItem value="pending" className="text-xs">
            미확인 ({stats.pendingCount})
          </SelectItem>
          <SelectItem value="checked" className="text-xs">
            확인완료 ({stats.checkedCount})
          </SelectItem>
          <SelectItem value="issue" className="text-xs">
            문제발견 ({stats.issueCount})
          </SelectItem>
        </SelectContent>
      </Select>

      {/* 요약 배지 */}
      <div
        className="flex items-center gap-1 ml-auto"
        role="status"
        aria-live="polite"
        aria-label={`확인완료 ${stats.checkedCount}건, 문제발견 ${stats.issueCount}건, 미확인 ${stats.pendingCount}건`}
      >
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
          aria-label={`확인완료 ${stats.checkedCount}건`}
        >
          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
          {stats.checkedCount}
        </Badge>
        {stats.issueCount > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200"
            aria-label={`문제발견 ${stats.issueCount}건`}
          >
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
            {stats.issueCount}
          </Badge>
        )}
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
          aria-label={`미확인 ${stats.pendingCount}건`}
        >
          <Circle className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
          {stats.pendingCount}
        </Badge>
      </div>
    </div>
  );
}
