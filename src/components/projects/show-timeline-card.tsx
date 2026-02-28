"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  Pencil,
  Clock,
  User,
  MapPin,
  MoreVertical,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Circle,
  XCircle,
  Mic,
  Music,
  Sparkles,
  DoorOpen,
  PlayCircle,
  PauseCircle,
  StopCircle,
  PackageOpen,
} from "lucide-react";
import { useShowTimeline } from "@/hooks/use-show-timeline";
import type { ShowTimelineEventType, ShowTimelineStatus, ShowTimelineEvent } from "@/types";
import type { AddShowTimelineEventInput } from "@/hooks/use-show-timeline";

// ============================================================
// 상수: 이벤트 유형 설정
// ============================================================

const EVENT_TYPE_CONFIG: Record<
  ShowTimelineEventType,
  { label: string; icon: React.ReactNode; color: string; dotColor: string }
> = {
  arrival: {
    label: "도착",
    icon: <PackageOpen className="h-3 w-3" />,
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-400",
  },
  soundcheck: {
    label: "사운드체크",
    icon: <Mic className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-400",
  },
  rehearsal: {
    label: "리허설",
    icon: <Music className="h-3 w-3" />,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dotColor: "bg-indigo-400",
  },
  makeup: {
    label: "메이크업",
    icon: <Sparkles className="h-3 w-3" />,
    color: "bg-pink-100 text-pink-700 border-pink-200",
    dotColor: "bg-pink-400",
  },
  door_open: {
    label: "개장",
    icon: <DoorOpen className="h-3 w-3" />,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dotColor: "bg-cyan-400",
  },
  show_start: {
    label: "공연 시작",
    icon: <PlayCircle className="h-3 w-3" />,
    color: "bg-green-100 text-green-700 border-green-200",
    dotColor: "bg-green-500",
  },
  intermission: {
    label: "인터미션",
    icon: <PauseCircle className="h-3 w-3" />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dotColor: "bg-yellow-400",
  },
  show_end: {
    label: "공연 종료",
    icon: <StopCircle className="h-3 w-3" />,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dotColor: "bg-orange-400",
  },
  teardown: {
    label: "철수",
    icon: <PackageOpen className="h-3 w-3" />,
    color: "bg-stone-100 text-stone-700 border-stone-200",
    dotColor: "bg-stone-400",
  },
  custom: {
    label: "기타",
    icon: <CircleDot className="h-3 w-3" />,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dotColor: "bg-purple-400",
  },
};

