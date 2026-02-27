"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import type { EntityContext } from "@/types/entity-context";
import type { ProjectTask } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface ProjectTaskBoardProps {
  ctx: EntityContext;
}

// 날짜 포맷
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const isOverdue = d < now;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${isOverdue ? "⚠ " : ""}${month}/${day}`;
}

// 마감일 색상
function getDueDateColor(dateStr: string | null): string {
  if (!dateStr) return "text-muted-foreground";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "text-red-500";
  if (diff <= 3) return "text-orange-500";
  return "text-muted-foreground";
}

// ============================================
// 할 일 항목 컴포넌트
// ============================================

interface TaskItemProps {
  task: ProjectTask;
  ctx: EntityContext;
  onToggle: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  canDelete: boolean;
}

function TaskItem({ task, ctx, onToggle, onDelete, canDelete }: TaskItemProps) {
  const isDone = task.status === "done";

  // 담당자 이름/이니셜
  let assigneeName = "";
  let assigneeInitial = "";
  if (task.assignee_id) {
    const member = ctx.members.find((m) => m.userId === task.assignee_id);
    if (member) {
      assigneeName = ctx.nicknameMap[member.userId] || member.profile.name || "알 수 없음";
      assigneeInitial = assigneeName.charAt(0).toUpperCase();
    }
  }

  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/30 group">
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggle(task)}
        className="h-3.5 w-3.5 shrink-0"
      />
      <span
        className={`flex-1 text-xs min-w-0 truncate ${
          isDone ? "line-through text-muted-foreground" : "text-foreground"
        }`}
      >
        {task.title}
      </span>

      {/* 담당자 아바타 */}
      {task.assignee_id && assigneeInitial && (
        <Avatar className="h-4 w-4 shrink-0" title={assigneeName}>
          <AvatarFallback className="text-[8px]">{assigneeInitial}</AvatarFallback>
        </Avatar>
      )}

      {/* 마감일 */}
      {task.due_date && (
        <span
          className={`flex items-center gap-0.5 text-[10px] shrink-0 ${getDueDateColor(task.due_date)}`}
        >
          <Calendar className="h-2.5 w-2.5" />
          {formatDate(task.due_date)}
        </span>
      )}

      {/* 삭제 버튼 */}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}

// ============================================
// 섹션 헤더 (접이식)
// ============================================

interface SectionHeaderProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  badgeVariant?: "default" | "secondary" | "outline";
  badgeClass?: string;
}

function SectionHeader({
  label,
  count,
  isOpen,
  onToggle,
  badgeClass,
}: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full text-left py-1 hover:bg-muted/20 rounded px-1"
    >
      {isOpen ? (
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
      <span className="text-xs font-medium">{label}</span>
      {count > 0 && (
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 ml-0.5 ${badgeClass ?? ""}`}
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

// ============================================
// 인라인 추가 폼
// ============================================

interface InlineAddFormProps {
  onAdd: (title: string) => Promise<boolean>;
}

function InlineAddForm({ onAdd }: InlineAddFormProps) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAdding(true);
    const ok = await onAdd(trimmed);
    if (ok) {
      setValue("");
      inputRef.current?.focus();
    }
    setAdding(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="새 할 일 추가 (Enter)"
        className="h-7 text-xs flex-1 border-dashed"
        disabled={adding}
      />
      {adding && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
    </div>
  );
}

// ============================================
// 메인 보드 컴포넌트
// ============================================

export function ProjectTaskBoard({ ctx }: ProjectTaskBoardProps) {
  const {
    todoTasks,
    inProgressTasks,
    doneTasks,
    loading,
    totalCount,
    doneCount,
    completionRate,
    createTask,
    toggleTaskDone,
    deleteTask,
  } = useProjectTasks(ctx.projectId ?? "");

  const [todoOpen, setTodoOpen] = useState(true);
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [doneOpen, setDoneOpen] = useState(false);

  const canManage = ctx.permissions.canEdit || ctx.permissions.canManageMembers;

  // projectId가 없으면 렌더 안 함
  if (!ctx.projectId) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="px-3 py-2.5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
          할 일 보드
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {doneCount}/{totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 py-3">
        {/* 완료율 프로그레스 바 */}
        {totalCount > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">완료율</span>
              <span className="text-[10px] font-medium text-foreground">
                {completionRate}%
              </span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">할 일이 없습니다</p>
            {canManage && (
              <p className="text-[10px] mt-0.5">아래에서 첫 할 일을 추가하세요</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 할 일 섹션 */}
            <div>
              <SectionHeader
                label="할 일"
                count={todoTasks.length}
                isOpen={todoOpen}
                onToggle={() => setTodoOpen((v) => !v)}
                badgeClass="bg-blue-100 text-blue-700"
              />
              {todoOpen && todoTasks.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {todoTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      ctx={ctx}
                      onToggle={toggleTaskDone}
                      onDelete={deleteTask}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 진행 중 섹션 */}
            <div>
              <SectionHeader
                label="진행 중"
                count={inProgressTasks.length}
                isOpen={inProgressOpen}
                onToggle={() => setInProgressOpen((v) => !v)}
                badgeClass="bg-yellow-100 text-yellow-700"
              />
              {inProgressOpen && inProgressTasks.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {inProgressTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      ctx={ctx}
                      onToggle={toggleTaskDone}
                      onDelete={deleteTask}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 완료 섹션 */}
            <div>
              <SectionHeader
                label="완료"
                count={doneTasks.length}
                isOpen={doneOpen}
                onToggle={() => setDoneOpen((v) => !v)}
                badgeClass="bg-green-100 text-green-700"
              />
              {doneOpen && doneTasks.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {doneTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      ctx={ctx}
                      onToggle={toggleTaskDone}
                      onDelete={deleteTask}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 인라인 추가 폼 */}
        {canManage && (
          <div className="mt-3 pt-2 border-t">
            <InlineAddForm onAdd={createTask} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
