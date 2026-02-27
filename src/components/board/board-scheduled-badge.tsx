"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
    ? `${format(scheduledDate, "M/d HH:mm", { locale: ko })} 발행됨`
    : `예약됨 · ${format(scheduledDate, "M/d HH:mm", { locale: ko })} 발행`;

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
      aria-label={isReleased ? `${format(scheduledDate, "M월 d일 HH시 mm분", { locale: ko })}에 발행됨` : `${format(scheduledDate, "M월 d일 HH시 mm분", { locale: ko })}에 예약 발행`}
    >
      <CalendarClock className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}
