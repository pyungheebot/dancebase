"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Lightbulb,
  Music,
  Package,
  Clock,
  CheckCircle2,
  Circle,
  GripVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Separator } from "@/components/ui/separator";

import { useStageTransition } from "@/hooks/use-stage-transition";
import type { StageTransitionEntry, StageTransitionTask } from "@/types";

// ─── 시간 포맷 헬퍼 ────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds === 0) return "0초";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}초`;
  if (s === 0) return `${m}분`;
  return `${m}분 ${s}초`;
}

// ─── 완료율 계산 ───────────────────────────────────────────────

function calcCompletionRate(entry: StageTransitionEntry): number {
  if (entry.tasks.length === 0) return 0;
  const done = entry.tasks.filter((t) => t.isCompleted).length;
  return Math.round((done / entry.tasks.length) * 100);
}

// ─── 태스크 추가 폼 ────────────────────────────────────────────

interface TaskFormState {
  description: string;
  assignee: string;
  durationSeconds: string;
}

const emptyTaskForm: TaskFormState = {
  description: "",
  assignee: "",
  durationSeconds: "30",
};

// ─── 전환 추가 다이얼로그 ──────────────────────────────────────

interface AddTransitionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    payload: Omit<
      StageTransitionEntry,
      "id" | "tasks" | "totalDuration" | "createdAt" | "transitionOrder"
    >
  ) => Promise<string>;
}

