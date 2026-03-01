"use client";

// 멘토 매칭 요약 통계 그리드 (총 매칭, 진행중, 총 세션, 평균 평가)

import { Star } from "lucide-react";
import type { GroupMentorStats } from "@/hooks/use-group-mentor";

type MentorStatsGridProps = {
  /** useGroupMentor 훅에서 반환하는 stats 객체 */
  stats: GroupMentorStats;
};

/**
 * 4개 지표를 그리드로 표시하는 요약 통계 컴포넌트
 * - 총 매칭, 진행중, 총 세션, 평균 평가
 */
export function MentorStatsGrid({ stats }: MentorStatsGridProps) {
  return (
    <div
      className="grid grid-cols-4 gap-1.5"
      role="region"
      aria-label="멘토링 요약 통계"
    >
      {/* 총 매칭 */}
      <div
        className="rounded-lg bg-indigo-50 p-2 text-center"
        aria-label={`총 매칭 ${stats.total}건`}
      >
        <div className="text-base font-bold text-indigo-600">
          {stats.total}
        </div>
        <div className="text-[10px] text-muted-foreground">총 매칭</div>
      </div>

      {/* 진행중 */}
      <div
        className="rounded-lg bg-green-50 p-2 text-center"
        aria-label={`진행중 ${stats.active}건`}
      >
        <div className="text-base font-bold text-green-600">
          {stats.active}
        </div>
        <div className="text-[10px] text-muted-foreground">진행중</div>
      </div>

      {/* 총 세션 */}
      <div
        className="rounded-lg bg-gray-50 p-2 text-center"
        aria-label={`총 세션 ${stats.totalSessions}회`}
      >
        <div className="text-base font-bold text-gray-600">
          {stats.totalSessions}
        </div>
        <div className="text-[10px] text-muted-foreground">총 세션</div>
      </div>

      {/* 평균 평가 */}
      <div
        className="rounded-lg bg-yellow-50 p-2 text-center"
        aria-label={
          stats.avgRating !== null
            ? `평균 평가 ${stats.avgRating}점`
            : "평균 평가 없음"
        }
      >
        <div className="text-base font-bold text-yellow-600 flex items-center justify-center gap-0.5">
          {stats.avgRating !== null ? (
            <>
              <Star
                className="h-3 w-3 fill-yellow-400 text-yellow-400"
                aria-hidden="true"
              />
              {stats.avgRating}
            </>
          ) : (
            "-"
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">평균 평가</div>
      </div>
    </div>
  );
}
