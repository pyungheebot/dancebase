"use client";

import { useState, useMemo } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Star,
  Flame,
  Filter,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupTimeline } from "@/hooks/use-group-timeline";
import type {
  GroupTimelineEvent,
  GroupTimelineCategory,
  GroupTimelineImportance,
} from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const CATEGORIES: GroupTimelineCategory[] = [
  "창립",
  "공연",
  "대회",
  "합숙",
  "특별이벤트",
  "기타",
];

const IMPORTANCE_LIST: GroupTimelineImportance[] = [
  "일반",
  "중요",
  "매우중요",
];

const CATEGORY_COLOR: Record<GroupTimelineCategory, string> = {
  창립: "bg-purple-100 text-purple-700",
  공연: "bg-pink-100 text-pink-700",
  대회: "bg-orange-100 text-orange-700",
  합숙: "bg-cyan-100 text-cyan-700",
  특별이벤트: "bg-indigo-100 text-indigo-700",
  기타: "bg-gray-100 text-gray-600",
};

const MARKER_CLASS: Record<
  GroupTimelineImportance,
  { dot: string; ring: string; icon: ReactNode }
> = {
  일반: {
    dot: "w-2.5 h-2.5 bg-gray-400",
    ring: "",
    icon: null,
  },
  중요: {
    dot: "w-3.5 h-3.5 bg-blue-500",
    ring: "ring-2 ring-blue-200",
    icon: <Star className="h-2.5 w-2.5 text-white" />,
  },
  매우중요: {
    dot: "w-4 h-4 bg-red-500",
    ring: "ring-2 ring-red-200",
    icon: <Flame className="h-3 w-3 text-white" />,
  },
};

// ─── 빈 폼 초기값 ──────────────────────────────────────────────────────────────

type FormState = {
  date: string;
  title: string;
  description: string;
  category: GroupTimelineCategory;
  importance: GroupTimelineImportance;
};

const EMPTY_FORM: FormState = {
  date: "",
  title: "",
  description: "",
  category: "기타",
  importance: "일반",
};

// ─── 통계 배지 ─────────────────────────────────────────────────────────────────

