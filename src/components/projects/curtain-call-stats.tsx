"use client";

// ============================================================
// 커튼콜 요약 통계
// ============================================================

interface CurtainCallStatsProps {
  totalPlans: number;
  totalSteps: number;
}

export function CurtainCallStats({ totalPlans, totalSteps }: CurtainCallStatsProps) {
  if (totalPlans === 0) return null;

  return (
    <dl
      className="mt-1.5 flex gap-3 flex-wrap"
      aria-label="커튼콜 통계"
    >
      <div className="flex gap-1">
        <dt className="text-[10px] text-muted-foreground">플랜</dt>
        <dd className="text-[10px]">
          <span className="font-semibold text-foreground">{totalPlans}</span>
          <span className="text-muted-foreground">개</span>
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className="text-[10px] text-muted-foreground">총 스텝</dt>
        <dd className="text-[10px]">
          <span className="font-semibold text-foreground">{totalSteps}</span>
          <span className="text-muted-foreground">개</span>
        </dd>
      </div>
    </dl>
  );
}
