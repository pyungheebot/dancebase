"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  MapPin,
  Users,
  Star,
  CheckCircle2,
  Circle,
  User,
  CalendarDays,
  MessageSquare,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { formatYearMonthDay } from "@/lib/date-utils";
import { StarRating } from "./team-building-star-rating";
import { FeedbackDialog } from "./team-building-dialogs";
import {
  CATEGORY_COLOR,
  CATEGORY_ICON,
  CATEGORY_LABEL,
  calcDDay,
  formatDuration,
} from "./team-building-types";
import type { TeamBuildingEvent } from "@/types";

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

export const EventCard = memo(function EventCard({
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

  const ratedParticipants = event.participants.filter(
    (p) => p.rating !== undefined
  );
  const avgRating =
    ratedParticipants.length > 0
      ? ratedParticipants.reduce((sum, p) => sum + (p.rating ?? 0), 0) /
        ratedParticipants.length
      : null;

  async function handleJoin() {
    if (!currentMemberName) {
      toast.error(TOAST.TEAM_BUILDING.LOGIN_REQUIRED);
      return;
    }
    const ok = await onJoin(event.id, currentMemberName);
    if (ok) {
      toast.success(TOAST.TEAM_BUILDING.JOIN_DONE);
    } else {
      toast.error(isFull ? "최대 인원에 도달했습니다." : "이미 참가 중입니다.");
    }
  }

  async function handleLeave() {
    if (!currentMemberName) return;
    await onLeave(event.id, currentMemberName);
    toast.success(TOAST.TEAM_BUILDING.JOIN_CANCELLED);
  }

  async function handleFeedbackSubmit(rating: number, feedback?: string) {
    if (!currentMemberName) return;
    await onFeedback(event.id, currentMemberName, rating, feedback);
  }

  async function handleToggleComplete() {
    await onToggleComplete(event.id);
    toast.success(
      event.isCompleted ? "예정 상태로 변경되었습니다." : "완료 처리되었습니다."
    );
  }

  async function handleDelete() {
    await onDelete(event.id);
    toast.success(TOAST.TEAM_BUILDING.DELETED);
  }

  const participantCount = event.participants.length;
  const expandedLabel = expanded
    ? `참가자 목록 닫기 (${participantCount}명)`
    : `참가자 목록 열기 (${participantCount}명)`;

  return (
    <article
      className="rounded-lg border bg-card p-3 space-y-2"
      aria-label={`팀빌딩 활동: ${event.title}`}
    >
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
              <span aria-hidden="true">{CATEGORY_ICON[event.category]}</span>
              {CATEGORY_LABEL[event.category]}
            </Badge>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-tight truncate">
              {event.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
                <time dateTime={event.date}>
                  {formatYearMonthDay(event.date)}
                  {event.time && ` ${event.time}`}
                </time>
              </span>
              {!event.isCompleted && (
                <span
                  className="text-[10px] font-medium text-blue-600"
                  aria-label={`D-day: ${calcDDay(event.date)}`}
                >
                  {calcDDay(event.date)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleComplete}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label={event.isCompleted ? "예정으로 변경" : "완료 처리"}
            aria-pressed={event.isCompleted}
          >
            {event.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-muted-foreground hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label={`${event.title} 삭제`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 메타 정보 */}
      <dl className="flex items-center gap-3 flex-wrap">
        {event.location && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
            <dt className="sr-only">장소</dt>
            <dd>{event.location}</dd>
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User className="h-2.5 w-2.5" aria-hidden="true" />
          <dt className="sr-only">주최자</dt>
          <dd>{event.organizer}</dd>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Users className="h-2.5 w-2.5" aria-hidden="true" />
          <dt className="sr-only">참가자</dt>
          <dd>
            {participantCount}명
            {event.maxParticipants !== undefined && ` / ${event.maxParticipants}명`}
          </dd>
        </div>
        {event.duration !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Timer className="h-2.5 w-2.5" aria-hidden="true" />
            <dt className="sr-only">소요시간</dt>
            <dd>{formatDuration(event.duration)}</dd>
          </div>
        )}
        {event.budget !== undefined && (
          <div className="text-[10px] text-muted-foreground">
            <dt className="sr-only">예산</dt>
            <dd>예산 {event.budget.toLocaleString()}원</dd>
          </div>
        )}
      </dl>

      {/* 완료된 경우 평균 평점 */}
      {event.isCompleted && avgRating !== null && (
        <div className="flex items-center gap-1.5" aria-label={`평균 평점 ${avgRating.toFixed(1)}점`}>
          <StarRating value={Math.round(avgRating)} readonly />
          <span className="text-[10px] text-muted-foreground" aria-hidden="true">
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
                aria-label={`${event.title} 참가 취소`}
              >
                참가 취소
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={handleJoin}
                disabled={isFull}
                aria-label={isFull ? `${event.title} 마감됨` : `${event.title} 참가`}
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
            aria-label={
              myParticipant?.rating !== undefined
                ? `${event.title} 후기 수정`
                : `${event.title} 후기 작성`
            }
          >
            <Star className="h-2.5 w-2.5" aria-hidden="true" />
            {myParticipant?.rating !== undefined ? "후기 수정" : "후기 작성"}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2 ml-auto flex items-center gap-1"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expandedLabel}
        >
          참가자 {participantCount}명
          {expanded ? (
            <ChevronUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* 참가자 목록 */}
      {expanded && (
        <div className="pt-1 space-y-1.5" role="region" aria-label="참가자 목록">
          <Separator />
          {participantCount === 0 ? (
            <p
              className="text-[10px] text-muted-foreground text-center py-1"
              aria-live="polite"
            >
              아직 참가자가 없습니다.
            </p>
          ) : (
            <ul
              className="space-y-1.5"
              role="list"
              aria-label={`참가자 ${participantCount}명`}
            >
              {event.participants.map((p) => (
                <li
                  key={p.memberName}
                  className="flex items-start gap-2 text-[10px]"
                  role="listitem"
                >
                  <span className="font-medium text-foreground min-w-[56px] shrink-0">
                    {p.memberName}
                  </span>
                  {p.rating !== undefined && (
                    <StarRating value={p.rating} readonly />
                  )}
                  {p.feedback && (
                    <span className="text-muted-foreground flex items-start gap-0.5">
                      <MessageSquare className="h-2.5 w-2.5 mt-0.5 shrink-0" aria-hidden="true" />
                      {p.feedback}
                    </span>
                  )}
                </li>
              ))}
            </ul>
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
    </article>
  );
});
