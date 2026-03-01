"use client";

import { useState, useMemo } from "react";
import { formatShortDateTime } from "@/lib/date-utils";
import { useAuth } from "@/hooks/use-auth";
import { CalendarCheck, Clock, MapPin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { invalidateBulkRsvp } from "@/lib/swr/invalidate";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { Schedule, ScheduleRsvpResponse } from "@/types";

type BulkRsvpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  schedules: Schedule[];
};

const RESPONSE_LABELS: Record<ScheduleRsvpResponse, string> = {
  going: "참석",
  not_going: "불참",
  maybe: "미정",
};

const RESPONSE_BADGE_CLASSES: Record<ScheduleRsvpResponse, string> = {
  going: "bg-green-100 text-green-700 border-green-200",
  not_going: "bg-red-100 text-red-700 border-red-200",
  maybe: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export function BulkRsvpDialog({
  open,
  onOpenChange,
  groupId,
  schedules,
}: BulkRsvpDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [response, setResponse] = useState<ScheduleRsvpResponse>("going");
  const { pending: submitting, execute } = useAsyncAction();
  const { user } = useAuth();

  // 오늘 이후의 일정만 필터링, 날짜순 정렬
  const upcomingSchedules = useMemo(
    () =>
      schedules
        .filter((s) => new Date(s.starts_at) >= new Date())
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        ),
    [schedules]
  );

  const toggleAll = () => {
    if (selectedIds.size === upcomingSchedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(upcomingSchedules.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("일정을 하나 이상 선택해주세요");
      return;
    }

    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    const supabase = createClient();

    await execute(async () => {
      const now = new Date().toISOString();
      const upsertRows = Array.from(selectedIds).map((scheduleId) => ({
        schedule_id: scheduleId,
        user_id: user.id,
        response,
        updated_at: now,
      }));

      const { error } = await supabase
        .from("schedule_rsvp")
        .upsert(upsertRows, { onConflict: "schedule_id,user_id" });

      if (error) {
        toast.error("일괄 RSVP 응답에 실패했습니다");
        throw error;
      }

      // SWR 무효화
      invalidateBulkRsvp(groupId, Array.from(selectedIds));

      toast.success(
        `${selectedIds.size}개 일정에 "${RESPONSE_LABELS[response]}"으로 응답했습니다`
      );

      // 초기화 후 닫기
      setSelectedIds(new Set());
      setResponse("going");
      onOpenChange(false);
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedIds(new Set());
      setResponse("going");
    }
    onOpenChange(v);
  };

  const allSelected =
    upcomingSchedules.length > 0 &&
    selectedIds.size === upcomingSchedules.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < upcomingSchedules.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4" />
            일괄 RSVP
          </DialogTitle>
          <DialogDescription className="text-xs">
            여러 일정에 대해 한 번에 참석 여부를 응답합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 참석 여부 선택 */}
          <div className="space-y-2">
            <p className="text-xs font-medium">참석 여부</p>
            <RadioGroup
              value={response}
              onValueChange={(v) => setResponse(v as ScheduleRsvpResponse)}
              className="flex gap-4"
            >
              {(
                Object.entries(RESPONSE_LABELS) as [
                  ScheduleRsvpResponse,
                  string,
                ][]
              ).map(([value, label]) => (
                <div key={value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={value} id={`rsvp-${value}`} />
                  <Label htmlFor={`rsvp-${value}`} className="text-xs cursor-pointer">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        response === value
                          ? RESPONSE_BADGE_CLASSES[value]
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </Badge>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 일정 목록 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">일정 선택</p>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor="select-all"
                  className="text-[11px] text-muted-foreground cursor-pointer"
                >
                  전체 선택 ({selectedIds.size}/{upcomingSchedules.length})
                </Label>
              </div>
            </div>

            {upcomingSchedules.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-4 text-center">
                예정된 일정이 없습니다
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-1 pr-1">
                  {upcomingSchedules.map((schedule) => {
                    const isSelected = selectedIds.has(schedule.id);
                    return (
                      <div
                        key={schedule.id}
                        className={`flex items-start gap-2.5 rounded-md border px-2.5 py-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-muted/60 border-primary/30"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() => toggleOne(schedule.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(schedule.id)}
                          className="h-3.5 w-3.5 mt-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {schedule.title}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {formatShortDateTime(new Date(schedule.starts_at))}
                            </span>
                            {schedule.location && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">
                                  {schedule.location}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting || selectedIds.size === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <CalendarCheck className="h-3 w-3 mr-1" />
                {selectedIds.size > 0
                  ? `${selectedIds.size}개 일정에 ${RESPONSE_LABELS[response]} 응답`
                  : "일정을 선택하세요"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
