"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  MoveUp,
  MoveDown,
  Pencil,
  User,
  FileText,
  ListChecks,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
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

import { useStageTransition } from "@/hooks/use-stage-transition";
import type { StageTransitionItem, StageTransitionType } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TRANSITION_TYPE_LABELS: Record<StageTransitionType, string> = {
  blackout: "암전",
  light_fade: "조명 페이드",
  curtain: "커튼",
  set_change: "세트 교체",
  costume_change: "의상 변경",
  other: "기타",
};

const TRANSITION_TYPE_COLORS: Record<StageTransitionType, string> = {
  blackout: "bg-gray-900 text-gray-100 border-gray-700",
  light_fade: "bg-yellow-100 text-yellow-800 border-yellow-300",
  curtain: "bg-red-100 text-red-700 border-red-300",
  set_change: "bg-blue-100 text-blue-700 border-blue-300",
  costume_change: "bg-purple-100 text-purple-700 border-purple-300",
  other: "bg-gray-100 text-gray-600 border-gray-300",
};

const ALL_TRANSITION_TYPES: StageTransitionType[] = [
  "blackout",
  "light_fade",
  "curtain",
  "set_change",
  "costume_change",
  "other",
];

// ============================================================
// 헬퍼
// ============================================================

function formatDuration(sec: number): string {
  if (sec === 0) return "0초";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

// ============================================================
// 전환 등록/수정 다이얼로그
// ============================================================

interface TransitionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    fromScene: string;
    toScene: string;
    durationSec: number;
    transitionType: StageTransitionType;
    assignedStaff: string;
    notes: string;
  }) => void;
  editItem?: StageTransitionItem | null;
}

function TransitionFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: TransitionFormDialogProps) {
  const [fromScene, setFromScene] = useState(editItem?.fromScene ?? "");
  const [toScene, setToScene] = useState(editItem?.toScene ?? "");
  const [durationSec, setDurationSec] = useState(
    String(editItem?.durationSec ?? 30)
  );
  const [transitionType, setTransitionType] = useState<StageTransitionType>(
    editItem?.transitionType ?? "blackout"
  );
  const [assignedStaff, setAssignedStaff] = useState(
    editItem?.assignedStaff ?? ""
  );
  const [notes, setNotes] = useState(editItem?.notes ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setFromScene(editItem?.fromScene ?? "");
      setToScene(editItem?.toScene ?? "");
      setDurationSec(String(editItem?.durationSec ?? 30));
      setTransitionType(editItem?.transitionType ?? "blackout");
      setAssignedStaff(editItem?.assignedStaff ?? "");
      setNotes(editItem?.notes ?? "");
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!fromScene.trim()) {
      toast.error("이전 장면을 입력해주세요.");
      return;
    }
    if (!toScene.trim()) {
      toast.error("다음 장면을 입력해주세요.");
      return;
    }
    const dur = parseInt(durationSec, 10);
    if (isNaN(dur) || dur < 0) {
      toast.error("올바른 전환 시간을 입력해주세요.");
      return;
    }
    onSubmit({
      fromScene: fromScene.trim(),
      toScene: toScene.trim(),
      durationSec: dur,
      transitionType,
      assignedStaff: assignedStaff.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "전환 수정" : "전환 구간 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 이전/다음 장면 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">이전 장면 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 1막 1장"
                value={fromScene}
                onChange={(e) => setFromScene(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">다음 장면 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 1막 2장"
                value={toScene}
                onChange={(e) => setToScene(e.target.value)}
              />
            </div>
          </div>

          {/* 전환 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">전환 유형</Label>
            <Select
              value={transitionType}
              onValueChange={(v) => setTransitionType(v as StageTransitionType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TRANSITION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TRANSITION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 전환 시간 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">전환 시간 (초)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                className="h-8 text-xs w-24"
                placeholder="30"
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                {parseInt(durationSec, 10) > 0
                  ? `= ${formatDuration(parseInt(durationSec, 10))}`
                  : ""}
              </span>
            </div>
          </div>

          {/* 담당 스태프 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">담당 스태프</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 조명감독 김철수"
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="전환 시 주의사항 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {editItem ? "수정" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 할 일 추가 인라인 폼
// ============================================================

interface InlineTaskFormProps {
  onAdd: (text: string) => void;
  onCancel: () => void;
}

function InlineTaskForm({ onAdd, onCancel }: InlineTaskFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) {
      toast.error("할 일 내용을 입력해주세요.");
      return;
    }
    onAdd(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <Input
        className="h-7 text-xs flex-1"
        placeholder="할 일 내용 입력"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
      />
      <Button
        size="sm"
        className="h-7 text-xs px-2"
        onClick={handleSubmit}
      >
        추가
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs px-2"
        onClick={onCancel}
      >
        취소
      </Button>
    </div>
  );
}

// ============================================================
// 전환 항목 행
// ============================================================

interface TransitionItemRowProps {
  item: StageTransitionItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleRehearsed: () => void;
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

function TransitionItemRow({
  item,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleRehearsed,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TransitionItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const doneTasks = item.tasks.filter((t) => t.done).length;
  const totalTasks = item.tasks.length;

  return (
    <div
      className={`rounded-md border overflow-hidden ${
        item.rehearsed
          ? "bg-green-50/40 border-green-200"
          : "bg-background"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* 순서 번호 */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
          {item.order}
        </div>

        {/* 장면 정보 */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium truncate max-w-[100px]">
              {item.fromScene}
            </span>
            <ArrowRightLeft className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium truncate max-w-[100px]">
              {item.toScene}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${TRANSITION_TYPE_COLORS[item.transitionType]}`}
            >
              {TRANSITION_TYPE_LABELS[item.transitionType]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.durationSec > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDuration(item.durationSec)}
              </span>
            )}
            {item.assignedStaff && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <User className="h-2.5 w-2.5" />
                {item.assignedStaff}
              </span>
            )}
            {totalTasks > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <ListChecks className="h-2.5 w-2.5" />
                {doneTasks}/{totalTasks}
              </span>
            )}
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* 연습 완료 토글 */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${
              item.rehearsed
                ? "text-green-600 hover:text-green-700"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={onToggleRehearsed}
            title={item.rehearsed ? "연습 완료 취소" : "연습 완료 체크"}
          >
            {item.rehearsed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* 순서 이동 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={onMoveUp}
            disabled={isFirst}
            title="위로"
          >
            <MoveUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={onMoveDown}
            disabled={isLast}
            title="아래로"
          >
            <MoveDown className="h-3 w-3" />
          </Button>

          {/* 상세 펼치기 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            title="상세 보기"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>

          {/* 수정 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>

          {/* 삭제 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 상세 영역 */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t bg-muted/10 space-y-3">
          {/* 메모 */}
          {item.notes && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-2.5 w-2.5" />
                메모
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {item.notes}
              </p>
            </div>
          )}

          {/* 할 일 체크리스트 */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <ListChecks className="h-2.5 w-2.5" />
              할 일 목록 ({doneTasks}/{totalTasks})
            </p>

            {item.tasks.length === 0 && !showTaskForm && (
              <p className="text-[10px] text-muted-foreground italic">
                등록된 할 일이 없습니다.
              </p>
            )}

            <div className="space-y-1">
              {item.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 group rounded px-1 py-0.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.done}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="h-3.5 w-3.5 flex-shrink-0"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-xs flex-1 cursor-pointer ${
                      task.done ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.text}
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => onDeleteTask(task.id)}
                    title="할 일 삭제"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {showTaskForm ? (
              <InlineTaskForm
                onAdd={(text) => {
                  onAddTask(text);
                  setShowTaskForm(false);
                }}
                onCancel={() => setShowTaskForm(false)}
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-1 text-muted-foreground w-full justify-start"
                onClick={() => setShowTaskForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                할 일 추가
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageTransitionCardProps {
  projectId: string;
}

export function StageTransitionCard({ projectId }: StageTransitionCardProps) {
  const {
    items,
    loading,
    stats,
    addItem,
    updateItem,
    deleteItem,
    toggleRehearsed,
    moveItem,
    addTask,
    toggleTask,
    deleteTask,
  } = useStageTransition(projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageTransitionItem | null>(
    null
  );

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (item: StageTransitionItem) => {
    setEditTarget(item);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = (params: {
    fromScene: string;
    toScene: string;
    durationSec: number;
    transitionType: StageTransitionType;
    assignedStaff: string;
    notes: string;
  }) => {
    if (editTarget) {
      const ok = updateItem(editTarget.id, params);
      if (ok) {
        toast.success("전환 구간이 수정되었습니다.");
      } else {
        toast.error("수정에 실패했습니다.");
      }
    } else {
      addItem(params);
      toast.success("전환 구간이 등록되었습니다.");
    }
    setFormDialogOpen(false);
    setEditTarget(null);
  };

  const handleDelete = (itemId: string) => {
    const ok = deleteItem(itemId);
    if (ok) {
      toast.success("전환 구간이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleToggleRehearsed = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const ok = toggleRehearsed(itemId);
    if (ok) {
      const next = !item?.rehearsed;
      toast.success(next ? "연습 완료로 표시했습니다." : "연습 완료를 취소했습니다.");
    }
  };

  const handleAddTask = (itemId: string, text: string) => {
    const ok = addTask(itemId, text);
    if (ok) {
      toast.success("할 일이 추가되었습니다.");
    } else {
      toast.error("할 일 추가에 실패했습니다.");
    }
  };

  const handleToggleTask = (itemId: string, taskId: string) => {
    toggleTask(itemId, taskId);
  };

  const handleDeleteTask = (itemId: string, taskId: string) => {
    const ok = deleteTask(itemId, taskId);
    if (ok) {
      toast.success("할 일이 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <ArrowRightLeft className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <CardTitle className="text-sm font-semibold">
                    무대 전환 계획
                  </CardTitle>
                  {stats.total > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                    >
                      총 {stats.total}회
                    </Badge>
                  )}
                  {stats.unrehearsedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-300"
                    >
                      미연습 {stats.unrehearsedCount}
                    </Badge>
                  )}
                  {stats.total > 0 && stats.unrehearsedCount === 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      전체 연습 완료
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계 요약 */}
                  {items.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-md bg-muted/40 border text-center">
                        <p className="text-[10px] text-muted-foreground">전체</p>
                        <p className="text-sm font-bold tabular-nums">
                          {stats.total}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-center">
                        <p className="text-[10px] text-blue-600">전체 시간</p>
                        <p className="text-sm font-bold tabular-nums text-blue-700">
                          {formatDuration(stats.totalDurationSec)}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-orange-50 border border-orange-200 text-center">
                        <p className="text-[10px] text-orange-600">미연습</p>
                        <p className="text-sm font-bold tabular-nums text-orange-700">
                          {stats.unrehearsedCount}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 목록 헤더 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      전환 목록
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAdd();
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      전환 추가
                    </Button>
                  </div>

                  {/* 목록 */}
                  {items.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <ArrowRightLeft className="h-7 w-7 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        등록된 전환 구간이 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        공연의 각 장면 전환을 등록하고 관리하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <TransitionItemRow
                          key={item.id}
                          item={item}
                          isFirst={idx === 0}
                          isLast={idx === items.length - 1}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item.id)}
                          onMoveUp={() => moveItem(item.id, "up")}
                          onMoveDown={() => moveItem(item.id, "down")}
                          onToggleRehearsed={() =>
                            handleToggleRehearsed(item.id)
                          }
                          onAddTask={(text) => handleAddTask(item.id, text)}
                          onToggleTask={(taskId) =>
                            handleToggleTask(item.id, taskId)
                          }
                          onDeleteTask={(taskId) =>
                            handleDeleteTask(item.id, taskId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 등록/수정 다이얼로그 */}
      <TransitionFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setEditTarget(null);
        }}
        onSubmit={handleFormSubmit}
        editItem={editTarget}
      />
    </>
  );
}
