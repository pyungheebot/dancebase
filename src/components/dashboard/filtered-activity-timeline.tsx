"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  UserCheck,
  FileText,
  MessageSquare,
  CalendarCheck,
  UserPlus,
  Filter,
  Activity,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilteredActivityTimeline } from "@/hooks/use-filtered-activity-timeline";
import type {
  FilteredActivityType,
  FilteredActivityFilterType,
  FilteredActivityItem,
} from "@/types/index";

// ============================================
// 유형별 설정
// ============================================

type ActivityConfig = {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeClass: string;
  label: string;
};

const ACTIVITY_CONFIG: Record<FilteredActivityType, ActivityConfig> = {
  attendance: {
    icon: UserCheck,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    label: "출석",
  },
  post: {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    label: "게시글",
  },
  comment: {
    icon: MessageSquare,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    label: "댓글",
  },
  rsvp: {
    icon: CalendarCheck,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    label: "RSVP",
  },
  member_join: {
    icon: UserPlus,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
    label: "가입",
  },
};

// ============================================
// 필터 옵션
// ============================================

const FILTER_OPTIONS: { value: FilteredActivityFilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "attendance", label: "출석" },
  { value: "post", label: "게시글" },
  { value: "comment", label: "댓글" },
  { value: "rsvp", label: "RSVP" },
  { value: "member_join", label: "가입" },
];

// ============================================
// 날짜 구분선 레이블 (예: "2월 28일 금요일")
// ============================================

function formatDayLabel(isoString: string): string {
  try {
    return format(parseISO(isoString), "M월 d일 EEEE", { locale: ko });
  } catch {
    return isoString.slice(0, 10);
  }
}

// 시간 포맷 (예: "오후 3:30")
function formatTimeLabel(isoString: string): string {
  try {
    return format(parseISO(isoString), "a h:mm", { locale: ko });
  } catch {
    return "";
  }
}

// ============================================
// 날짜별 그룹화 유틸
// ============================================

function groupByDay(items: FilteredActivityItem[]): {
  dateKey: string;
  label: string;
  items: FilteredActivityItem[];
}[] {
  const map = new Map<string, FilteredActivityItem[]>();

  for (const item of items) {
    const key = item.occurredAt.slice(0, 10); // "YYYY-MM-DD"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([dateKey, dayItems]) => ({
      dateKey,
      label: formatDayLabel(dayItems[0].occurredAt),
      items: dayItems,
    }));
}

// ============================================
// Props
// ============================================

interface FilteredActivityTimelineProps {
  groupId: string;
}

// ============================================
// 컴포넌트
// ============================================

export function FilteredActivityTimeline({
  groupId,
}: FilteredActivityTimelineProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilteredActivityFilterType>("all");
  const [daysBack, setDaysBack] = useState(30);

  const { items, loading, filterByTypes, refetch } =
    useFilteredActivityTimeline(groupId, daysBack);

  // 필터 적용
  const filtered =
    filter === "all"
      ? items
      : filterByTypes([filter as FilteredActivityType]);

  // 날짜별 그룹화
  const dayGroups = groupByDay(filtered);

  // 더 보기 (30일씩 확장)
  function handleLoadMore() {
    setDaysBack((prev) => prev + 30);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Filter className="h-3 w-3" />
          활동 타임라인
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* 헤더 */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            활동 타임라인
          </SheetTitle>
        </SheetHeader>

        {/* 필터 토글 */}
        <div className="px-4 py-2 border-b shrink-0">
          <div className="flex flex-wrap gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={[
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  filter === opt.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-28" />
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="flex gap-3 pl-2">
                      <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-2.5 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-xs">
                최근 {daysBack}일간 활동이 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dayGroups.map((group) => (
                <div key={group.dateKey}>
                  {/* 날짜 구분선 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {group.label}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* 해당 날짜 활동 목록 */}
                  <div className="relative">
                    {/* 세로 타임라인 라인 */}
                    <div className="absolute left-3 top-0 bottom-0 border-l-2 border-muted" />

                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const config = ACTIVITY_CONFIG[item.type];
                        const Icon = config.icon;

                        return (
                          <div
                            key={item.id}
                            className="flex gap-3 relative"
                          >
                            {/* 아이콘 원 */}
                            <div
                              className={[
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
                                config.iconBg,
                              ].join(" ")}
                            >
                              <Icon
                                className={[
                                  "h-3 w-3",
                                  config.iconColor,
                                ].join(" ")}
                              />
                            </div>

                            {/* 내용 */}
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={[
                                    "text-[10px] px-1.5 py-0 border",
                                    config.badgeClass,
                                  ].join(" ")}
                                >
                                  {config.label}
                                </Badge>
                                <span className="text-xs font-medium truncate max-w-[120px]">
                                  {item.userName}
                                </span>
                              </div>
                              <p className="text-xs text-foreground mt-0.5 truncate">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatTimeLabel(item.occurredAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* 더 보기 버튼 */}
              <div className="pt-2 pb-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {daysBack}일 이전 더 보기
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 요약 */}
        {!loading && items.length > 0 && (
          <div className="px-4 py-2 border-t shrink-0">
            <p className="text-[10px] text-muted-foreground">
              최근 {daysBack}일 활동 {filtered.length}건
              {filter !== "all" &&
                ` (필터: ${ACTIVITY_CONFIG[filter as FilteredActivityType]?.label ?? filter})`}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
