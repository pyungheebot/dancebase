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
import type { Schedule } from "@/types";

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

type ScheduleFormProps = {
  groupId: string;
  projectId?: string | null;
  onCreated: () => void;
  mode?: "create" | "edit";
  schedule?: Schedule;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ScheduleForm({
  groupId,
  projectId,
  onCreated,
  mode = "create",
  schedule,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ScheduleFormProps) {
  const isEdit = mode === "edit";

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ScheduleFieldValues>(DEFAULT_FIELDS);
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Create mode: recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (fields.attendanceMethod === "location" && (fields.latitude == null || fields.longitude == null)) {
        setError("위치 기반 출석을 사용하려면 주소를 검색해주세요.");
        setLoading(false);
        return;
      }

      if (isEdit && schedule) {
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
            starts_at: new Date(`${date}T${fields.startTime}`).toISOString(),
            ends_at: new Date(`${date}T${fields.endTime}`).toISOString(),
            late_threshold: fields.lateThresholdTime ? new Date(`${date}T${fields.lateThresholdTime}`).toISOString() : null,
            attendance_deadline: fields.attendanceDeadlineTime ? new Date(`${date}T${fields.attendanceDeadlineTime}`).toISOString() : null,
            require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
          })
          .eq("id", schedule.id);

        if (error) throw error;
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
          starts_at: new Date(`${dateStr}T${fields.startTime}`).toISOString(),
          ends_at: new Date(`${dateStr}T${fields.endTime}`).toISOString(),
          late_threshold: fields.lateThresholdTime ? new Date(`${dateStr}T${fields.lateThresholdTime}`).toISOString() : null,
          attendance_deadline: fields.attendanceDeadlineTime ? new Date(`${dateStr}T${fields.attendanceDeadlineTime}`).toISOString() : null,
          require_checkout: fields.attendanceMethod !== "none" ? fields.requireCheckout : false,
        });

        if (isRecurring) {
          if (recurringDates.length === 0) {
            setError("생성할 일정이 없습니다. 반복 설정을 확인해주세요.");
            setLoading(false);
            return;
          }

          const rows = recurringDates.map((d) => buildRow(format(d, "yyyy-MM-dd")));
          const { error } = await supabase.from("schedules").insert(rows);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("schedules").insert(buildRow(date));
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
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

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "일정 수정" : "새 일정 등록"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ScheduleFormFields
          values={fields}
          onChange={(partial) => setFields((prev) => ({ ...prev, ...partial }))}
          dateSection={dateSection}
          prefix={isEdit ? "edit" : ""}
        />

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
            <Button type="submit" className="flex-1 h-8 text-sm" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
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
