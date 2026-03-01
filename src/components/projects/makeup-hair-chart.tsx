"use client";

// ============================================================
// DonutChart - 재사용 가능한 CSS conic-gradient 도넛 차트
// ============================================================

export interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  total: number;
}

export function DonutChart({ data, total }: DonutChartProps) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-muted">
        <span className="text-[10px] text-muted-foreground">없음</span>
      </div>
    );
  }

  const segments = data
    .filter((d) => d.value > 0)
    .reduce<{ label: string; value: number; color: string; pct: number; start: number }[]>(
      (acc, d) => {
        const pct = (d.value / total) * 100;
        const start = acc.length > 0 ? acc[acc.length - 1].start + acc[acc.length - 1].pct : 0;
        acc.push({ ...d, pct, start });
        return acc;
      },
      []
    );

  const gradient = segments
    .map((s) => `${s.color} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(", ");

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <div
        className="w-20 h-20 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
          <span className="text-[10px] font-semibold text-foreground">{total}</span>
        </div>
      </div>
    </div>
  );
}
