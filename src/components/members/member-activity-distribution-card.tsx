"use client";

import { useState } from "react";
import {
  BarChart3,
  Medal,
  Trophy,
  Users,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMemberActivityDistribution } from "@/hooks/use-member-activity-distribution";
import type { MemberActivityScore } from "@/types";

interface MemberActivityDistributionCardProps {
  groupId: string;
}

// -----------------------------------------------
// 서브 컴포넌트: 메달 아이콘 (1-3위)
// -----------------------------------------------

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="h-3.5 w-3.5 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="h-3.5 w-3.5 text-slate-400" />;
  }
  if (rank === 3) {
    return <Medal className="h-3.5 w-3.5 text-amber-600" />;
  }
  return (
    <span className="text-[10px] font-bold text-muted-foreground w-3.5 text-center tabular-nums">
      {rank}
    </span>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 이니셜 아바타
// -----------------------------------------------

function InitialAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-primary">{initial}</span>
      )}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: TOP 5 멤버 행
// -----------------------------------------------

function TopMemberRow({ member }: { member: MemberActivityScore }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* 순위 */}
      <div className="w-4 flex items-center justify-center shrink-0">
        <RankMedal rank={member.rank} />
      </div>

      {/* 아바타 */}
      <InitialAvatar name={member.name} avatarUrl={member.avatarUrl} />

      {/* 이름 */}
      <span className="text-xs font-medium flex-1 min-w-0 truncate">
        {member.name}
      </span>

      {/* 점수 */}
      <span className="text-xs font-bold tabular-nums text-primary shrink-0">
        {member.totalScore}점
      </span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 등급별 분포 바
// -----------------------------------------------

function GradeDistributionBar({
  grade,
  count,
  color,
  totalMembers,
}: {
  grade: string;
  count: number;
  color: string;
  totalMembers: number;
}) {
  const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      {/* 등급명 */}
      <span className="text-[10px] text-muted-foreground w-14 shrink-0 text-right">
        {grade}
      </span>

      {/* 바 */}
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: count > 0 ? `${Math.max(pct, 3)}%` : "0%" }}
        />
      </div>

      {/* 멤버 수 */}
      <span className="text-[10px] font-semibold tabular-nums w-8 shrink-0">
        {count}명
      </span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function DistributionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 flex-1 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

export function MemberActivityDistributionCard({
  groupId,
}: MemberActivityDistributionCardProps) {
  const { distribution, loading } = useMemberActivityDistribution(groupId);
  const [collapsed, setCollapsed] = useState(false);

  const hasData = distribution.totalMembers > 0;

  return (
    <Card className="mb-3">
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">멤버 활동 분포도</span>
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
              style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            />
          </Button>
        </div>

        {/* 요약 배지 바 */}
        <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Users className="h-2.5 w-2.5" />
            {distribution.totalMembers}명
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <TrendingUp className="h-2.5 w-2.5" />
            평균 {distribution.avgScore}점
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 text-muted-foreground">
            최근 30일
          </Badge>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <DistributionSkeleton />
          ) : !hasData ? (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-muted-foreground">
                아직 활동 기록이 없습니다
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 등급별 분포 바 */}
              <div className="space-y-1.5">
                {distribution.gradeSummary.map((item) => (
                  <GradeDistributionBar
                    key={item.grade}
                    grade={item.grade}
                    count={item.count}
                    color={item.color}
                    totalMembers={distribution.totalMembers}
                  />
                ))}
              </div>

              {/* TOP 5 활동 멤버 */}
              {distribution.top5.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      TOP 5 활동 멤버
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {distribution.top5.map((member) => (
                      <TopMemberRow key={member.userId} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
