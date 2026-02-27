"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsDown, Hand, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { useSongReadinessVote, VOTE_LABELS, VOTE_COLORS } from "@/hooks/use-song-readiness-vote";
import type { SongReadinessVote } from "@/types";

interface SongReadinessVoteProps {
  songId: string;
  groupId: string;
  userId: string;
  userName: string;
}

const VOTE_OPTIONS: {
  value: SongReadinessVote;
  icon: React.ReactNode;
}[] = [
  { value: "not_ready", icon: <ThumbsDown className="h-3 w-3" /> },
  { value: "almost", icon: <Hand className="h-3 w-3" /> },
  { value: "ready", icon: <ThumbsUp className="h-3 w-3" /> },
];

const PROGRESS_BAR_COLORS: Record<SongReadinessVote, string> = {
  not_ready: "bg-red-400",
  almost: "bg-yellow-400",
  ready: "bg-green-400",
};

const BADGE_COLORS: Record<typeof VOTE_COLORS[SongReadinessVote], string> = {
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
};

export function SongReadinessVotePanel({
  songId,
  groupId,
  userId,
  userName,
}: SongReadinessVoteProps) {
  const { getVotes, castVote, getMyVote, getSummary, getReadinessRate } =
    useSongReadinessVote(groupId);

  const [detailOpen, setDetailOpen] = useState(false);

  const summary = getSummary(songId);
  const myVote = getMyVote(songId, userId);
  const readinessRate = getReadinessRate(songId);
  const votes = getVotes(songId);

  function handleVote(vote: SongReadinessVote) {
    castVote(songId, userId, userName, vote);
  }

  // 진행률 바 각 구간 너비 계산
  const notReadyPct =
    summary.total > 0
      ? Math.round((summary.notReady / summary.total) * 100)
      : 0;
  const almostPct =
    summary.total > 0
      ? Math.round((summary.almost / summary.total) * 100)
      : 0;
  const readyPct =
    summary.total > 0
      ? Math.round((summary.ready / summary.total) * 100)
      : 0;

  return (
    <div className="mt-1 ml-1 px-2 py-1.5 bg-muted/20 rounded border border-border/40 space-y-1.5">
      {/* 투표 버튼 행 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground shrink-0">완성도:</span>
        {VOTE_OPTIONS.map(({ value, icon }) => {
          const isSelected = myVote === value;
          const count =
            value === "not_ready"
              ? summary.notReady
              : value === "almost"
              ? summary.almost
              : summary.ready;
          const color = VOTE_COLORS[value];
          return (
            <div key={value} className="flex flex-col items-center gap-0.5">
              {/* 투표 수 배지 */}
              {count > 0 && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    BADGE_COLORS[color as keyof typeof BADGE_COLORS] ??
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {count}
                </Badge>
              )}
              {count === 0 && <span className="h-4" />}
              {/* 버튼 */}
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`h-6 text-[10px] px-2 gap-1 ${
                  isSelected
                    ? value === "not_ready"
                      ? "bg-red-500 hover:bg-red-600 border-red-500"
                      : value === "almost"
                      ? "bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
                      : "bg-green-500 hover:bg-green-600 border-green-500"
                    : ""
                }`}
                onClick={() => handleVote(value)}
                title={VOTE_LABELS[value]}
              >
                {icon}
                <span className="hidden sm:inline">{VOTE_LABELS[value]}</span>
              </Button>
            </div>
          );
        })}
      </div>

      {/* 진행률 바 */}
      {summary.total > 0 && (
        <div className="space-y-0.5">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50 w-full">
            {notReadyPct > 0 && (
              <div
                className={`h-full ${PROGRESS_BAR_COLORS.not_ready} transition-all`}
                style={{ width: `${notReadyPct}%` }}
              />
            )}
            {almostPct > 0 && (
              <div
                className={`h-full ${PROGRESS_BAR_COLORS.almost} transition-all`}
                style={{ width: `${almostPct}%` }}
              />
            )}
            {readyPct > 0 && (
              <div
                className={`h-full ${PROGRESS_BAR_COLORS.ready} transition-all`}
                style={{ width: `${readyPct}%` }}
              />
            )}
          </div>
          {/* 완성도 % + 총 투표 수 */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              총 {summary.total}명 투표
            </span>
            <span className="text-[10px] font-medium text-foreground">
              완성도 {readinessRate}%
            </span>
          </div>
        </div>
      )}

      {/* 투표 상세 보기 토글 */}
      {summary.total > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setDetailOpen((v) => !v)}
          >
            {detailOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            투표 상세
          </button>

          {detailOpen && (
            <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {votes.map((entry) => {
                const color = VOTE_COLORS[entry.vote];
                return (
                  <div
                    key={`${entry.userId}-${entry.songId}`}
                    className="flex items-center gap-1.5 text-[10px]"
                  >
                    <span className="text-muted-foreground shrink-0 w-20 truncate">
                      {entry.userName}
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 shrink-0 ${
                        BADGE_COLORS[color as keyof typeof BADGE_COLORS] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {VOTE_LABELS[entry.vote]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
