"use client";

import { Badge } from "@/components/ui/badge";

type MentoringStatsProps = {
  totalPairs: number;
  totalSessions: number;
  avgSessionsPerPair: number;
  topMentors: { mentorName: string; sessionCount: number }[];
};

export function MentoringStats({
  totalPairs,
  totalSessions,
  avgSessionsPerPair,
  topMentors,
}: MentoringStatsProps) {
  return (
    <>
      {/* 통계 카드 */}
      <dl className="grid grid-cols-3 gap-2" aria-label="멘토링 통계">
        <div className="rounded-lg bg-blue-50 p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">총 매칭</dt>
          <dd className="text-lg font-bold text-blue-600">{totalPairs}</dd>
        </div>
        <div className="rounded-lg bg-green-50 p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">총 세션</dt>
          <dd className="text-lg font-bold text-green-600">{totalSessions}</dd>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">평균 세션</dt>
          <dd className="text-lg font-bold text-purple-600">{avgSessionsPerPair}</dd>
        </div>
      </dl>

      {/* 탑 멘토 */}
      {topMentors.length > 0 && (
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            활발한 멘토
          </p>
          <ol aria-label="활발한 멘토 순위">
            {topMentors.map((m, i) => (
              <li
                key={m.mentorName}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-bold text-muted-foreground w-4"
                    aria-label={`${i + 1}위`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs">{m.mentorName}</span>
                </div>
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
                  <span className="sr-only">세션 횟수: </span>
                  {m.sessionCount}회
                </Badge>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
