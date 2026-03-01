"use client";

import { memo } from "react";
import type { TicketMgmtSummaryStats } from "@/hooks/use-ticket-management";
import { formatPrice } from "./types";

interface TicketStatsSummaryProps {
  stats: TicketMgmtSummaryStats;
}

/**
 * 전체 이벤트 통계 요약 (이벤트 2개 이상일 때 표시)
 */
export const TicketStatsSummary = memo(function TicketStatsSummary({
  stats,
}: TicketStatsSummaryProps) {
  return (
    <div
      role="region"
      aria-label="전체 티켓 판매 통계"
      className="grid grid-cols-4 gap-2 rounded-md bg-orange-50 p-2 mb-3"
    >
      <dl className="contents">
        <div className="text-center space-y-0.5">
          <dt className="text-[10px] text-muted-foreground">이벤트</dt>
          <dd className="text-xs font-semibold">{stats.totalEvents}개</dd>
        </div>
        <div className="text-center space-y-0.5 border-x border-orange-200">
          <dt className="text-[10px] text-muted-foreground">총 매출</dt>
          <dd className="text-xs font-semibold text-blue-600">
            {formatPrice(stats.totalRevenue)}
          </dd>
        </div>
        <div className="text-center space-y-0.5 border-r border-orange-200">
          <dt className="text-[10px] text-muted-foreground">총 판매</dt>
          <dd className="text-xs font-semibold">{stats.totalSold}석</dd>
        </div>
        <div className="text-center space-y-0.5">
          <dt className="text-[10px] text-muted-foreground">매진 티어</dt>
          <dd className="text-xs font-semibold text-red-500">
            {stats.soldOutTiers}개
          </dd>
        </div>
      </dl>
    </div>
  );
});
