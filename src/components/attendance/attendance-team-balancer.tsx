"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, Shuffle, BarChart3, ArrowRight } from "lucide-react";
import { useAttendanceTeamBalance } from "@/hooks/use-attendance-team-balance";
import { TEAM_BALANCER_COLORS } from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// Props
// ============================================

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: EntityMember[];
};

// ============================================
// 팀 수 버튼 그룹
// ============================================

const TEAM_COUNT_OPTIONS = [2, 3, 4] as const;
type TeamCountOption = (typeof TEAM_COUNT_OPTIONS)[number];

// ============================================
// 아바타 이니셜 추출
// ============================================

function getInitials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

// ============================================
// 출석률 색상
// ============================================

function getAttendanceRateColor(rate: number): string {
  if (rate >= 80) return "text-green-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-500";
}

// ============================================
// AttendanceTeamBalancer 컴포넌트
// ============================================

export function AttendanceTeamBalancer({ open, onOpenChange, groupId, members }: Props) {
  const [teamCount, setTeamCount] = useState<TeamCountOption>(2);

  const { teams, rateDeviation, hasData, loading, refetch } =
    useAttendanceTeamBalance(groupId, members, teamCount);

  // 팀 색상 헬퍼
  function getColor(colorKey: string) {
    return (
      TEAM_BALANCER_COLORS.find((c) => c.key === colorKey) ??
      TEAM_BALANCER_COLORS[0]
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-blue-500" />
            출석 팀 밸런서
          </DialogTitle>
        </DialogHeader>

        {/* 팀 수 선택 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">팀 수</span>
          <div className="flex gap-1">
            {TEAM_COUNT_OPTIONS.map((n) => (
              <Button
                key={n}
                size="sm"
                variant={teamCount === n ? "default" : "outline"}
                className="h-7 w-10 text-xs px-0"
                onClick={() => setTeamCount(n)}
              >
                {n}팀
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs ml-auto gap-1"
            onClick={refetch}
            disabled={loading}
          >
            <Shuffle className="h-3 w-3" />
            새로 구성
          </Button>
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              출석 패턴 분석 중...
            </span>
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !hasData && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <BarChart3 className="h-8 w-8 opacity-30" />
            <p className="text-sm">최근 2개월간 출석 기록이 없습니다.</p>
            <p className="text-xs">출석 체크가 있는 일정이 필요합니다.</p>
          </div>
        )}

        {/* 팀 카드 */}
        {!loading && hasData && teams.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teams.map((team) => {
              const color = getColor(team.colorKey);
              return (
                <div
                  key={team.index}
                  className={`rounded-lg border p-3 ${color.bg} ${color.border}`}
                >
                  {/* 팀 헤더 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${color.text}`}>
                      {team.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        평균 출석률
                      </span>
                      <span
                        className={`text-xs font-semibold ${getAttendanceRateColor(
                          team.avgAttendanceRate
                        )}`}
                      >
                        {team.avgAttendanceRate}%
                      </span>
                    </div>
                  </div>

                  {/* 멤버 수 배지 */}
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${color.badge}`}
                    >
                      <Users className="h-3 w-3" />
                      {team.members.length}명
                    </span>
                  </div>

                  {/* 멤버 목록 */}
                  <div className="flex flex-col gap-1.5">
                    {team.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          {member.avatarUrl && (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                          )}
                          <AvatarFallback className="text-[10px]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs flex-1 truncate">
                          {member.name}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${getAttendanceRateColor(
                            member.attendanceRate
                          )}`}
                        >
                          {member.attendanceRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 요약 섹션 */}
        {!loading && hasData && teams.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                팀 구성 요약
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* 팀별 멤버 수 */}
              {teams.map((team) => {
                const color = getColor(team.colorKey);
                return (
                  <div key={team.index} className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color.badge}`}
                    >
                      {team.name}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">
                      {team.members.length}명
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 출석률 편차 */}
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                팀 간 출석률 편차
              </span>
              <Badge
                className={`text-[10px] px-1.5 py-0 ${
                  rateDeviation <= 10
                    ? "bg-green-100 text-green-700 border-green-200"
                    : rateDeviation <= 20
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
                variant="outline"
              >
                {rateDeviation}%p
              </Badge>
            </div>

            {/* 편차 해석 */}
            <p className="text-[10px] text-muted-foreground mt-1">
              {rateDeviation <= 10
                ? "팀 간 출석률이 균형적으로 구성되었습니다."
                : rateDeviation <= 20
                ? "팀 간 출석률에 약간의 차이가 있습니다."
                : "팀 간 출석률 차이가 크므로 구성을 재검토해 보세요."}
            </p>
          </div>
        )}

        {/* 안내 문구 */}
        {!loading && (
          <p className="text-[10px] text-muted-foreground text-center">
            최근 2개월 출석 패턴을 분석하여 팀을 자동 구성합니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