function StatBadge({
  category,
  count,
}: {
  category: GroupTimelineCategory;
  count: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[category]}`}
    >
      {category}
      <span className="font-bold">{count}</span>
    </span>
  );
}

// ─── 이벤트 폼 다이얼로그 ──────────────────────────────────────────────────────

function EventFormDialog({
  open,
  initial,
  onClose,
  onSubmit,
  isEdit,
}: {
  open: boolean;
  initial: FormState;
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<void>;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const { pending: saving, execute } = useAsyncAction();

  // open될 때마다 initial 동기화
  useMemo(() => {
    setForm(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit() {
    if (!form.date.trim()) {
      toast.error(TOAST.GROUP_TIMELINE.DATE_REQUIRED);
      return;
    }
    if (!form.title.trim()) {
      toast.error(TOAST.GROUP_TIMELINE.TITLE_REQUIRED);
      return;
    }
    await execute(async () => {
      await onSubmit(form);
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {isEdit ? "이벤트 수정" : "이벤트 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이벤트 제목"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="min-h-[64px] text-xs resize-none"
              placeholder="이벤트 설명 (선택)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    category: v as GroupTimelineCategory,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">중요도</Label>
              <Select
                value={form.importance}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    importance: v as GroupTimelineImportance,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPORTANCE_LIST.map((imp) => (
                    <SelectItem key={imp} value={imp} className="text-xs">
                      {imp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 이벤트 단일 항목 ──────────────────────────────────────────────────────────

function TimelineEventItem({
  event,
  onEdit,
  onDelete,
}: {
  event: GroupTimelineEvent;
  onEdit: (event: GroupTimelineEvent) => void;
  onDelete: (id: string) => void;
}) {
  const marker = MARKER_CLASS[event.importance];

  return (
    <div className="flex gap-3 group">
      {/* 마커 + 연결선 */}
      <div className="flex flex-col items-center">
        <div
          className={`rounded-full flex-shrink-0 flex items-center justify-center ${marker.dot} ${marker.ring}`}
        >
          {marker.icon}
        </div>
        <div className="flex-1 w-px bg-gray-200 mt-1" />
      </div>

      {/* 내용 */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                {event.date}
              </span>
              <Badge
                className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLOR[event.category]} border-0`}
              >
                {event.category}
              </Badge>
              {event.importance !== "일반" && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 border-0 ${
                    event.importance === "매우중요"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {event.importance}
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium text-gray-800 truncate">
              {event.title}
            </p>
            {event.description && (
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(event)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function GroupTimelineCard({ groupId }: { groupId: string }) {
  const { data, loading, addEvent, updateEvent, deleteEvent } =
    useGroupTimeline(groupId);

  const [open, setOpen] = useState(true);
  const [filterCategory, setFilterCategory] = useState<
    GroupTimelineCategory | "전체"
  >("전체");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupTimelineEvent | null>(null);

  // 이벤트 정렬 (최신순) 및 필터
  const sortedEvents = useMemo(() => {
    const filtered =
      filterCategory === "전체"
        ? data.events
        : data.events.filter((e) => e.category === filterCategory);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data.events, filterCategory]);

  // 연도별 그룹핑
  const groupedByYear = useMemo(() => {
    const map = new Map<number, GroupTimelineEvent[]>();
    for (const ev of sortedEvents) {
      const year = new Date(ev.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(ev);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [sortedEvents]);

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    const stats: Partial<Record<GroupTimelineCategory, number>> = {};
    for (const ev of data.events) {
      stats[ev.category] = (stats[ev.category] ?? 0) + 1;
    }
    return stats;
  }, [data.events]);

  // 이벤트 추가 핸들러
  async function handleAdd(form: FormState) {
    try {
      await addEvent(form);
      toast.success(TOAST.GROUP_TIMELINE.EVENT_ADDED);
    } catch {
      toast.error(TOAST.GROUP_TIMELINE.EVENT_ADD_ERROR);
      throw new Error("add failed");
    }
  }

  // 이벤트 수정 핸들러
  async function handleUpdate(form: FormState) {
    if (!editTarget) return;
    try {
      await updateEvent(editTarget.id, form);
      toast.success(TOAST.GROUP_TIMELINE.EVENT_UPDATED);
    } catch {
      toast.error(TOAST.GROUP_TIMELINE.EVENT_UPDATE_ERROR);
      throw new Error("update failed");
    }
  }

  // 이벤트 삭제 핸들러
  async function handleDelete(id: string) {
    try {
      await deleteEvent(id);
      toast.success(TOAST.GROUP_TIMELINE.EVENT_DELETED);
    } catch {
      toast.error(TOAST.GROUP_TIMELINE.EVENT_DELETE_ERROR);
    }
  }

  function openAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(event: GroupTimelineEvent) {
    setEditTarget(event);
    setDialogOpen(true);
  }

  const formInitial: FormState = editTarget
    ? {
        date: editTarget.date,
        title: editTarget.title,
        description: editTarget.description,
        category: editTarget.category,
        importance: editTarget.importance,
      }
    : EMPTY_FORM;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                그룹 타임라인
              </span>
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-0">
                총 {data.events.length}개
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={openAdd}
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            {/* 통계 + 필터 */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 space-y-2">
              {/* 카테고리별 통계 */}
              {data.events.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter((c) => (categoryStats[c] ?? 0) > 0).map(
                    (c) => (
                      <StatBadge
                        key={c}
                        category={c}
                        count={categoryStats[c]!}
                      />
                    )
                  )}
                </div>
              )}

              {/* 카테고리 필터 */}
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {(["전체", ...CATEGORIES] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilterCategory(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterCategory === c
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-background text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 타임라인 */}
            <div className="px-4 py-3">
              {loading ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  불러오는 중...
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  {filterCategory === "전체"
                    ? "아직 등록된 이벤트가 없습니다."
                    : `'${filterCategory}' 카테고리 이벤트가 없습니다.`}
                </div>
              ) : (
                <div className="space-y-0">
                  {groupedByYear.map(([year, events]) => (
                    <div key={year}>
                      {/* 연도 구분선 */}
                      <div className="flex items-center gap-2 mb-2 mt-1">
                        <span className="text-xs font-bold text-gray-500">
                          {year}년
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] text-gray-400">
                          {events.length}개
                        </span>
                      </div>

                      {/* 이벤트 목록 */}
                      <div>
                        {events.map((ev) => (
                          <TimelineEventItem
                            key={ev.id}
                            event={ev}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 이벤트 추가/수정 다이얼로그 */}
      <EventFormDialog
        open={dialogOpen}
        initial={formInitial}
        onClose={() => setDialogOpen(false)}
        onSubmit={editTarget ? handleUpdate : handleAdd}
        isEdit={!!editTarget}
      />
    </>
  );
}