const STATUS_CONFIG: Record<
  ShowTimelineStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  scheduled: {
    label: "예정",
    icon: <Circle className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  in_progress: {
    label: "진행중",
    icon: <CircleDot className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  completed: {
    label: "완료",
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  cancelled: {
    label: "취소",
    icon: <XCircle className="h-3 w-3" />,
    color: "bg-red-100 text-red-600 border-red-200",
  },
};

const EVENT_TYPE_OPTIONS: ShowTimelineEventType[] = [
  "arrival",
  "soundcheck",
  "rehearsal",
  "makeup",
  "door_open",
  "show_start",
  "intermission",
  "show_end",
  "teardown",
  "custom",
];

const STATUS_OPTIONS: ShowTimelineStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

const EMPTY_FORM: AddShowTimelineEventInput = {
  title: "",
  eventType: "custom",
  startTime: "09:00",
  endTime: "",
  assignedTo: "",
  location: "",
  status: "scheduled",
  notes: "",
};

// ============================================================
// 상태 배지
// ============================================================

function StatusBadge({ status }: { status: ShowTimelineStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 이벤트 유형 배지
// ============================================================

function EventTypeBadge({ type }: { type: ShowTimelineEventType }) {
  const cfg = EVENT_TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ============================================================
// 이벤트 폼 다이얼로그
// ============================================================

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ShowTimelineEvent;
  onSubmit: (input: AddShowTimelineEventInput) => Promise<boolean>;
  title: string;
};

function EventFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: EventFormDialogProps) {
  const [form, setForm] = useState<AddShowTimelineEventInput>(
    initial
      ? {
          title: initial.title,
          eventType: initial.eventType,
          startTime: initial.startTime,
          endTime: initial.endTime ?? "",
          assignedTo: initial.assignedTo ?? "",
          location: initial.location ?? "",
          status: initial.status,
          notes: initial.notes ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof AddShowTimelineEventInput>(
    key: K,
    value: AddShowTimelineEventInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) {
      setForm(EMPTY_FORM);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              이벤트 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="예: 전체 리허설, 메이크업 시작"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>

          {/* 이벤트 유형 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">이벤트 유형</Label>
            <Select
              value={form.eventType}
              onValueChange={(v) => setField("eventType", v as ShowTimelineEventType)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-sm">
                    {EVENT_TYPE_CONFIG[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                시작 시간 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setField("startTime", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">종료 시간</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setField("endTime", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 담당자 & 장소 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">담당자</Label>
              <Input
                placeholder="담당자 이름"
                value={form.assignedTo}
                onChange={(e) => setField("assignedTo", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">장소</Label>
              <Input
                placeholder="예: 메인 무대, 분장실"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 상태 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField("status", v as ShowTimelineStatus)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-sm">
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">메모</Label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.startTime}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 타임라인 이벤트 아이템
// ============================================================

type TimelineEventItemProps = {
  event: ShowTimelineEvent;
  isLast: boolean;
  onEdit: (event: ShowTimelineEvent) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ShowTimelineStatus) => void;
};

function TimelineEventItem({
  event,
  isLast,
  onEdit,
  onDelete,
  onStatusChange,
}: TimelineEventItemProps) {
  const typeCfg = EVENT_TYPE_CONFIG[event.eventType];
  const isCompleted = event.status === "completed";
  const isCancelled = event.status === "cancelled";

  return (
    <div className="flex gap-3">
      {/* 수직 타임라인 선 + 점 */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 z-10 ${
            isCompleted
              ? "bg-green-500"
              : isCancelled
              ? "bg-gray-300"
              : typeCfg.dotColor
          }`}
        />
        {!isLast && (
          <div className="w-px flex-1 min-h-[20px] bg-border mt-1" />
        )}
      </div>

      {/* 이벤트 내용 */}
      <div className={`flex-1 pb-3 ${isLast ? "" : ""}`}>
        <div
          className={`rounded-lg border bg-card px-3 py-2.5 hover:shadow-sm transition-shadow ${
            isCancelled ? "opacity-60" : ""
          }`}
        >
          {/* 상단: 시간 + 제목 + 액션 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 시간 */}
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {event.startTime}
                  {event.endTime && ` ~ ${event.endTime}`}
                </span>
              </div>
              {/* 제목 */}
              <span
                className={`text-sm font-medium leading-tight block ${
                  isCompleted ? "line-through text-muted-foreground" : ""
                }`}
              >
                {event.title}
              </span>
            </div>

            {/* 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem
                  className="text-xs gap-1.5"
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="h-3 w-3" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.filter((s) => s !== event.status).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    className="text-xs gap-1.5"
                    onClick={() => onStatusChange(event.id, s)}
                  >
                    {STATUS_CONFIG[s].icon}
                    {STATUS_CONFIG[s].label}(으)로 변경
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 배지 행 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <EventTypeBadge type={event.eventType} />
            <StatusBadge status={event.status} />
          </div>

          {/* 담당자 & 장소 */}
          {(event.assignedTo || event.location) && (
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {event.assignedTo && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  {event.assignedTo}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {event.location}
                </span>
              )}
            </div>
          )}

          {/* 메모 */}
          {event.notes && (
            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {event.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type ShowTimelineCardProps = {
  groupId: string;
  projectId: string;
};

export function ShowTimelineCard({ groupId, projectId }: ShowTimelineCardProps) {
  const {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    changeStatus,
    stats,
  } = useShowTimeline(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShowTimelineEvent | null>(null);

  function handleEdit(event: ShowTimelineEvent) {
    setEditTarget(event);
  }

  async function handleUpdate(
    input: AddShowTimelineEventInput
  ): Promise<boolean> {
    if (!editTarget) return false;
    const ok = await updateEvent(editTarget.id, input);
    if (ok) setEditTarget(null);
    return ok;
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
  }

  async function handleStatusChange(
    id: string,
    status: ShowTimelineStatus
  ) {
    await changeStatus(id, status);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                공연 타임라인
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {stats.total}개
              </Badge>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3 w-3" />
              이벤트 추가
            </Button>
          </div>

          {/* 진행 현황 요약 */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.byStatus.completed > 0 && (
                <span className="text-[10px] text-green-700 bg-green-50 rounded px-2 py-0.5">
                  완료 {stats.byStatus.completed}
                </span>
              )}
              {stats.byStatus.in_progress > 0 && (
                <span className="text-[10px] text-blue-700 bg-blue-50 rounded px-2 py-0.5">
                  진행중 {stats.byStatus.in_progress}
                </span>
              )}
              {stats.byStatus.scheduled > 0 && (
                <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                  예정 {stats.byStatus.scheduled}
                </span>
              )}
              {stats.byStatus.cancelled > 0 && (
                <span className="text-[10px] text-red-600 bg-red-50 rounded px-2 py-0.5">
                  취소 {stats.byStatus.cancelled}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                진행률 {stats.progress}%
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* 빈 상태 */}
          {events.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <CalendarClock className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 타임라인 이벤트가 없습니다
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3" />
                첫 번째 이벤트 추가
              </Button>
            </div>
          )}

          {/* 세로 타임라인 */}
          {events.length > 0 && (
            <div className="space-y-0">
              {events.map((event, idx) => (
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  isLast={idx === events.length - 1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가 다이얼로그 */}
      <EventFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addEvent}
        title="이벤트 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EventFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initial={editTarget}
          onSubmit={handleUpdate}
          title="이벤트 수정"
        />
      )}
    </>
  );
}
