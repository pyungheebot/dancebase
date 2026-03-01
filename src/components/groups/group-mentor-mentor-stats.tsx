"use client";

// 멘토별 통계 탭 컨텐츠 (세션 수, 평균 평가, 활성 매칭 수 + 바 차트)

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GroupMentorStats } from "@/hooks/use-group-mentor";

type MentorStatsTabProps = {
  /** useGroupMentor 훅에서 반환하는 stats 객체 */
  stats: GroupMentorStats;
};

/**
 * 멘토별 통계 목록 컴포넌트
 * - 멘토 이름, 평균 별점, 활성 매칭 수 표시
 * - 총 세션 수 기준 비례 바 차트
 * - 세션 수 내림차순 정렬
 */
export function MentorStatsTab({ stats }: MentorStatsTabProps) {
  if (stats.mentorStats.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-8">
        멘토 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="멘토별 통계 목록"
      className="space-y-2"
    >
      {stats.mentorStats.map((m, i) => (
        <div
          key={m.mentorName}
          role="listitem"
          aria-label={`멘토 ${m.mentorName}: 세션 ${m.sessionCount}회, 활성 매칭 ${m.activeMatches}개`}
          className="rounded-lg border p-3 space-y-1.5"
        >
          {/* 멘토 이름 + 별점 + 활성 배지 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 순위 번호 */}
              <span
                className="text-[10px] font-bold text-muted-foreground w-4"
                aria-label={`${i + 1}위`}
              >
                {i + 1}
              </span>
              <span className="text-xs font-semibold">{m.mentorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {m.avgRating !== null && (
                <span
                  className="flex items-center gap-0.5 text-[10px] text-yellow-600"
                  aria-label={`평균 평가 ${m.avgRating}점`}
                >
                  <Star
                    className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400"
                    aria-hidden="true"
                  />
                  {m.avgRating}
                </span>
              )}
              {m.activeMatches > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                  활성 {m.activeMatches}
                </Badge>
              )}
            </div>
          </div>

          {/* 세션 수 + 활성 매칭 수 텍스트 */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>총 세션 {m.sessionCount}회</span>
            <span>활성 매칭 {m.activeMatches}개</span>
          </div>

          {/* 세션 수 비례 바 차트 */}
          {stats.totalSessions > 0 && (
            <div
              className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={m.sessionCount}
              aria-valuemax={stats.totalSessions}
              aria-label={`전체 세션 중 ${Math.round((m.sessionCount / stats.totalSessions) * 100)}%`}
            >
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{
                  width: `${(m.sessionCount / stats.totalSessions) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
