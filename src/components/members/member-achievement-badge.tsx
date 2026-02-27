"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAttendanceAchievements } from "@/hooks/use-attendance-achievements";

type MemberAchievementBadgeProps = {
  groupId: string;
  userId: string;
  /** 표시할 최대 배지 수 (기본값: 3) */
  maxVisible?: number;
};

/**
 * 멤버 카드용 작은 출석 달성 배지 이모지 목록.
 *
 * - 달성한 배지만 이모지로 나열합니다 (최대 maxVisible개).
 * - 각 이모지에 호버 시 Tooltip으로 배지명을 표시합니다.
 * - 달성한 배지가 없으면 렌더링하지 않습니다.
 */
export function MemberAchievementBadge({
  groupId,
  userId,
  maxVisible = 3,
}: MemberAchievementBadgeProps) {
  const { achievements, loading } = useAttendanceAchievements(groupId, userId);

  if (loading) return null;

  const achievedBadges = achievements.filter((a) => a.achieved);

  if (achievedBadges.length === 0) return null;

  const visible = achievedBadges.slice(0, maxVisible);
  const remaining = achievedBadges.length - visible.length;

  return (
    <span className="flex items-center gap-0.5">
      {visible.map((badge) => (
        <Tooltip key={badge.id}>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center cursor-default text-sm leading-none"
              aria-label={badge.label}
            >
              {badge.emoji}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-medium">{badge.label}</p>
            <p className="text-muted-foreground">{badge.description}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      {remaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center cursor-default text-[10px] text-muted-foreground font-medium leading-none px-0.5">
              +{remaining}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="text-muted-foreground">배지 {remaining}개 더 보기</p>
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
