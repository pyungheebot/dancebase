"use client";

import { FileText, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { useMemberActivityTimeline } from "@/hooks/use-member-activity-timeline";
import type { ActivityType } from "@/hooks/use-member-activity-timeline";

// 활동 타입별 아이콘 및 색상
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; colorClass: string }
> = {
  post: {
    icon: FileText,
    colorClass: "text-blue-500",
  },
  comment: {
    icon: MessageSquare,
    colorClass: "text-green-500",
  },
  attendance: {
    icon: CheckCircle,
    colorClass: "text-orange-500",
  },
};

// 상대 시간 포맷
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}

interface MemberActivityTimelineProps {
  userId: string;
}

export function MemberActivityTimeline({ userId }: MemberActivityTimelineProps) {
  const { activities, loading } = useMemberActivityTimeline(userId, true);

  return (
    <div className="px-3 pt-2 pb-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        최근 활동
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          최근 활동이 없습니다
        </p>
      ) : (
        <ul className="space-y-1.5">
          {activities.map((item) => {
            const config = ACTIVITY_CONFIG[item.type];
            const Icon = config.icon;
            return (
              <li key={item.id} className="flex items-start gap-1.5 min-w-0">
                <Icon
                  className={`h-3 w-3 mt-0.5 shrink-0 ${config.colorClass}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-tight truncate">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {formatRelativeTime(item.occurredAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
