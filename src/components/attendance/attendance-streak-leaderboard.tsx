"use client";

import { Flame, Trophy, Medal, Crown, Star, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAttendanceStreakLeaderboard } from "@/hooks/use-attendance-streak-leaderboard";
import type { AttendanceStreakEntry, StreakBadgeTier } from "@/types";
import { cn } from "@/lib/utils";

// -------------------------------------------------------
// 배지 설정
// -------------------------------------------------------

type BadgeConfig = {
  label: string;
  className: string;
};

const BADGE_CONFIG: Record<StreakBadgeTier, BadgeConfig> = {
  FIRE:    { label: "FIRE",    className: "bg-orange-100 text-orange-700 border-orange-200" },
  STAR:    { label: "STAR",    className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  DIAMOND: { label: "DIAMOND", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  CROWN:   { label: "CROWN",   className: "bg-purple-100 text-purple-700 border-purple-200" },
};

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
// 이름 이니셜 추출
// -------------------------------------------------------

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 한글은 첫 글자, 영문은 첫 두 글자
  return trimmed.charAt(0).toUpperCase();
}

// -------------------------------------------------------
// 단일 리더보드 행
// -------------------------------------------------------

type LeaderboardRowProps = {
  entry: AttendanceStreakEntry;
  isMe: boolean;
};

function LeaderboardRow({ entry, isMe }: LeaderboardRowProps) {
  const isTop3 = entry.rank <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
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
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            isTop3 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
          )}
        >
          {getInitials(entry.name)}
        </AvatarFallback>
      </Avatar>

      {/* 이름 + 최대 기록 */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn("text-sm font-medium truncate", isMe && "text-blue-700")}>
          {entry.name}
          {isMe && (
            <span className="ml-1 text-[10px] text-blue-500 font-normal">(나)</span>
          )}
        </span>
        {entry.longestStreak > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            최대 {entry.longestStreak}회
          </span>
        )}
      </div>

      {/* 배지 */}
      {entry.badge && (
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 h-4 shrink-0",
            BADGE_CONFIG[entry.badge].className
          )}
        >
          {BADGE_CONFIG[entry.badge].label}
        </Badge>
      )}

      {/* 현재 스트릭 */}
      <div className="flex items-center gap-0.5 shrink-0 ml-auto">
        <Flame
          className={cn(
            "h-3.5 w-3.5",
            entry.currentStreak >= 14
              ? "text-purple-500"
              : entry.currentStreak >= 7
              ? "text-yellow-500"
              : entry.currentStreak >= 3
              ? "text-amber-500"
              : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            entry.currentStreak >= 14
              ? "text-purple-600"
              : entry.currentStreak >= 7
              ? "text-yellow-600"
              : entry.currentStreak >= 3
              ? "text-amber-600"
              : "text-foreground"
          )}
        >
          {entry.currentStreak}
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 상단 요약 카드
// -------------------------------------------------------

type SummaryCardProps = {
  averageStreak: number;
  topName: string;
  topStreak: number;
};

function SummaryCard({ averageStreak, topName, topStreak }: SummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {/* 그룹 평균 스트릭 */}
      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/40 border">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-[10px] text-muted-foreground font-medium">그룹 평균</span>
        </div>
        <span className="text-2xl font-bold tabular-nums leading-none">
          {averageStreak}
        </span>
        <span className="text-[10px] text-muted-foreground">회 연속</span>
      </div>

      {/* 최고 스트릭 보유자 */}
      <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-1">
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] text-muted-foreground font-medium">최고 기록</span>
        </div>
        <span className="text-sm font-bold leading-none truncate max-w-full px-1">
          {topName}
        </span>
        <span className="text-[10px] text-amber-600 font-semibold">{topStreak}회 연속</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 배지 기준 안내
// -------------------------------------------------------

function BadgeLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {(Object.entries(BADGE_CONFIG) as [StreakBadgeTier, BadgeConfig][]).map(([tier, config]) => {
        const thresholds: Record<StreakBadgeTier, string> = {
          FIRE:    "3회+",
          STAR:    "7회+",
          DIAMOND: "14회+",
          CROWN:   "30회+",
        };
        return (
          <Badge
            key={tier}
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4", config.className)}
          >
            {config.label} {thresholds[tier]}
          </Badge>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------

type AttendanceStreakLeaderboardProps = {
  groupId: string;
  currentUserId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AttendanceStreakLeaderboard({
  groupId,
  currentUserId,
  open,
  onOpenChange,
}: AttendanceStreakLeaderboardProps) {
  const { entries, averageStreak, topEntry, loading } =
    useAttendanceStreakLeaderboard(groupId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-amber-500" />
            출석 스트릭 리더보드
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">출석 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-2 pr-1">
            {/* 상단 요약 */}
            {topEntry && (
              <SummaryCard
                averageStreak={averageStreak}
                topName={topEntry.name}
                topStreak={topEntry.currentStreak}
              />
            )}

            {/* 배지 기준 안내 */}
            <BadgeLegend />

            {/* 리더보드 목록 */}
            <div className="flex flex-col gap-1">
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isMe={entry.userId === currentUserId}
                />
              ))}
            </div>

            {/* 내 순위가 상위권에 없을 때 하단 고정 표시 */}
            {(() => {
              const myEntry = entries.find((e) => e.userId === currentUserId);
              if (!myEntry || myEntry.rank <= 10) return null;
              return (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-[10px] text-muted-foreground mb-1 text-center">
                    내 순위
                  </p>
                  <LeaderboardRow entry={myEntry} isMe={true} />
                </div>
              );
            })()}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
