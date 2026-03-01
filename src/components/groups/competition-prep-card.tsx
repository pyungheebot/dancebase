"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Medal,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Users,
  CheckSquare,

  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useCompetitionPrep } from "@/hooks/use-competition-prep";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CompetitionPrepCategory, CompetitionPrepEvent } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CompetitionPrepCategory, string> = {
  registration: "등록",
  choreography: "안무",
  music: "음악",
  costume: "의상",
  travel: "이동",
  documents: "서류",
  other: "기타",
};

const CATEGORY_COLORS: Record<CompetitionPrepCategory, string> = {
  registration: "bg-blue-100 text-blue-700",
  choreography: "bg-purple-100 text-purple-700",
  music: "bg-pink-100 text-pink-700",
  costume: "bg-orange-100 text-orange-700",
  travel: "bg-cyan-100 text-cyan-700",
  documents: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

const ALL_CATEGORIES: CompetitionPrepCategory[] = [
  "registration",
  "choreography",
  "music",
  "costume",
  "travel",
  "documents",
  "other",
];

// ─── D-day 계산 ──────────────────────────────────────────────

function calcDDay(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getDDayColor(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "bg-gray-100 text-gray-500";
  if (diff === 0) return "bg-red-100 text-red-600";
  if (diff <= 7) return "bg-red-50 text-red-500";
  if (diff <= 30) return "bg-yellow-100 text-yellow-600";
  return "bg-green-100 text-green-600";
}

// ─── 이벤트 추가 다이얼로그 ──────────────────────────────────

function AddEventDialog({
  onAdd,
}: {
  onAdd: (data: Omit<CompetitionPrepEvent, "id" | "createdAt" | "items">) => Promise<CompetitionPrepEvent>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const { pending: saving, execute } = useAsyncAction();

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error(TOAST.COMPETITION_PREP.COMPETITION_NAME_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.COMPETITION_PREP.DATE_REQUIRED);
      return;
    }
    if (!location.trim()) {
      toast.error(TOAST.COMPETITION_PREP.VENUE_REQUIRED);
      return;
    }
    await execute(async () => {
      try {
        await onAdd({
          competitionName: name.trim(),
          date,
          location: location.trim(),
          category: category.trim() || undefined,
          teamSize: teamSize ? Number(teamSize) : undefined,
          registrationDeadline: regDeadline || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success(TOAST.COMPETITION_PREP.COMPETITION_ADDED);
        setName("");
        setDate("");
        setLocation("");
        setCategory("");
        setTeamSize("");
        setRegDeadline("");
        setNotes("");
        setOpen(false);
      } catch {
        toast.error(TOAST.COMPETITION_PREP.COMPETITION_ADD_ERROR);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          대회 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">대회 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">대회명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 전국 댄스 경연대회"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">대회 날짜 *</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">접수 마감일</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">장소 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 세종문화회관 대극장"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">부문/종목</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 팀 힙합"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">참가 인원</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                placeholder="명"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 메모를 입력하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "추가 중..." : "추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 아이템 추가 다이얼로그 ──────────────────────────────────

function AddItemDialog({
  eventId,
  memberNames,
  onAdd,
}: {
  eventId: string;
  memberNames?: string[];
  onAdd: (
    eventId: string,
    data: Omit<import("@/types").CompetitionPrepItem, "id" | "isCompleted">
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState("");
  const [category, setCategory] = useState<CompetitionPrepCategory>("other");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const { pending: saving, execute: executeTask } = useAsyncAction();

  async function handleSubmit() {
    if (!task.trim()) {
      toast.error(TOAST.COMPETITION_PREP.TASK_NAME_REQUIRED);
      return;
    }
    await executeTask(async () => {
      try {
        await onAdd(eventId, {
          task: task.trim(),
          category,
          assignee: assignee.trim() || undefined,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success(TOAST.COMPETITION_PREP.CHECK_ITEM_ADDED);
        setTask("");
        setCategory("other");
        setAssignee("");
        setDueDate("");
        setNotes("");
        setOpen(false);
      } catch {
        toast.error(TOAST.COMPETITION_PREP.CHECK_ITEM_ADD_ERROR);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
          <Plus className="h-3 w-3" />
          항목 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">체크 항목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">과제명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 참가 신청서 제출"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as CompetitionPrepCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              {memberNames && memberNames.length > 0 ? (
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">
                      미지정
                    </SelectItem>
                    {memberNames.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="담당자명"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">기한</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Input
              className="h-8 text-xs"
              placeholder="메모 (선택)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "추가 중..." : "추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 단일 이벤트 패널 ────────────────────────────────────────

function EventPanel({
  event,
  memberNames,
  onToggle,
  onAddItem,
  onDeleteItem,
  onDeleteEvent,
}: {
  event: CompetitionPrepEvent;
  memberNames?: string[];
  onToggle: (eventId: string, itemId: string) => Promise<void>;
  onAddItem: (
    eventId: string,
    data: Omit<import("@/types").CompetitionPrepItem, "id" | "isCompleted">
  ) => Promise<void>;
  onDeleteItem: (eventId: string, itemId: string) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<CompetitionPrepCategory | "all">("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const totalItems = event.items.length;
  const completedItems = event.items.filter((i) => i.isCompleted).length;
  const completionRate =
    totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  const dday = calcDDay(event.date);
  const ddayColor = getDDayColor(event.date);

  const visibleItems =
    activeCategory === "all"
      ? event.items
      : event.items.filter((i) => i.category === activeCategory);

  const usedCategories = Array.from(
    new Set(event.items.map((i) => i.category))
  ) as CompetitionPrepCategory[];

  async function handleDeleteEvent() {
    try {
      await onDeleteEvent(event.id);
      toast.success(TOAST.COMPETITION_PREP.COMPETITION_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      await onDeleteItem(event.id, itemId);
      toast.success(TOAST.COMPETITION_PREP.ITEM_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  async function handleToggle(itemId: string) {
    try {
      await onToggle(event.id, itemId);
    } catch {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  const isPast = new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-2 transition-colors group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">
                {event.competitionName}
              </span>
              {event.category && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
                  {event.category}
                </Badge>
              )}
              <Badge className={`text-[10px] px-1.5 py-0 border-0 ${ddayColor}`}>
                {dday}
              </Badge>
              {isPast && (
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-0">
                  종료
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {event.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location}
              </span>
              {event.teamSize && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.teamSize}명
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Progress value={completionRate} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {completedItems}/{totalItems} ({completionRate}%)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmOpen(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-2 pr-2 pb-3 space-y-2">
          {/* 등록 마감일 */}
          {event.registrationDeadline && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              접수 마감: {event.registrationDeadline}
            </div>
          )}

          {/* 메모 */}
          {event.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              {event.notes}
            </p>
          )}

          {/* 카테고리 필터 */}
          <div className="flex items-center gap-1 flex-wrap pt-1">
            <button
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                activeCategory === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-foreground/50"
              }`}
              onClick={() => setActiveCategory("all")}
            >
              전체 ({event.items.length})
            </button>
            {usedCategories.map((cat) => {
              const catCount = event.items.filter(
                (i) => i.category === cat
              ).length;
              return (
                <button
                  key={cat}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    activeCategory === cat
                      ? "bg-foreground text-background border-foreground"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-foreground/50"
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]} ({catCount})
                </button>
              );
            })}
          </div>

          {/* 아이템 목록 */}
          <div className="space-y-1">
            {visibleItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                체크 항목이 없습니다.
              </p>
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/40 group/item"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.isCompleted}
                    onCheckedChange={() => handleToggle(item.id)}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={item.id}
                      className={`text-xs cursor-pointer leading-tight ${
                        item.isCompleted
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {item.task}
                    </label>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 border-0 ${CATEGORY_COLORS[item.category]}`}
                      >
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                      {item.assignee && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {item.assignee}
                        </span>
                      )}
                      {item.dueDate && (
                        <span
                          className={`text-[10px] flex items-center gap-0.5 ${
                            !item.isCompleted &&
                            new Date(item.dueDate) <
                              new Date(new Date().setHours(0, 0, 0, 0))
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          <Calendar className="h-2.5 w-2.5" />
                          {item.dueDate}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover/item:opacity-100 text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* 항목 추가 버튼 */}
          <div className="pt-1">
            <AddItemDialog
              eventId={event.id}
              memberNames={memberNames}
              onAdd={onAddItem}
            />
          </div>
        </div>
      </CollapsibleContent>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="대회 삭제"
        description={`"${event.competitionName}" 대회를 삭제하시겠습니까?`}
        onConfirm={handleDeleteEvent}
        destructive
      />
    </Collapsible>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────

export function CompetitionPrepCard({
  groupId,
  memberNames,
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const [open, setOpen] = useState(true);
  const {
    events,
    loading,
    stats,
    addEvent,
    deleteEvent,
    addItem,
    deleteItem,
    toggleComplete,
  } = useCompetitionPrep(groupId);

  const sortedEvents = [...events].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return da - db;
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* 헤더 */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold">대회 준비 체크</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-0">
                {stats.totalEvents}건
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* 통계 요약 */}
              <div className="flex items-center gap-3 mr-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>예정 {stats.upcomingEvents}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckSquare className="h-3 w-3" />
                  <span>완료율 {stats.overallCompletionRate}%</span>
                </div>
              </div>
              <AddEventDialog onAdd={addEvent} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />

          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              불러오는 중...
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-30" />
              <p className="text-xs">등록된 대회가 없습니다.</p>
              <p className="text-[10px]">위의 대회 추가 버튼을 눌러 시작하세요.</p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedEvents.map((event) => (
                <div key={event.id} className="px-2">
                  <EventPanel
                    event={event}
                    memberNames={memberNames}
                    onToggle={toggleComplete}
                    onAddItem={addItem}
                    onDeleteItem={deleteItem}
                    onDeleteEvent={deleteEvent}
                  />
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
