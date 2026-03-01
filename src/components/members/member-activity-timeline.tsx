"use client";

import { FileText, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { useMemberActivityTimeline } from "@/hooks/use-member-activity-timeline";
import type { ActivityType } from "@/hooks/use-member-activity-timeline";
import { formatRelative } from "@/lib/date-utils";

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
                    {formatRelative(item.occurredAt)}
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
