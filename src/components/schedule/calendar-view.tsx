"use client";

import { useCallback, useMemo } from "react";
import { formatYearMonth, formatKo, formatTime } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, Clock, MapPin, RefreshCw } from "lucide-react";
import { ScheduleForm } from "./schedule-form";
import { CalendarGrid } from "./calendar-grid";
import { ScheduleDetailPanel } from "./schedule-detail-panel";
import { RecurrenceEditDialog, RecurrenceDeleteDialog } from "./recurrence-dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useCalendarState } from "@/hooks/use-calendar-state";
import { useSwipe } from "@/hooks/use-swipe";
import { detectConflicts } from "@/lib/schedule-conflict";
import { schedulesToIcs, downloadIcs } from "@/lib/ics";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { Schedule } from "@/types";

type CalendarViewProps = {
  schedules: Schedule[];
  onSelectSchedule?: (schedule: Schedule) => void;
  canEdit?: boolean;
  onScheduleUpdated?: () => void;
  attendancePath?: string;
  /** 출석 예측 Badge 표시를 위한 그룹 ID */
  groupId?: string;
  /** 역할 배정 섹션 표시 여부 (그룹 ID 겸용) */
  canEditRoles?: boolean;
};

export function CalendarView({
  schedules,
  onSelectSchedule,
  canEdit,
  onScheduleUpdated,
  attendancePath,
  groupId,
  canEditRoles,
}: CalendarViewProps) {
  const {
    state,
    dispatch,
    singleDeleteDialog,
    handleEditClick,
    handleRecurrenceEditSelect,
    handleDeleteConfirm,
    handleSingleDeleteConfirm,
    handleDetailEditClick,
    handleDetailDeleteClick,
    handleEditCreated,
  } = useCalendarState({ onScheduleUpdated });

  const {
    currentMonth,
    editSchedule,
    editScope,
    detailSchedule,
    overflowDay,
    recurrenceEditDialogOpen,
    recurrenceDeleteDialogOpen,
    deleteLoading,
    pendingDeleteSchedule,
  } = state;

  // 좌/우 스와이프로 월 변경
  const handleSwipe = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (direction === "left") dispatch({ type: "NEXT_MONTH" });
      if (direction === "right") dispatch({ type: "PREV_MONTH" });
    },
    [dispatch]
  );
  const swipeHandlers = useSwipe({ onSwipe: handleSwipe, threshold: 50 });

  // 충돌하는 일정 ID 집합 계산 (양방향 충돌 감지)
  const conflictingIds = useMemo(() => {
    const ids = new Set<string>();
    schedules.forEach((s) => {
      const conflicts = detectConflicts(
        { starts_at: s.starts_at, ends_at: s.ends_at },
        schedules,
        s.id
      );
      if (conflicts.length > 0) ids.add(s.id);
    });
    return ids;
  }, [schedules]);

  return (
    <div className="space-y-3">
      {/* 월 네비게이션 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">{formatYearMonth(currentMonth)}</h3>
        <div className="flex gap-0.5">
          {schedules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1"
              onClick={() => {
                const icsContent = schedulesToIcs(schedules);
                downloadIcs(icsContent, "DanceBase_일정.ics");
                toast.success(TOAST.SCHEDULE.EXPORTED);
              }}
            >
              <Download className="h-3 w-3" />
              전체 내보내기
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => dispatch({ type: "PREV_MONTH" })}
            aria-label="이전 달"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => dispatch({ type: "TODAY" })}
            aria-label="오늘로 이동"
          >
            오늘
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => dispatch({ type: "NEXT_MONTH" })}
            aria-label="다음 달"
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 월간 그리드 + 다가오는 일정 리스트 */}
      <CalendarGrid
        currentMonth={currentMonth}
        schedules={schedules}
        conflictingIds={conflictingIds}
        groupId={groupId}
        canEdit={canEdit}
        swipeHandlers={swipeHandlers}
        onOpenDetail={(schedule) => dispatch({ type: "OPEN_DETAIL", schedule })}
        onOpenOverflow={(day) => dispatch({ type: "OPEN_OVERFLOW", day })}
        onEditClick={handleEditClick}
        onSelectSchedule={onSelectSchedule}
      />

      {/* 수정 폼 (단일 or 시리즈) */}
      {editSchedule && canEdit && (
        <ScheduleForm
          mode="edit"
          groupId={editSchedule.group_id}
          schedule={editSchedule}
          editScope={editScope ?? "this"}
          hideDeleteButton={!!editSchedule.recurrence_id}
          open={!!editSchedule}
          onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_EDIT" }); }}
          onCreated={handleEditCreated}
          existingSchedules={schedules}
        />
      )}

      {/* 반복 일정 수정 범위 선택 다이얼로그 */}
      <RecurrenceEditDialog
        open={recurrenceEditDialogOpen}
        onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_RECURRENCE_EDIT" }); }}
        onSelect={handleRecurrenceEditSelect}
      />

      {/* 단일 일정 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={singleDeleteDialog.open}
        onCancel={singleDeleteDialog.cancel}
        onConfirm={handleSingleDeleteConfirm}
        title="일정 삭제"
        itemLabel={singleDeleteDialog.targetLabel}
        loading={deleteLoading}
      />

      {/* 반복 일정 삭제 범위 선택 다이얼로그 */}
      <RecurrenceDeleteDialog
        open={recurrenceDeleteDialogOpen}
        onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_RECURRENCE_DELETE" }); }}
        onSelect={(scope) => {
          if (pendingDeleteSchedule) handleDeleteConfirm(pendingDeleteSchedule, scope);
        }}
        loading={deleteLoading}
      />

      {/* 일정 상세 다이얼로그 */}
      <Dialog
        open={!!detailSchedule}
        onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_DETAIL" }); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              {detailSchedule?.title}
              {detailSchedule?.recurrence_id && (
                <RefreshCw className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              )}
            </DialogTitle>
          </DialogHeader>
          {detailSchedule && (
            <ScheduleDetailPanel
              schedule={detailSchedule}
              canEdit={canEdit}
              canEditRoles={canEditRoles}
              groupId={groupId}
              attendancePath={attendancePath}
              deleteLoading={deleteLoading}
              onEditClick={handleDetailEditClick}
              onDeleteClick={handleDetailDeleteClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 날짜별 일정 더보기 모달 */}
      <Dialog
        open={!!overflowDay}
        onOpenChange={(open) => { if (!open) dispatch({ type: "CLOSE_OVERFLOW" }); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {overflowDay && formatKo(overflowDay, "M월 d일 (EEE) 일정")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            {overflowDay &&
              schedules
                .filter((s) => {
                  const d = new Date(s.starts_at);
                  return (
                    d.getFullYear() === overflowDay.getFullYear() &&
                    d.getMonth() === overflowDay.getMonth() &&
                    d.getDate() === overflowDay.getDate()
                  );
                })
                .map((schedule) => (
                  <button
                    key={schedule.id}
                    className="w-full text-left rounded border px-2.5 py-1.5 hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      dispatch({ type: "CLOSE_OVERFLOW" });
                      dispatch({ type: "OPEN_DETAIL", schedule });
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium">{schedule.title}</p>
                      {schedule.recurrence_id && (
                        <RefreshCw className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(new Date(schedule.starts_at))}
                      </span>
                      {schedule.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {schedule.location}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
