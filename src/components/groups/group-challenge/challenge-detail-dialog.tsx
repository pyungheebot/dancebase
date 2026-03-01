"use client";

import { useState } from "react";
import {
  Trophy,
  Plus,
  Trash2,
  Users,
  Calendar,
  Medal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DanceGroupChallengeEntry,
  DanceGroupChallengeParticipantStatus,
} from "@/types";
import {
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASS,
  PARTICIPANT_STATUS_LABELS,
  PARTICIPANT_STATUS_CLASS,
  calcStatus,
  daysRemaining,
  progressPercent,
} from "./types";
import { ParticipantStatusIcon } from "./participant-status-icon";

interface ChallengeDetailDialogProps {
  challenge: DanceGroupChallengeEntry;
  open: boolean;
  onClose: () => void;
  onAddParticipant: (challengeId: string, name: string) => boolean;
  onUpdateParticipantStatus: (
    challengeId: string,
    participantId: string,
    status: DanceGroupChallengeParticipantStatus
  ) => void;
  onRemoveParticipant: (challengeId: string, participantId: string) => void;
}

export function ChallengeDetailDialog({
  challenge,
  open,
  onClose,
  onAddParticipant,
  onUpdateParticipantStatus,
  onRemoveParticipant,
}: ChallengeDetailDialogProps) {
  const [newName, setNewName] = useState("");
  const addInputId = `add-participant-${challenge.id}`;

  const handleAddParticipant = () => {
    const success = onAddParticipant(challenge.id, newName);
    if (success) setNewName("");
  };

  const sortedParticipants = [...challenge.participants].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (b.status === "completed" && a.status !== "completed") return 1;
    if (a.completedRank !== null && b.completedRank !== null) {
      return a.completedRank - b.completedRank;
    }
    return 0;
  });

  const isActive = calcStatus(challenge.startDate, challenge.endDate) === "active";
  const hasCompleted = challenge.participants.some((p) => p.status === "completed");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            {challenge.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 카테고리 & 기간 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[challenge.category]}`}
            >
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={challenge.startDate}>{challenge.startDate}</time>
              {" ~ "}
              <time dateTime={challenge.endDate}>{challenge.endDate}</time>
            </span>
          </div>

          {/* 설명 */}
          {challenge.description && (
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          )}

          {/* 진행률 바 */}
          {isActive && (
            <div className="space-y-1" aria-label="기간 진행률">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>진행률</span>
                <span aria-label={`마감까지 ${daysRemaining(challenge.endDate)}일 남음`}>
                  D-{daysRemaining(challenge.endDate)}
                </span>
              </div>
              <div
                className="h-2 bg-muted rounded-full overflow-hidden"
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

          <Separator />

          {/* 참여자 섹션 */}
          <section aria-labelledby="participants-heading">
            <p
              id="participants-heading"
              className="text-xs font-medium flex items-center gap-1 mb-2"
            >
              <Users className="h-3 w-3" aria-hidden="true" />
              참여자 ({challenge.participants.length}명)
            </p>

            {/* 참여자 추가 입력 */}
            <div className="flex gap-2 mb-3">
              <label htmlFor={addInputId} className="sr-only">
                참여자 이름
              </label>
              <Input
                id={addInputId}
                className="h-7 text-xs"
                placeholder="참여자 이름 입력"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddParticipant();
                }}
                aria-describedby="add-participant-hint"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleAddParticipant}
                aria-label="참여자 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                추가
              </Button>
            </div>
            <p id="add-participant-hint" className="sr-only">
              이름 입력 후 Enter 또는 추가 버튼을 누르세요
            </p>

            {/* 참여자 목록 */}
            {sortedParticipants.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-3"
                role="alert"
                aria-live="polite"
              >
                참여자가 없습니다
              </p>
            ) : (
              <ul
                className="space-y-1.5"
                role="list"
                aria-label="참여자 상태 목록"
              >
                {sortedParticipants.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      {p.completedRank !== null ? (
                        <span
                          className="text-[10px] font-bold text-yellow-600 w-5 text-center"
                          aria-label={`${p.completedRank}위`}
                        >
                          {p.completedRank}위
                        </span>
                      ) : (
                        <span className="w-5" aria-hidden="true" />
                      )}
                      <span className="text-xs font-medium">{p.name}</span>
                      <span
                        className={`flex items-center gap-0.5 text-[10px] ${PARTICIPANT_STATUS_CLASS[p.status]}`}
                        aria-label={`상태: ${PARTICIPANT_STATUS_LABELS[p.status]}`}
                      >
                        <ParticipantStatusIcon status={p.status} />
                        {PARTICIPANT_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1" role="group" aria-label={`${p.name} 관리`}>
                      <Select
                        value={p.status}
                        onValueChange={(v) =>
                          onUpdateParticipantStatus(
                            challenge.id,
                            p.id,
                            v as DanceGroupChallengeParticipantStatus
                          )
                        }
                      >
                        <SelectTrigger
                          className="h-6 text-[10px] w-24 px-2"
                          aria-label={`${p.name} 상태 변경`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started" className="text-xs">
                            미시작
                          </SelectItem>
                          <SelectItem value="in_progress" className="text-xs">
                            진행중
                          </SelectItem>
                          <SelectItem value="completed" className="text-xs">
                            완료
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveParticipant(challenge.id, p.id)}
                        aria-label={`${p.name} 참가자 제거`}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* 완료 순위 */}
            {hasCompleted && (
              <div
                className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200"
                role="region"
                aria-label="완료 순위"
              >
                <p className="text-[10px] font-medium text-yellow-700 flex items-center gap-1 mb-1">
                  <Medal className="h-3 w-3" aria-hidden="true" />
                  완료 순위
                </p>
                <ol aria-label="완료 순위 목록">
                  {[...challenge.participants]
                    .filter((p) => p.status === "completed" && p.completedRank !== null)
                    .sort((a, b) => (a.completedRank ?? 0) - (b.completedRank ?? 0))
                    .map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 text-xs text-yellow-800"
                      >
                        <span className="font-bold w-6" aria-label={`${p.completedRank}위`}>
                          {p.completedRank}위
                        </span>
                        <span>{p.name}</span>
                      </li>
                    ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
