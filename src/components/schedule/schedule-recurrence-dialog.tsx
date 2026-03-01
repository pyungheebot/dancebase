"use client";

import { useState } from "react";
import {
  CalendarClock,
  Plus,
  Trash2,
  Pencil,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useScheduleRecurrence,
  formatRecurrenceSummary,
  generateUpcomingDates,
  DAY_LABELS,
  RECURRENCE_TYPE_LABELS,
  type RecurrenceRuleFormData,
} from "@/hooks/use-schedule-recurrence";
import type {
  RecurrenceType,
  RecurrenceEndType,
  ScheduleRecurrenceRule,
} from "@/types";
import { formatKo } from "@/lib/date-utils";

// ============================================
// 상수
// ============================================

const DAYS_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0]; // 월~일 순서

// ============================================
// 빈 폼 기본값
// ============================================

type FormState = {
  type: RecurrenceType;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  title: string;
  location: string;
  endType: RecurrenceEndType;
  endDate: string;
  endCount: number;
};

const EMPTY_FORM: FormState = {
  type: "weekly",
  daysOfWeek: [],
  startTime: "19:00",
  durationMinutes: 120,
  title: "",
  location: "",
  endType: "never",
  endDate: "",
  endCount: 10,
};

// ============================================
// 날짜 포맷 유틸리티
// ============================================

// ============================================
// 미리보기 섹션
// ============================================

