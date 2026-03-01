"use client";

import { useState } from "react";
import { formatRelative } from "@/lib/date-utils";
import {
  Activity,
  FileText,
  MessageSquare,
  CalendarCheck,
  UserPlus,
  Calendar,
  Wallet,
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
import { useGroupActivity } from "@/hooks/use-group-activity";
import type { ActivityType } from "@/types/index";

// ============================================
// 타입별 아이콘 / 색상 / 레이블 설정
// ============================================

type ActivityConfig = {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeClass: string;
  label: string;
};

const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  post: {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    label: "글",
  },
  comment: {
    icon: MessageSquare,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    label: "댓글",
  },
  rsvp: {
    icon: CalendarCheck,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    label: "RSVP",
  },
  member_join: {
    icon: UserPlus,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "멤버",
  },
  schedule_create: {
    icon: Calendar,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
    label: "일정",
  },
  finance: {
    icon: Wallet,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    label: "회비",
  },
};

// 필터 버튼 목록
type FilterType = ActivityType | "all";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "post", label: "글" },
  { value: "comment", label: "댓글" },
  { value: "rsvp", label: "RSVP" },
  { value: "member_join", label: "멤버" },
  { value: "schedule_create", label: "일정" },
  { value: "finance", label: "회비" },
];

// ============================================
// Props
// ============================================

interface GroupActivityFeedProps {
  groupId: string;
}

// ============================================
// 컴포넌트
// ============================================

export function GroupActivityFeed({ groupId }: GroupActivityFeedProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const { activities, loading } = useGroupActivity(groupId);

  const filtered =
    filter === "all" ? activities : activities.filter((a) => a.type === filter);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Activity className="h-3 w-3" />
          활동
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            그룹 활동 타임라인
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
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-2.5 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-xs">최근 활동이 없습니다</p>
            </div>
          ) : (
            <div className="relative">
              {/* 세로 타임라인 라인 */}
              <div className="absolute left-3 top-0 bottom-0 border-l-2 border-muted" />

              <div className="space-y-4">
                {filtered.map((item) => {
                  const config = ACTIVITY_CONFIG[item.type];
                  const Icon = config.icon;

                  return (
                    <div key={item.id} className="flex gap-3 relative">
                      {/* 아이콘 원 */}
                      <div
                        className={[
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
                          config.iconBg,
                        ].join(" ")}
                      >
                        <Icon className={["h-3 w-3", config.iconColor].join(" ")} />
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
                          {formatRelative(new Date(item.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 하단 요약 */}
        {!loading && activities.length > 0 && (
          <div className="px-4 py-2 border-t shrink-0">
            <p className="text-[10px] text-muted-foreground">
              최근 활동 {activities.length}건
              {filter !== "all" && ` (필터: ${ACTIVITY_CONFIG[filter as ActivityType]?.label ?? filter})`}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
