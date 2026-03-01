"use client";

import { formatKo } from "@/lib/date-utils";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BoardScheduledBadgeProps {
  /** 예약 발행 시각 (ISO 문자열). null이면 컴포넌트를 렌더링하지 않음 */
  publishedAt: string | null;
  /** 작성자 또는 관리자 여부 — true일 때만 뱃지 표시 */
  isAuthorOrAdmin?: boolean;
  className?: string;
}

/**
 * 예약 발행 상태를 나타내는 뱃지.
 * - 발행 전: 노란색 (pending)
 * - 발행 후: 회색 (released)
 * 작성자/관리자에게만 노출.
 */
export function BoardScheduledBadge({
  publishedAt,
  isAuthorOrAdmin = false,
  className,
}: BoardScheduledBadgeProps) {
  if (!publishedAt || !isAuthorOrAdmin) return null;

  const now = new Date();
  const scheduledDate = new Date(publishedAt);
  const isReleased = scheduledDate <= now;

  const label = isReleased
    ? `${formatKo(scheduledDate, "M/d HH:mm")} 발행됨`
    : `예약됨 · ${formatKo(scheduledDate, "M/d HH:mm")} 발행`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 gap-0.5 font-normal shrink-0",
        isReleased
          ? "border-muted-foreground/30 text-muted-foreground bg-muted/40"
          : "border-yellow-400 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950/40",
        className,
      )}
      aria-label={isReleased ? `${formatKo(scheduledDate, "M월 d일 HH시 mm분")}에 발행됨` : `${formatKo(scheduledDate, "M월 d일 HH시 mm분")}에 예약 발행`}
    >
      <CalendarClock className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}
