"use client";

import { memo } from "react";
import { formatKo, formatTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Pencil, Trash2, CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AttendancePredictionCard } from "./attendance-prediction-card";
import { ScheduleWeatherBadge } from "./schedule-weather-badge";
import { ScheduleRetroSheet } from "./schedule-retro-sheet";
import { ScheduleLocationShare } from "./schedule-location-share";
import { ScheduleCarpoolSection } from "./schedule-carpool-section";
import { ScheduleBroadcastDialog } from "./schedule-broadcast-dialog";
import { SmartReminderDialog } from "./smart-reminder-dialog";
import { ScheduleDdayTimeline } from "./schedule-dday-timeline";
import { ScheduleRolesSection } from "./schedule-roles-section";
import { RsvpSectionWithWaitlist } from "./rsvp-section";
import { ScheduleCostSummaryWithRsvp } from "./schedule-badge";
import { MirrorModeDialog } from "@/components/shared/mirror-mode-dialog";
import { MapEmbed } from "@/components/shared/map-embed";
import { ShareButton } from "@/components/shared/share-button";
import { scheduleToIcs, downloadIcs, buildGoogleCalendarUrl } from "@/lib/ics";
import type { Schedule } from "@/types";

type ScheduleDetailPanelProps = {
  // 상세 표시할 일정
  schedule: Schedule;
  // 편집 권한 여부
  canEdit?: boolean;
  // 역할 편집 권한 여부
  canEditRoles?: boolean;
  // 그룹 ID (출석 예측, 방송, 스마트 알림용)
  groupId?: string;
  // 출석 관리 페이지 경로
  attendancePath?: string;
  // 삭제 로딩 중 여부
  deleteLoading?: boolean;
  // 수정 버튼 클릭 핸들러
  onEditClick: (schedule: Schedule) => void;
  // 삭제 버튼 클릭 핸들러
  onDeleteClick: (schedule: Schedule) => void;
};

// 일정 상세 다이얼로그 내부 콘텐츠 패널
export const ScheduleDetailPanel = memo(function ScheduleDetailPanel({
  schedule,
  canEdit,
  canEditRoles,
  groupId,
  attendancePath,
  deleteLoading,
  onEditClick,
  onDeleteClick,
}: ScheduleDetailPanelProps) {
  // 실제 편집 권한 (canEditRoles 우선, 없으면 canEdit)
  const effectiveCanEdit = canEditRoles ?? canEdit ?? false;

  return (
    <div className="space-y-3">
      {/* 기본 정보 (날짜, 장소, 날씨, 설명) */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>
            {formatKo(new Date(schedule.starts_at), "yyyy년 M월 d일 (EEE) HH:mm")}
            {" ~ "}
            {formatTime(new Date(schedule.ends_at))}
          </span>
        </div>
        {schedule.location && (
          <>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{schedule.location}</span>
            </div>
            <MapEmbed
              location={schedule.location}
              address={schedule.address}
              latitude={schedule.latitude}
              longitude={schedule.longitude}
              height={160}
              showExternalLinks={false}
            />
          </>
        )}
        {/* 날씨 예보 배지 */}
        <ScheduleWeatherBadge schedule={schedule} />
        {schedule.description && (
          <p className="text-xs whitespace-pre-wrap pt-1">{schedule.description}</p>
        )}
      </div>

      {/* RSVP + 대기 명단 섹션 */}
      <div className="border-t pt-3">
        <RsvpSectionWithWaitlist schedule={schedule} />
      </div>

      {/* 출석 예측 섹션 */}
      {groupId && (
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">출석 예측</p>
          <AttendancePredictionCard
            groupId={groupId}
            scheduleId={schedule.id}
          />
        </div>
      )}

      {/* 역할 배정 섹션 */}
      {groupId && (
        <div className="border-t pt-3">
          <ScheduleRolesSection
            scheduleId={schedule.id}
            groupId={groupId}
            canEdit={effectiveCanEdit}
          />
        </div>
      )}

      {/* 회고록 섹션 */}
      <div className="border-t pt-3">
        <ScheduleRetroSheet
          scheduleId={schedule.id}
          canEdit={effectiveCanEdit}
        />
      </div>

      {/* 카풀 섹션 */}
      <div className="border-t pt-3">
        <ScheduleCarpoolSection scheduleId={schedule.id} />
      </div>

      {/* D-Day 준비 타임라인 섹션 */}
      <div className="border-t pt-3">
        <ScheduleDdayTimeline
          scheduleId={schedule.id}
          scheduleStartsAt={schedule.starts_at}
          canEdit={effectiveCanEdit}
        />
      </div>

      {/* 비용 정산 섹션 */}
      <div className="border-t pt-3">
        <ScheduleCostSummaryWithRsvp
          scheduleId={schedule.id}
          canEdit={effectiveCanEdit}
        />
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex gap-2 flex-wrap">
        {canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={deleteLoading}
              onClick={() => onEditClick(schedule)}
              aria-label={`${schedule.title} 일정 수정`}
            >
              <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              disabled={deleteLoading}
              onClick={() => onDeleteClick(schedule)}
              aria-label={`${schedule.title} 일정 삭제`}
            >
              <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
              삭제
            </Button>
          </>
        )}
        {attendancePath && (
          <Button asChild size="sm" className="h-7 text-xs">
            <Link href={`${attendancePath}?schedule=${schedule.id}`}>
              출석 관리
            </Link>
          </Button>
        )}
        {schedule.location && (
          <ScheduleLocationShare
            scheduleTitle={schedule.title}
            location={schedule.location}
            address={schedule.address}
            latitude={schedule.latitude}
            longitude={schedule.longitude}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <CalendarPlus className="h-3 w-3 mr-1" />
              캘린더에 추가
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <a
                href={buildGoogleCalendarUrl(schedule)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google 캘린더에 추가 (새 탭에서 열림)"
              >
                <Calendar className="h-3.5 w-3.5 mr-2" />
                Google 캘린더
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const icsContent = scheduleToIcs(schedule);
                downloadIcs(icsContent, `${schedule.title}.ics`);
                toast.success(TOAST.SCHEDULE.ICS_DOWNLOADED);
              }}
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              ICS 파일 다운로드
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ShareButton
          title={schedule.title}
          text={`${formatKo(new Date(schedule.starts_at), "M월 d일 (EEE) HH:mm")}${schedule.location ? ` | ${schedule.location}` : ""}`}
        />
        {groupId && canEdit && (
          <ScheduleBroadcastDialog
            schedule={schedule}
            groupId={groupId}
            canBroadcast={true}
          />
        )}
        {groupId && canEdit && (
          <SmartReminderDialog
            schedule={schedule}
            groupId={groupId}
          />
        )}
        <MirrorModeDialog />
      </div>
    </div>
  );
});
