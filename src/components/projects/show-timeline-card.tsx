"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flag,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useShowTimeline } from "@/hooks/use-show-timeline";
import type { ShowMilestone, ShowMilestoneStatus } from "@/types";

// ================================================================
// 유틸 함수
// ================================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${year}. ${month}. ${day}.`;
}

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

function getStatusLabel(status: ShowMilestoneStatus): string {
  switch (status) {
    case "pending":
      return "대기";
    case "in_progress":
      return "진행중";
    case "completed":
      return "완료";
    case "delayed":
      return "지연";
  }
}

function getStatusBadgeClass(status: ShowMilestoneStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-600";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "delayed":
      return "bg-red-100 text-red-600";
  }
}

function getStatusIcon(status: ShowMilestoneStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />;
    case "in_progress":
      return <Loader2 className="h-3 w-3" />;
    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "delayed":
      return <AlertTriangle className="h-3 w-3" />;
  }
}

function getNodeColor(status: ShowMilestoneStatus): string {
  switch (status) {
    case "pending":
      return "#94a3b8";
    case "in_progress":
      return "#3b82f6";
    case "completed":
      return "#22c55e";
    case "delayed":
      return "#ef4444";
  }
}

// ================================================================
// 타임라인 생성 다이얼로그
// ================================================================

type CreateTimelineDialogProps = {
  onCreate: (showName: string, showDate: string) => void;
};

