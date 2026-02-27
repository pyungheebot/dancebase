"use client";

import { useState } from "react";
import { usePollStatistics } from "@/hooks/use-poll-statistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";

interface PollStatisticsCardProps {
  postId: string;
  groupId: string;
}

export function PollStatisticsCard({ postId, groupId }: PollStatisticsCardProps) {
  const { statistics, loading } = usePollStatistics(postId, groupId);
  const [showNonParticipants, setShowNonParticipants] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!statistics) return null;

  const {
    optionStats,
    totalVotes,
    totalMembers,
    participantCount,
    participationRate,
    nonParticipants,
    isExpired,
  } = statistics;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">투표 통계</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isExpired && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600"
              >
                마감됨
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">총 {totalVotes}표</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* 득표율 바 차트 */}
        <div className="space-y-2">
          {optionStats.map((option) => (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs truncate">{option.text}</span>
                  {option.isTop && (
                    <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                      최다
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                  {option.voteCount}표 · {option.percentage}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    option.isTop ? "bg-blue-500" : "bg-muted-foreground/40"
                  }`}
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 구분선 */}
        <div className="border-t" />

        {/* 참여율 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">참여율</span>
            <span className="text-xs font-medium">
              {participantCount}/{totalMembers}명 참여 ({participationRate}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                participationRate >= 70
                  ? "bg-green-500"
                  : participationRate >= 40
                  ? "bg-yellow-500"
                  : "bg-red-400"
              }`}
              style={{ width: `${participationRate}%` }}
            />
          </div>
        </div>

        {/* 미참여 멤버 */}
        {nonParticipants.length > 0 && (
          <div className="space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-1 text-muted-foreground w-full justify-between"
              onClick={() => setShowNonParticipants((prev) => !prev)}
            >
              <span>미참여 멤버 {nonParticipants.length}명</span>
              {showNonParticipants ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            {showNonParticipants && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {nonParticipants.map((member) => (
                  <Badge
                    key={member.userId}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-normal"
                  >
                    {member.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 전원 참여 */}
        {nonParticipants.length === 0 && totalMembers > 0 && (
          <div className="text-center py-1">
            <span className="text-[11px] text-green-600 font-medium">
              모든 멤버가 투표에 참여했습니다
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
