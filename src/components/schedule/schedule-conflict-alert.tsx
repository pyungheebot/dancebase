"use client";

import { useState } from "react";
import { formatKo, formatTime } from "@/lib/date-utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScheduleConflictDetector } from "@/hooks/use-schedule-conflict-detector";
import type { ConflictType, ScheduleConflict } from "@/types";

// ============================================
// 충돌 유형 라벨 및 색상
// ============================================

const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  time_overlap: "시간 겹침",
  same_day: "같은 날",
  same_location: "장소 동일",
};

const CONFLICT_TYPE_CLASSES: Record<ConflictType, string> = {
  time_overlap: "bg-red-100 text-red-700 border-red-200",
  same_day: "bg-orange-100 text-orange-700 border-orange-200",
  same_location: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

// ============================================
// 보조 컴포넌트: 단일 일정 정보 표시
// ============================================

type ScheduleInfoProps = {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
};

function ScheduleInfo({ title, startsAt, endsAt, location }: ScheduleInfoProps) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-800 truncate">{title}</p>
      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
        <Clock className="h-3 w-3 shrink-0" />
        <span>
          {formatKo(new Date(startsAt), "M/d(EEE) HH:mm")}
          {" ~ "}
          {formatTime(new Date(endsAt))}
        </span>
      </div>
      {location && (
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// 보조 컴포넌트: 충돌 항목 카드
// ============================================

function ConflictItem({ conflict }: { conflict: ScheduleConflict }) {
  return (
    <div className="border border-gray-100 rounded-md p-2.5 space-y-2 bg-gray-50/50">
      {/* 충돌 유형 배지 */}
      <div className="flex flex-wrap gap-1">
        {conflict.conflictTypes.map((type) => (
          <span
            key={type}
            className={`inline-flex items-center text-[10px] px-1.5 py-0 rounded border font-medium ${CONFLICT_TYPE_CLASSES[type]}`}
          >
            {CONFLICT_TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      {/* 일정 A */}
      <ScheduleInfo
        title={conflict.scheduleA.title}
        startsAt={conflict.scheduleA.startsAt}
        endsAt={conflict.scheduleA.endsAt}
        location={conflict.scheduleA.location}
      />

      {/* 구분선 + vs */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 font-medium">vs</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 일정 B */}
      <ScheduleInfo
        title={conflict.scheduleB.title}
        startsAt={conflict.scheduleB.startsAt}
        endsAt={conflict.scheduleB.endsAt}
        location={conflict.scheduleB.location}
      />
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type ScheduleConflictAlertProps = {
  groupId: string;
};

export function ScheduleConflictAlert({ groupId }: ScheduleConflictAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { conflicts, loading } = useScheduleConflictDetector(groupId);

  const hasConflicts = conflicts.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-0 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-gray-800">
              일정 충돌 감지
            </CardTitle>
            {!loading && hasConflicts && (
              <Badge className="text-[10px] px-1.5 py-0 bg-red-500 hover:bg-red-500 text-white border-0">
                {conflicts.length}건
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "접기" : "펼치기"}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-2">
        {/* 요약 행: 항상 표시 */}
        {loading ? (
          <p className="text-xs text-gray-400">분석 중...</p>
        ) : !hasConflicts ? (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>충돌 없음</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              {conflicts.length}개의 충돌이 감지되었습니다
            </span>
          </div>
        )}

        {/* 충돌 목록: isOpen 일 때만 표시 */}
        {isOpen && hasConflicts && (
          <div className="mt-2.5 space-y-2">
            {conflicts.map((conflict) => (
              <ConflictItem key={conflict.id} conflict={conflict} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
