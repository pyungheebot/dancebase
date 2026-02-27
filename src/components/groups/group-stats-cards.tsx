"use client";

import { Users, Calendar, FileText, FolderOpen } from "lucide-react";
import { useGroupStats } from "@/hooks/use-group-stats";

interface GroupStatsCardsProps {
  groupId: string;
  memberCount?: number;
}

export function GroupStatsCards({ groupId, memberCount }: GroupStatsCardsProps) {
  const { stats, loading } = useGroupStats(groupId);

  // memberCount가 prop으로 전달되면 ctx에서 가져온 값 우선 사용 (이미 로드됨)
  const displayMemberCount = memberCount ?? stats.memberCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {/* 총 멤버 수 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">멤버</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {loading && memberCount === undefined ? (
            <span className="text-muted-foreground text-sm">-</span>
          ) : (
            <>
              {displayMemberCount}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">명</span>
            </>
          )}
        </p>
      </div>

      {/* 이번 달 일정 수 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">이번 달 일정</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {loading ? (
            <span className="text-muted-foreground text-sm">-</span>
          ) : (
            <>
              {stats.thisMonthScheduleCount}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
            </>
          )}
        </p>
      </div>

      {/* 이번 달 게시글 수 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">이번 달 게시글</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {loading ? (
            <span className="text-muted-foreground text-sm">-</span>
          ) : (
            <>
              {stats.thisMonthPostCount}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
            </>
          )}
        </p>
      </div>

      {/* 프로젝트 수 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">프로젝트</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {loading ? (
            <span className="text-muted-foreground text-sm">-</span>
          ) : (
            <>
              {stats.projectCount}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
