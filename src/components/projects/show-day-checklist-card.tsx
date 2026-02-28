"use client";

import { useState } from "react";
import { useShowDayChecklist } from "@/hooks/use-show-day-checklist";
import type {
  ShowDayChecklistItem,
  ShowDayTimeSlot,
  ShowDayPriority,
} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  Mic2,
  Palette,
  Timer,
  Zap,
  PartyPopper,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 시간대 헬퍼
// ============================================

const ALL_TIME_SLOTS: ShowDayTimeSlot[] = [
  "entry",
  "rehearsal",
  "makeup",
  "standby",
  "preshow",
  "postshow",
  "teardown",
];

function timeSlotLabel(slot: ShowDayTimeSlot): string {
  switch (slot) {
    case "entry":
      return "입장";
    case "rehearsal":
      return "리허설";
    case "makeup":
      return "분장";
    case "standby":
      return "대기";
    case "preshow":
      return "공연 직전";
    case "postshow":
      return "공연 후";
    case "teardown":
      return "철수";
  }
}

function TimeSlotIcon({
  slot,
  className,
}: {
  slot: ShowDayTimeSlot;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (slot) {
    case "entry":
      return <LogIn className={cls} />;
    case "rehearsal":
      return <Mic2 className={cls} />;
    case "makeup":
      return <Palette className={cls} />;
    case "standby":
      return <Timer className={cls} />;
    case "preshow":
      return <Zap className={cls} />;
    case "postshow":
      return <PartyPopper className={cls} />;
    case "teardown":
      return <PackageOpen className={cls} />;
  }
}

function timeSlotIconColor(slot: ShowDayTimeSlot): string {
  switch (slot) {
    case "entry":
      return "text-blue-500";
    case "rehearsal":
      return "text-indigo-500";
    case "makeup":
      return "text-pink-500";
    case "standby":
      return "text-yellow-500";
    case "preshow":
      return "text-orange-500";
    case "postshow":
      return "text-green-500";
    case "teardown":
      return "text-gray-500";
  }
}

// ============================================
// 우선순위 헬퍼
// ============================================

function priorityLabel(priority: ShowDayPriority): string {
  switch (priority) {
    case "required":
      return "필수";
    case "recommended":
      return "권장";
    case "optional":
      return "선택";
  }
}

function priorityBadgeClass(priority: ShowDayPriority): string {
  switch (priority) {
    case "required":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "recommended":
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100";
    case "optional":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  }
}

// ============================================
// 항목 다이얼로그 (추가/수정 공통)
// ============================================

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: ShowDayChecklistItem;
  onSubmit: (
    timeSlot: ShowDayTimeSlot,
    title: string,
    priority: ShowDayPriority,
    assignedTo?: string
  ) => void;
}

function ItemDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: ItemDialogProps) {
  const [timeSlot, setTimeSlot] = useState<ShowDayTimeSlot>(
    initial?.timeSlot ?? "entry"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [priority, setPriority] = useState<ShowDayPriority>(
    initial?.priority ?? "recommended"
  );
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? "");

  function handleOpen(v: boolean) {
    if (v) {
      setTimeSlot(initial?.timeSlot ?? "entry");
      setTitle(initial?.title ?? "");
      setPriority(initial?.priority ?? "recommended");
      setAssignedTo(initial?.assignedTo ?? "");
    }
    onOpenChange(v);
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("항목명을 입력하세요.");
      return;
    }
    onSubmit(timeSlot, title.trim(), priority, assignedTo.trim() || undefined);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "체크리스트 항목 추가" : "항목 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 시간대 */}
          <div className="space-y-1">
            <Label className="text-xs">시간대</Label>
            <Select
              value={timeSlot}
              onValueChange={(v) => setTimeSlot(v as ShowDayTimeSlot)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot} className="text-xs">
                    {timeSlotLabel(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 항목명 */}
          <div className="space-y-1">
            <Label className="text-xs">항목명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 의상 착용 확인"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label className="text-xs">우선순위</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as ShowDayPriority)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="required" className="text-xs">
                  필수
                </SelectItem>
                <SelectItem value="recommended" className="text-xs">
                  권장
                </SelectItem>
                <SelectItem value="optional" className="text-xs">
                  선택
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당자</Label>
            <Input
              className="h-8 text-xs"
              placeholder="담당자 이름 (선택)"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 시간대 그룹 컴포넌트
// ============================================

interface TimeSlotGroupProps {
  slot: ShowDayTimeSlot;
  items: ShowDayChecklistItem[];
  progress: number;
  onToggle: (id: string) => void;
  onEdit: (item: ShowDayChecklistItem) => void;
  onDelete: (id: string) => void;
}

function TimeSlotGroup({
  slot,
  items,
  progress,
  onToggle,
  onEdit,
  onDelete,
}: TimeSlotGroupProps) {
  const [open, setOpen] = useState(true);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
          <span className={timeSlotIconColor(slot)}>
            <TimeSlotIcon slot={slot} className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-foreground flex-1 text-left">
            {timeSlotLabel(slot)}
          </span>
          <span className="text-[10px] text-muted-foreground mr-1">
            {items.filter((i) => i.completed).length}/{items.length}
          </span>
          {/* 미니 프로그레스 바 */}
          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1 pl-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 border transition-colors ${
                item.completed
                  ? "bg-muted/30 border-transparent"
                  : "bg-background border-border/50 hover:border-border"
              }`}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => onToggle(item.id)}
                className="h-3.5 w-3.5 shrink-0"
              />
              <span
                className={`flex-1 text-xs leading-snug ${
                  item.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.title}
              </span>
              {item.assignedTo && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {item.assignedTo}
                </span>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 shrink-0 ${priorityBadgeClass(item.priority)}`}
              >
                {priorityLabel(item.priority)}
              </Badge>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function ShowDayChecklistCard({ projectId }: { projectId: string }) {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleCompleted,
    getByTimeSlot,
    totalItems,
    completedCount,
    requiredUncompletedCount,
    overallProgress,
    getTimeSlotProgress,
  } = useShowDayChecklist(projectId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShowDayChecklistItem | null>(
    null
  );

  function handleAdd(
    timeSlot: ShowDayTimeSlot,
    title: string,
    priority: ShowDayPriority,
    assignedTo?: string
  ) {
    const ok = addItem(timeSlot, title, priority, assignedTo);
    if (ok) {
      toast.success("항목이 추가되었습니다.");
    } else {
      toast.error("항목명을 입력하세요.");
    }
  }

  function handleEdit(
    timeSlot: ShowDayTimeSlot,
    title: string,
    priority: ShowDayPriority,
    assignedTo?: string
  ) {
    if (!editTarget) return;
    updateItem(editTarget.id, { timeSlot, title, priority, assignedTo });
    toast.success("항목이 수정되었습니다.");
    setEditTarget(null);
  }

  function handleDelete(id: string) {
    deleteItem(id);
    toast.success("항목이 삭제되었습니다.");
  }

  function handleToggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    toggleCompleted(id);
    if (!item.completed) {
      toast.success("완료 처리되었습니다.");
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">공연 당일 체크리스트</span>
        </div>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          항목 추가
        </Button>
      </div>

      {/* 통계 요약 */}
      <div className="px-4 py-3 border-b bg-muted/20 space-y-2">
        {/* 전체 완료율 프로그레스 바 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary w-9 text-right">
            {overallProgress}%
          </span>
        </div>

        {/* 통계 배지들 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-background"
          >
            전체 {totalItems}개
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
          >
            완료 {completedCount}개
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-background"
          >
            미완료 {totalItems - completedCount}개
          </Badge>
          {requiredUncompletedCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              필수 미완료 {requiredUncompletedCount}개
            </Badge>
          )}
        </div>

        {/* 필수 항목 미완료 경고 배너 */}
        {requiredUncompletedCount > 0 && (
          <div className="flex items-start gap-1.5 rounded-md bg-red-50 border border-red-200 px-2.5 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />
            <span className="text-[11px] text-red-700 leading-snug">
              필수 항목 {requiredUncompletedCount}개가 아직 완료되지 않았습니다.
              공연 전 반드시 확인하세요.
            </span>
          </div>
        )}
      </div>

      {/* 시간대별 그룹 목록 */}
      <div className="px-3 py-2 space-y-1">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <CheckSquare className="h-8 w-8 opacity-30" />
            <p className="text-xs">체크리스트 항목이 없습니다.</p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs mt-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              첫 항목 추가하기
            </Button>
          </div>
        ) : (
          ALL_TIME_SLOTS.map((slot) => (
            <TimeSlotGroup
              key={slot}
              slot={slot}
              items={getByTimeSlot(slot)}
              progress={getTimeSlotProgress(slot)}
              onToggle={handleToggle}
              onEdit={(item) => setEditTarget(item)}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 항목 추가 다이얼로그 */}
      <ItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      {/* 항목 수정 다이얼로그 */}
      <ItemDialog
        open={editTarget !== null}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        mode="edit"
        initial={editTarget ?? undefined}
        onSubmit={handleEdit}
      />
    </div>
  );
}
