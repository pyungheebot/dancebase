"use client";

import { useState } from "react";
import {
  Trophy,
  Medal,
  Target,
  CheckCircle2,
  Flame,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWeeklyChallengeBoard } from "@/hooks/use-weekly-challenge-board";
import { cn } from "@/lib/utils";
import type { WeeklyChallenge, WeeklyChallengeEntry, MemberChallengeProgress, WeeklyChallengeType } from "@/types";

// -------------------------------------------------------
// 유틸
// -------------------------------------------------------

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function formatDateRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const month = start.getMonth() + 1;
  const startDay = start.getDate();
  const endDay = end.getDate();
  return `${month}월 ${startDay}일 - ${endDay}일`;
}

// -------------------------------------------------------
// 순위 아이콘
// -------------------------------------------------------

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
  return (
    <span className="text-xs font-semibold text-muted-foreground w-4 text-center tabular-nums">
      {rank}
    </span>
  );
}

// -------------------------------------------------------
// 챌린지 유형별 아이콘/색상 설정
// -------------------------------------------------------

type ChallengeConfig = {
  color: string;
  trackColor: string;
};

const CHALLENGE_CONFIG: Record<WeeklyChallengeType, ChallengeConfig> = {
  attendance: { color: "text-blue-600",  trackColor: "bg-blue-100" },
  board:      { color: "text-purple-600", trackColor: "bg-purple-100" },
  rsvp:       { color: "text-green-600", trackColor: "bg-green-100" },
};

// -------------------------------------------------------
// 단일 챌린지 카드 (내 진행 상황용)
// -------------------------------------------------------

type MyChallengeCardProps = {
  challenge: WeeklyChallenge;
  progress: MemberChallengeProgress;
};

function MyChallengeCard({ challenge, progress }: MyChallengeCardProps) {
  const config = CHALLENGE_CONFIG[challenge.id];

  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
          <span className="text-xs font-medium truncate">{challenge.title}</span>
        </div>
        {progress.completed && (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        )}
      </div>

      <div className="space-y-1">
        <Progress
          value={progress.progressRate}
          className={cn("h-1.5", config.trackColor)}
        />
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {progress.challengeId === "rsvp"
              ? progress.completed
                ? "전체 응답 완료"
                : "미응답 일정 있음"
              : `${progress.current} / ${progress.goal}`}
          </span>
          {progress.completed ? (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200">
              완료
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {progress.progressRate}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 리더보드 단일 행
// -------------------------------------------------------

type LeaderboardRowProps = {
  entry: WeeklyChallengeEntry;
  isMe: boolean;
};

function LeaderboardRow({ entry, isMe }: LeaderboardRowProps) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors",
        isMe
          ? "bg-blue-50 border border-blue-200"
          : isTop3
          ? "bg-muted/40"
          : "hover:bg-muted/20"
      )}
    >
      {/* 순위 */}
      <div className="flex items-center justify-center w-5 shrink-0">
        <RankIcon rank={entry.rank} />
      </div>

      {/* 아바타 */}
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            isTop3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
          )}
        >
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>

      {/* 이름 */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn("text-xs font-medium truncate", isMe && "text-blue-700")}>
          {entry.name}
          {isMe && (
            <span className="ml-1 text-[10px] text-blue-500 font-normal">(나)</span>
          )}
        </span>
      </div>

      {/* 완료 챌린지 수 배지들 */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex gap-0.5">
          {entry.challenges.map((ch) => (
            <div
              key={ch.challengeId}
              className={cn(
                "w-2 h-2 rounded-full",
                ch.completed ? "bg-green-400" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* 점수 */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Flame
          className={cn(
            "h-3 w-3",
            entry.score >= 3
              ? "text-amber-500"
              : entry.score >= 2
              ? "text-orange-400"
              : entry.score >= 1
              ? "text-blue-400"
              : "text-muted-foreground/30"
          )}
        />
        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            entry.score >= 3
              ? "text-amber-600"
              : entry.score >= 2
              ? "text-orange-500"
              : entry.score >= 1
              ? "text-blue-500"
              : "text-muted-foreground"
          )}
        >
          {entry.completedCount}/3
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------

type WeeklyChallengeBoardProps = {
  groupId: string;
  currentUserId?: string;
};

export function WeeklyChallengeBoard({ groupId, currentUserId }: WeeklyChallengeBoardProps) {
  const [open, setOpen] = useState(true);

  const {
    entries,
    challenges,
    weekStart,
    weekEnd,
    daysLeft,
    myEntry,
    loading,
  } = useWeeklyChallengeBoard(groupId, currentUserId);

  // 리더보드 상위 5명
  const top5 = entries.slice(0, 5);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded border">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Trophy className="h-3 w-3 text-amber-500" />
              주간 챌린지 보드
            </span>
            <div className="flex items-center gap-1.5">
              {/* 이번 주 기간 + 남은 일수 */}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {formatDateRange(weekStart, weekEnd)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4",
                    daysLeft <= 2
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-blue-50 text-blue-600 border-blue-200"
                  )}
                >
                  D-{daysLeft}
                </Badge>
              </div>
              {open ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="px-2.5 py-2 space-y-3">
              {/* 내 챌린지 진행 상황 */}
              {myEntry && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    내 챌린지
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {challenges.map((challenge) => {
                      const progress = myEntry.challenges.find(
                        (c) => c.challengeId === challenge.id
                      );
                      if (!progress) return null;
                      return (
                        <MyChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          progress={progress}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 구분선 (내 챌린지가 있을 때) */}
              {myEntry && top5.length > 0 && (
                <div className="border-t" />
              )}

              {/* 리더보드 */}
              {top5.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    리더보드
                  </p>
                  <div className="space-y-0.5">
                    {top5.map((entry) => (
                      <LeaderboardRow
                        key={entry.userId}
                        entry={entry}
                        isMe={entry.userId === currentUserId}
                      />
                    ))}
                  </div>

                  {/* 내 순위가 5위 밖일 때 하단 표시 */}
                  {myEntry && myEntry.rank > 5 && (
                    <div className="pt-1.5 border-t">
                      <p className="text-[10px] text-muted-foreground mb-0.5 text-center">
                        내 순위
                      </p>
                      <LeaderboardRow entry={myEntry} isMe={true} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    아직 멤버가 없습니다.
                  </p>
                </div>
              )}

              {/* 챌린지 범례 */}
              <div className="pt-0.5 border-t">
                <div className="flex flex-wrap gap-1.5">
                  {challenges.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          ch.id === "attendance"
                            ? "bg-blue-400"
                            : ch.id === "board"
                            ? "bg-purple-400"
                            : "bg-green-400"
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
