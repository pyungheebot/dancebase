"use client";

import { useGroupHealth } from "@/hooks/use-group-health";

interface GroupHealthCardProps {
  groupId: string;
}

type HealthLevel = "good" | "normal" | "warning";

function getHealthLevel(score: number | null): HealthLevel {
  if (score === null) return "normal";
  if (score >= 80) return "good";
  if (score >= 60) return "normal";
  return "warning";
}

const HEALTH_LEVEL_CONFIG: Record<
  HealthLevel,
  { label: string; color: string; trackColor: string; textColor: string; bg: string }
> = {
  good: {
    label: "좋음",
    color: "#22c55e",      // green-500
    trackColor: "#dcfce7", // green-100
    textColor: "text-green-600",
    bg: "bg-green-50",
  },
  normal: {
    label: "보통",
    color: "#eab308",       // yellow-500
    trackColor: "#fef9c3",  // yellow-100
    textColor: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  warning: {
    label: "주의",
    color: "#ef4444",      // red-500
    trackColor: "#fee2e2", // red-100
    textColor: "text-red-600",
    bg: "bg-red-50",
  },
};

/** 게이지 바 (세부 항목용) */
function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const pct = value !== null ? Math.round(value * 100) : null;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-medium tabular-nums">
          {pct !== null ? `${pct}%` : "-"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        {pct !== null && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        )}
      </div>
    </div>
  );
}

/** SVG 반원 게이지 */
function SemiCircleGauge({
  score,
  color,
  trackColor,
}: {
  score: number | null;
  color: string;
  trackColor: string;
}) {
  const radius = 28;
  const cx = 36;
  const cy = 36;
  // 반원: 180도 (왼쪽 끝 → 오른쪽 끝)
  const circumference = Math.PI * radius; // 반원 둘레
  const pct = score !== null ? score / 100 : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <svg width="72" height="42" viewBox="0 0 72 42" fill="none">
      {/* 배경 트랙 */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        stroke={trackColor}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* 진행 바 */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        fill="none"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function GroupHealthCard({ groupId }: GroupHealthCardProps) {
  const { health, loading } = useGroupHealth(groupId);

  const level = getHealthLevel(health.score);
  const config = HEALTH_LEVEL_CONFIG[level];

  return (
    <div className="rounded border bg-card px-3 py-2.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground font-medium">그룹 건강도</span>
        {!loading && health.hasEnoughData && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.bg} ${config.textColor}`}
          >
            {config.label}
          </span>
        )}
      </div>

      {/* 로딩 */}
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <span className="text-muted-foreground text-sm">-</span>
        </div>
      ) : !health.hasEnoughData ? (
        <div className="flex items-center justify-center h-16">
          <span className="text-muted-foreground text-xs">데이터 부족</span>
        </div>
      ) : (
        <>
          {/* 반원 게이지 + 점수 */}
          <div className="flex flex-col items-center mb-2">
            <div className="relative">
              <SemiCircleGauge
                score={health.score}
                color={config.color}
                trackColor={config.trackColor}
              />
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                <span
                  className={`text-base font-bold tabular-nums leading-none ${config.textColor}`}
                >
                  {health.score !== null ? health.score : "-"}
                </span>
                <span className="text-[9px] text-muted-foreground leading-none mt-0.5">/ 100</span>
              </div>
            </div>
          </div>

          {/* 세부 항목 바 */}
          <div className="flex flex-col gap-1.5">
            <MetricBar
              label="출석률"
              value={health.attendanceRate}
              color={config.color}
            />
            <MetricBar
              label="활동도"
              value={health.activityRate}
              color={config.color}
            />
            <MetricBar
              label="멤버 유지율"
              value={health.retentionRate}
              color={config.color}
            />
          </div>
        </>
      )}
    </div>
  );
}