function CreateTimelineDialog({ onCreate }: CreateTimelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });

  const handleSubmit = () => {
    if (!showName.trim()) {
      toast.error("공연명을 입력해주세요");
      return;
    }
    if (!showDate) {
      toast.error("공연일을 선택해주세요");
      return;
    }
    onCreate(showName, showDate);
    setShowName("");
    setOpen(false);
    toast.success("공연 타임라인을 생성했습니다");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          타임라인 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">공연 타임라인 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">공연명 *</label>
            <Input
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              placeholder="예: 2026 봄 정기공연"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">공연일 *</label>
            <Input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
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
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================================================================
// 마일스톤 추가 다이얼로그
// ================================================================

type AddMilestoneDialogProps = {
  onAdd: (
    title: string,
    description: string,
    dueDate: string,
    assignee: string
  ) => void;
};

function AddMilestoneDialog({ onAdd }: AddMilestoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [assignee, setAssignee] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("마일스톤 제목을 입력해주세요");
      return;
    }
    if (!dueDate) {
      toast.error("마감일을 선택해주세요");
      return;
    }
    onAdd(title, description, dueDate, assignee);
    setTitle("");
    setDescription("");
    setAssignee("");
    setOpen(false);
    toast.success("마일스톤을 추가했습니다");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          마일스톤 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">마일스톤 추가</DialogTitle>
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
            <label className="text-xs text-muted-foreground">담당자 (선택)</label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="예: 홍길동"
              className="h-8 text-xs"
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
// 수직 타임라인 노드 선
// ================================================================

type TimelineConnectorProps = {
  isLast: boolean;
  status: ShowMilestoneStatus;
};

function TimelineConnector({ isLast, status }: TimelineConnectorProps) {
  const color = getNodeColor(status);
  return (
    <div className="flex flex-col items-center">
      {/* 원 노드 */}
      <div
        className="w-3 h-3 rounded-full border-2 shrink-0 z-10"
        style={{
          borderColor: color,
          backgroundColor:
            status === "completed" ? color : "hsl(var(--background))",
        }}
      />
      {/* 연결선 */}
      {!isLast && (
        <div
          className="w-0.5 flex-1 min-h-[24px]"
          style={{ backgroundColor: "#e2e8f0" }}
        />
      )}
    </div>
  );
}

// ================================================================
// 마일스톤 카드 아이템
// ================================================================

type MilestoneItemProps = {
  milestone: ShowMilestone;
  isLast: boolean;
  isFirst: boolean;
  onUpdateStatus: (id: string, status: ShowMilestoneStatus) => void;
  onDelete: (id: string, title: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

function MilestoneItem({
  milestone,
  isLast,
  isFirst,
  onUpdateStatus,
  onDelete,
  onMoveUp,
  onMoveDown,
}: MilestoneItemProps) {
  const [expanded, setExpanded] = useState(false);

  const ddayText = getDdayText(milestone.dueDate);
  const isPastDue = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(milestone.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today && milestone.status !== "completed";
  })();

  return (
    <div className="flex gap-2 items-stretch">
      {/* 수직 타임라인 선 + 노드 */}
      <TimelineConnector isLast={isLast} status={milestone.status} />

      {/* 마일스톤 카드 본문 */}
      <div className="flex-1 pb-3">
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <div className="border rounded-md bg-card overflow-hidden">
            {/* 헤더 */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  {/* 제목 + 상태 배지 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-medium ${
                        milestone.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {milestone.title}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 shrink-0 gap-0.5 ${getStatusBadgeClass(
                        milestone.status
                      )}`}
                    >
                      {getStatusIcon(milestone.status)}
                      {getStatusLabel(milestone.status)}
                    </Badge>
                  </div>
                  {/* 담당자 + 마감일 + D-day */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {milestone.assignee && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        {milestone.assignee}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Calendar className="h-2.5 w-2.5" />
                      {formatDate(milestone.dueDate)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 shrink-0 ${
                        milestone.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : isPastDue
                          ? "bg-red-100 text-red-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {milestone.status === "completed"
                        ? "완료"
                        : ddayText}
                    </Badge>
                  </div>
                </div>
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            </CollapsibleTrigger>

            {/* 펼쳐진 내용 */}
            <CollapsibleContent>
              <div className="px-3 pb-3 space-y-2.5 border-t pt-2.5">
                {/* 설명 */}
                {milestone.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {milestone.description}
                  </p>
                )}

                {/* 완료 시각 */}
                {milestone.completedAt && (
                  <p className="text-[10px] text-green-600">
                    완료: {formatDate(milestone.completedAt.split("T")[0])}
                  </p>
                )}

                {/* 상태 변경 셀렉트 */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    상태 변경
                  </span>
                  <Select
                    value={milestone.status}
                    onValueChange={(val) =>
                      onUpdateStatus(
                        milestone.id,
                        val as ShowMilestoneStatus
                      )
                    }
                  >
                    <SelectTrigger className="h-7 text-xs flex-1 max-w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-xs">
                        대기
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-xs">
                        진행중
                      </SelectItem>
                      <SelectItem value="completed" className="text-xs">
                        완료
                      </SelectItem>
                      <SelectItem value="delayed" className="text-xs">
                        지연
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 순서 변경 + 삭제 */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onMoveUp(milestone.id)}
                      disabled={isFirst}
                      aria-label="위로 이동"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onMoveDown(milestone.id)}
                      disabled={isLast}
                      aria-label="아래로 이동"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-destructive px-2"
                    onClick={() => onDelete(milestone.id, milestone.title)}
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

// ================================================================
// 메인 카드 컴포넌트
// ================================================================

type ShowTimelineCardProps = {
  groupId: string;
  projectId: string;
};

export function ShowTimelineCard({ groupId, projectId }: ShowTimelineCardProps) {
  const [open, setOpen] = useState(true);

  const {
    timeline,
    loading,
    createTimeline,
    deleteTimeline,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestone,
    totalMilestones,
    completedCount,
    delayedCount,
    progressRate,
  } = useShowTimeline(groupId, projectId);

  // ── 핸들러 ─────────────────────────────────────────────────

  const handleUpdateStatus = (
    milestoneId: string,
    status: ShowMilestoneStatus
  ) => {
    updateMilestone(milestoneId, { status });
    const label = getStatusLabel(status);
    toast.success(`상태를 "${label}"(으)로 변경했습니다`);
  };

  const handleDeleteMilestone = (id: string, title: string) => {
    deleteMilestone(id);
    toast.success(`"${title}" 마일스톤을 삭제했습니다`);
  };

  const handleDeleteTimeline = () => {
    deleteTimeline();
    toast.success("타임라인을 삭제했습니다");
  };

  // ── D-day to show ──────────────────────────────────────────

  const showDday = timeline?.showDate ? getDdayText(timeline.showDate) : null;

  const milestones: ShowMilestone[] = timeline?.milestones ?? [];

  // ── 렌더링 ─────────────────────────────────────────────────

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between">
            {/* 헤더 좌측 */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 group"
              >
                <Flag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium">공연 타임라인</span>
                {/* 진행률 배지 */}
                {timeline && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${
                      progressRate === 100
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {progressRate}%
                  </Badge>
                )}
                {/* 지연 경고 배지 */}
                {delayedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 shrink-0 bg-red-100 text-red-600 gap-0.5"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    지연 {delayedCount}
                  </Badge>
                )}
                <span className="text-muted-foreground ml-0.5">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            </CollapsibleTrigger>

            {/* 헤더 우측 */}
            <div className="flex items-center gap-1">
              {!timeline && !loading && (
                <CreateTimelineDialog onCreate={createTimeline} />
              )}
              {timeline && open && (
                <AddMilestoneDialog onAdd={addMilestone} />
              )}
            </div>
          </div>

          {/* 카드 본문 */}
          <CollapsibleContent>
            <CardContent className="px-0 pb-0 pt-3">
              {loading && (
                <div className="flex items-center gap-2 py-4 px-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    불러오는 중...
                  </span>
                </div>
              )}

              {!loading && !timeline && (
                <div className="py-6 text-center space-y-1.5">
                  <Flag className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    아직 타임라인이 없습니다.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    위의 생성 버튼으로 공연 타임라인을 만들어보세요.
                  </p>
                </div>
              )}

              {!loading && timeline && (
                <div className="space-y-3 px-2">
                  {/* 공연 정보 요약 */}
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium truncate max-w-[180px]">
                        {timeline.showName}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(timeline.showDate)}
                        </span>
                        {showDday && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                          >
                            {showDday}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* 타임라인 삭제 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-destructive px-2 shrink-0"
                      onClick={handleDeleteTimeline}
                    >
                      <Trash2 className="h-3 w-3" />
                      초기화
                    </Button>
                  </div>

                  {/* 전체 진행률 프로그레스 바 */}
                  {totalMilestones > 0 && (
                    <div className="space-y-1 px-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          전체 진행률
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {completedCount} / {totalMilestones} 완료
                        </span>
                      </div>
                      <Progress value={progressRate} className="h-1.5" />
                    </div>
                  )}

                  {/* 마일스톤 목록 (수직 타임라인) */}
                  {milestones.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-[11px] text-muted-foreground">
                        마일스톤이 없습니다. 추가 버튼으로 첫 마일스톤을
                        만들어보세요.
                      </p>
                    </div>
                  ) : (
                    <div className="pt-1">
                      {milestones.map((m, idx) => (
                        <MilestoneItem
                          key={m.id}
                          milestone={m}
                          isFirst={idx === 0}
                          isLast={idx === milestones.length - 1}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDeleteMilestone}
                          onMoveUp={(id) => reorderMilestone(id, "up")}
                          onMoveDown={(id) => reorderMilestone(id, "down")}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
}
