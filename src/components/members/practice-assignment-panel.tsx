"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ClipboardCheck,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Calendar,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePracticeAssignments,
  calcAssignmentProgress,
} from "@/hooks/use-practice-assignments";
import type {
  AssignmentPriority,
  AssignmentProgress,
  PracticeAssignment,
} from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// Props
// ============================================

type PracticeAssignmentPanelProps = {
  groupId: string;
  currentUserId: string;
  isLeader: boolean;
  members: EntityMember[];
  trigger?: React.ReactNode;
};

// ============================================
// 우선순위 헬퍼
// ============================================

const PRIORITY_LABELS: Record<AssignmentPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_CLASSES: Record<AssignmentPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

// ============================================
// 진행 상태 헬퍼
// ============================================

const PROGRESS_LABELS: Record<AssignmentProgress, string> = {
  not_started: "미시작",
  in_progress: "진행 중",
  completed: "완료",
};

const PROGRESS_CLASSES: Record<AssignmentProgress, string> = {
  not_started: "bg-gray-100 text-gray-500 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

// ============================================
// 마감일 포맷
// ============================================

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = d.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
  if (diff < 0) return `${formatted} (${Math.abs(diff)}일 초과)`;
  if (diff === 0) return `${formatted} (오늘)`;
  if (diff <= 3) return `${formatted} (${diff}일 후)`;
  return formatted;
}

function isDueDateUrgent(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff <= 3;
}

// ============================================
// 과제 생성 Dialog
// ============================================

type CreateAssignmentDialogProps = {
  members: EntityMember[];
  onSubmit: (params: {
    title: string;
    description: string;
    memberIds: { userId: string; userName: string }[];
    priority: AssignmentPriority;
    dueDate: string | null;
  }) => void;
};

