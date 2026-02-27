"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  Trash2,
  Clock,
  MapPin,
  CalendarPlus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
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
import { useLocalScheduleTemplates } from "@/hooks/use-local-schedule-templates";
import type {
  ScheduleTemplateItem,
  ScheduleTemplateFormData,
} from "@/types";

// ============================================
// 상수
// ============================================

const DAY_LABELS: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

const ATTENDANCE_METHODS = [
  { value: "", label: "선택 안 함" },
  { value: "qr", label: "QR 코드" },
  { value: "manual", label: "수동 입력" },
  { value: "auto", label: "자동" },
];

// ============================================
// 빈 폼 기본값
// ============================================

const EMPTY_FORM: ScheduleTemplateFormData & { dayOfWeek: string } = {
  title: "",
  location: "",
  startTime: "19:00",
  durationMinutes: 120,
  attendanceMethod: "",
  memo: "",
  dayOfWeek: "",
};

// ============================================
// 템플릿 추가 다이얼로그
// ============================================

type AddTemplateDialogProps = {
  groupId: string;
  onAdded: () => void;
  maxReached: boolean;
  addTemplate: (
    formData: ScheduleTemplateFormData,
    dayOfWeek?: number | null
  ) => boolean;
};

function AddTemplateDialog({
  onAdded,
  maxReached,
  addTemplate,
}: AddTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => setForm(EMPTY_FORM);

  const handleChange = (
    field: keyof typeof EMPTY_FORM,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    const dayOfWeek =
      form.dayOfWeek !== "" ? parseInt(form.dayOfWeek, 10) : null;

    const success = addTemplate(
      {
        title: form.title.trim(),
        location: form.location.trim(),
        startTime: form.startTime,
        durationMinutes: Number(form.durationMinutes),
        attendanceMethod: form.attendanceMethod,
        memo: form.memo.trim(),
      },
      dayOfWeek
    );

    if (!success) {
      toast.error("템플릿은 최대 20개까지 저장할 수 있습니다.");
      return;
    }

    toast.success("템플릿이 저장되었습니다.");
    resetForm();
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={maxReached}
        >
          <Plus className="mr-1 h-3 w-3" />
          새 템플릿
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm">새 일정 템플릿</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="tmpl-title" className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tmpl-title"
              placeholder="예: 정기 연습"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label htmlFor="tmpl-location" className="text-xs">장소</Label>
            <Input
              id="tmpl-location"
              placeholder="예: 홍대 댄스 스튜디오"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          {/* 요일 + 시작 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">요일</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => handleChange("dayOfWeek", v)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="요일 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안 함</SelectItem>
                  {Object.entries(DAY_LABELS).map(([num, label]) => (
                    <SelectItem key={num} value={num}>
                      {label}요일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tmpl-startTime" className="text-xs">
                시작 시간
              </Label>
              <Input
                id="tmpl-startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
            </div>
          </div>

          {/* 소요 시간 */}
          <div className="space-y-1">
            <Label htmlFor="tmpl-duration" className="text-xs">소요 시간 (분)</Label>
            <Input
              id="tmpl-duration"
              type="number"
              min={1}
              max={1440}
              placeholder="예: 120"
              value={form.durationMinutes}
              onChange={(e) => handleChange("durationMinutes", e.target.value)}
            />
          </div>

          {/* 출석 방법 */}
          <div className="space-y-1">
            <Label className="text-xs">출석 방법</Label>
            <Select
              value={form.attendanceMethod}
              onValueChange={(v) => handleChange("attendanceMethod", v)}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue placeholder="출석 방법 선택" />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor="tmpl-memo" className="text-xs">메모</Label>
            <Input
              id="tmpl-memo"
              placeholder="메모 (선택사항)"
              value={form.memo}
              onChange={(e) => handleChange("memo", e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-8 text-sm"
            disabled={!form.title.trim()}
          >
            템플릿 저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 템플릿 카드
// ============================================

type TemplateCardProps = {
  template: ScheduleTemplateItem;
  onApply: (formData: ScheduleTemplateFormData) => void;
  onDelete: (id: string) => void;
};

function TemplateCard({ template, onApply, onDelete }: TemplateCardProps) {
  const durationLabel =
    template.durationMinutes >= 60
      ? `${Math.floor(template.durationMinutes / 60)}시간${
          template.durationMinutes % 60 > 0
            ? ` ${template.durationMinutes % 60}분`
            : ""
        }`
      : `${template.durationMinutes}분`;

  const dayLabel =
    template.dayOfWeek !== null
      ? `${DAY_LABELS[template.dayOfWeek]}요일`
      : null;

  const timeLabel = [dayLabel, template.startTime].filter(Boolean).join(" ");

  const handleApply = () => {
    onApply({
      title: template.title,
      location: template.location,
      startTime: template.startTime,
      durationMinutes: template.durationMinutes,
      attendanceMethod: template.attendanceMethod,
      memo: template.memo,
    });
  };

  return (
    <div className="rounded-md border p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium truncate flex-1">{template.title}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>템플릿 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{template.title}&quot; 템플릿을 삭제하시겠습니까? 이
                작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(template.id)}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {timeLabel && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            {timeLabel} · {durationLabel}
          </span>
        )}
        {template.location && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px]">{template.location}</span>
          </span>
        )}
      </div>

      {template.memo && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {template.memo}
        </p>
      )}

      {/* 사용 버튼 */}
      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={handleApply}
      >
        <CalendarPlus className="mr-1 h-3 w-3" />
        사용
      </Button>
    </div>
  );
}

