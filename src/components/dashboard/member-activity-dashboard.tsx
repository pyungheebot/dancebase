"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  UserCheck,
  FileText,
  MessageSquare,
  CalendarCheck,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMemberDashboardActivity } from "@/hooks/use-member-dashboard-activity";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { MemberActivityType } from "@/types";

// 활동 유형별 아이콘 및 색상
const ACTIVITY_CONFIG: Record<
  MemberActivityType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  attendance: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    label: "출석",
    color: "text-green-600",
  },
  post: {
    icon: <FileText className="h-3.5 w-3.5" />,
    label: "게시글",
    color: "text-blue-600",
  },
  comment: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    label: "댓글",
    color: "text-purple-600",
  },
  rsvp: {
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    label: "RSVP",
    color: "text-orange-500",
  },
};

function SummaryBadge({
  type,
  count,
}: {
  type: MemberActivityType;
  count: number;
}) {
  const config = ACTIVITY_CONFIG[type];
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/40 px-3 py-2 min-w-[60px]">
      <span className={`${config.color}`}>{config.icon}</span>
      <span className="text-base font-bold tabular-nums leading-none">
        {count}
      </span>
      <span className="text-[10px] text-muted-foreground">{config.label}</span>
    </div>
  );
}

function TimelineItem({
  type,
  description,
  occurredAt,
}: {
  type: MemberActivityType;
  description: string;
  occurredAt: string;
}) {
  const config = ACTIVITY_CONFIG[type];
  const timeAgo = formatDistanceToNow(new Date(occurredAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0">
      <span
        className={`mt-0.5 flex-shrink-0 rounded-full bg-muted p-1 ${config.color}`}
      >
        {config.icon}
      </span>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs leading-snug text-foreground line-clamp-2">
          {description}
        </p>
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 px-3 py-2 min-w-[60px]"
          >
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-5 w-6" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-2.5 py-1">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberActivityDashboard() {
  const { data, loading } = useMemberDashboardActivity();
  const [isOpen, setIsOpen] = useState(true);

  const hasActivity =
    data &&
    (data.summary.attendanceCount > 0 ||
      data.summary.postCount > 0 ||
      data.summary.commentCount > 0 ||
      data.summary.rsvpCount > 0);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full" asChild>
            <button
              type="button"
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
            >
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  최근 7일 내 활동
                </span>
                <span className="text-muted-foreground">
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </CardTitle>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent aria-live="polite" aria-atomic="false">
            {loading ? (
              <LoadingSkeleton />
            ) : !hasActivity ? (
              <p className="text-xs text-muted-foreground py-2">
                최근 7일간 활동 내역이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {/* 요약 통계 */}
                <div className="flex gap-2 flex-wrap">
                  <SummaryBadge
                    type="attendance"
                    count={data.summary.attendanceCount}
                  />
                  <SummaryBadge
                    type="post"
                    count={data.summary.postCount}
                  />
                  <SummaryBadge
                    type="comment"
                    count={data.summary.commentCount}
                  />
                  <SummaryBadge
                    type="rsvp"
                    count={data.summary.rsvpCount}
                  />
                </div>

                {/* 타임라인 */}
                <div className="pt-1">
                  {data.timeline.map((item) => (
                    <TimelineItem
                      key={item.id}
                      type={item.type}
                      description={item.description}
                      occurredAt={item.occurredAt}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
