"use client";

import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAttendancePrediction } from "@/hooks/use-attendance-prediction";

type AttendancePredictionCardProps = {
  groupId: string;
  scheduleId: string;
  /** compact 모드: Badge만 표시 (일정 목록용) */
  compact?: boolean;
};

/** show rate에 따른 색상 클래스 반환 */
function getShowRateColor(showRate: number): {
  badge: string;
  text: string;
} {
  if (showRate >= 0.8) {
    return {
      badge: "bg-green-100 text-green-700 border-green-200",
      text: "text-green-600",
    };
  }
  if (showRate >= 0.6) {
    return {
      badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
      text: "text-yellow-600",
    };
  }
  return {
    badge: "bg-red-100 text-red-700 border-red-200",
    text: "text-red-600",
  };
}

/**
 * 출석 예측 Badge (compact 모드)
 * 일정 목록의 각 항목 옆에 배치합니다.
 */
export function AttendancePredictionBadge({
  groupId,
  scheduleId,
}: {
  groupId: string;
  scheduleId: string;
}) {
  const { prediction, loading } = useAttendancePrediction(groupId, scheduleId);

  if (loading || !prediction || !prediction.hasData) return null;

  const colors = getShowRateColor(prediction.showRate);

  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 shrink-0 ${colors.badge}`}
      title={`RSVP 참석 ${prediction.rsvpYesCount}명 중 예상 출석 ${prediction.predictedAttendance}명 (과거 show rate ${Math.round(prediction.showRate * 100)}%)`}
    >
      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
      {prediction.predictedAttendance}명
    </Badge>
  );
}

/**
 * 출석 예측 카드 (full 모드)
 * 일정 상세 모달 내에 배치합니다.
 */
export function AttendancePredictionCard({
  groupId,
  scheduleId,
  compact = false,
}: AttendancePredictionCardProps) {
  const { prediction, loading } = useAttendancePrediction(groupId, scheduleId);

  if (compact) {
    return (
      <AttendancePredictionBadge groupId={groupId} scheduleId={scheduleId} />
    );
  }

  if (loading) {
    return (
      <div className="h-8 bg-muted animate-pulse rounded" />
    );
  }

  if (!prediction || !prediction.hasData) {
    return (
      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        RSVP 데이터가 부족해 예측이 어렵습니다
      </div>
    );
  }

  const colors = getShowRateColor(prediction.showRate);
  const showRatePercent = Math.round(prediction.showRate * 100);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        RSVP 참석 {prediction.rsvpYesCount}명
        <span className="text-muted-foreground/50">→</span>
        예상 출석
      </span>
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 ${colors.badge}`}
      >
        {prediction.predictedAttendance}명
      </Badge>
      <span className={`text-[10px] ${colors.text}`}>
        (과거 출석률 {showRatePercent}%)
      </span>
    </div>
  );
}
