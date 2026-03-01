"use client";

import { Ticket, Users, CheckCircle2, DollarSign } from "lucide-react";
import type { PerfTicketTierSummary, PerfTicketStats } from "@/hooks/use-performance-ticket";
import { formatKRW } from "./performance-ticket-types";

// ============================================================
// 진행률 바
// ============================================================

export function SalesProgressBar({
  progress,
  sold,
  total,
  goal,
}: {
  progress: number;
  sold: number;
  total: number;
  goal: number | null;
}) {
  const base = goal ?? total;
  const progressBarId = "sales-progress-label";

  return (
    <div className="space-y-1" aria-live="polite" aria-atomic="true">
      <div
        id={progressBarId}
        className="flex justify-between items-center text-xs text-muted-foreground"
      >
        <span>
          배분 현황: {sold} / {base}석
        </span>
        <span className="font-medium text-foreground">{progress}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={progressBarId}
        aria-label={`배분 진행률 ${progress}%`}
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {goal && (
        <p className="text-[10px] text-muted-foreground" aria-live="polite">
          목표 {goal}석 중 {sold}석 배분
        </p>
      )}
    </div>
  );
}

// ============================================================
// 등급별 분포 차트
// ============================================================

export function TierDistributionChart({
  tierSummary,
}: {
  tierSummary: PerfTicketTierSummary[];
}) {
  if (tierSummary.length === 0) return null;

  const totalConfirmed = tierSummary.reduce((acc, s) => acc + s.confirmedQty, 0);

  return (
    <section aria-label="등급별 확정 분포">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        등급별 확정 분포
      </p>
      <ul role="list" className="space-y-2">
        {tierSummary.map((s) => {
          const pct =
            totalConfirmed > 0
              ? Math.round((s.confirmedQty / totalConfirmed) * 100)
              : 0;
          const barLabelId = `tier-bar-label-${s.tier.id}`;
          return (
            <li key={s.tier.id} className="space-y-0.5" role="listitem">
              <div
                id={barLabelId}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.tier.color }}
                  />
                  <span className="font-medium">{s.tier.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {s.confirmedQty}석 ({pct}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-labelledby={barLabelId}
                className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: s.tier.color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ============================================================
// 매출 요약 카드
// ============================================================

export function RevenueSummaryCards({
  stats,
}: {
  stats: PerfTicketStats;
}) {
  return (
    <dl
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      aria-label="티켓 판매 요약"
    >
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <dt className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Ticket className="h-3 w-3" aria-hidden="true" />
          총 좌석
        </dt>
        <dd className="text-lg font-bold">{stats.totalTickets}</dd>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <dt className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          배분 완료
        </dt>
        <dd className="text-lg font-bold text-blue-600">{stats.soldTickets}</dd>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <dt className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          확정
        </dt>
        <dd className="text-lg font-bold text-green-600">
          {stats.confirmedTickets}
        </dd>
      </div>
      <div className="rounded-lg border bg-card p-3 space-y-0.5">
        <dt className="text-[10px] text-muted-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3" aria-hidden="true" />
          확정 매출
        </dt>
        <dd className="text-sm font-bold text-purple-600">
          {formatKRW(stats.revenue)}
        </dd>
      </div>
    </dl>
  );
}
