"use client";

import { useState, useRef } from "react";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useMentalCoaching } from "@/hooks/use-mental-coaching";
import type {
  MentalCoachingNote,
  MentalCoachingTopic,
  MentalCoachingStatus,
  MentalCoachingActionItem,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const TOPICS: MentalCoachingTopic[] = [
  "자신감",
  "무대 공포증",
  "동기부여",
  "팀워크",
  "스트레스 관리",
  "목표 설정",
];

const TOPIC_BADGE: Record<MentalCoachingTopic, string> = {
  자신감: "bg-yellow-100 text-yellow-700",
  "무대 공포증": "bg-red-100 text-red-700",
  동기부여: "bg-green-100 text-green-700",
  팀워크: "bg-blue-100 text-blue-700",
  "스트레스 관리": "bg-purple-100 text-purple-700",
  "목표 설정": "bg-orange-100 text-orange-700",
};

const STATUS_LABEL: Record<MentalCoachingStatus, string> = {
  진행중: "진행중",
  개선됨: "개선됨",
  해결됨: "해결됨",
};

const STATUS_BADGE: Record<MentalCoachingStatus, string> = {
  진행중: "bg-blue-100 text-blue-700",
  개선됨: "bg-yellow-100 text-yellow-700",
  해결됨: "bg-green-100 text-green-700",
};

const ENERGY_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

const ENERGY_LABEL: Record<number, string> = {
  1: "매우 낮음",
  2: "낮음",
  3: "보통",
  4: "높음",
  5: "매우 높음",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 에너지 레벨 선택 컴포넌트
// ============================================================

function EnergyPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          title={ENERGY_LABEL[n]}
          className={cn(
            "text-lg leading-none rounded-md p-1 border transition-colors",
            value === n
              ? "border-blue-400 bg-blue-50"
              : "border-transparent hover:bg-gray-100"
          )}
        >
          {ENERGY_EMOJI[n]}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 코칭 노트 다이얼로그 (추가 / 수정)
// ============================================================

type NoteDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  initial?: MentalCoachingNote;
  onSave: (data: {
    memberName: string;
    coachName: string;
    date: string;
    topic: MentalCoachingTopic;
    content: string;
    energyLevel: number;
    actionItems: Omit<MentalCoachingActionItem, "id">[];
    status: MentalCoachingStatus;
  }) => void;
};

function NoteDialog({
  open,
  onClose,
  memberNames,
  initial,
  onSave,
}: NoteDialogProps) {
  const isEdit = !!initial;

  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [coachName, setCoachName] = useState(initial?.coachName ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [topic, setTopic] = useState<MentalCoachingTopic>(
    initial?.topic ?? "자신감"
  );
  const [content, setContent] = useState(initial?.content ?? "");
  const [energyLevel, setEnergyLevel] = useState(initial?.energyLevel ?? 3);
  const [status, setStatus] = useState<MentalCoachingStatus>(
    initial?.status ?? "진행중"
  );
  const [actionInput, setActionInput] = useState("");
  const [actionItems, setActionItems] = useState<
    Omit<MentalCoachingActionItem, "id">[]
  >(
    initial?.actionItems.map(({ text, done }) => ({ text, done })) ?? []
  );
  const actionRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMemberName(initial?.memberName ?? "");
    setCoachName(initial?.coachName ?? "");
    setDate(initial?.date ?? today());
    setTopic(initial?.topic ?? "자신감");
    setContent(initial?.content ?? "");
    setEnergyLevel(initial?.energyLevel ?? 3);
    setStatus(initial?.status ?? "진행중");
    setActionInput("");
    setActionItems(
      initial?.actionItems.map(({ text, done }) => ({ text, done })) ?? []
    );
  }

  function addAction() {
    const v = actionInput.trim();
    if (!v) return;
    setActionItems([...actionItems, { text: v, done: false }]);
    setActionInput("");
    actionRef.current?.focus();
  }

  function removeAction(idx: number) {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!memberName.trim()) {
      toast.error("대상 멤버를 입력해주세요.");
      return;
    }
    if (!coachName.trim()) {
      toast.error("코치 이름을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("코칭 내용을 입력해주세요.");
      return;
    }
    onSave({
      memberName: memberName.trim(),
      coachName: coachName.trim(),
      date,
      topic,
      content: content.trim(),
      energyLevel,
      actionItems,
      status,
    });
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "코칭 노트 수정" : "코칭 노트 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 대상 멤버 */}
          <div className="space-y-1">
            <Label className="text-xs">대상 멤버 *</Label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="멤버 이름 입력"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 코치 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">코치 이름 *</Label>
            <Input
              placeholder="코치 이름 입력"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 주제 */}
          <div className="space-y-1">
            <Label className="text-xs">주제 카테고리</Label>
            <Select
              value={topic}
              onValueChange={(v) => setTopic(v as MentalCoachingTopic)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 기분/에너지 레벨 */}
          <div className="space-y-1">
            <Label className="text-xs">
              기분/에너지 레벨{" "}
              <span className="text-muted-foreground">
                ({ENERGY_LABEL[energyLevel]})
              </span>
            </Label>
            <EnergyPicker value={energyLevel} onChange={setEnergyLevel} />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">코칭 내용 *</Label>
            <Textarea
              placeholder="코칭 세션 내용을 기록해주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* 액션 아이템 */}
          <div className="space-y-1">
            <Label className="text-xs">액션 아이템</Label>
            <div className="flex gap-1">
              <Input
                ref={actionRef}
                placeholder="할 일 입력 후 Enter"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAction()}
                className="h-8 text-xs flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addAction}
              >
                추가
              </Button>
            </div>
            {actionItems.length > 0 && (
              <ul className="space-y-1 mt-1">
                {actionItems.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span className="flex-1">{a.text}</span>
                    <button
                      type="button"
                      onClick={() => removeAction(i)}
                      className="text-red-400 hover:text-red-600 text-[10px]"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 진행 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">진행 상태</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MentalCoachingStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["진행중", "개선됨", "해결됨"] as MentalCoachingStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {isEdit ? "수정" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 개별 노트 카드
// ============================================================

type NoteCardProps = {
  note: MentalCoachingNote;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAction: (actionId: string) => void;
  onStatusChange: (status: MentalCoachingStatus) => void;
};

function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleAction,
  onStatusChange,
}: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);

  const doneCount = note.actionItems.filter((a) => a.done).length;
  const totalCount = note.actionItems.length;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-xs font-medium truncate max-w-[100px]">
            {note.memberName}
          </span>
          <span className="text-[10px] text-muted-foreground">/</span>
          <span className="text-[10px] text-muted-foreground truncate">
            {note.coachName}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              TOPIC_BADGE[note.topic]
            )}
          >
            {note.topic}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 cursor-pointer",
              STATUS_BADGE[note.status]
            )}
            onClick={() => {
              const next: Record<MentalCoachingStatus, MentalCoachingStatus> = {
                진행중: "개선됨",
                개선됨: "해결됨",
                해결됨: "진행중",
              };
              onStatusChange(next[note.status]);
            }}
          >
            {STATUS_LABEL[note.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 날짜 + 에너지 */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{note.date}</span>
        <span>
          {ENERGY_EMOJI[note.energyLevel]} {ENERGY_LABEL[note.energyLevel]}
        </span>
        {totalCount > 0 && (
          <span className="text-blue-600">
            액션 {doneCount}/{totalCount}
          </span>
        )}
      </div>

      {/* 내용 */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {note.content}
      </p>

      {/* 액션 아이템 */}
      {totalCount > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800">
              <CheckSquare className="h-3 w-3" />
              액션 아이템 {expanded ? "접기" : "펼치기"}
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1.5 space-y-1">
              {note.actionItems.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-1.5 cursor-pointer group"
                  onClick={() => onToggleAction(a.id)}
                >
                  {a.done ? (
                    <CheckSquare className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <Square className="h-3 w-3 text-gray-400 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-[11px] flex-1",
                      a.done
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {a.text}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ============================================================
// 통계 패널
// ============================================================

function StatsPanel({
  stats,
}: {
  stats: ReturnType<typeof useMentalCoaching>["stats"];
}) {
  if (stats.totalNotes === 0) return null;

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        <BarChart2 className="h-3 w-3" />
        통계
      </p>

      {/* 요약 수치 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-blue-600">
            {stats.totalNotes}
          </div>
          <div className="text-[10px] text-muted-foreground">총 노트</div>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-purple-600">
            {stats.avgEnergyLevel > 0
              ? `${ENERGY_EMOJI[Math.round(stats.avgEnergyLevel)]} ${stats.avgEnergyLevel}`
              : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">평균 에너지</div>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-green-600">
            {stats.totalActionItems > 0
              ? `${stats.doneActionItems}/${stats.totalActionItems}`
              : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">액션 완료</div>
        </div>
      </div>

      {/* 주제별 분포 */}
      {stats.topicDistribution.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            주제별 분포
          </p>
          {stats.topicDistribution
            .sort((a, b) => b.count - a.count)
            .map(({ topic, count }) => (
              <div key={topic} className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 w-20 justify-center shrink-0",
                    TOPIC_BADGE[topic]
                  )}
                >
                  {topic}
                </Badge>
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-400 h-1.5 rounded-full"
                    style={{
                      width: `${(count / stats.totalNotes) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-4 text-right">
                  {count}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* 상태별 분포 */}
      {stats.statusDistribution.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {stats.statusDistribution.map(({ status, count }) => (
            <div
              key={status}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5",
                STATUS_BADGE[status]
              )}
            >
              <TrendingUp className="h-2.5 w-2.5" />
              <span className="text-[10px]">
                {STATUS_LABEL[status]} {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type FilterTopic = "전체" | MentalCoachingTopic;
type FilterStatus = "전체" | MentalCoachingStatus;

export function MentalCoachingCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    notes,
    loading,
    stats,
    addNote,
    updateNote,
    deleteNote,
    toggleActionItem,
    updateStatus,
  } = useMentalCoaching(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MentalCoachingNote | null>(null);
  const [filterTopic, setFilterTopic] = useState<FilterTopic>("전체");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");
  const [showStats, setShowStats] = useState(false);

  const filtered = notes.filter((n) => {
    if (filterTopic !== "전체" && n.topic !== filterTopic) return false;
    if (filterStatus !== "전체" && n.status !== filterStatus) return false;
    return true;
  });

  const sortedFiltered = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd(data: Parameters<typeof addNote>[0]) {
    addNote(data);
    toast.success("코칭 노트가 추가되었습니다.");
  }

  function handleEdit(data: Parameters<typeof addNote>[0]) {
    if (!editTarget) return;
    // actionItems에 기존 id를 유지하거나 새로 부여하여 타입을 맞춤
    const actionItemsWithId: MentalCoachingActionItem[] = data.actionItems.map(
      (a, i) => ({
        ...a,
        id: editTarget.actionItems[i]?.id ?? crypto.randomUUID(),
      })
    );
    const ok = updateNote(editTarget.id, {
      ...data,
      actionItems: actionItemsWithId,
    });
    if (ok) toast.success("코칭 노트가 수정되었습니다.");
    else toast.error(TOAST.UPDATE_ERROR);
    setEditTarget(null);
  }

  function handleDelete(noteId: string) {
    const ok = deleteNote(noteId);
    if (ok) toast.success("코칭 노트가 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  }

  function handleToggleAction(noteId: string, actionId: string) {
    toggleActionItem(noteId, actionId);
  }

  function handleStatusChange(noteId: string, status: MentalCoachingStatus) {
    const ok = updateStatus(noteId, status);
    if (ok) toast.success(`상태가 "${STATUS_LABEL[status]}"으로 변경되었습니다.`);
    else toast.error("상태 변경에 실패했습니다.");
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 카드 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">멘탈 코칭 노트</span>
                {stats.totalNotes > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
                    {stats.totalNotes}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 툴바 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 통계 토글 */}
                  <Button
                    variant={showStats ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setShowStats(!showStats)}
                  >
                    <BarChart2 className="h-3 w-3 mr-0.5" />
                    통계
                  </Button>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  노트 추가
                </Button>
              </div>

              {/* 통계 패널 */}
              {showStats && <StatsPanel stats={stats} />}

              {/* 필터 */}
              <div className="space-y-1.5">
                {/* 주제 필터 */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={filterTopic === "전체" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setFilterTopic("전체")}
                  >
                    전체
                  </Button>
                  {TOPICS.map((t) => (
                    <Button
                      key={t}
                      variant={filterTopic === t ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterTopic(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>

                {/* 상태 필터 */}
                <div className="flex gap-1">
                  {(
                    [
                      { value: "전체", label: "전체" },
                      { value: "진행중", label: "진행중" },
                      { value: "개선됨", label: "개선됨" },
                      { value: "해결됨", label: "해결됨" },
                    ] as { value: FilterStatus; label: string }[]
                  ).map((f) => (
                    <Button
                      key={f.value}
                      variant={filterStatus === f.value ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterStatus(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 노트 목록 */}
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </div>
              ) : sortedFiltered.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  {notes.length === 0
                    ? "아직 코칭 노트가 없습니다. 첫 노트를 추가해보세요."
                    : "해당 조건의 노트가 없습니다."}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedFiltered.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={() => setEditTarget(note)}
                      onDelete={() => handleDelete(note.id)}
                      onToggleAction={(actionId) =>
                        handleToggleAction(note.id, actionId)
                      }
                      onStatusChange={(status) =>
                        handleStatusChange(note.id, status)
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가 다이얼로그 */}
      <NoteDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        memberNames={memberNames}
        onSave={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <NoteDialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          memberNames={memberNames}
          initial={editTarget}
          onSave={handleEdit}
        />
      )}
    </>
  );
}
