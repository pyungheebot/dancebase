"use client";

// ============================================
// dance-networking/networking-stats-bar.tsx
// 역할별 통계 배지 바
// ============================================

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, ROLE_COLOR } from "@/hooks/use-dance-networking";
import type { DanceNetworkingRole } from "@/types";

type NetworkingStatsBarProps = {
  roleCount: Partial<Record<DanceNetworkingRole, number>>;
  activeRole: DanceNetworkingRole | "all";
  onRoleClick: (role: DanceNetworkingRole) => void;
};

export const NetworkingStatsBar = memo(function NetworkingStatsBar({
  roleCount,
  activeRole,
  onRoleClick,
}: NetworkingStatsBarProps) {
  const entries = Object.entries(roleCount) as [DanceNetworkingRole, number][];
  if (entries.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label="역할별 연락처 수 (클릭하여 필터)"
    >
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([role, count]) => (
          <Badge
            key={role}
            className={cn(
              "text-[10px] px-1.5 py-0 border-0 cursor-pointer transition-shadow",
              activeRole === role ? "ring-1 ring-offset-1 ring-current" : "",
              ROLE_COLOR[role]
            )}
            onClick={() => onRoleClick(role)}
            role="button"
            tabIndex={0}
            aria-pressed={activeRole === role}
            aria-label={`${ROLE_LABEL[role]} ${count}명${activeRole === role ? " (현재 필터 중)" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRoleClick(role);
              }
            }}
          >
            {ROLE_LABEL[role]} {count}
          </Badge>
        ))}
    </div>
  );
});
