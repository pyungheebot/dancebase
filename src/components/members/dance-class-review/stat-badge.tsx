"use client";

// ============================================================
// 통계 배지 컴포넌트
// ============================================================

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}

export function StatBadge({ icon, label, value, colorClass }: StatBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${colorClass}`}
      role="meter"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center gap-1" aria-hidden="true">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold" aria-hidden="true">{value}</span>
    </div>
  );
}
