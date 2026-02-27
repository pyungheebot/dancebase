"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  MessageSquare,
  Trophy,
  Flame,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { usePersonalGrowthTimeline } from "@/hooks/use-personal-growth-timeline";
import type { GrowthEventType, GrowthTimelineEvent } from "@/types";

// ============================================================
// 이벤트 유형별 아이콘, 색상, 레이블
// ============================================================

const EVENT_CONFIG: Record<
  GrowthEventType,
  {
    icon: React.ReactNode;
    dotClass: string;
    badgeClass: string;
    label: string;
  }
> = {
  first_attendance: {
    icon: <Star className="h-3.5 w-3.5" />,
    dotClass: "bg-green-500 ring-green-100",
    badgeClass: "bg-green-100 text-green-700",
    label: "첫 출석",
  },
  attendance_milestone: {
    icon: <Trophy className="h-3.5 w-3.5" />,
    dotClass: "bg-yellow-500 ring-yellow-100",
    badgeClass: "bg-yellow-100 text-yellow-700",
    label: "마일스톤",
  },
  post: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    dotClass: "bg-blue-500 ring-blue-100",
    badgeClass: "bg-blue-100 text-blue-700",
    label: "게시글",
  },
  streak: {
    icon: <Flame className="h-3.5 w-3.5" />,
    dotClass: "bg-orange-500 ring-orange-100",
    badgeClass: "bg-orange-100 text-orange-700",
    label: "연속 출석",
  },
};

// ============================================================
// 날짜 포맷 유틸리티
// ============================================================

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// ============================================================
// 단일 타임라인 이벤트 아이템
// ============================================================

function TimelineItem({
  event,
  isLast,
}: {
  event: GrowthTimelineEvent;
  isLast: boolean;
}) {
  const config = EVENT_CONFIG[event.type];

  return (
    <div className="relative flex gap-3">
      {/* 세로 선 */}
      {!isLast && (
        <div
          className="absolute left-3.5 top-7 w-px bg-border"
          style={{ bottom: "-8px" }}
          aria-hidden="true"
        />
      )}

      {/* 타임라인 점 (아이콘) */}
      <div
        className={`relative z-10 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ring-4 text-white ${config.dotClass}`}
      >
        {config.icon}
      </div>

      {/* 이벤트 내용 */}
      <div className="flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-sm font-medium leading-tight">{event.title}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 font-normal ${config.badgeClass}`}
          >
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {event.description}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <Calendar className="h-3 w-3" />
          {formatDate(event.date)}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 스켈레톤 로딩 상태
// ============================================================

function TimelineSkeleton() {
  return (
    <div className="space-y-4 pt-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-7 w-7 rounded-full flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-1.5 pb-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

const INITIAL_SHOW_COUNT = 5;

interface PersonalGrowthTimelineCardProps {
  groupId: string;
  userId: string;
}

export function PersonalGrowthTimelineCard({
  groupId,
  userId,
}: PersonalGrowthTimelineCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const { events, loading } = usePersonalGrowthTimeline(groupId, userId);

  const visibleEvents = showAll ? events : events.slice(0, INITIAL_SHOW_COUNT);
  const hasMore = events.length > INITIAL_SHOW_COUNT;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              개인 성장 포트폴리오
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          {!loading && events.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              총 {events.length}개의 성장 기록
            </p>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-1 pb-4">
            {loading ? (
              <TimelineSkeleton />
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  아직 성장 기록이 없습니다.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  출석하고 게시글을 작성하면 타임라인이 쌓입니다.
                </p>
              </div>
            ) : (
              <div className="pt-2">
                {/* 타임라인 목록 */}
                <div>
                  {visibleEvents.map((event, index) => (
                    <TimelineItem
                      key={event.id}
                      event={event}
                      isLast={index === visibleEvents.length - 1}
                    />
                  ))}
                </div>

                {/* 더보기 / 접기 버튼 */}
                {hasMore && (
                  <div className="mt-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowAll((prev) => !prev)}
                    >
                      {showAll ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          접기
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          {events.length - INITIAL_SHOW_COUNT}개 더 보기
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
