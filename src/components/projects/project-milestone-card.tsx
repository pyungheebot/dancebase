"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Flag,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  ListTodo,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useProjectMilestoneCard } from "@/hooks/use-project-milestone-card";
import type { ProjectMilestoneCard } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ================================================================
// 유틸 함수
// ================================================================

/** YYYY-MM-DD → 한국어 날짜 */

/** 마감일 기준 D-Day 텍스트 */
function getDdayText(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/** D-Day에 따른 배지 색상 클래스 */
function getDdayClass(dueDate: string, isCompleted: boolean): string {
  if (isCompleted) return "bg-green-100 text-green-700";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "bg-red-100 text-red-600";
  if (diff <= 3) return "bg-orange-100 text-orange-700";
  if (diff <= 7) return "bg-yellow-100 text-yellow-700";
  return "bg-muted text-muted-foreground";
}

// ================================================================
// SVG 타임라인 차트 컴포넌트
// ================================================================

type SvgTimelineProps = {
  milestones: ProjectMilestoneCard[];
  getRate: (id: string) => number;
};

function SvgTimeline({ milestones, getRate }: SvgTimelineProps) {
  if (milestones.length === 0) return null;

  const SVG_WIDTH = 320;
  const NODE_R = 8;
  const ROW_H = 36;
  const LEFT_PAD = 20;
  const BAR_START = 80;
  const BAR_END = SVG_WIDTH - 20;
  const BAR_W = BAR_END - BAR_START;
  const SVG_HEIGHT = milestones.length * ROW_H + 8;

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full"
      style={{ maxHeight: SVG_HEIGHT }}
      aria-label="마일스톤 타임라인"
    >
      {/* 세로 연결선 */}
      {milestones.length > 1 && (
        <line
          x1={LEFT_PAD + NODE_R}
          y1={ROW_H * 0.5}
          x2={LEFT_PAD + NODE_R}
          y2={ROW_H * (milestones.length - 1) + ROW_H * 0.5}
          stroke="#e2e8f0"
          strokeWidth={2}
        />
      )}

      {milestones.map((m, i) => {
        const cx = LEFT_PAD + NODE_R;
        const cy = i * ROW_H + ROW_H / 2 + 4;
        const rate = getRate(m.id);
        const isCompleted = m.tasks.length > 0 && m.tasks.every((t) => t.completed);
        const barFillWidth = (BAR_W * rate) / 100;

        return (
          <g key={m.id}>
            {/* 노드 원 */}
            <circle
              cx={cx}
              cy={cy}
              r={NODE_R}
              fill={isCompleted ? "#22c55e" : "#f1f5f9"}
              stroke={isCompleted ? "#16a34a" : "#94a3b8"}
              strokeWidth={1.5}
            />
            {/* 완료 체크 */}
            {isCompleted && (
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="white"
                fontWeight="bold"
              >
                ✓
              </text>
            )}

            {/* 진행률 바 배경 */}
            <rect
              x={BAR_START}
              y={cy - 5}
              width={BAR_W}
              height={10}
              rx={5}
              fill="#f1f5f9"
            />
            {/* 진행률 바 채움 */}
            {rate > 0 && (
              <rect
                x={BAR_START}
                y={cy - 5}
                width={barFillWidth}
                height={10}
                rx={5}
                fill={isCompleted ? "#22c55e" : "#6366f1"}
              />
            )}

            {/* 마일스톤 제목 (노드와 바 사이) */}
            <text
              x={cx + NODE_R + 6}
              y={cy}
              dominantBaseline="middle"
              fontSize={9}
              fill="#475569"
              className="font-medium"
            >
              {m.title.length > 7 ? m.title.slice(0, 7) + "…" : m.title}
            </text>

            {/* 진행률 텍스트 */}
            <text
              x={BAR_END + 4}
              y={cy}
              dominantBaseline="middle"
              fontSize={8}
              fill="#94a3b8"
            >
              {rate}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ================================================================
// 마일스톤 추가 다이얼로그
// ================================================================

type AddMilestoneDialogProps = {
  onAdd: (title: string, description: string, dueDate: string) => void;
  disabled: boolean;
};

function AddMilestoneDialog({ onAdd, disabled }: AddMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.MILESTONE.TITLE_REQUIRED);
      return;
    }
    if (!dueDate) {
      toast.error(TOAST.MILESTONE.DATE_REQUIRED);
      return;
    }
    onAdd(title.trim(), description.trim(), dueDate);
    setTitle("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
          마일스톤 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 마일스톤 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">제목 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 안무 완성"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">설명 (선택)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="마일스톤에 대한 설명을 입력하세요"
              className="text-xs resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">마감일 *</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================================================================
// 단일 마일스톤 항목 컴포넌트
// ================================================================

type MilestoneItemProps = {
  milestone: ProjectMilestoneCard;
  completionRate: number;
  canEdit: boolean;
  onDeleteMilestone: (id: string, title: string) => void;
  onAddTask: (milestoneId: string, taskTitle: string) => boolean | void;
  onToggleTask: (milestoneId: string, taskId: string) => void;
  maxTasks: number;
};

function MilestoneItem({
  milestone,
  completionRate,
  canEdit,
  onDeleteMilestone,
  onAddTask,
  onToggleTask,
  maxTasks,
}: MilestoneItemProps) {
  const [open, setOpen] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const isCompleted =
    milestone.tasks.length > 0 && milestone.tasks.every((t) => t.completed);
  const ddayText = getDdayText(milestone.dueDate);
  const ddayClass = getDdayClass(milestone.dueDate, isCompleted);

  const handleAddTask = () => {
    const trimmed = taskTitle.trim();
    if (!trimmed) {
      toast.error(TOAST.MILESTONE.TASK_NAME_REQUIRED);
      return;
    }
    const ok = onAddTask(milestone.id, trimmed);
    if (ok === false) {
      toast.error(`작업은 최대 ${maxTasks}개까지 추가할 수 있습니다`);
      return;
    }
    setTaskTitle("");
    setAddingTask(false);
    toast.success(TOAST.MILESTONE.TASK_ADDED);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-md bg-card overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
          >
            {/* 완료 아이콘 */}
            <span className="mt-0.5 shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </span>

            {/* 제목 + 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-medium ${
                    isCompleted ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {milestone.title}
                </span>
                <Badge
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${ddayClass}`}
                  variant="secondary"
                >
                  {isCompleted ? "완료" : ddayText}
                </Badge>
              </div>
              {/* 진행률 바 */}
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ListTodo className="h-3 w-3" />
                    <span>
                      {milestone.tasks.filter((t) => t.completed).length}/
                      {milestone.tasks.length} 완료
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} className="h-1" />
              </div>
            </div>

            {/* 펼침 아이콘 */}
            <span className="mt-0.5 shrink-0 text-muted-foreground">
              {open ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
        </CollapsibleTrigger>

        {/* 펼쳐진 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t">
            {/* 설명 + 마감일 */}
            <div className="pt-2 space-y-1">
              {milestone.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {milestone.description}
                </p>
              )}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>마감일: {formatYearMonthDay(milestone.dueDate)}</span>
              </div>
            </div>

            {/* 세부 작업 목록 */}
            {milestone.tasks.length > 0 && (
              <ul className="space-y-1">
                {milestone.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleTask(milestone.id, task.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={task.completed ? "작업 미완료로 변경" : "작업 완료로 변경"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span
                      className={`text-xs flex-1 ${
                        task.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* 작업 추가 */}
            {canEdit && (
              <div className="ml-5">
                {addingTask ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="작업 이름 입력"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTask();
                        if (e.key === "Escape") {
                          setAddingTask(false);
                          setTaskTitle("");
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2 shrink-0"
                      onClick={handleAddTask}
                    >
                      추가
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 shrink-0"
                      onClick={() => {
                        setAddingTask(false);
                        setTaskTitle("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-1"
                    onClick={() => setAddingTask(true)}
                    disabled={milestone.tasks.length >= maxTasks}
                  >
                    <Plus className="h-3 w-3" />
                    작업 추가
                    {milestone.tasks.length >= maxTasks && (
                      <span className="text-[10px] text-muted-foreground">
                        (최대 {maxTasks}개)
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* 삭제 버튼 */}
            {canEdit && (
              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-destructive px-2"
                  onClick={() => onDeleteMilestone(milestone.id, milestone.title)}
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ================================================================
// 메인 컴포넌트
// ================================================================

type ProjectMilestoneCardProps = {
  groupId: string;
  projectId: string;
  projectName?: string;
  canEdit?: boolean;
};

export function ProjectMilestoneCardSection({
  groupId,
  projectId,
  projectName = "프로젝트",
  canEdit = false,
}: ProjectMilestoneCardProps) {
  const [sectionOpen, setSectionOpen] = useState(true);

  const {
    milestones,
    addMilestone,
    deleteMilestone,
    addTask,
    toggleTask,
    getCompletionRate,
    completedCount,
    overallRate,
    maxMilestones,
    maxTasks,
  } = useProjectMilestoneCard(groupId, projectId);

  const handleAddMilestone = (
    title: string,
    description: string,
    dueDate: string
  ) => {
    const ok = addMilestone(title, description, dueDate);
    if (ok === false) {
      toast.error(`마일스톤은 최대 ${maxMilestones}개까지 추가할 수 있습니다`);
      return;
    }
    toast.success(TOAST.MILESTONE.ADDED);
  };

  const handleDeleteMilestone = (id: string, title: string) => {
    deleteMilestone(id);
    toast.success(`"${title}" 마일스톤을 삭제했습니다`);
  };

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 group"
          onClick={() => setSectionOpen((v) => !v)}
        >
          <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">마일스톤 트래커</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 shrink-0 ${
              overallRate === 100
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            }`}
            variant="secondary"
          >
            {overallRate}%
          </Badge>
          {completedCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 shrink-0 bg-green-100 text-green-700"
              variant="secondary"
            >
              <CheckCheck className="h-2.5 w-2.5 mr-0.5" />
              {completedCount}/{milestones.length}
            </Badge>
          )}
          <span className="text-muted-foreground ml-1">
            {sectionOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {/* 마일스톤 추가 버튼 */}
        {canEdit && sectionOpen && (
          <AddMilestoneDialog
            onAdd={handleAddMilestone}
            disabled={milestones.length >= maxMilestones}
          />
        )}
      </div>

      {/* 섹션 본문 */}
      {sectionOpen && (
        <div className="space-y-3 pl-1">
          {/* 전체 진행률 요약 */}
          {milestones.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">
                  {projectName}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {completedCount} / {milestones.length} 완료
                </span>
              </div>
              {/* SVG 타임라인 */}
              <SvgTimeline
                milestones={milestones}
                getRate={getCompletionRate}
              />
            </div>
          )}

          {/* 마일스톤 목록 */}
          {milestones.length === 0 ? (
            <p className="text-[11px] text-muted-foreground pl-2">
              마일스톤이 없습니다.{" "}
              {canEdit ? "위의 추가 버튼으로 첫 마일스톤을 만들어보세요." : ""}
            </p>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => (
                <MilestoneItem
                  key={m.id}
                  milestone={m}
                  completionRate={getCompletionRate(m.id)}
                  canEdit={canEdit}
                  onDeleteMilestone={handleDeleteMilestone}
                  onAddTask={(milestoneId, taskTitle) => {
                    const ok = addTask(milestoneId, taskTitle);
                    return ok;
                  }}
                  onToggleTask={toggleTask}
                  maxTasks={maxTasks}
                />
              ))}
            </div>
          )}

          {/* 상한 안내 */}
          {canEdit && milestones.length >= maxMilestones && (
            <p className="text-[11px] text-muted-foreground pl-2">
              마일스톤은 최대 {maxMilestones}개까지 추가할 수 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
