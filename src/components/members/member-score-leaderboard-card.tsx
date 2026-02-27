"use client";

import { useState } from "react";
import { Trophy, Users, ChevronDown, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberScoreLeaderboard } from "@/hooks/use-member-score-leaderboard";
import type { MemberScoreEntry, MemberScoreBreakdown } from "@/types";

// -----------------------------------------------
// 점수 구성 바 색상 정의
// -----------------------------------------------

const SCORE_BAR_COLORS = {
  attendance: "bg-green-500",
  posts: "bg-blue-500",
  comments: "bg-purple-500",
  rsvp: "bg-orange-400",
} as const;

const SCORE_BAR_LABELS = {
  attendance: "출석",
  posts: "게시글",
  comments: "댓글",
  rsvp: "RSVP",
} as const;

// -----------------------------------------------
// 서브 컴포넌트: 메달 / 순위 표시
// -----------------------------------------------

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="text-sm select-none"
        role="img"
        aria-label="금메달"
      >
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className="text-sm select-none"
        role="img"
        aria-label="은메달"
      >
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className="text-sm select-none"
        role="img"
        aria-label="동메달"
      >
        🥉
      </span>
    );
  }
  return (
    <span className="text-[11px] font-bold text-muted-foreground w-5 text-center tabular-nums">
      {rank}
    </span>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 이니셜 아바타
// -----------------------------------------------

function InitialAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
      <span className="text-[10px] font-bold text-primary">{initial}</span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 점수 구성 바
// -----------------------------------------------

function ScoreBreakdownBar({
  breakdown,
  totalScore,
}: {
  breakdown: MemberScoreBreakdown;
  totalScore: number;
}) {
  if (totalScore === 0) {
    return (
      <div className="w-full h-1.5 rounded-full bg-muted mt-1" />
    );
  }

  const allSegments: { key: keyof MemberScoreBreakdown; value: number }[] = [
    { key: "attendance", value: breakdown.attendance },
    { key: "posts", value: breakdown.posts },
    { key: "comments", value: breakdown.comments },
    { key: "rsvp", value: breakdown.rsvp },
  ];
  const segments = allSegments.filter((s) => s.value > 0);

  return (
    <div
      className="flex w-full h-1.5 rounded-full overflow-hidden mt-1 gap-px"
      title={[
        `출석: ${breakdown.attendance}점`,
        `게시글: ${breakdown.posts}점`,
        `댓글: ${breakdown.comments}점`,
        `RSVP: ${breakdown.rsvp}점`,
      ].join(" / ")}
    >
      {segments.map(({ key, value }) => (
        <div
          key={key}
          className={`h-full ${SCORE_BAR_COLORS[key]}`}
          style={{ width: `${Math.round((value / totalScore) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 리더보드 행 (1~3위 - 구성 바 포함)
// -----------------------------------------------

function TopEntryRow({
  entry,
  isMe,
}: {
  entry: MemberScoreEntry;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 py-1.5 px-1.5 rounded-md ${
        isMe ? "bg-primary/5 ring-1 ring-primary/20" : ""
      }`}
    >
      {/* 순위 */}
      <div className="w-5 flex items-center justify-center shrink-0 pt-0.5">
        <RankDisplay rank={entry.rank} />
      </div>

      {/* 아바타 */}
      <InitialAvatar name={entry.name} />

      {/* 이름 + 점수 구성 바 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold truncate">
            {entry.name}
            {isMe && (
              <span className="ml-1 text-[9px] font-bold text-primary">나</span>
            )}
          </span>
          <span className="text-xs font-bold tabular-nums text-primary shrink-0">
            {entry.totalScore}점
          </span>
        </div>
        <ScoreBreakdownBar
          breakdown={entry.breakdown}
          totalScore={entry.totalScore}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 리더보드 행 (4위 이하)
// -----------------------------------------------

function NormalEntryRow({
  entry,
  isMe,
}: {
  entry: MemberScoreEntry;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 py-1 px-1.5 rounded-md ${
        isMe ? "bg-primary/5 ring-1 ring-primary/20" : ""
      }`}
    >
      {/* 순위 */}
      <div className="w-5 flex items-center justify-center shrink-0">
        <RankDisplay rank={entry.rank} />
      </div>

      {/* 아바타 */}
      <InitialAvatar name={entry.name} />

      {/* 이름 */}
      <span className="text-xs flex-1 min-w-0 truncate">
        {entry.name}
        {isMe && (
          <span className="ml-1 text-[9px] font-bold text-primary">나</span>
        )}
      </span>

      {/* 총점 */}
      <span className="text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
        {entry.totalScore}점
      </span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 내 순위 하이라이트 (20위 밖인 경우)
// -----------------------------------------------

function MyOutOfRangeEntry({
  myEntry,
}: {
  myEntry: MemberScoreEntry;
}) {
  return (
    <div className="border-t pt-2 mt-1">
      <div className="flex items-center gap-1 mb-1">
        <Star className="h-3 w-3 text-yellow-500" />
        <span className="text-[10px] font-semibold text-muted-foreground">
          내 순위
        </span>
      </div>
      <TopEntryRow entry={myEntry} isMe={true} />
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 범례
// -----------------------------------------------

function ScoreLegend() {
  const items = Object.entries(SCORE_BAR_LABELS) as [
    keyof typeof SCORE_BAR_LABELS,
    string
  ][];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t mt-1">
      {items.map(([key, label]) => (
        <div key={key} className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full shrink-0 ${SCORE_BAR_COLORS[key]}`}
          />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-1.5">
          <Skeleton className="h-4 w-5 rounded" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface MemberScoreLeaderboardCardProps {
  groupId: string;
}

export function MemberScoreLeaderboardCard({
  groupId,
}: MemberScoreLeaderboardCardProps) {
  const { data, loading } = useMemberScoreLeaderboard(groupId);
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { entries, totalMembers, myEntry } = data;

  // 기본 표시: 상위 10명, showAll이면 최대 20명
  const displayEntries = showAll ? entries : entries.slice(0, 10);

  // 내 순위가 표시 범위 밖인지 확인
  const myEntryInDisplay = myEntry
    ? displayEntries.some((e) => e.userId === myEntry.userId)
    : false;
  const showMyOutOfRange = myEntry && !myEntryInDisplay;

  const hasData = entries.length > 0;

  // 기간 표시 문자열 계산
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;
  const periodLabel = `${formatDate(thirtyDaysAgo)} ~ ${formatDate(now)}`;

  return (
    <Card className="mb-3">
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-semibold">활동 리더보드</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
              style={{
                transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              }}
            />
          </Button>
        </div>

        {/* 요약 배지 */}
        <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 gap-1"
          >
            <Users className="h-2.5 w-2.5" />
            {totalMembers}명 참여
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 text-muted-foreground"
          >
            최근 30일 ({periodLabel})
          </Badge>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <LeaderboardSkeleton />
          ) : !hasData ? (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-muted-foreground">
                아직 활동 기록이 없습니다
              </span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* 리더보드 목록 (최대 스크롤 20명) */}
              <div className="max-h-[320px] overflow-y-auto space-y-0.5 pr-0.5">
                {displayEntries.map((entry) => {
                  const isMe = myEntry?.userId === entry.userId;
                  if (entry.rank <= 3) {
                    return (
                      <TopEntryRow
                        key={entry.userId}
                        entry={entry}
                        isMe={isMe}
                      />
                    );
                  }
                  return (
                    <NormalEntryRow
                      key={entry.userId}
                      entry={entry}
                      isMe={isMe}
                    />
                  );
                })}
              </div>

              {/* 내 순위 (20위 밖) */}
              {showMyOutOfRange && myEntry && (
                <MyOutOfRangeEntry myEntry={myEntry} />
              )}

              {/* 더 보기 / 접기 버튼 */}
              {entries.length > 10 && (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => setShowAll((prev) => !prev)}
                  >
                    {showAll
                      ? "접기"
                      : `${entries.length - 10}명 더 보기`}
                  </Button>
                </div>
              )}

              {/* 점수 범례 */}
              <ScoreLegend />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
