"use client";

import { useState } from "react";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  StickyNote,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useRehearsalSchedule,
  type AddRehearsalParams,
} from "@/hooks/use-rehearsal-schedule";
import type {
  RehearsalScheduleItem,
  RehearsalScheduleType as RehearsalType,
  RehearsalScheduleStatus as RehearsalStatus,
} from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ============================================================
// 상수 & 헬퍼
// ============================================================

const TYPE_LABELS: Record<RehearsalType, string> = {
  full: "전체 런스루",
  partial: "부분 연습",
  tech: "기술 리허설",
  dress: "드레스 리허설",
  blocking: "블로킹",
};

const TYPE_BADGE_CLASS: Record<RehearsalType, string> = {
  full: "bg-blue-100 text-blue-700 border-blue-200",
  partial: "bg-green-100 text-green-700 border-green-200",
  tech: "bg-orange-100 text-orange-700 border-orange-200",
  dress: "bg-purple-100 text-purple-700 border-purple-200",
  blocking: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const TYPE_DOT_CLASS: Record<RehearsalType, string> = {
  full: "bg-blue-500",
  partial: "bg-green-500",
  tech: "bg-orange-500",
  dress: "bg-purple-500",
  blocking: "bg-cyan-500",
};

const STATUS_LABELS: Record<RehearsalStatus, string> = {
  scheduled: "예정",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_BADGE_CLASS: Record<RehearsalStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const ALL_TYPES: RehearsalType[] = ["full", "partial", "tech", "dress", "blocking"];
const ALL_STATUSES_FILTER: (RehearsalStatus | "all")[] = [
  "all",
  "scheduled",
  "completed",
  "cancelled",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ============================================================
// 리허설 추가/수정 다이얼로그
// ============================================================

type RehearsalDialogMode = "add" | "edit";

type RehearsalDialogProps = {
  open: boolean;
  mode: RehearsalDialogMode;
  initial?: Partial<RehearsalScheduleItem>;
  onClose: () => void;
  onSubmit: (params: AddRehearsalParams) => void;
};

function RehearsalDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: RehearsalDialogProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "14:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "17:00");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [type, setType] = useState<RehearsalType>(initial?.type ?? "full");
  const [participantsStr, setParticipantsStr] = useState(
    (initial?.participants ?? []).join(", ")
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // open 변경 시 초기값 재설정
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(initial?.title ?? "");
      setDate(initial?.date ?? "");
      setStartTime(initial?.startTime ?? "14:00");
      setEndTime(initial?.endTime ?? "17:00");
      setLocation(initial?.location ?? "");
      setType(initial?.type ?? "full");
      setParticipantsStr((initial?.participants ?? []).join(", "));
      setNotes(initial?.notes ?? "");
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.DATE_REQUIRED);
      return;
    }
    if (!startTime) {
      toast.error(TOAST.REHEARSAL_SCHEDULE.START_TIME_REQUIRED);
      return;
    }
    const participants = participantsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      date,
      startTime,
      endTime: endTime.trim() || null,
      location: location.trim() || null,
      type,
      participants,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "리허설 추가" : "리허설 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 1차 전체 런스루"
              className="h-8 text-xs"
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">유형 *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as RehearsalType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 시작/종료 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작 시간 *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료 시간</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label className="text-xs">장소</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예) 연습실 A"
              className="h-8 text-xs"
            />
          </div>

          {/* 참여자 */}
          <div className="space-y-1">
            <Label className="text-xs">참여자 (쉼표 구분)</Label>
            <Input
              value={participantsStr}
              onChange={(e) => setParticipantsStr(e.target.value)}
              placeholder="예) 김지수, 이민준, 박소연"
              className="h-8 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="준비사항, 특이사항 등"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            <X className="h-3 w-3 mr-1" />
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 체크리스트 섹션 (인라인)
// ============================================================

type ChecklistSectionProps = {
  rehearsal: RehearsalScheduleItem;
  onToggle: (rehearsalId: string, itemId: string) => void;
  onAdd: (rehearsalId: string, title: string) => void;
  onRemove: (rehearsalId: string, itemId: string) => void;
};

function ChecklistSection({
  rehearsal,
  onToggle,
  onAdd,
  onRemove,
}: ChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState("");

  const checklist = rehearsal.checklist;
  const checkedCount = checklist.filter((item) => item.isChecked).length;

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    onAdd(rehearsal.id, newItemTitle.trim());
    setNewItemTitle("");
  };

  return (
    <div className="mt-2 space-y-1.5">
      {/* 체크리스트 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
          <ListChecks className="h-3 w-3" />
          체크리스트
          {checklist.length > 0 && (
            <span className="text-gray-400">
              ({checkedCount}/{checklist.length})
            </span>
          )}
        </span>
      </div>

      {/* 체크리스트 항목 */}
      {checklist.length > 0 && (
        <div className="space-y-1">
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 group"
            >
              <button
                onClick={() => onToggle(rehearsal.id, item.id)}
                className={`h-3.5 w-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.isChecked
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300 hover:border-green-400"
                }`}
                aria-label={item.isChecked ? "체크 해제" : "체크"}
              >
                {item.isChecked && <Check className="h-2.5 w-2.5" />}
              </button>
              <span
                className={`text-xs flex-1 leading-tight ${
                  item.isChecked
                    ? "line-through text-gray-400"
                    : "text-gray-700"
                }`}
              >
                {item.title}
              </span>
              <button
                onClick={() => onRemove(rehearsal.id, item.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                aria-label="항목 삭제"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 항목 추가 입력 */}
      <div className="flex gap-1">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="체크리스트 항목 추가..."
          className="h-6 text-[10px] flex-1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={handleAdd}
          aria-label="추가"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 리허설 아이템 (타임라인 행)
// ============================================================

type RehearsalItemProps = {
  rehearsal: RehearsalScheduleItem;
  onEdit: (rehearsal: RehearsalScheduleItem) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onToggleCheck: (rehearsalId: string, itemId: string) => void;
  onAddCheck: (rehearsalId: string, title: string) => void;
  onRemoveCheck: (rehearsalId: string, itemId: string) => void;
};

function RehearsalItem({
  rehearsal,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onToggleCheck,
  onAddCheck,
  onRemoveCheck,
}: RehearsalItemProps) {
  const [expanded, setExpanded] = useState(false);

  const isScheduled = rehearsal.status === "scheduled";
  const isCancelled = rehearsal.status === "cancelled";
  const days = daysUntil(rehearsal.date);

  const checklistProgress =
    rehearsal.checklist.length === 0
      ? 0
      : Math.round(
          (rehearsal.checklist.filter((i) => i.isChecked).length /
            rehearsal.checklist.length) *
            100
        );

  return (
    <div className={`flex gap-3 py-3 border-b last:border-b-0 ${isCancelled ? "opacity-50" : ""}`}>
      {/* 타임라인 점 & 선 */}
      <div className="flex flex-col items-center flex-shrink-0 pt-1">
        <div
          className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT_CLASS[rehearsal.type]} ${
            isCancelled ? "opacity-40" : ""
          }`}
        />
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 날짜 + 시간 + D-day */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="text-[10px] text-gray-500 font-mono">
            {formatMonthDay(rehearsal.date)}
          </span>
          <span className="text-[10px] text-gray-400">
            {rehearsal.startTime}
            {rehearsal.endTime ? ` ~ ${rehearsal.endTime}` : ""}
          </span>
          {isScheduled && days >= 0 && (
            <span
              className={`text-[10px] font-semibold ${
                days === 0
                  ? "text-red-500"
                  : days <= 3
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            >
              {days === 0 ? "오늘" : `D-${days}`}
            </span>
          )}
        </div>

        {/* 유형 배지 + 제목 + 상태 배지 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE_CLASS[rehearsal.type]}`}
          >
            {TYPE_LABELS[rehearsal.type]}
          </Badge>
          <span
            className={`text-xs font-semibold truncate flex-1 ${
              isCancelled ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {rehearsal.title}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_BADGE_CLASS[rehearsal.status]}`}
          >
            {STATUS_LABELS[rehearsal.status]}
          </Badge>
        </div>

        {/* 메타 정보 */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 mb-1">
          {rehearsal.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {rehearsal.location}
            </span>
          )}
          {rehearsal.participants.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {rehearsal.participants.join(", ")}
            </span>
          )}
        </div>

        {/* 메모 */}
        {rehearsal.notes && (
          <div className="flex items-start gap-1 mb-1">
            <StickyNote className="h-3 w-3 text-gray-300 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
              {rehearsal.notes}
            </p>
          </div>
        )}

        {/* 체크리스트 진행률 미리보기 */}
        {rehearsal.checklist.length > 0 && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">
              {checklistProgress}%
            </span>
          </div>
        )}

        {/* 펼치기/접기 + 액션 버튼 */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            체크리스트
          </button>

          <div className="flex items-center gap-1 ml-auto">
            {isScheduled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => onComplete(rehearsal.id)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  완료
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => onCancel(rehearsal.id)}
                >
                  <XCircle className="h-3 w-3 mr-0.5" />
                  취소
                </Button>
              </>
            )}
            <button
              onClick={() => onEdit(rehearsal)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="수정"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(rehearsal.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 체크리스트 인라인 (펼쳐진 경우) */}
        {expanded && (
          <ChecklistSection
            rehearsal={rehearsal}
            onToggle={onToggleCheck}
            onAdd={onAddCheck}
            onRemove={onRemoveCheck}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type RehearsalScheduleCardProps = {
  projectId: string;
  /** 하위 호환용 (사용되지 않음) */
  groupId?: string;
  /** 하위 호환용 (사용되지 않음) */
  memberNames?: string[];
};

export function RehearsalScheduleCard({
  projectId,
}: RehearsalScheduleCardProps) {
  const {
    scheduleData,
    loading,
    addRehearsal,
    updateRehearsal,
    deleteRehearsal,
    toggleCheckItem,
    addCheckItem,
    removeCheckItem,
    completeRehearsal,
    cancelRehearsal,
    totalRehearsals,
    completedCount,
    upcomingRehearsals,
    checklistProgress,
    totalCheckItems,
    checkedItems,
  } = useRehearsalSchedule(projectId);

  // 다이얼로그 상태
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] =
    useState<RehearsalScheduleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<RehearsalStatus | "all">(
    "all"
  );

  // ——— 정렬 & 필터 ———
  const filteredRehearsals = [...scheduleData.rehearsals]
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .sort((a, b) => {
      // 예정 먼저, 날짜 오름차순, 완료/취소는 아래
      if (a.status === "scheduled" && b.status !== "scheduled") return -1;
      if (a.status !== "scheduled" && b.status === "scheduled") return 1;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  // ——— 핸들러 ———

  const handleAdd = (params: AddRehearsalParams) => {
    addRehearsal(params);
    toast.success(TOAST.REHEARSAL_SCHEDULE.ADDED);
  };

  const handleUpdate = (params: AddRehearsalParams) => {
    if (!editingRehearsal) return;
    updateRehearsal(editingRehearsal.id, params);
    toast.success(TOAST.REHEARSAL_SCHEDULE.UPDATED);
    setEditingRehearsal(null);
  };

  const handleDelete = (id: string) => {
    deleteRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.DELETED);
    setDeleteConfirmId(null);
  };

  const handleComplete = (id: string) => {
    completeRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.COMPLETED);
  };

  const handleCancel = (id: string) => {
    cancelRehearsal(id);
    toast.success(TOAST.REHEARSAL_SCHEDULE.CANCELLED);
  };

  // ——— 로딩 ———
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-sm">공연 리허설 스케줄러</CardTitle>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </div>

          {/* 통계 요약 */}
          {totalRehearsals > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gray-50 rounded-md">
                <p className="text-xs font-semibold text-gray-700">
                  {totalRehearsals}
                </p>
                <p className="text-[10px] text-gray-400">전체</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-md">
                <p className="text-xs font-semibold text-blue-700">
                  {upcomingRehearsals.length}
                </p>
                <p className="text-[10px] text-blue-400">예정</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-md">
                <p className="text-xs font-semibold text-green-700">
                  {completedCount}
                </p>
                <p className="text-[10px] text-green-400">완료</p>
              </div>
            </div>
          )}

          {/* 체크리스트 전체 진행률 */}
          {totalCheckItems > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  체크리스트 진행률 ({checkedItems}/{totalCheckItems})
                </span>
                <span className="font-medium text-gray-700">
                  {checklistProgress}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* 다음 리허설 알림 */}
          {upcomingRehearsals.length > 0 && (
            <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md">
              <p className="text-[10px] font-medium text-indigo-700 mb-0.5">
                다음 리허설
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE_CLASS[upcomingRehearsals[0].type]}`}
                >
                  {TYPE_LABELS[upcomingRehearsals[0].type]}
                </Badge>
                <span className="text-[10px] font-medium text-indigo-700">
                  {upcomingRehearsals[0].title}
                </span>
                <span className="text-[10px] text-indigo-500">
                  {formatMonthDay(upcomingRehearsals[0].date)}
                </span>
                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {upcomingRehearsals[0].startTime}
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {/* 빈 상태 */}
          {totalRehearsals === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">아직 리허설 일정이 없습니다.</p>
              <p className="text-[10px] mt-0.5">
                전체 런스루, 드레스 리허설 등 일정을 추가해보세요.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-7 text-xs"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 리허설 추가
              </Button>
            </div>
          )}

          {/* 상태 필터 탭 */}
          {totalRehearsals > 0 && (
            <div className="flex gap-1 mb-3 flex-wrap">
              {ALL_STATUSES_FILTER.map((s) => {
                const count =
                  s === "all"
                    ? totalRehearsals
                    : scheduleData.rehearsals.filter((r) => r.status === s)
                        .length;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-gray-500 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {s === "all" ? "전체" : STATUS_LABELS[s]} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* 필터 결과 없음 */}
          {totalRehearsals > 0 && filteredRehearsals.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-xs">해당 상태의 리허설이 없습니다.</p>
            </div>
          )}

          {/* 타임라인 목록 */}
          {filteredRehearsals.length > 0 && (
            <div>
              {filteredRehearsals.map((rehearsal) => (
                <RehearsalItem
                  key={rehearsal.id}
                  rehearsal={rehearsal}
                  onEdit={(r) => setEditingRehearsal(r)}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onToggleCheck={toggleCheckItem}
                  onAddCheck={addCheckItem}
                  onRemoveCheck={removeCheckItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 리허설 추가 다이얼로그 */}
      <RehearsalDialog
        open={addDialogOpen}
        mode="add"
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
      />

      {/* 리허설 수정 다이얼로그 */}
      {editingRehearsal && (
        <RehearsalDialog
          open={!!editingRehearsal}
          mode="edit"
          initial={editingRehearsal}
          onClose={() => setEditingRehearsal(null)}
          onSubmit={handleUpdate}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">리허설 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-600 py-1">
            이 리허설 일정을 삭제하시겠습니까? 체크리스트도 함께 삭제됩니다.
          </p>
          <DialogFooter className="gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDeleteConfirmId(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                deleteConfirmId && handleDelete(deleteConfirmId)
              }
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
