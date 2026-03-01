"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  PartyPopper,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Circle,
  User,
  Utensils,
  TreePine,
  Lightbulb,
  Snowflake,
  Sparkles,
  CalendarDays,
  MessageSquare,
  MessageCircle,
  Heart,
  Timer,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTeamBuilding } from "@/hooks/use-team-building";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TeamBuildingCategory, TeamBuildingEvent } from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const CATEGORY_LABEL: Record<TeamBuildingCategory, string> = {
  ice_breaker: "아이스브레이킹",
  trust: "신뢰 빌딩",
  creativity: "창의력",
  communication: "소통",
  party: "회식/파티",
  outdoor: "야외 활동",
  other: "기타",
};

const CATEGORY_COLOR: Record<TeamBuildingCategory, string> = {
  ice_breaker: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  trust: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  creativity: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  communication: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  party: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  outdoor: "bg-green-100 text-green-700 hover:bg-green-100",
  other: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

const CATEGORY_ICON: Record<TeamBuildingCategory, React.ReactNode> = {
  ice_breaker: <Snowflake className="h-3 w-3" />,
  trust: <Heart className="h-3 w-3" />,
  creativity: <Lightbulb className="h-3 w-3" />,
  communication: <MessageCircle className="h-3 w-3" />,
  party: <Utensils className="h-3 w-3" />,
  outdoor: <TreePine className="h-3 w-3" />,
  other: <Sparkles className="h-3 w-3" />,
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function calcDDay(dateStr: string): string {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={cn(
            "focus:outline-none",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-4 w-4",
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 이벤트 추가 다이얼로그
// ============================================================

type AddEventDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (
    input: Omit<
      TeamBuildingEvent,
      "id" | "createdAt" | "participants" | "isCompleted"
    >
  ) => Promise<void>;
  memberNames: string[];
};

function AddEventDialog({
  open,
  onClose,
  onAdd,
  memberNames,
}: AddEventDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TeamBuildingCategory>("ice_breaker");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState(memberNames[0] ?? "");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const { pending: saving, execute: executeAdd } = useAsyncAction();

  function reset() {
    setTitle("");
    setCategory("ice_breaker");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    setOrganizer(memberNames[0] ?? "");
    setDuration("");
    setBudget("");
    setMaxParticipants("");
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("활동명을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!organizer.trim()) {
      toast.error("주최자를 입력해주세요.");
      return;
    }
    await executeAdd(async () => {
      await onAdd({
        title: title.trim(),
        category,
        date,
        time: time || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        organizer: organizer.trim(),
        duration: duration ? Number(duration) : undefined,
        budget: budget ? Number(budget) : undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      });
      toast.success("팀빌딩 활동이 추가되었습니다.");
      reset();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <PartyPopper className="h-4 w-4 text-purple-500" />
            팀빌딩 활동 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">활동명 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: MT, 볼링 모임, 팀 저녁식사"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TeamBuildingCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(CATEGORY_LABEL) as TeamBuildingCategory[]
                ).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABEL[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">날짜 *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">시간</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">장소</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소를 입력하세요"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">주최자 *</Label>
            {memberNames.length > 0 ? (
              <Select value={organizer} onValueChange={setOrganizer}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="주최자 선택" />
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
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="주최자 이름"
                className="h-8 text-xs"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">소요시간 (분)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="h-8 text-xs"
                min={1}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">예산 (원)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
                min={0}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">최대 인원</Label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="제한 없음"
                className="h-8 text-xs"
                min={1}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="활동 내용이나 안내사항을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "추가 중..." : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 피드백 다이얼로그
// ============================================================

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string) => Promise<void>;
  existingRating?: number;
  existingFeedback?: string;
};

function FeedbackDialog({
  open,
  onClose,
  onSubmit,
  existingRating = 0,
  existingFeedback = "",
}: FeedbackDialogProps) {
  const [rating, setRating] = useState(existingRating);
  const [feedback, setFeedback] = useState(existingFeedback);
  const { pending: saving, execute: executeFeedback } = useAsyncAction();

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    await executeFeedback(async () => {
      await onSubmit(rating, feedback.trim() || undefined);
      toast.success("피드백이 저장되었습니다.");
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            활동 후기 작성
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">별점 *</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">코멘트 (선택)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="활동 소감을 자유롭게 남겨주세요"
              className="text-xs min-h-[70px] resize-none"
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단일 이벤트 카드
// ============================================================

type EventCardProps = {
  event: TeamBuildingEvent;
  currentMemberName?: string;
  onJoin: (eventId: string, memberName: string) => Promise<boolean>;
  onLeave: (eventId: string, memberName: string) => Promise<void>;
  onFeedback: (
    eventId: string,
    memberName: string,
    rating: number,
    feedback?: string
  ) => Promise<boolean>;
  onToggleComplete: (eventId: string) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
};

function EventCard({
  event,
  currentMemberName,
  onJoin,
  onLeave,
  onFeedback,
  onToggleComplete,
  onDelete,
}: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isParticipating =
    currentMemberName !== undefined &&
    event.participants.some((p) => p.memberName === currentMemberName);

  const myParticipant = event.participants.find(
    (p) => p.memberName === currentMemberName
  );

  const isFull =
    event.maxParticipants !== undefined &&
    event.participants.length >= event.maxParticipants;

  const avgRating =
    event.participants.filter((p) => p.rating !== undefined).length > 0
      ? event.participants
          .filter((p) => p.rating !== undefined)
          .reduce((sum, p) => sum + (p.rating ?? 0), 0) /
        event.participants.filter((p) => p.rating !== undefined).length
      : null;

  async function handleJoin() {
    if (!currentMemberName) {
      toast.error("참가하려면 로그인이 필요합니다.");
      return;
    }
    const ok = await onJoin(event.id, currentMemberName);
    if (ok) {
      toast.success("참가 신청이 완료되었습니다.");
    } else {
      toast.error(isFull ? "최대 인원에 도달했습니다." : "이미 참가 중입니다.");
    }
  }

  async function handleLeave() {
    if (!currentMemberName) return;
    await onLeave(event.id, currentMemberName);
    toast.success("참가 취소되었습니다.");
  }

  async function handleFeedbackSubmit(rating: number, feedback?: string) {
    if (!currentMemberName) return;
    await onFeedback(event.id, currentMemberName, rating, feedback);
  }

  async function handleToggleComplete() {
    await onToggleComplete(event.id);
    toast.success(event.isCompleted ? "예정 상태로 변경되었습니다." : "완료 처리되었습니다.");
  }

  async function handleDelete() {
    await onDelete(event.id);
    toast.success("활동이 삭제되었습니다.");
  }

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 shrink-0">
            <Badge
              variant="secondary"
              className={cn(
                "flex items-center gap-1 text-[10px] px-1.5 py-0",
                CATEGORY_COLOR[event.category]
              )}
            >
              {CATEGORY_ICON[event.category]}
              {CATEGORY_LABEL[event.category]}
            </Badge>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-tight truncate">
              {event.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="h-2.5 w-2.5" />
                {formatDate(event.date)}
                {event.time && ` ${event.time}`}
              </span>
              {!event.isCompleted && (
                <span className="text-[10px] font-medium text-blue-600">
                  {calcDDay(event.date)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleComplete}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={event.isCompleted ? "예정으로 변경" : "완료 처리"}
          >
            {event.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-3 flex-wrap">
        {event.location && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            {event.location}
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User className="h-2.5 w-2.5" />
          {event.organizer}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-2.5 w-2.5" />
          {event.participants.length}명
          {event.maxParticipants !== undefined &&
            ` / ${event.maxParticipants}명`}
        </span>
        {event.duration !== undefined && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Timer className="h-2.5 w-2.5" />
            {event.duration >= 60
              ? `${Math.floor(event.duration / 60)}시간${event.duration % 60 > 0 ? ` ${event.duration % 60}분` : ""}`
              : `${event.duration}분`}
          </span>
        )}
        {event.budget !== undefined && (
          <span className="text-[10px] text-muted-foreground">
            예산 {event.budget.toLocaleString()}원
          </span>
        )}
      </div>

      {/* 완료된 경우 평균 평점 표시 */}
      {event.isCompleted && avgRating !== null && (
        <div className="flex items-center gap-1.5">
          <StarRating value={Math.round(avgRating)} readonly />
          <span className="text-[10px] text-muted-foreground">
            평균 {avgRating.toFixed(1)}점
          </span>
        </div>
      )}

      {/* 설명 */}
      {event.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">
          {event.description}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2">
        {!event.isCompleted && currentMemberName && (
          <>
            {isParticipating ? (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={handleLeave}
              >
                참가 취소
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={handleJoin}
                disabled={isFull}
              >
                {isFull ? "마감" : "참가"}
              </Button>
            )}
          </>
        )}
        {event.isCompleted && isParticipating && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2 flex items-center gap-1"
            onClick={() => setFeedbackOpen(true)}
          >
            <Star className="h-2.5 w-2.5" />
            {myParticipant?.rating !== undefined ? "후기 수정" : "후기 작성"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2 ml-auto flex items-center gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          참가자 {event.participants.length}명
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* 참가자 목록 확장 */}
      {expanded && (
        <div className="pt-1 space-y-1.5">
          <Separator />
          {event.participants.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-1">
              아직 참가자가 없습니다.
            </p>
          ) : (
            <div className="space-y-1.5">
              {event.participants.map((p) => (
                <div
                  key={p.memberName}
                  className="flex items-start gap-2 text-[10px]"
                >
                  <span className="font-medium text-foreground min-w-[56px] shrink-0">
                    {p.memberName}
                  </span>
                  {p.rating !== undefined && (
                    <StarRating value={p.rating} readonly />
                  )}
                  {p.feedback && (
                    <span className="text-muted-foreground flex items-start gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                      {p.feedback}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 피드백 다이얼로그 */}
      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
        existingRating={myParticipant?.rating ?? 0}
        existingFeedback={myParticipant?.feedback ?? ""}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="활동 삭제"
        description="이 활동을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type TeamBuildingCardProps = {
  groupId: string;
  memberNames?: string[];
  currentMemberName?: string;
};

export function TeamBuildingCard({
  groupId,
  memberNames = [],
  currentMemberName,
}: TeamBuildingCardProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    events,
    loading,
    addEvent,
    joinEvent,
    leaveEvent,
    addFeedback,
    toggleComplete,
    deleteEvent,
    stats,
  } = useTeamBuilding(groupId);

  const upcomingList = events
    .filter((e) => !e.isCompleted)
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedList = events
    .filter((e) => e.isCompleted)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">팀빌딩 활동</span>
                {stats.upcomingEvents > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700"
                  >
                    예정 {stats.upcomingEvents}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.totalEvents > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    총 {stats.totalEvents}회
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <Separator />

            {/* 통계 요약 */}
            {stats.totalEvents > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-semibold">{stats.totalEvents}</p>
                    <p className="text-[10px] text-muted-foreground">총 활동</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-semibold text-green-600">
                      {stats.completedEvents}
                    </p>
                    <p className="text-[10px] text-muted-foreground">완료</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-semibold text-yellow-600">
                      {stats.averageRating > 0
                        ? `${stats.averageRating}점`
                        : "-"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">평균 만족도</p>
                  </div>
                </div>
                {stats.topCategory && (
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5">
                    <BarChart2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">인기 카테고리</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-auto flex items-center gap-1 text-[10px] px-1.5 py-0",
                        CATEGORY_COLOR[stats.topCategory]
                      )}
                    >
                      {CATEGORY_ICON[stats.topCategory]}
                      {CATEGORY_LABEL[stats.topCategory]}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* 추가 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs flex items-center gap-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              팀빌딩 활동 추가
            </Button>

            {/* 탭: 예정 / 완료 */}
            <Tabs defaultValue="upcoming">
              <TabsList className="h-7 w-full">
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 text-[10px] h-6 flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  예정 ({upcomingList.length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex-1 text-[10px] h-6 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  완료 ({completedList.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-2 space-y-2">
                {loading ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    불러오는 중...
                  </p>
                ) : upcomingList.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    예정된 팀빌딩 활동이 없습니다.
                  </p>
                ) : (
                  upcomingList.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentMemberName={currentMemberName}
                      onJoin={joinEvent}
                      onLeave={leaveEvent}
                      onFeedback={addFeedback}
                      onToggleComplete={toggleComplete}
                      onDelete={deleteEvent}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-2 space-y-2">
                {loading ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    불러오는 중...
                  </p>
                ) : completedList.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    완료된 팀빌딩 활동이 없습니다.
                  </p>
                ) : (
                  completedList.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentMemberName={currentMemberName}
                      onJoin={joinEvent}
                      onLeave={leaveEvent}
                      onFeedback={addFeedback}
                      onToggleComplete={toggleComplete}
                      onDelete={deleteEvent}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 이벤트 추가 다이얼로그 */}
      <AddEventDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={addEvent}
        memberNames={memberNames}
      />
    </Card>
  );
}
