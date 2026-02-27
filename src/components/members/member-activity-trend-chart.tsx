"use client";

import { useState } from "react";
import { useMemberActivityTrend } from "@/hooks/use-member-activity-trend";
import type { MemberActivityTrendPoint } from "@/hooks/use-member-activity-trend";

type Props = {
  groupId: string;
  userId: string;
  weeks?: number;
};

type TooltipState = {
  point: MemberActivityTrendPoint;
  x: number;
  y: number;
} | null;

const SERIES = [
  { key: "posts" as const, label: "게시글", color: "bg-blue-500", dotColor: "bg-blue-500", textColor: "text-blue-600" },
  { key: "comments" as const, label: "댓글", color: "bg-indigo-500", dotColor: "bg-indigo-500", textColor: "text-indigo-600" },
  { key: "attendances" as const, label: "출석", color: "bg-green-500", dotColor: "bg-green-500", textColor: "text-green-600" },
];

/** 차트 영역 높이(px) */
const CHART_HEIGHT = 80;

export function MemberActivityTrendChart({ groupId, userId, weeks = 8 }: Props) {
  const { trend, loading } = useMemberActivityTrend(groupId, userId, weeks);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  // 전체 max 값 (Y축 스케일 기준)
  const maxValue = Math.max(
    1,
    ...trend.flatMap((p) => [p.posts, p.comments, p.attendances])
  );

  const hasAnyData = trend.some(
    (p) => p.posts > 0 || p.comments > 0 || p.attendances > 0
  );

  if (!hasAnyData) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        활동 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 범례 */}
      <div className="flex items-center gap-3">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-sm ${s.dotColor}`} />
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* 차트 본체 */}
      <div className="relative select-none">
        {/* 바 영역 */}
        <div
          className="relative flex items-end gap-0"
          style={{ height: `${CHART_HEIGHT}px` }}
          onMouseLeave={() => setTooltip(null)}
        >
          {trend.map((point, wi) => (
            <div
              key={point.week}
              className="flex-1 flex items-end justify-center gap-px px-0.5 h-full cursor-pointer group"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ point, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {SERIES.map((s) => {
                const value = point[s.key];
                const heightPct = value === 0 ? 0 : Math.max(4, (value / maxValue) * 100);
                return (
                  <div
                    key={s.key}
                    className={`
                      flex-1 rounded-t transition-all duration-150
                      ${s.color}
                      ${value === 0 ? "opacity-10" : "opacity-80 group-hover:opacity-100"}
                    `}
                    style={{ height: `${heightPct}%`, minWidth: "3px" }}
                    title={`${s.label}: ${value}`}
                  />
                );
              })}
              {/* 이번주 강조 표시 */}
              {wi === trend.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none" />
              )}
            </div>
          ))}
        </div>

        {/* X축 레이블 */}
        <div className="flex mt-1">
          {trend.map((point, wi) => (
            <div key={point.week} className="flex-1 text-center">
              <span
                className={`text-[9px] leading-tight ${
                  wi === trend.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip (hover 시) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-popover border rounded-md shadow-md px-2.5 py-1.5 text-xs min-w-[100px]">
            <p className="font-medium text-foreground mb-1">{tooltip.point.label}</p>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-sm ${s.dotColor}`} />
                  <span className="text-muted-foreground">{s.label}</span>
                </div>
                <span className={`font-medium ${s.textColor}`}>
                  {tooltip.point[s.key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
