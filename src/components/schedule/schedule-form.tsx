"use client";

import { useState, useEffect, useMemo } from "react";
import { eachDayOfInterval, getDay, getDate, format, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";
import { ScheduleFormFields, type ScheduleFieldValues } from "./schedule-form-fields";
import type { ScheduleFormFieldErrors } from "./schedule-form-fields";
import type { Schedule } from "@/types";
import {
  validateRequired,
  validateDateRange,
  validateTimeRange,
} from "@/lib/validation";

type RecurrenceType = "daily" | "weekly" | "monthly";

const WEEKDAYS = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" },
];

const DEFAULT_FIELDS: ScheduleFieldValues = {
  title: "",
  description: "",
  location: "",
  address: "",
  latitude: null,
  longitude: null,
  attendanceMethod: "admin",
  lateThresholdTime: "",
  attendanceDeadlineTime: "",
  requireCheckout: false,
  startTime: "",
  endTime: "",
};

function toLocalDate(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}

function toLocalTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

/**
 * 날짜 문자열(yyyy-MM-dd)과 시간 문자열(HH:mm)을 조합하여 ISO 8601 문자열로 변환합니다.
 * 브라우저 로컬 타임존 offset을 명시적으로 붙여 서버/클라이언트 타임존 불일치 문제를 방지합니다.
 * 예) "2026-02-27" + "14:30" + KST → "2026-02-27T14:30:00+09:00" → UTC 변환 시 "2026-02-27T05:30:00.000Z"
 */
function toISOWithLocalOffset(dateStr: string, timeStr: string): string {
  const offsetMs = new Date().getTimezoneOffset() * -1 * 60 * 1000;
  const absMin = Math.abs(new Date().getTimezoneOffset());
  const sign = offsetMs >= 0 ? "+" : "-";
  const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
  const mm = String(absMin % 60).padStart(2, "0");
  return new Date(`${dateStr}T${timeStr}:00${sign}${hh}:${mm}`).toISOString();
}

type RecurrenceScope = "this" | "this_and_future" | "all";

type ScheduleFormProps = {
  groupId: string;
  projectId?: string | null;
  onCreated: () => void;
  mode?: "create" | "edit";
  schedule?: Schedule;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // 반복 일정 수정 범위 (edit 모드에서만 사용)
  editScope?: RecurrenceScope;
  // 폼 내부 삭제 버튼 숨기기 (외부에서 삭제 처리할 때)
  hideDeleteButton?: boolean;
  // 템플릿에서 불러온 초기값
  prefill?: Partial<{
    title: string;
    description: string;
    location: string;
  }> | null;
};

