"use client";

// ============================================================
// 공연 후원/스폰서 관리 — 통계/차트 컴포넌트
// ============================================================

import { Target } from "lucide-react";
import type { SponsorTierBreakdown, SponsorStats } from "@/hooks/use-performance-sponsor";
import { formatKRW } from "./performance-sponsor-types";

// ── 요약 통계 카드 ─────────────────────────────────────────

export function SponsorSummaryStats({ stats }: { stats: SponsorStats }) {
  return (
    <dl
      className="grid grid-cols-3 gap-2"
      aria-label="후원 요약 통계"
    >
      <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
        <dt className="text-[10px] text-muted-foreground">전체 스폰서</dt>
        <dd className="text-lg font-bold mt-0.5">{stats.totalSponsors}</dd>
        <span className="text-[10px] text-muted-foreground" aria-hidden="true">
          개사
        </span>
      </div>
      <div className="rounded-lg border bg-green-50 p-2.5 text-center">
        <dt className="text-[10px] text-green-600">확정 후원금</dt>
        <dd className="text-sm font-bold text-green-700 mt-0.5 tabular-nums">
          {formatKRW(stats.confirmedAmount)}
        </dd>
        <span className="text-[10px] text-green-600" aria-hidden="true">
          확정
        </span>
      </div>
      <div className="rounded-lg border bg-yellow-50 p-2.5 text-center">
        <dt className="text-[10px] text-yellow-600">보류 후원금</dt>
        <dd className="text-sm font-bold text-yellow-700 mt-0.5 tabular-nums">
          {formatKRW(stats.pendingAmount)}
        </dd>
        <span className="text-[10px] text-yellow-600" aria-hidden="true">
          협의 중
        </span>
      </div>
    </dl>
  );
}

// ── 목표 달성률 바 ─────────────────────────────────────────

export function GoalProgressBar({
  progress,
  confirmedAmount,
  totalGoal,
}: {
  progress: number | null;
  confirmedAmount: number;
  totalGoal: number | null;
}) {
  if (totalGoal == null) return null;
  const pct = progress ?? 0;

  return (
    <div className="space-y-1" role="group" aria-label="후원 목표 달성률">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Target className="h-3 w-3" aria-hidden="true" />
          후원 목표 달성률
        </span>
        <span className="font-semibold text-foreground" aria-live="polite">
          {pct}%
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`목표 달성률 ${pct}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100
                ? "#16a34a"
                : pct >= 60
                  ? "#2563eb"
                  : "#7c3aed",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>확정 {formatKRW(confirmedAmount)}</span>
        <span>목표 {formatKRW(totalGoal)}</span>
      </div>
    </div>
  );
}

// ── 등급별 후원금 분포 차트 ────────────────────────────────

export function TierDistributionChart({
  tierBreakdown,
}: {
  tierBreakdown: SponsorTierBreakdown[];
}) {
  const activeBreakdown = tierBreakdown.filter(
    (t) => t.confirmedAmount + t.pendingAmount > 0
  );
  if (activeBreakdown.length === 0) return null;

  const totalAmount = activeBreakdown.reduce(
    (acc, t) => acc + t.confirmedAmount + t.pendingAmount,
    0
  );

  return (
    <div
      className="space-y-2"
      role="group"
      aria-label="등급별 후원금 분포"
    >
      <p className="text-xs font-medium text-muted-foreground">
        등급별 후원금 분포
      </p>
      <ul role="list" className="space-y-2">
        {activeBreakdown.map((t) => {
          const total = t.confirmedAmount + t.pendingAmount;
          const pct =
            totalAmount > 0 ? Math.round((total / totalAmount) * 100) : 0;
          return (
            <li key={t.tier} className="space-y-0.5" role="listitem">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground text-[10px]">
                    ({t.count}개사)
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {formatKRW(total)} ({pct}%)
                </span>
              </div>
              <div
                className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t.label} 비중 ${pct}%`}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
