"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShieldCheck, Clock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { reviewExcuse } from "@/hooks/use-attendance-excuses";
import type { ExcuseStatus } from "@/types";

type AttendanceExcuseBadgeProps = {
  attendanceId: string;
  scheduleId: string;
  excuseStatus: ExcuseStatus;
  excuseReason: string | null;
  isLeader: boolean;
  onUpdated?: () => void;
};

const statusConfig: Record<
  ExcuseStatus,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  pending: {
    label: "면제 대기",
    icon: Clock,
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100",
  },
  approved: {
    label: "면제",
    icon: ShieldCheck,
    badgeClass:
      "bg-green-100 text-green-700 border-green-300 hover:bg-green-100",
  },
  rejected: {
    label: "면제 거절",
    icon: X,
    badgeClass: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
  },
};

export function AttendanceExcuseBadge({
  attendanceId,
  scheduleId,
  excuseStatus,
  excuseReason,
  isLeader,
  onUpdated,
}: AttendanceExcuseBadgeProps) {
  const [reviewing, setReviewing] = useState(false);
  const [open, setOpen] = useState(false);

  const config = statusConfig[excuseStatus];
  const Icon = config.icon;

  const handleReview = async (decision: "approved" | "rejected") => {
    setReviewing(true);
    const { error } = await reviewExcuse(scheduleId, attendanceId, decision);
    setReviewing(false);

    if (error) {
      toast.error(TOAST.ATTENDANCE.EXCUSE_BADGE_ERROR);
      return;
    }

    toast.success(decision === "approved" ? "면제를 승인했습니다" : "면제를 거절했습니다");
    setOpen(false);
    onUpdated?.();
  };

  // 리더가 아니면 단순 뱃지만 표시
  if (!isLeader) {
    return (
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${config.badgeClass}`}
      >
        <Icon className="h-2.5 w-2.5" />
        {config.label}
      </Badge>
    );
  }

  // 리더: 클릭 시 승인/거절 Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 cursor-pointer ${config.badgeClass}`}
          >
            <Icon className="h-2.5 w-2.5" />
            {config.label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2.5" side="left" align="start">
        <div className="space-y-1">
          <p className="text-xs font-medium">면제 신청 사유</p>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
            {excuseReason || "(사유 없음)"}
          </p>
        </div>

        {excuseStatus === "pending" && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1 gap-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleReview("approved")}
              disabled={reviewing}
            >
              <Check className="h-3 w-3" />
              승인
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs flex-1 gap-1"
              onClick={() => handleReview("rejected")}
              disabled={reviewing}
            >
              <X className="h-3 w-3" />
              거절
            </Button>
          </div>
        )}

        {excuseStatus === "approved" && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-green-700">승인된 면제입니다. 출석률 계산에서 제외됩니다.</p>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs w-full gap-1"
              onClick={() => handleReview("rejected")}
              disabled={reviewing}
            >
              <X className="h-3 w-3" />
              승인 취소 (거절로 변경)
            </Button>
          </div>
        )}

        {excuseStatus === "rejected" && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-red-600">거절된 면제입니다.</p>
            <Button
              size="sm"
              className="h-7 text-xs w-full gap-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleReview("approved")}
              disabled={reviewing}
            >
              <Check className="h-3 w-3" />
              거절 취소 (승인으로 변경)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
