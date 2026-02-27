"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemberBadges } from "@/hooks/use-member-badges";

type MemberBadgeIconsProps = {
  groupId: string;
  userId: string;
  joinedAt: string | null | undefined;
  role: string;
};

/**
 * 멤버의 성과 뱃지 아이콘들을 Tooltip과 함께 표시하는 컴포넌트.
 *
 * 멤버 이름 옆에 작은 아이콘으로 배치됩니다.
 */
export function MemberBadgeIcons({
  groupId,
  userId,
  joinedAt,
  role,
}: MemberBadgeIconsProps) {
  const { badges, loading } = useMemberBadges(groupId, userId, joinedAt, role);

  if (loading || badges.length === 0) return null;

  return (
    <span className="flex items-center gap-0.5">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center cursor-default">
                <Icon className={`h-3 w-3 ${badge.colorClass}`} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-medium">{badge.label}</p>
              <p className="text-muted-foreground">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </span>
  );
}
