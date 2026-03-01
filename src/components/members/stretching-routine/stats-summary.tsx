"use client";

interface StatsSummaryProps {
  totalRoutines: number;
  totalLogs: number;
  averageFlexibility: number;
}

export function StatsSummary({
  totalRoutines,
  totalLogs,
  averageFlexibility,
}: StatsSummaryProps) {
  return (
    <dl className="grid grid-cols-3 gap-2" aria-label="스트레칭 통계 요약">
      <div className="rounded-lg bg-teal-50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">총 루틴</dt>
        <dd className="text-sm font-bold text-teal-600">{totalRoutines}개</dd>
      </div>
      <div className="rounded-lg bg-violet-50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">총 기록</dt>
        <dd className="text-sm font-bold text-violet-600">{totalLogs}회</dd>
      </div>
      <div className="rounded-lg bg-amber-50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">평균 유연성</dt>
        <dd className="text-sm font-bold text-amber-600">
          {averageFlexibility > 0 ? `${averageFlexibility}/5` : "-"}
        </dd>
      </div>
    </dl>
  );
}