export function ScheduleForm({
  groupId,
  projectId,
  onCreated,
  mode = "create",
  schedule,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  editScope = "this",
  hideDeleteButton = false,
  prefill,
}: ScheduleFormProps) {
  const isEdit = mode === "edit";

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ScheduleFieldValues>(DEFAULT_FIELDS);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const supabase = createClient();

  // Create mode: recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Create mode: prefill from template
  useEffect(() => {
    if (open && !isEdit && prefill) {
      setFields((prev) => ({
        ...prev,
        title: prefill.title ?? prev.title,
        description: prefill.description ?? prev.description,
        location: prefill.location ?? prev.location,
      }));
    }
  }, [open, isEdit, prefill]);

  // Edit mode: initialize from schedule
  useEffect(() => {
    if (open && isEdit && schedule) {
      setFields({
        title: schedule.title,
        description: schedule.description || "",
        location: schedule.location || "",
        address: schedule.address || "",
        latitude: schedule.latitude,
        longitude: schedule.longitude,
        attendanceMethod: schedule.attendance_method,
        lateThresholdTime: schedule.late_threshold ? toLocalTime(schedule.late_threshold) : "",
        attendanceDeadlineTime: schedule.attendance_deadline ? toLocalTime(schedule.attendance_deadline) : "",
        requireCheckout: schedule.require_checkout,
        startTime: toLocalTime(schedule.starts_at),
        endTime: toLocalTime(schedule.ends_at),
      });
      setDate(toLocalDate(schedule.starts_at));
      setError(null);
    }
  }, [open, isEdit, schedule]);

  const recurringDates = useMemo(() => {
    if (!isRecurring || !startDate || !endDate) return [];
    const start = parse(startDate, "yyyy-MM-dd", new Date());
    const end = parse(endDate, "yyyy-MM-dd", new Date());
    if (start > end) return [];

    const allDays = eachDayOfInterval({ start, end });

    switch (recurrenceType) {
      case "daily":
        return allDays;
      case "weekly":
        return allDays.filter((d) => selectedWeekdays.includes(getDay(d)));
      case "monthly":
        return allDays.filter((d) => getDate(d) === monthDay);
      default:
        return [];
    }
  }, [isRecurring, startDate, endDate, recurrenceType, selectedWeekdays, monthDay]);

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setFields(DEFAULT_FIELDS);
    setDate("");
    setIsRecurring(false);
    setRecurrenceType("weekly");
    setSelectedWeekdays([]);
    setMonthDay(1);
    setStartDate("");
    setEndDate("");
    setError(null);
    setTitleError(null);
    setTimeError(null);
    setDateRangeError(null);
  };

  const validateScheduleForm = (): boolean => {
    const newTitleError = validateRequired(fields.title, "제목");
    const newTimeError = validateTimeRange(fields.startTime, fields.endTime);
    const newDateRangeError = isRecurring ? validateDateRange(startDate, endDate) : null;
    setTitleError(newTitleError);
    setTimeError(newTimeError);
    setDateRangeError(newDateRangeError);
    return !newTitleError && !newTimeError && !newDateRangeError;
  };

  const isScheduleFormValid =
    !validateRequired(fields.title, "제목") &&
    !validateTimeRange(fields.startTime, fields.endTime) &&
    !(isRecurring ? validateDateRange(startDate, endDate) : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;
    setError(null);
    setLoading(true);

    try {
      if (fields.attendanceMethod === "location" && (fields.latitude == null || fields.longitude == null)) {
        setError("위치 기반 출석을 사용하려면 주소를 검색해주세요.");
        setLoading(false);
        return;
      }

      if (isEdit && schedule) {
        if (editScope === "this" || !schedule.recurrence_id) {
          // 이 일정만 수정 (단일 update)
          const { error } = await supabase
            .from("schedules")
            .update({
              title: fields.title,
              description: fields.description || null,
              location: fields.location || null,
              address: fields.address || null,
              latitude: fields.latitude,
              longitude: fields.longitude,
              attendance_method: fields.attendanceMethod,
              starts_at: toISOWithLocalOffset(date, fields.startTime),
              ends_at: toISOWithLocalOffset(date, fields.endTime),
              late_threshold: fields.lateThresholdTime ? toISOWithLocalOffset(date, fields.lateThresholdTime) : null,
              attendance_deadline: fields.attendanceDeadlineTime ? toISOWithLocalOffset(date, fields.attendanceDeadlineTime) : null,
              require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
            })
            .eq("id", schedule.id);

          if (error) throw error;
        } else if (editScope === "this_and_future") {
          // 이후 모든 일정 수정: 시간/장소/설명만 일괄 update (날짜는 유지)
          // starts_at, ends_at의 날짜 부분은 유지하고 시간만 변경
          // 각 행별로 날짜를 추출해서 새 시간으로 교체
          const { data: targets, error: fetchError } = await supabase
            .from("schedules")
            .select("id, starts_at, ends_at, late_threshold, attendance_deadline")
            .eq("recurrence_id", schedule.recurrence_id)
            .gte("starts_at", schedule.starts_at);
          if (fetchError) throw fetchError;

          for (const target of targets ?? []) {
            const targetDate = format(new Date(target.starts_at), "yyyy-MM-dd");
            const { error: updateError } = await supabase
              .from("schedules")
              .update({
                title: fields.title,
                description: fields.description || null,
                location: fields.location || null,
                address: fields.address || null,
                latitude: fields.latitude,
                longitude: fields.longitude,
                attendance_method: fields.attendanceMethod,
                starts_at: toISOWithLocalOffset(targetDate, fields.startTime),
                ends_at: toISOWithLocalOffset(targetDate, fields.endTime),
                late_threshold: fields.lateThresholdTime ? toISOWithLocalOffset(targetDate, fields.lateThresholdTime) : null,
                attendance_deadline: fields.attendanceDeadlineTime ? toISOWithLocalOffset(targetDate, fields.attendanceDeadlineTime) : null,
                require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
              })
              .eq("id", target.id);
            if (updateError) throw updateError;
          }
        } else {
          // 전체 시리즈 수정: 시간/장소/설명만 일괄 update (날짜는 유지)
          const { data: targets, error: fetchError } = await supabase
            .from("schedules")
            .select("id, starts_at")
            .eq("recurrence_id", schedule.recurrence_id);
          if (fetchError) throw fetchError;

          for (const target of targets ?? []) {
            const targetDate = format(new Date(target.starts_at), "yyyy-MM-dd");
            const { error: updateError } = await supabase
              .from("schedules")
              .update({
                title: fields.title,
                description: fields.description || null,
                location: fields.location || null,
                address: fields.address || null,
                latitude: fields.latitude,
                longitude: fields.longitude,
                attendance_method: fields.attendanceMethod,
                starts_at: toISOWithLocalOffset(targetDate, fields.startTime),
                ends_at: toISOWithLocalOffset(targetDate, fields.endTime),
                late_threshold: fields.lateThresholdTime ? toISOWithLocalOffset(targetDate, fields.lateThresholdTime) : null,
                attendance_deadline: fields.attendanceDeadlineTime ? toISOWithLocalOffset(targetDate, fields.attendanceDeadlineTime) : null,
                require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
              })
              .eq("id", target.id);
            if (updateError) throw updateError;
          }
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const common = {
          group_id: groupId,
          project_id: projectId || null,
          title: fields.title,
          description: fields.description || null,
          location: fields.location || null,
          address: fields.address || null,
          latitude: fields.latitude,
          longitude: fields.longitude,
          attendance_method: fields.attendanceMethod,
          created_by: user.id,
        };

        const buildRow = (dateStr: string) => ({
          ...common,
          starts_at: toISOWithLocalOffset(dateStr, fields.startTime),
          ends_at: toISOWithLocalOffset(dateStr, fields.endTime),
          late_threshold: fields.lateThresholdTime ? toISOWithLocalOffset(dateStr, fields.lateThresholdTime) : null,
          attendance_deadline: fields.attendanceDeadlineTime ? toISOWithLocalOffset(dateStr, fields.attendanceDeadlineTime) : null,
          require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
        });

        if (isRecurring) {
          if (recurringDates.length === 0) {
            setError("생성할 일정이 없습니다. 반복 설정을 확인해주세요.");
            setLoading(false);
            return;
          }

          // 같은 시리즈 전체에 동일한 recurrence_id 부여
          const seriesId = crypto.randomUUID();
          const rows = recurringDates.map((d) => ({
            ...buildRow(format(d, "yyyy-MM-dd")),
            recurrence_id: seriesId,
          }));
          const { error } = await supabase.from("schedules").insert(rows);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("schedules").insert({
            ...buildRow(date),
            recurrence_id: null,
          });
          if (error) throw error;
        }
      }

      setOpen(false);
      if (!isEdit) resetForm();
      onCreated();
    } catch {
      setError(isEdit ? "일정 수정에 실패했습니다" : "일정 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      await supabase.from("attendance").delete().eq("schedule_id", schedule.id);
      const { error } = await supabase.from("schedules").delete().eq("id", schedule.id);
      if (error) throw error;
      setOpen(false);
      onCreated();
    } catch {
      setError("일정 삭제에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const dateSection = isEdit ? (
    <div className="space-y-1">
      <Label htmlFor="edit-date" className="text-xs">날짜</Label>
      <Input
        id="edit-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
    </div>
  ) : (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recurring"
          checked={isRecurring}
          onCheckedChange={(checked) => setIsRecurring(checked === true)}
        />
        <Label htmlFor="recurring" className="font-normal cursor-pointer">
          반복 일정
        </Label>
      </div>

      {isRecurring ? (
        <>
          <div className="space-y-1">
            <Label className="text-xs">반복 유형</Label>
            <Select
              value={recurrenceType}
              onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">매일</SelectItem>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="monthly">매월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceType === "weekly" && (
            <div className="space-y-1">
              <Label className="text-xs">요일 선택</Label>
              <div className="flex gap-1">
                {WEEKDAYS.map((wd) => (
                  <button
                    key={wd.value}
                    type="button"
                    onClick={() => toggleWeekday(wd.value)}
                    className={`w-7 h-7 rounded text-xs font-medium border transition-colors ${
                      selectedWeekdays.includes(wd.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-input"
                    }`}
                  >
                    {wd.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType === "monthly" && (
            <div className="space-y-1">
              <Label htmlFor="monthDay" className="text-xs">매월 반복일</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">매월</span>
                <Input
                  id="monthDay"
                  type="number"
                  min={1}
                  max={31}
                  value={monthDay}
                  onChange={(e) => setMonthDay(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">일</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs">
                  시작일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangeError(validateDateRange(e.target.value, endDate));
                  }}
                  required
                  className={dateRangeError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs">
                  종료일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangeError(validateDateRange(startDate, e.target.value));
                  }}
                  required
                  className={dateRangeError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs">날짜</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      )}
    </>
  );

  const editScopeLabel: Record<RecurrenceScope, string> = {
    this: "이 일정만",
    this_and_future: "이후 모든 일정",
    all: "전체 시리즈",
  };

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "일정 수정" : "새 일정 등록"}
          {isEdit && schedule?.recurrence_id && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({editScopeLabel[editScope]})
            </span>
          )}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ScheduleFormFields
          values={fields}
          onChange={(partial) => {
            setFields((prev) => ({ ...prev, ...partial }));
            // 시간 변경 시 실시간 재검증
            if ("startTime" in partial || "endTime" in partial) {
              const newStart = "startTime" in partial ? (partial.startTime ?? fields.startTime) : fields.startTime;
              const newEnd = "endTime" in partial ? (partial.endTime ?? fields.endTime) : fields.endTime;
              setTimeError(validateTimeRange(newStart, newEnd));
            }
            // 제목 변경 시 실시간 재검증
            if ("title" in partial) {
              setTitleError(validateRequired(partial.title ?? "", "제목"));
            }
          }}
          dateSection={dateSection}
          prefix={isEdit ? "edit" : ""}
          errors={{
            title: titleError ?? undefined,
            timeRange: timeError ?? undefined,
          } satisfies ScheduleFormFieldErrors}
          onBlurTitle={() => setTitleError(validateRequired(fields.title, "제목"))}
          onBlurTime={() => setTimeError(validateTimeRange(fields.startTime, fields.endTime))}
        />

        {dateRangeError && isRecurring && (
          <p className="text-xs text-destructive">{dateRangeError}</p>
        )}

        {!isEdit && isRecurring && recurringDates.length > 0 && (
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{recurringDates.length}개</span>의 일정이 등록됩니다
            <span className="block text-xs mt-1">
              {format(recurringDates[0], "M/d(EEE)", { locale: ko })} ~ {format(recurringDates[recurringDates.length - 1], "M/d(EEE)", { locale: ko })}
            </span>
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isEdit ? (
          <div className="flex gap-2">
            {!hideDeleteButton && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm" className="h-8 text-sm" disabled={loading}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>일정 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      이 일정과 관련된 출석 기록이 모두 삭제됩니다. 정말 삭제하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" className="flex-1 h-8 text-sm" disabled={loading || !isScheduleFormValid}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button type="submit" className="w-full h-8 text-sm" disabled={loading || !isScheduleFormValid}>
            {loading ? "생성 중..." : "등록"}
          </Button>
        )}
      </form>
    </DialogContent>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          일정 추가
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