function AddTransitionDialog({ open, onClose, onAdd }: AddTransitionDialogProps) {
  const [fromScene, setFromScene] = useState("");
  const [toScene, setToScene] = useState("");
  const [notes, setNotes] = useState("");
  const [lightingChange, setLightingChange] = useState("");
  const [musicChange, setMusicChange] = useState("");
  const [propInput, setPropInput] = useState("");
  const [propsNeeded, setPropsNeeded] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setFromScene("");
    setToScene("");
    setNotes("");
    setLightingChange("");
    setMusicChange("");
    setPropInput("");
    setPropsNeeded([]);
  }

  function handleAddProp() {
    const trimmed = propInput.trim();
    if (!trimmed) return;
    if (propsNeeded.includes(trimmed)) {
      toast.error("이미 추가된 소품입니다.");
      return;
    }
    setPropsNeeded((prev) => [...prev, trimmed]);
    setPropInput("");
  }

  function handleRemoveProp(prop: string) {
    setPropsNeeded((prev) => prev.filter((p) => p !== prop));
  }

  async function handleSubmit() {
    if (!fromScene.trim() || !toScene.trim()) {
      toast.error("이전 장면과 다음 장면을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        fromScene: fromScene.trim(),
        toScene: toScene.trim(),
        notes: notes.trim() || undefined,
        lightingChange: lightingChange.trim() || undefined,
        musicChange: musicChange.trim() || undefined,
        propsNeeded,
      });
      toast.success("전환이 추가되었습니다.");
      resetForm();
      onClose();
    } catch {
      toast.error("전환 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">무대 전환 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 이전/다음 장면 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">이전 장면 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 1막 1장"
                value={fromScene}
                onChange={(e) => setFromScene(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">다음 장면 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 1막 2장"
                value={toScene}
                onChange={(e) => setToScene(e.target.value)}
              />
            </div>
          </div>

          {/* 조명 변경 */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-yellow-500" />
              조명 변경 사항
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 블루 스팟 → 앰버 풀"
              value={lightingChange}
              onChange={(e) => setLightingChange(e.target.value)}
            />
          </div>

          {/* 음악 변경 */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Music className="h-3 w-3 text-purple-500" />
              음악 변경 사항
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 트랙 3 페이드아웃 → 트랙 4"
              value={musicChange}
              onChange={(e) => setMusicChange(e.target.value)}
            />
          </div>

          {/* 필요 소품 */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Package className="h-3 w-3 text-orange-500" />
              필요 소품
            </Label>
            <div className="flex gap-2">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="소품 이름 입력"
                value={propInput}
                onChange={(e) => setPropInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProp();
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={handleAddProp}
              >
                추가
              </Button>
            </div>
            {propsNeeded.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {propsNeeded.map((prop) => (
                  <Badge
                    key={prop}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 flex items-center gap-1"
                  >
                    {prop}
                    <button
                      onClick={() => handleRemoveProp(prop)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="추가 안내사항을 입력하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
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
            {saving ? "저장 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 태스크 추가 인라인 폼 ────────────────────────────────────

interface InlineTaskFormProps {
  onAdd: (task: Omit<StageTransitionTask, "id" | "isCompleted">) => void | Promise<string | null | void>;
  onCancel: () => void;
}

function InlineTaskForm({ onAdd, onCancel }: InlineTaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(emptyTaskForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.description.trim()) {
      toast.error("태스크 내용을 입력해주세요.");
      return;
    }
    const dur = parseInt(form.durationSeconds, 10);
    if (isNaN(dur) || dur < 0) {
      toast.error("올바른 소요 시간을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        description: form.description.trim(),
        assignee: form.assignee.trim() || undefined,
        durationSeconds: dur,
      });
      toast.success("태스크가 추가되었습니다.");
      setForm(emptyTaskForm);
      onCancel();
    } catch {
      toast.error("태스크 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed p-2 space-y-2 mt-1">
      <Input
        className="h-7 text-xs"
        placeholder="태스크 내용 (예: 조명 전환)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      <div className="flex gap-2">
        <Input
          className="h-7 text-xs flex-1"
          placeholder="담당자"
          value={form.assignee}
          onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
        />
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="h-7 text-xs w-16"
            min={0}
            placeholder="초"
            value={form.durationSeconds}
            onChange={(e) => setForm((f) => ({ ...f, durationSeconds: e.target.value }))}
          />
          <span className="text-[10px] text-muted-foreground">초</span>
        </div>
      </div>
      <div className="flex justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-2"
          onClick={onCancel}
          disabled={saving}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={handleSubmit}
          disabled={saving}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 전환 항목 컴포넌트 ───────────────────────────────────────

interface TransitionItemProps {
  entry: StageTransitionEntry;
  onToggleTask: (taskId: string) => void;
  onAddTask: (payload: Omit<StageTransitionTask, "id" | "isCompleted">) => void | Promise<string | null | void>;
  onDeleteTask: (taskId: string) => void;
  onDelete: () => void;
}

function TransitionItem({
  entry,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onDelete,
}: TransitionItemProps) {
  const [open, setOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const completionRate = calcCompletionRate(entry);
  const completedCount = entry.tasks.filter((t) => t.isCompleted).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" />

          {/* 장면 정보 */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-medium shrink-0"
            >
              #{entry.transitionOrder + 1}
            </Badge>
            <span className="text-xs font-medium truncate">{entry.fromScene}</span>
            <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium truncate">{entry.toScene}</span>
          </div>

          {/* 소요시간 + 완료율 */}
          <div className="flex items-center gap-2 shrink-0">
            {entry.totalDuration > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatDuration(entry.totalDuration)}
              </span>
            )}
            {entry.tasks.length > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {completedCount}/{entry.tasks.length}
              </span>
            )}
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 완료율 진행바 */}
        {entry.tasks.length > 0 && (
          <div className="px-3 pb-1.5">
            <Progress value={completionRate} className="h-1" />
          </div>
        )}

        {/* 상세 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-3">
            {/* 조명/음악 변경 */}
            {(entry.lightingChange || entry.musicChange) && (
              <div className="flex flex-wrap gap-2">
                {entry.lightingChange && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                    <span>{entry.lightingChange}</span>
                  </div>
                )}
                {entry.musicChange && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Music className="h-3 w-3 text-purple-500" />
                    <span>{entry.musicChange}</span>
                  </div>
                )}
              </div>
            )}

            {/* 필요 소품 */}
            {entry.propsNeeded.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3 text-orange-500" />
                  필요 소품
                </p>
                <div className="flex flex-wrap gap-1">
                  {entry.propsNeeded.map((prop) => (
                    <Badge
                      key={prop}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 메모 */}
            {entry.notes && (
              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
                {entry.notes}
              </p>
            )}

            {/* 태스크 체크리스트 */}
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">태스크 목록</p>
              {entry.tasks.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  태스크가 없습니다.
                </p>
              )}
              {entry.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 group rounded px-1 py-0.5 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.isCompleted}
                    onCheckedChange={() => onToggleTask(task.id)}
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-xs flex-1 cursor-pointer ${
                      task.isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.description}
                    {task.assignee && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({task.assignee})
                      </span>
                    )}
                  </label>
                  {task.durationSeconds > 0 && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDuration(task.durationSeconds)}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* 태스크 추가 폼 */}
              {showTaskForm ? (
                <InlineTaskForm
                  onAdd={onAddTask}
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
                  태스크 추가
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── 타임라인 뷰 ─────────────────────────────────────────────

interface TimelineViewProps {
  entries: StageTransitionEntry[];
}

function TimelineView({ entries }: TimelineViewProps) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        전환이 없습니다.
      </p>
    );
  }

  const totalTime = entries.reduce((sum, e) => sum + e.totalDuration, 0);

  return (
    <div className="space-y-2">
      {/* 수평 타임라인 */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-0 min-w-max">
          {entries.map((entry, idx) => {
            const widthPct =
              totalTime > 0
                ? Math.max(60, (entry.totalDuration / totalTime) * 400)
                : 80;
            const rate = calcCompletionRate(entry);
            return (
              <div key={entry.id} className="flex items-center">
                {/* 장면 블록 */}
                <div
                  className="flex flex-col items-center justify-center rounded-md border bg-muted/50 px-2 py-1.5 text-center"
                  style={{ minWidth: `${widthPct}px` }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <ArrowRightLeft className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium">
                      #{entry.transitionOrder + 1}
                    </span>
                  </div>
                  <p className="text-[10px] leading-tight">
                    {entry.fromScene}
                  </p>
                  <p className="text-[10px] text-muted-foreground">↓</p>
                  <p className="text-[10px] leading-tight">{entry.toScene}</p>
                  {entry.totalDuration > 0 && (
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {formatDuration(entry.totalDuration)}
                    </span>
                  )}
                  {entry.tasks.length > 0 && (
                    <div className="w-full mt-1">
                      <Progress value={rate} className="h-0.5" />
                      <span className="text-[9px] text-muted-foreground">{rate}%</span>
                    </div>
                  )}
                </div>

                {/* 화살표 연결선 (마지막 제외) */}
                {idx < entries.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className="h-px w-4 bg-border" />
                    <div className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[4px] border-t-transparent border-b-transparent border-l-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 요약 행 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <ArrowRightLeft className="h-3 w-3" />
          총 {entries.length}회 전환
        </span>
        {totalTime > 0 && (
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            총 {formatDuration(totalTime)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────

interface StageTransitionCardProps {
  groupId: string;
  projectId: string;
}

export function StageTransitionCard({ groupId, projectId }: StageTransitionCardProps) {
  const {
    entries,
    addTransition,
    deleteTransition,
    addTask,
    deleteTask,
    toggleTaskComplete,
    stats,
  } = useStageTransition(groupId, projectId);

  const [cardOpen, setCardOpen] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");

  return (
    <>
      <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  공연 무대 전환 계획
                </CardTitle>
                {entries.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {entries.length}회
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowDialog(true)}
                >
                  <Plus className="h-3 w-3" />
                  전환 추가
                </Button>
                <CollapsibleTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    {cardOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ArrowRightLeft className="h-3 w-3" />
                      전환 {stats.totalTransitions}회
                    </span>
                    <span className="flex items-center gap-1">
                      {stats.completedTasks === stats.totalTasks && stats.totalTasks > 0 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      태스크 {stats.completedTasks}/{stats.totalTasks} 완료
                    </span>
                    {stats.totalTransitionTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        총 {formatDuration(stats.totalTransitionTime)}
                      </span>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* 탭 선택 */}
              {entries.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={activeTab === "list" ? "default" : "ghost"}
                    className="h-6 text-[10px] px-2"
                    onClick={() => setActiveTab("list")}
                  >
                    목록
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "timeline" ? "default" : "ghost"}
                    className="h-6 text-[10px] px-2"
                    onClick={() => setActiveTab("timeline")}
                  >
                    타임라인
                  </Button>
                </div>
              )}

              {/* 목록 뷰 */}
              {activeTab === "list" && (
                <div className="space-y-2">
                  {entries.length === 0 && (
                    <div className="text-center py-6 space-y-1">
                      <ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        무대 전환 계획이 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        전환 추가 버튼으로 시작하세요.
                      </p>
                    </div>
                  )}
                  {entries.map((entry) => (
                    <TransitionItem
                      key={entry.id}
                      entry={entry}
                      onToggleTask={(taskId) =>
                        toggleTaskComplete(entry.id, taskId)
                      }
                      onAddTask={(payload) => addTask(entry.id, payload)}
                      onDeleteTask={(taskId) => {
                        deleteTask(entry.id, taskId);
                        toast.success("태스크가 삭제되었습니다.");
                      }}
                      onDelete={() => {
                        deleteTransition(entry.id);
                        toast.success("전환이 삭제되었습니다.");
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 타임라인 뷰 */}
              {activeTab === "timeline" && (
                <TimelineView entries={entries} />
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 전환 추가 다이얼로그 */}
      <AddTransitionDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onAdd={addTransition}
      />
    </>
  );
}
