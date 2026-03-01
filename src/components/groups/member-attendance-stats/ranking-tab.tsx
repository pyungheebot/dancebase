"use client";

import { Trophy } from "lucide-react";
import type {
  MemberAttendStatSummary,
} from "@/types";
import { MemberRateBar } from "./member-rate-bar";

export interface RankingTabProps {
  summaries: MemberAttendStatSummary[];
  topAttendee: string | null;
  mostAbsentee: string | null;
}

export function RankingTab({
  summaries,
  topAttendee,
  mostAbsentee,
}: RankingTabProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Trophy className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span
          className="text-[11px] font-semibold text-gray-600"
          id="ranking-heading"
        >
          멤버별 출석률
        </span>
      </div>
      {summaries.length === 0 ? (
        <p
          className="text-[11px] text-gray-400 py-4 text-center"
          role="status"
          aria-live="polite"
        >
          출석 기록이 없습니다.
        </p>
      ) : (
        <div
          className="space-y-2.5"
          role="list"
          aria-labelledby="ranking-heading"
        >
          {summaries.map((s, idx) => (
            <MemberRateBar
              key={s.memberName}
              summary={s}
              rank={idx + 1}
              isTopAttendee={s.memberName === topAttendee}
              isMostAbsentee={s.memberName === mostAbsentee}
            />
          ))}
        </div>
      )}
    </div>
  );
}
