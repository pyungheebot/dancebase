"use client";

import { useState } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  User,
  BarChart2,
  ChevronRight,
  Pencil,
  Check,
  X,
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
import type {
  PracticeGoalEntry,
  PracticeGoalCategory,
  PracticeGoalStatus,
} from "@/types";

// ─── 카테고리 설정 ────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  PracticeGoalCategory,
  { label: string; className: string }
> = {
  choreography: {
    label: "안무완성",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  fitness: {
    label: "체력향상",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  sync: {
    label: "동기화",
    className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  },
  technique: {
    label: "기술향상",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  other: {
    label: "기타",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
};

// ─── 상태 설정 ────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  PracticeGoalStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "진행중",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  completed: {
    label: "완료",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  paused: {
    label: "보류",
    dotClass: "bg-yellow-400",
    badgeClass: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
};

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

function isDueSoon(dueDate: string): boolean {
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

// ─── 진행률 슬라이더 ──────────────────────────────────────────
function ProgressSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-violet-500"
      />
      <span className="w-8 text-right text-[11px] font-semibold text-violet-600">
        {value}%
      </span>
    </div>
  );
}

// ─── 하위 목표 섹션 ───────────────────────────────────────────
function SubTaskSection({
  goalId,
  subTasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  goalId: string;
  subTasks: PracticeGoalEntry["subTasks"];
  onAdd: (goalId: string, title: string) => boolean;
  onToggle: (goalId: string, subId: string) => void;
  onDelete: (goalId: string, subId: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    const ok = onAdd(goalId, input.trim());
    if (ok) {
      setInput("");
    } else {
      toast.error("하위 목표 추가에 실패했습니다.");
    }
  };

  return (
    <div className="mt-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        하위 목표
      </p>
      {subTasks.length > 0 && (
        <ul className="mb-1.5 space-y-1">
          {subTasks.map((sub) => (
            <li key={sub.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggle(goalId, sub.id)}
                className="shrink-0 text-gray-400 hover:text-violet-500"
              >
                {sub.done ? (
                  <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Square className="h-3.5 w-3.5" />
                )}
              </button>
              <span
                className={`flex-1 text-[11px] leading-snug ${
                  sub.done ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {sub.title}
              </span>
              <button
                type="button"
                onClick={() => onDelete(goalId, sub.id)}
                className="shrink-0 text-gray-300 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 50))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="하위 목표 입력 후 Enter"
          className="h-7 flex-1 text-[11px]"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-violet-500"
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 단일 목표 카드 ──────────────────────────────────────────
function GoalCard({
  entry,
  onUpdateProgress,
  onChangeStatus,
  onDelete,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
}: {
  entry: PracticeGoalEntry;
  onUpdateProgress: (id: string, v: number) => void;
  onChangeStatus: (id: string, s: PracticeGoalStatus) => void;
  onDelete: (id: string) => void;
  onAddSubTask: (goalId: string, title: string) => boolean;
  onToggleSubTask: (goalId: string, subId: string) => void;
  onDeleteSubTask: (goalId: string, subId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[entry.category];
  const stsCfg = STATUS_CONFIG[entry.status];

  const dueDateColor = entry.dueDate
    ? isOverdue(entry.dueDate) && entry.status !== "completed"
      ? "text-red-500 font-semibold"
      : isDueSoon(entry.dueDate) && entry.status !== "completed"
      ? "text-orange-500 font-semibold"
      : "text-gray-400"
    : "";

  const STATUS_CYCLES: PracticeGoalStatus[] = ["active", "paused", "completed"];
  const nextStatus =
    STATUS_CYCLES[(STATUS_CYCLES.indexOf(entry.status) + 1) % STATUS_CYCLES.length];

  return (
    <div className="rounded-lg border border-gray-200 bg-card shadow-sm">
      {/* 카드 헤더 */}
      <div className="flex items-start gap-2 p-3 pb-2">
        {/* 상태 점 */}
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${stsCfg.dotClass}`}
        />

        {/* 제목 + 배지들 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug text-gray-800 break-words">
            {entry.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge className={`text-[10px] px-1.5 py-0 ${catCfg.className}`}>
              {catCfg.label}
            </Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${stsCfg.badgeClass}`}>
              {stsCfg.label}
            </Badge>
          </div>
        </div>

        {/* 확장 토글 */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="px-3 pb-2">
        <ProgressSlider
          value={entry.progress}
          onChange={(v) => onUpdateProgress(entry.id, v)}
        />
        <Progress value={entry.progress} className="mt-1 h-1" />
      </div>

      {/* 확장 영역 */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2">
          {/* 설명 */}
          {entry.description && (
            <p className="mb-2 text-[11px] leading-relaxed text-gray-500 break-words">
              {entry.description}
            </p>
          )}

          {/* 담당자 */}
          {entry.assignees.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {entry.assignees.map((name, i) => (
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
          {entry.dueDate && (
            <div
              className={`mb-2 flex items-center gap-0.5 text-[10px] ${dueDateColor}`}
            >
              <Calendar className="h-3 w-3" />
              {entry.dueDate}
              {isOverdue(entry.dueDate) &&
                entry.status !== "completed" &&
                " (마감 초과)"}
              {isDueSoon(entry.dueDate) &&
                !isOverdue(entry.dueDate) &&
                entry.status !== "completed" &&
                " (마감 임박)"}
            </div>
          )}

          {/* 하위 목표 */}
          <SubTaskSection
            goalId={entry.id}
            subTasks={entry.subTasks}
            onAdd={onAddSubTask}
            onToggle={onToggleSubTask}
            onDelete={onDeleteSubTask}
          />

          {/* 액션 */}
          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => onChangeStatus(entry.id, nextStatus)}
              title={`${STATUS_CONFIG[nextStatus].label}(으)로 변경`}
            >
              <Pencil className="mr-1 h-2.5 w-2.5" />
              {STATUS_CONFIG[nextStatus].label}으로
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-300 hover:text-red-400"
              onClick={() => onDelete(entry.id)}
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* 수정 시각 */}
          <p className="mt-1.5 text-[10px] text-gray-300">
            수정: {formatDate(entry.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 목표 추가 폼 ─────────────────────────────────────────────
function AddGoalForm({ onAdd }: { onAdd: (params: AddGoalParams) => boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PracticeGoalCategory>("choreography");
  const [dueDate, setDueDate] = useState("");
  const [assigneesRaw, setAssigneesRaw] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("목표 제목을 입력해주세요.");
      return;
    }
    const assignees = assigneesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ok = onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      dueDate: dueDate || undefined,
      assignees,
    });
    if (ok) {
      toast.success("목표가 추가되었습니다.");
      setTitle("");
      setDescription("");
      setCategory("choreography");
      setDueDate("");
      setAssigneesRaw("");
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
        새 목표 추가
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/40 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-700">새 연습 목표</p>

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
        className="mb-2 min-h-[52px] resize-none text-xs"
      />

      {/* 카테고리 */}
      <div className="mb-2">
        <p className="mb-1 text-[11px] text-gray-500">카테고리</p>
        <div className="flex flex-wrap gap-1">
          {(
            Object.keys(CATEGORY_CONFIG) as PracticeGoalCategory[]
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                category === cat
                  ? CATEGORY_CONFIG[cat].className + " border-transparent"
                  : "bg-background text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {CATEGORY_CONFIG[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* 담당자 + 마감일 */}
      <div className="mb-3 flex gap-2">
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
          className="rounded-md border border-gray-200 bg-background px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-300"
          title="기한 (선택)"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSubmit}>
          <Check className="mr-1 h-3 w-3" />
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

// ─── 상태 탭 ─────────────────────────────────────────────────
type TabStatus = "all" | PracticeGoalStatus;

const TABS: { value: TabStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행중" },
  { value: "paused", label: "보류" },
  { value: "completed", label: "완료" },
];

// ─── 메인 카드 ────────────────────────────────────────────────
interface PracticeGoalBoardCardProps {
  groupId: string;
}

export function PracticeGoalBoardCard({ groupId }: PracticeGoalBoardCardProps) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<TabStatus>("all");

  const {
    entries,
    grouped,
    stats,
    addGoal,
    setProgress,
    setStatus,
    deleteGoal,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
  } = usePracticeGoalBoard(groupId);

  const handleDelete = (id: string) => {
    deleteGoal(id);
    toast.success("목표가 삭제되었습니다.");
  };

  const filteredEntries: PracticeGoalEntry[] =
    tab === "all"
      ? entries
      : tab === "active"
      ? grouped.active
      : tab === "paused"
      ? grouped.paused
      : grouped.completed;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">
            연습 목표 보드
          </span>
          {stats.total > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {stats.total}
            </Badge>
          )}
          {stats.completedCount > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              완료 {stats.completedCount}
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
        <div className="rounded-b-lg border border-gray-200 bg-card p-4">
          {/* 상태 탭 */}
          <div className="mb-3 flex items-center gap-1 border-b border-gray-100 pb-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  tab === t.value
                    ? "bg-violet-100 text-violet-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t.label}
                {t.value !== "all" && (
                  <span className="ml-1 text-[10px] text-gray-400">
                    {t.value === "active"
                      ? stats.activeCount
                      : t.value === "paused"
                      ? stats.pausedCount
                      : stats.completedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 목표 목록 */}
          {filteredEntries.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">
              {tab === "all"
                ? "아직 등록된 목표가 없습니다."
                : `${TABS.find((t) => t.value === tab)?.label} 상태의 목표가 없습니다.`}
            </p>
          ) : (
            <div className="mb-4 space-y-2.5">
              {filteredEntries.map((entry) => (
                <GoalCard
                  key={entry.id}
                  entry={entry}
                  onUpdateProgress={setProgress}
                  onChangeStatus={setStatus}
                  onDelete={handleDelete}
                  onAddSubTask={addSubTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteSubTask={deleteSubTask}
                />
              ))}
            </div>
          )}

          <Separator className="mb-4" />

          {/* 목표 추가 폼 */}
          <AddGoalForm onAdd={addGoal} />

          {/* 하단 통계 */}
          {stats.total > 0 && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <div className="mb-2 flex items-center gap-1">
                <BarChart2 className="h-3 w-3 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500">
                  전체 현황
                </span>
              </div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  전체 {stats.total}개 · 진행중 {stats.activeCount}개 · 보류{" "}
                  {stats.pausedCount}개 · 완료 {stats.completedCount}개
                </span>
                <span className="text-[11px] font-semibold text-green-600">
                  {stats.completionRate}%
                </span>
              </div>
              <Progress value={stats.completionRate} className="mb-2 h-1.5" />
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>평균 진행률</span>
                <span className="font-semibold text-violet-600">
                  {stats.avgProgress}%
                </span>
              </div>
              <Progress value={stats.avgProgress} className="mt-1 h-1" />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
