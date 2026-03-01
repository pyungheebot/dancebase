"use client";

import { formatKRW } from "./types";

// ============================================================
// 요약 통계 패널
// ============================================================

type FeeStats = {
  totalAmount: number;
  totalCount: number;
  settledAmount: number;
  settledCount: number;
  pendingAmount: number;
  pendingCount: number;
};

export function FeeStatsPanel({ stats }: { stats: FeeStats }) {
  const settledPct =
    stats.totalCount > 0
      ? Math.round((stats.settledCount / stats.totalCount) * 100)
      : 0;

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="region"
      aria-label="출연료 정산 통계"
    >
      {/* 전체 */}
      <div
        className="rounded-md bg-muted/40 px-2 py-1.5 text-center"
        role="group"
        aria-label="전체 통계"
      >
        <p className="text-[10px] text-muted-foreground">전체</p>
        <p className="text-xs font-semibold" aria-label={`전체 금액 ${formatKRW(stats.totalAmount)}`}>
          {formatKRW(stats.totalAmount)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          <span aria-label={`전체 인원 ${stats.totalCount}명`}>{stats.totalCount}명</span>
        </p>
      </div>

      {/* 정산완료 */}
      <div
        className="rounded-md bg-green-50 px-2 py-1.5 text-center"
        role="group"
        aria-label="정산완료 통계"
      >
        <p className="text-[10px] text-green-600">정산완료</p>
        <p
          className="text-xs font-semibold text-green-700"
          aria-label={`정산완료 금액 ${formatKRW(stats.settledAmount)}`}
        >
          {formatKRW(stats.settledAmount)}
        </p>
        <p className="text-[10px] text-green-600">
          <span aria-label={`정산완료 인원 ${stats.settledCount}명`}>{stats.settledCount}명</span>
        </p>
      </div>

      {/* 미정산 */}
      <div
        className="rounded-md bg-orange-50 px-2 py-1.5 text-center"
        role="group"
        aria-label="미정산 통계"
      >
        <p className="text-[10px] text-orange-600">미정산</p>
        <p
          className="text-xs font-semibold text-orange-700"
          aria-label={`미정산 금액 ${formatKRW(stats.pendingAmount)}`}
        >
          {formatKRW(stats.pendingAmount)}
        </p>
        <p className="text-[10px] text-orange-600">
          <span aria-label={`미정산 인원 ${stats.pendingCount}명`}>{stats.pendingCount}명</span>
        </p>
      </div>

      {/* 정산 진행률 (sr-only로 스크린리더에 추가 맥락 제공) */}
      <div
        role="meter"
        aria-valuenow={settledPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`정산 진행률 ${settledPct}%`}
        className="sr-only"
      >
        {settledPct}%
      </div>
    </div>
  );
}
