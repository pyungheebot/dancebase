"use client";

import { useState } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  User,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  usePracticeGoalBoard,
  type AddGoalParams,
} from "@/hooks/use-practice-goal-board";
import type { GoalBoardItem, GoalBoardPriority, GoalBoardStatus } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────
const COLUMN_CONFIG: Record<
  GoalBoardStatus,
  { label: string; bg: string; headerBg: string; border: string; emptyText: string }
> = {
  todo: {
    label: "할 일",
    bg: "bg-gray-50",
    headerBg: "bg-gray-100",
    border: "border-gray-200",
    emptyText: "할 일이 없습니다.",
  },
  in_progress: {
    label: "진행 중",
    bg: "bg-blue-50",
    headerBg: "bg-blue-100",
    border: "border-blue-200",
    emptyText: "진행 중인 목표가 없습니다.",
  },
  done: {
    label: "완료",
    bg: "bg-green-50",
    headerBg: "bg-green-100",
    border: "border-green-200",
    emptyText: "완료된 목표가 없습니다.",
  },
};

const PRIORITY_CONFIG: Record<
  GoalBoardPriority,
  { label: string; className: string }
> = {
  low: {
    label: "낮음",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
  medium: {
    label: "보통",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  high: {
    label: "높음",
    className: "bg-red-100 text-red-600 hover:bg-red-100",
  },
};

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isDueSoon(dueDate: string): boolean {
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

// ─── 단일 목표 카드 ──────────────────────────────────────────
function GoalCard({
  item,
  onMoveForward,
  onMoveBackward,
  onDelete,
}: {
  item: GoalBoardItem;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onDelete: () => void;
}) {
  const priorityCfg = PRIORITY_CONFIG[item.priority];
  const canGoForward = item.status !== "done";
  const canGoBackward = item.status !== "todo";

  const dueDateColor = item.dueDate
    ? isOverdue(item.dueDate) && item.status !== "done"
      ? "text-red-500 font-semibold"
      : isDueSoon(item.dueDate) && item.status !== "done"
      ? "text-orange-500 font-semibold"
      : "text-gray-400"
    : "";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* 제목 + 우선순위 */}
      <div className="mb-1.5 flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-snug text-gray-800 flex-1 break-words">
          {item.title}
        </p>
        <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${priorityCfg.className}`}>
          <Flag className="mr-0.5 h-2.5 w-2.5" />
          {priorityCfg.label}
        </Badge>
      </div>

      {/* 설명 */}
      {item.description && (
        <p className="mb-1.5 text-[11px] leading-relaxed text-gray-500 break-words line-clamp-2">
          {item.description}
        </p>
      )}

      {/* 담당자 */}
      {item.assignees.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {item.assignees.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600"
            >
              <User className="h-2.5 w-2.5" />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 마감일 */}
      {item.dueDate && (
        <div className={`mb-1.5 flex items-center gap-0.5 text-[10px] ${dueDateColor}`}>
          <Calendar className="h-3 w-3" />
          {item.dueDate}
          {isOverdue(item.dueDate) && item.status !== "done" && " (마감 초과)"}
          {isDueSoon(item.dueDate) && !isOverdue(item.dueDate) && item.status !== "done" && " (마감 임박)"}
        </div>
      )}

      {/* 작성자 + 날짜 */}
      <p className="mb-2 text-[10px] text-gray-400">
        {item.createdBy} · {formatDate(item.createdAt)}
        {item.completedAt && ` · 완료 ${formatDate(item.completedAt)}`}
      </p>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={onMoveBackward}
            disabled={!canGoBackward}
            title="이전 단계로"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-green-500"
            onClick={onMoveForward}
            disabled={!canGoForward}
            title="다음 단계로"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 칸반 열 ─────────────────────────────────────────────────
function KanbanColumn({
  status,
  items,
  onMoveForward,
  onMoveBackward,
  onDelete,
}: {
  status: GoalBoardStatus;
  items: GoalBoardItem[];
  onMoveForward: (id: string) => void;
  onMoveBackward: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = COLUMN_CONFIG[status];

  return (
    <div className={`flex flex-col rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* 열 헤더 */}
      <div className={`flex items-center justify-between px-3 py-2 ${cfg.headerBg}`}>
        <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
        <Badge className="bg-white text-[10px] px-1.5 py-0 text-gray-600 hover:bg-white">
          {items.length}
        </Badge>
      </div>

      {/* 카드 목록 */}
      <div className="flex flex-col gap-2 p-2 min-h-[80px]">
        {items.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-gray-400">{cfg.emptyText}</p>
        ) : (
          items.map((item) => (
            <GoalCard
              key={item.id}
              item={item}
              onMoveForward={() => onMoveForward(item.id)}
              onMoveBackward={() => onMoveBackward(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── 목표 추가 폼 ─────────────────────────────────────────────
function AddGoalForm({
  onAdd,
}: {
  onAdd: (params: AddGoalParams) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<GoalBoardPriority>("medium");
  const [assigneesRaw, setAssigneesRaw] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    const assignees = assigneesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = onAdd({
      title: title.trim(),
      description: description.trim(),
      priority,
      assignees,
      dueDate: dueDate || undefined,
      createdBy: createdBy.trim(),
    });

    if (ok) {
      toast.success("목표가 추가되었습니다.");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssigneesRaw("");
      setDueDate("");
      setCreatedBy("");
      setOpen(false);
    } else {
      toast.error("목표 추가에 실패했습니다.");
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 w-full text-xs border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        목표 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-700">새 목표 추가</p>

      {/* 제목 */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 60))}
        placeholder="목표 제목 (최대 60자)"
        className="mb-2 h-8 text-xs"
      />

      {/* 설명 */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 200))}
        placeholder="설명 (선택, 최대 200자)"
        className="mb-2 min-h-[56px] resize-none text-xs"
      />

      {/* 우선순위 */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500">우선순위:</span>
        {(["low", "medium", "high"] as GoalBoardPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all border ${
              priority === p
                ? p === "low"
                  ? "bg-gray-200 text-gray-700 border-gray-400"
                  : p === "medium"
                  ? "bg-yellow-200 text-yellow-800 border-yellow-400"
                  : "bg-red-200 text-red-700 border-red-400"
                : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
            }`}
          >
            {PRIORITY_CONFIG[p].label}
          </button>
        ))}
      </div>

      {/* 담당자 + 마감일 */}
      <div className="mb-2 flex gap-2">
        <Input
          value={assigneesRaw}
          onChange={(e) => setAssigneesRaw(e.target.value)}
          placeholder="담당자 (쉼표로 구분)"
          className="h-8 flex-1 text-xs"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="마감일 (선택)"
        />
      </div>

      {/* 작성자 */}
      <Input
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value.slice(0, 20))}
        placeholder="작성자 이름 (선택)"
        className="mb-3 h-8 text-xs"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
        >
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-500"
          onClick={() => setOpen(false)}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
interface PracticeGoalBoardCardProps {
  groupId: string;
}

export function PracticeGoalBoardCard({ groupId }: PracticeGoalBoardCardProps) {
  const [open, setOpen] = useState(true);
  const { grouped, stats, addItem, moveForward, moveBackward, deleteItem } =
    usePracticeGoalBoard(groupId);

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success("목표가 삭제되었습니다.");
  };

  const STATUS_COLUMNS: GoalBoardStatus[] = ["todo", "in_progress", "done"];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">연습 목표 보드</span>
          {stats.total > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {stats.total}
            </Badge>
          )}
          {stats.doneCount > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              완료 {stats.doneCount}
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4">
          {/* 칸반 3열 */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {STATUS_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                items={grouped[status]}
                onMoveForward={moveForward}
                onMoveBackward={moveBackward}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <Separator className="mb-4" />

          {/* 목표 추가 폼 */}
          <AddGoalForm onAdd={addItem} />

          {/* 하단 통계 */}
          {stats.total > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  전체 {stats.total}개 · 완료 {stats.doneCount}개 · 진행 {stats.inProgressCount}개 · 할 일 {stats.todoCount}개
                </span>
                <span className="text-[11px] font-semibold text-green-600">
                  {stats.completionRate}%
                </span>
              </div>
              <Progress value={stats.completionRate} className="h-1.5" />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
