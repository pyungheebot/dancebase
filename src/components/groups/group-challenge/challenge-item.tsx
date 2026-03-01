"use client";

import { memo, useState } from "react";
import { Calendar, Users, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DanceGroupChallengeEntry } from "@/types";
import {
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASS,
  PARTICIPANT_STATUS_CLASS,
  calcStatus,
  daysRemaining,
  progressPercent,
} from "./types";
import { ParticipantStatusIcon } from "./participant-status-icon";

interface ChallengeItemProps {
  challenge: DanceGroupChallengeEntry;
  onEdit: (challenge: DanceGroupChallengeEntry) => void;
  onDelete: (id: string) => void;
  onViewDetail: (challenge: DanceGroupChallengeEntry) => void;
}

export const ChallengeItem = memo(function ChallengeItem({
  challenge,
  onEdit,
  onDelete,
  onViewDetail,
}: ChallengeItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = calcStatus(challenge.startDate, challenge.endDate);
  const completedCount = challenge.participants.filter(
    (p) => p.status === "completed"
  ).length;
  const totalCount = challenge.participants.length;

  return (
    <article
      className="border rounded-lg p-3 space-y-2 hover:bg-muted/20 transition-colors"
      aria-label={`챌린지: ${challenge.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* 제목 영역 */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onViewDetail(challenge)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onViewDetail(challenge);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`${challenge.title} 상세 보기`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{challenge.title}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[challenge.category]}`}
            >
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
          </div>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {challenge.description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="챌린지 관리">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => onEdit(challenge)}
            aria-label={`${challenge.title} 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${confirmDelete ? "text-destructive" : "text-muted-foreground"}`}
            onClick={() => {
              if (confirmDelete) {
                onDelete(challenge.id);
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
              }
            }}
            onBlur={() => setConfirmDelete(false)}
            aria-label={confirmDelete ? `${challenge.title} 삭제 확인` : `${challenge.title} 삭제`}
            aria-pressed={confirmDelete}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <dl className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <dt className="sr-only">기간</dt>
          <dd>
            <time dateTime={challenge.startDate}>{challenge.startDate}</time>
            {" ~ "}
            <time dateTime={challenge.endDate}>{challenge.endDate}</time>
          </dd>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          <dt className="sr-only">참여자</dt>
          <dd>{totalCount}명 참여</dd>
        </div>
        {completedCount > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            <dt className="sr-only">완료</dt>
            <dd>{completedCount}명 완료</dd>
          </div>
        )}
      </dl>

      {/* 기간 진행률 바 */}
      {status === "active" && (
        <div className="space-y-1" aria-label="기간 진행률">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>기간 진행률</span>
            <span aria-label={`마감까지 ${daysRemaining(challenge.endDate)}일 남음`}>
              D-{daysRemaining(challenge.endDate)}
            </span>
          </div>
          <div
            className="h-1.5 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent(challenge.startDate, challenge.endDate)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`진행률 ${progressPercent(challenge.startDate, challenge.endDate)}%`}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${progressPercent(challenge.startDate, challenge.endDate)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 참여자 칩 */}
      {totalCount > 0 && (
        <ul
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="참여자 목록"
        >
          {challenge.participants.slice(0, 5).map((p) => (
            <li
              key={p.id}
              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted ${PARTICIPANT_STATUS_CLASS[p.status]}`}
            >
              <ParticipantStatusIcon status={p.status} />
              <span>{p.name}</span>
            </li>
          ))}
          {totalCount > 5 && (
            <li className="text-[10px] text-muted-foreground px-1.5 py-0.5" aria-label={`외 ${totalCount - 5}명`}>
              +{totalCount - 5}명
            </li>
          )}
        </ul>
      )}
    </article>
  );
});
