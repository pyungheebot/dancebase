"use client";

import { Crown } from "lucide-react";
import {
  SKILL_CERT_LEVEL_LABELS,
  SKILL_CERT_LEVEL_ORDER,
  SKILL_CERT_LEVEL_COLORS,
} from "@/hooks/use-skill-certification";
import type { SkillCertStatsProps } from "./skill-certification-types";

// ============================================================
// 레벨별 수여 통계 카드
// ============================================================

export function SkillCertStats({ stats }: SkillCertStatsProps) {
  if (stats.totalAwards === 0 && stats.totalCerts === 0) return null;

  const totalAwards = stats.totalAwards;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      role="list"
      aria-label="레벨별 인증 수여 현황"
    >
      {SKILL_CERT_LEVEL_ORDER.map((level) => {
        const count = stats.levelDistribution[level];
        const colors = SKILL_CERT_LEVEL_COLORS[level];
        const percentage = totalAwards > 0 ? Math.round((count / totalAwards) * 100) : 0;

        return (
          <div
            key={level}
            role="listitem"
            className="rounded-md border bg-muted/20 px-2.5 py-2 text-center"
          >
            <p className={`text-xs font-semibold ${colors.text}`}>
              {SKILL_CERT_LEVEL_LABELS[level]}
            </p>
            <p className="text-lg font-bold" aria-label={`${SKILL_CERT_LEVEL_LABELS[level]} ${count}건 수여`}>
              {count}
            </p>
            {/* 진행률 바 */}
            <div
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${SKILL_CERT_LEVEL_LABELS[level]} 비율 ${percentage}%`}
              className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">수여</p>
          </div>
        );
      })}

      {stats.topCertHolder && (
        <div
          role="listitem"
          className="rounded-md border bg-yellow-50 px-2.5 py-2 text-center col-span-2 sm:col-span-1"
          aria-label={`최다 인증 보유자: ${stats.topCertHolder.memberName}, ${stats.topCertHolder.count}개`}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Crown className="h-3 w-3 text-yellow-600" aria-hidden="true" />
            <p className="text-xs font-semibold text-yellow-700">최다 보유</p>
          </div>
          <p className="text-sm font-bold truncate">{stats.topCertHolder.memberName}</p>
          <p className="text-[10px] text-muted-foreground">
            {stats.topCertHolder.count}개
          </p>
        </div>
      )}
    </div>
  );
}
