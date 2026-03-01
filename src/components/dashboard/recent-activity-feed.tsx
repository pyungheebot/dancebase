"use client";

import Link from "next/link";
import { FileText, MessageSquare, Calendar } from "lucide-react";
import { formatRelative } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivityFeed } from "@/hooks/use-recent-activity-feed";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActivityFeedItem, ActivityFeedItemType } from "@/types";

// ─── 아이콘 매핑 ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<ActivityFeedItemType, React.ElementType> = {
  post: FileText,
  comment: MessageSquare,
  schedule: Calendar,
};

const ICON_COLOR_MAP: Record<ActivityFeedItemType, string> = {
  post: "text-blue-500",
  comment: "text-green-500",
  schedule: "text-orange-500",
};

// ─── 아이템 링크 생성 ──────────────────────────────────────────────────────────

function buildHref(item: ActivityFeedItem): string {
  if (item.type === "post" && item.postId) {
    return `/groups/${item.groupId}/board/${item.postId}`;
  }
  if (item.type === "comment" && item.postId) {
    return `/groups/${item.groupId}/board/${item.postId}`;
  }
  if (item.type === "schedule") {
    return `/groups/${item.groupId}/schedules`;
  }
  return `/groups/${item.groupId}`;
}

// ─── 개별 항목 ────────────────────────────────────────────────────────────────

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const Icon = ICON_MAP[item.type];
  const iconColor = ICON_COLOR_MAP[item.type];
  const href = buildHref(item);
  const timeAgo = formatRelative(new Date(item.createdAt));

  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-2.5 rounded-md hover:bg-accent transition-colors px-1 py-1"
      >
        <span className={`shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug line-clamp-2">{item.title}</p>
          {item.description && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
        </div>
      </Link>
    </li>
  );
}

// ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────────

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3 py-1" aria-label="최근 활동 불러오는 중" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

type RecentActivityFeedProps = {
  groupIds: string[];
  limit?: number;
};

export function RecentActivityFeed({ groupIds, limit = 20 }: RecentActivityFeedProps) {
  const { items, loading } = useRecentActivityFeed(groupIds, limit);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <FileText className="h-4 w-4" aria-hidden="true" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent aria-live="polite" aria-atomic="false">
        {loading ? (
          <ActivityFeedSkeleton />
        ) : items.length === 0 ? (
          <EmptyState icon={FileText} title="최근 활동이 없습니다" />
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