// ============================================
// ScheduleTemplateManager (메인 컴포넌트)
// ============================================

type ScheduleTemplateManagerProps = {
  groupId: string;
  /** 현재 편집 중인 일정을 템플릿으로 저장할 때 전달 */
  currentSchedule?: {
    title: string;
    location?: string | null;
    startAt: string;
    durationMinutes?: number;
    attendanceMethod?: string;
    memo?: string | null;
  } | null;
  /** 템플릿 "사용" 클릭 시 폼 데이터 콜백 */
  onApplyTemplate: (formData: ScheduleTemplateFormData) => void;
};

export function ScheduleTemplateManager({
  groupId,
  currentSchedule,
  onApplyTemplate,
}: ScheduleTemplateManagerProps) {
  const [open, setOpen] = useState(false);
  const {
    templates,
    maxReached,
    addTemplate,
    saveFromSchedule,
    deleteTemplate,
    getFormDataFromTemplate,
  } = useLocalScheduleTemplates(groupId);

  const handleApply = (formData: ScheduleTemplateFormData) => {
    onApplyTemplate(formData);
    setOpen(false);
    toast.success("템플릿이 적용되었습니다.");
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    toast.success("템플릿이 삭제되었습니다.");
  };

  const handleSaveCurrent = () => {
    if (!currentSchedule) return;
    const success = saveFromSchedule(currentSchedule);
    if (!success) {
      toast.error("템플릿은 최대 20개까지 저장할 수 있습니다.");
      return;
    }
    toast.success("현재 일정이 템플릿으로 저장되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <LayoutTemplate className="mr-1 h-3 w-3" />
          템플릿
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">일정 템플릿 관리</DialogTitle>
        </DialogHeader>

        {/* 상단 액션 버튼 영역 */}
        <div className="flex flex-wrap items-center gap-2">
          <AddTemplateDialog
            groupId={groupId}
            maxReached={maxReached}
            addTemplate={addTemplate}
            onAdded={() => {}}
          />
          {currentSchedule && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={handleSaveCurrent}
              disabled={maxReached}
            >
              <CalendarPlus className="mr-1 h-3 w-3" />
              현재 일정을 템플릿으로 저장
            </Button>
          )}
          {maxReached && (
            <p className="text-[11px] text-muted-foreground">
              최대 20개 도달
            </p>
          )}
        </div>

        {/* 템플릿 목록 */}
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
          {templates.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <LayoutTemplate className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                저장된 템플릿이 없습니다.
              </p>
              <p className="text-[11px] text-muted-foreground">
                자주 사용하는 일정 패턴을 템플릿으로 저장해보세요.
              </p>
            </div>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={(formData) => handleApply(formData)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {templates.length > 0 && (
          <p className="text-[11px] text-muted-foreground text-right">
            {templates.length} / 20
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