function CreateAssignmentDialog({ members, onSubmit }: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<AssignmentPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map((m) => m.userId));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("과제 제목을 입력해주세요");
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error("대상 멤버를 1명 이상 선택해주세요");
      return;
    }

    const memberIds = selectedMemberIds.map((userId) => {
      const member = members.find((m) => m.userId === userId);
      const userName = member
        ? member.nickname || member.profile.name
        : userId;
      return { userId, userName };
    });

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      memberIds,
      priority,
      dueDate: dueDate || null,
    });

    // 폼 초기화
    setTitle("");
    setDescription("");
    setSelectedMemberIds([]);
    setPriority("medium");
    setDueDate("");
    setOpen(false);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setTitle("");
      setDescription("");
      setSelectedMemberIds([]);
      setPriority("medium");
      setDueDate("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          과제 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">연습 과제 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">과제 제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 팔 동작 집중 연습"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제 상세 내용을 입력하세요..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* 우선순위 + 마감일 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">우선순위</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as AssignmentPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high" className="text-xs">높음</SelectItem>
                  <SelectItem value="medium" className="text-xs">보통</SelectItem>
                  <SelectItem value="low" className="text-xs">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">마감일</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 대상 멤버 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">대상 멤버 *</Label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-blue-600 hover:underline"
              >
                {selectedMemberIds.length === members.length ? "전체 해제" : "전체 선택"}
              </button>
            </div>
            <div className="rounded-lg border max-h-40 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center">
                  멤버가 없습니다
                </p>
              ) : (
                <div className="divide-y">
                  {members.map((member) => {
                    const name = member.nickname || member.profile.name;
                    const checked = selectedMemberIds.includes(member.userId);
                    return (
                      <label
                        key={member.userId}
                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleToggleMember(member.userId)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{name}</span>
                        {member.role === "leader" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 ml-auto bg-purple-50 text-purple-700 border-purple-200"
                          >
                            리더
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedMemberIds.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {selectedMemberIds.length}명 선택됨
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleSubmit}
            >
              과제 생성
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 과제 카드 (펼침/접기)
// ============================================

type AssignmentCardProps = {
  assignment: PracticeAssignment;
  isLeader: boolean;
  currentUserId: string;
  onDelete: (id: string) => void;
  onUpdateStatus: (
    assignmentId: string,
    userId: string,
    progress: AssignmentProgress,
    note?: string
  ) => void;
};

function AssignmentCard({
  assignment,
  isLeader,
  currentUserId,
  onDelete,
  onUpdateStatus,
}: AssignmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingNoteUserId, setEditingNoteUserId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const progress = calcAssignmentProgress(assignment);
  const urgent = isDueDateUrgent(assignment.dueDate);

  const handleNoteEdit = (userId: string, currentNote: string) => {
    setEditingNoteUserId(userId);
    setNoteInput(currentNote);
  };

  const handleNoteSave = (userId: string, currentProgress: AssignmentProgress) => {
    onUpdateStatus(assignment.id, userId, currentProgress, noteInput);
    setEditingNoteUserId(null);
    setNoteInput("");
    toast.success("메모가 저장되었습니다");
  };

  // 내가 대상 멤버인지 여부
  const myStatus = assignment.memberStatuses.find(
    (s) => s.userId === currentUserId
  );

  return (
    <div className="rounded-lg border bg-card">
      {/* 카드 헤더 */}
      <button
        type="button"
        className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* 제목 + 배지들 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium truncate">{assignment.title}</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 shrink-0 ${PRIORITY_CLASSES[assignment.priority]}`}
            >
              <Flag className="h-2.5 w-2.5 mr-0.5" />
              {PRIORITY_LABELS[assignment.priority]}
            </Badge>
          </div>

          {/* 마감일 */}
          {assignment.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] ${
                urgent ? "text-orange-600" : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {formatDueDate(assignment.dueDate)}
            </div>
          )}

          {/* 진행률 바 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {assignment.memberStatuses.filter((s) => s.progress === "completed").length}/
                {assignment.memberStatuses.length}명 완료
              </span>
              <span className="text-[11px] text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </button>

      {/* 펼침 영역: 멤버별 상태 */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t pt-3">
          {/* 과제 설명 */}
          {assignment.description && (
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded p-2">
              {assignment.description}
            </p>
          )}

          {/* 내 상태 (대상 멤버인 경우) */}
          {myStatus && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-foreground/70">내 진행 상태</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["not_started", "in_progress", "completed"] as AssignmentProgress[]).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onUpdateStatus(assignment.id, currentUserId, p)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                        myStatus.progress === p
                          ? `${PROGRESS_CLASSES[p]} font-medium`
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {PROGRESS_LABELS[p]}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* 멤버별 상태 목록 */}
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-foreground/70">멤버 현황</p>
            <div className="divide-y rounded-md border">
              {assignment.memberStatuses.map((status) => (
                <div key={status.userId} className="px-2.5 py-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs flex-1 truncate">{status.userName}</span>
                    {isLeader ? (
                      <Select
                        value={status.progress}
                        onValueChange={(v) =>
                          onUpdateStatus(assignment.id, status.userId, v as AssignmentProgress)
                        }
                      >
                        <SelectTrigger
                          className={`h-6 text-[11px] w-auto gap-1 border px-1.5 py-0 rounded-full ${
                            PROGRESS_CLASSES[status.progress]
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started" className="text-xs">
                            미시작
                          </SelectItem>
                          <SelectItem value="in_progress" className="text-xs">
                            진행 중
                          </SelectItem>
                          <SelectItem value="completed" className="text-xs">
                            완료
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${PROGRESS_CLASSES[status.progress]}`}
                      >
                        {PROGRESS_LABELS[status.progress]}
                      </Badge>
                    )}
                  </div>

                  {/* 메모 */}
                  {editingNoteUserId === status.userId ? (
                    <div className="flex gap-1.5">
                      <Input
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="메모 입력..."
                        className="h-6 text-[11px] flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleNoteSave(status.userId, status.progress);
                          if (e.key === "Escape") setEditingNoteUserId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => handleNoteSave(status.userId, status.progress)}
                      >
                        저장
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => setEditingNoteUserId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 cursor-pointer group"
                      onClick={() => handleNoteEdit(status.userId, status.note)}
                    >
                      {status.note ? (
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                          {status.note}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                          메모 추가...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 삭제 버튼 (리더만) */}
          {isLeader && (
            <div className="flex justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
                onClick={() => {
                  onDelete(assignment.id);
                  toast.success("과제가 삭제되었습니다");
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                과제 삭제
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function PracticeAssignmentPanel({
  groupId,
  currentUserId,
  isLeader,
  members,
  trigger,
}: PracticeAssignmentPanelProps) {
  const [open, setOpen] = useState(false);

  const {
    assignments,
    activeCount,
    overallProgress,
    createAssignment,
    deleteAssignment,
    updateMemberStatus,
  } = usePracticeAssignments(groupId);

  const handleCreate = (params: {
    title: string;
    description: string;
    memberIds: { userId: string; userName: string }[];
    priority: AssignmentPriority;
    dueDate: string | null;
  }) => {
    createAssignment({ ...params, createdBy: currentUserId });
    toast.success("연습 과제가 생성되었습니다");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-7 text-xs relative">
            <ClipboardCheck className="h-3 w-3 mr-1" />
            연습 과제
            {activeCount > 0 && (
              <Badge className="ml-1.5 text-[10px] px-1.5 py-0 h-4 min-w-4 bg-blue-600 text-white border-0">
                {activeCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm">연습 과제 관리</SheetTitle>
            {isLeader && (
              <CreateAssignmentDialog members={members} onSubmit={handleCreate} />
            )}
          </div>
          {/* 전체 진행률 */}
          {assignments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>전체 진행률</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                총 {assignments.length}개 과제 중 진행 중{" "}
                <span className="font-medium text-blue-600">{activeCount}개</span>
              </p>
            </div>
          )}
        </SheetHeader>

        {/* 과제 목록 */}
        <div className="px-4 pb-6 space-y-2.5">
          {assignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2.5" />
              <p className="text-xs text-muted-foreground">
                아직 등록된 과제가 없습니다
              </p>
              {isLeader && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  상단 &quot;과제 추가&quot; 버튼으로 과제를 생성해주세요
                </p>
              )}
            </div>
          ) : (
            assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                isLeader={isLeader}
                currentUserId={currentUserId}
                onDelete={deleteAssignment}
                onUpdateStatus={updateMemberStatus}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
