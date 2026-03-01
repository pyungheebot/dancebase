"use client";

// ============================================================
// 안전 점검 통계 요약 컴포넌트
// ============================================================

interface SafetyStatsProps {
  totalInspections: number;
  passRate: number;
  pendingItems: number;
}

export function SafetyStats({
  totalInspections,
  passRate,
  pendingItems,
}: SafetyStatsProps) {
  if (totalInspections === 0) return null;

  const barColor =
    passRate >= 80 ? "#22c55e" : passRate >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="space-y-3">
      {/* 3열 요약 수치 */}
      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-muted/50 p-2 text-center">
          <dd className="text-lg font-bold text-foreground">
            {totalInspections}
          </dd>
          <dt className="text-[10px] text-muted-foreground">총 점검</dt>
        </div>
        <div className="rounded-md bg-green-50 p-2 text-center">
          <dd className="text-lg font-bold text-green-600">
            <span
              role="meter"
              aria-valuenow={passRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`통과율 ${passRate}%`}
            >
              {passRate}%
            </span>
          </dd>
          <dt className="text-[10px] text-muted-foreground">통과율</dt>
        </div>
        <div className="rounded-md bg-yellow-50 p-2 text-center">
          <dd className="text-lg font-bold text-yellow-600">{pendingItems}</dd>
          <dt className="text-[10px] text-muted-foreground">보류 항목</dt>
        </div>
      </dl>

      {/* 전체 통과율 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span id="overall-pass-rate-label">전체 통과율</span>
          <span className="font-medium text-foreground">{passRate}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={passRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="overall-pass-rate-label"
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${passRate}%`,
              backgroundColor: barColor,
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