function RecurrencePreview({
  form,
}: {
  form: FormState;
}) {
  // 임시 규칙 객체 생성 (미리보기용)
  const tempRule: ScheduleRecurrenceRule = {
    id: "preview",
    groupId: "preview",
    type: form.type,
    daysOfWeek: form.daysOfWeek,
    startTime: form.startTime,
    durationMinutes: form.durationMinutes,
    title: form.title || "제목 없음",
    location: form.location,
    endType: form.endType,
    endDate: form.endDate || null,
    endCount: form.endCount > 0 ? form.endCount : null,
    createdAt: new Date().toISOString(),
  };

  const dates = generateUpcomingDates(tempRule, 4);

  if (form.daysOfWeek.length === 0) {
    return (
      <div className="rounded-md bg-muted/50 p-3 text-center">
        <p className="text-xs text-muted-foreground">요일을 선택하면 미리보기가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-muted/50 p-3 space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">향후 예정 일정 (최대 4개)</p>
      {dates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          종료 조건에 의해 예정된 일정이 없습니다.
        </p>
      ) : (
        <ul className="space-y-1">
          {dates.map((date, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span>{formatKo(date, "yyyy.MM.dd (EEE)")}</span>
              <span className="text-muted-foreground">{form.startTime}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================
// 반복 규칙 폼
// ============================================

type RecurrenceFormProps = {
  initial?: FormState;
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
};

function RecurrenceForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  submitLabel,
}: RecurrenceFormProps) {
  const [form, setForm] = useState<FormState>(initial);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDay = (day: number) => {
    setField(
      "daysOfWeek",
      form.daysOfWeek.includes(day)
        ? form.daysOfWeek.filter((d) => d !== day)
        : [...form.daysOfWeek, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(TOAST.TITLE_REQUIRED_DOT);
      return;
    }
    if (form.daysOfWeek.length === 0) {
      toast.error(TOAST.SCHEDULE.RECURRENCE_DAY_REQUIRED);
      return;
    }
    if (form.endType === "by_date" && !form.endDate) {
      toast.error(TOAST.SCHEDULE.RECURRENCE_END_DATE_REQUIRED);
      return;
    }
    if (form.endType === "by_count" && (!form.endCount || form.endCount < 1)) {
      toast.error(TOAST.SCHEDULE.RECURRENCE_COUNT_REQUIRED);
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제목 */}
      <div className="space-y-1">
        <Label htmlFor="rcr-title" className="text-xs">
          일정 제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="rcr-title"
          placeholder="예: 정기 연습"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          className="h-8 text-sm"
          required
        />
      </div>

      {/* 장소 */}
      <div className="space-y-1">
        <Label htmlFor="rcr-location" className="text-xs">장소</Label>
        <Input
          id="rcr-location"
          placeholder="예: 홍대 댄스 스튜디오"
          value={form.location}
          onChange={(e) => setField("location", e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* 반복 유형 */}
      <div className="space-y-1">
        <Label className="text-xs">반복 유형</Label>
        <Select
          value={form.type}
          onValueChange={(v) => setField("type", v as RecurrenceType)}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RECURRENCE_TYPE_LABELS) as RecurrenceType[]).map(
              (t) => (
                <SelectItem key={t} value={t}>
                  {RECURRENCE_TYPE_LABELS[t]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 요일 선택 */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          반복 요일 <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-1">
          {DAYS_ORDER.map((day) => {
            const selected = form.daysOfWeek.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={[
                  "flex-1 h-8 rounded text-xs font-medium border transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50",
                ].join(" ")}
              >
                {DAY_LABELS[day]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 시간 설정 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="rcr-startTime" className="text-xs">시작 시간</Label>
          <Input
            id="rcr-startTime"
            type="time"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rcr-duration" className="text-xs">소요 시간 (분)</Label>
          <Input
            id="rcr-duration"
            type="number"
            min={1}
            max={1440}
            value={form.durationMinutes}
            onChange={(e) =>
              setField("durationMinutes", Number(e.target.value))
            }
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* 종료 조건 */}
      <div className="space-y-2">
        <Label className="text-xs">종료 조건</Label>
        <RadioGroup
          value={form.endType}
          onValueChange={(v) => setField("endType", v as RecurrenceEndType)}
          className="space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="never" id="end-never" />
            <Label htmlFor="end-never" className="text-xs cursor-pointer">
              종료 없음 (계속 반복)
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="by_date" id="end-by-date" />
            <Label htmlFor="end-by-date" className="text-xs cursor-pointer">
              특정 날짜까지
            </Label>
          </div>
          {form.endType === "by_date" && (
            <div className="pl-5">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <RadioGroupItem value="by_count" id="end-by-count" />
            <Label htmlFor="end-by-count" className="text-xs cursor-pointer">
              N회 후 종료
            </Label>
          </div>
          {form.endType === "by_count" && (
            <div className="pl-5 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={999}
                value={form.endCount}
                onChange={(e) =>
                  setField("endCount", Number(e.target.value))
                }
                className="h-7 text-xs w-20"
              />
              <span className="text-xs text-muted-foreground">회</span>
            </div>
          )}
        </RadioGroup>
      </div>

      {/* 미리보기 */}
      <RecurrencePreview form={form} />

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 h-8 text-xs"
          disabled={!form.title.trim() || form.daysOfWeek.length === 0}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 규칙 추가 다이얼로그
// ============================================

type AddRuleDialogProps = {
  maxReached: boolean;
  onAdd: (data: FormState) => boolean;
};

function AddRuleDialog({ maxReached, onAdd }: AddRuleDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = (data: FormState) => {
    const success = onAdd(data);
    if (!success) {
      toast.error(TOAST.SCHEDULE.RECURRENCE_MAX);
      return;
    }
    toast.success(TOAST.SCHEDULE.RECURRENCE_SAVED);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={maxReached}
        >
          <Plus className="mr-1 h-3 w-3" />
          새 반복 규칙
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">반복 규칙 추가</DialogTitle>
        </DialogHeader>
        <RecurrenceForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel="저장"
        />
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 규칙 수정 다이얼로그
// ============================================

type EditRuleDialogProps = {
  rule: ScheduleRecurrenceRule;
  onUpdate: (data: FormState) => void;
};

function EditRuleDialog({ rule, onUpdate }: EditRuleDialogProps) {
  const [open, setOpen] = useState(false);

  const initial: FormState = {
    type: rule.type,
    daysOfWeek: rule.daysOfWeek,
    startTime: rule.startTime,
    durationMinutes: rule.durationMinutes,
    title: rule.title,
    location: rule.location,
    endType: rule.endType,
    endDate: rule.endDate ?? "",
    endCount: rule.endCount ?? 10,
  };

  const handleSubmit = (data: FormState) => {
    onUpdate(data);
    toast.success("반복 규칙이 수정되었습니다.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">반복 규칙 수정</DialogTitle>
        </DialogHeader>
        <RecurrenceForm
          initial={initial}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel="수정 저장"
        />
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 규칙 카드
// ============================================

type RuleCardProps = {
  rule: ScheduleRecurrenceRule;
  onUpdate: (id: string, data: RecurrenceRuleFormData) => void;
  onDelete: (id: string) => void;
};

function RuleCard({ rule, onUpdate, onDelete }: RuleCardProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const upcoming = generateUpcomingDates(rule, 2);

  const durationLabel =
    rule.durationMinutes >= 60
      ? `${Math.floor(rule.durationMinutes / 60)}시간${
          rule.durationMinutes % 60 > 0
            ? ` ${rule.durationMinutes % 60}분`
            : ""
        }`
      : `${rule.durationMinutes}분`;

  const handleUpdate = (data: FormState) => {
    const formData: RecurrenceRuleFormData = {
      type: data.type,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      title: data.title,
      location: data.location,
      endType: data.endType,
      endDate: data.endDate || null,
      endCount: data.endCount > 0 ? data.endCount : null,
    };
    onUpdate(rule.id, formData);
  };

  return (
    <div className="rounded-md border p-3 space-y-2">
      {/* 헤더: 제목 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium truncate flex-1">{rule.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          <EditRuleDialog rule={rule} onUpdate={handleUpdate} />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="반복 규칙 삭제"
            description={`"${rule.title}" 반복 규칙을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            onConfirm={() => onDelete(rule.id)}
            destructive
          />
        </div>
      </div>

      {/* 요약 정보 */}
      <p className="text-[11px] text-muted-foreground">
        {formatRecurrenceSummary(rule)}
      </p>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          {rule.startTime} · {durationLabel}
        </span>
        {rule.location && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">{rule.location}</span>
          </span>
        )}
      </div>

      {/* 다음 예정 일정 */}
      {upcoming.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {upcoming.map((date, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              <Calendar className="h-2.5 w-2.5" />
              {formatKo(date, "yyyy.MM.dd (EEE)")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ScheduleRecurrenceDialog (메인 컴포넌트)
// ============================================

type ScheduleRecurrenceDialogProps = {
  groupId: string;
};

export function ScheduleRecurrenceDialog({
  groupId,
}: ScheduleRecurrenceDialogProps) {
  const [open, setOpen] = useState(false);
  const { rules, maxReached, addRule, updateRule, deleteRule } =
    useScheduleRecurrence(groupId);

  const handleAdd = (data: FormState): boolean => {
    return addRule({
      type: data.type,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      title: data.title,
      location: data.location,
      endType: data.endType,
      endDate: data.endDate || null,
      endCount: data.endCount > 0 ? data.endCount : null,
    });
  };

  const handleUpdate = (id: string, formData: RecurrenceRuleFormData) => {
    updateRule(id, formData);
  };

  const handleDelete = (id: string) => {
    deleteRule(id);
    toast.success("반복 규칙이 삭제되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <CalendarClock className="mr-1 h-3 w-3" />
          반복 일정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">반복 일정 관리</DialogTitle>
        </DialogHeader>

        {/* 상단 액션 */}
        <div className="flex flex-wrap items-center gap-2">
          <AddRuleDialog maxReached={maxReached} onAdd={handleAdd} />
          {maxReached && (
            <p className="text-[11px] text-muted-foreground">최대 10개 도달</p>
          )}
        </div>

        {/* 규칙 목록 */}
        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
          {rules.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                저장된 반복 규칙이 없습니다.
              </p>
              <p className="text-[11px] text-muted-foreground">
                정기 연습, 모임 등의 반복 일정 규칙을 등록해보세요.
              </p>
            </div>
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {rules.length > 0 && (
          <p className="text-[11px] text-muted-foreground text-right">
            {rules.length} / 10
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
