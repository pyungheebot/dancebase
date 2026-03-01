"use client";

/**
 * 연습 파트너 매칭 카드 - 리스트 행 컴포넌트
 *
 * - ActiveMatchRow: 현재 활성 매칭 행 (React.memo 적용)
 * - HistoryMatchRow: 매칭 이력 행 (React.memo 적용)
 */

import { memo } from "react";
import { Link2, Link2Off, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_COLORS,
} from "@/hooks/use-practice-partner";
import { StarRating } from "./practice-partner-star-rating";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { PracticePartnerMember, PracticePartnerMatch } from "./practice-partner-types";

// ============================================
// 활성 매칭 행
// ============================================

interface ActiveMatchRowProps {
  match: PracticePartnerMatch;
  memberA: PracticePartnerMember | undefined;
  memberB: PracticePartnerMember | undefined;
  onEnd: () => void;
  onRateA: () => void;
  onRateB: () => void;
}

export const ActiveMatchRow = memo(function ActiveMatchRow({
  match,
  memberA,
  memberB,
  onEnd,
  onRateA,
  onRateB,
}: ActiveMatchRowProps) {
  return (
    <div
      role="listitem"
      className="flex items-center gap-2 rounded border bg-background px-2.5 py-2 group hover:bg-muted/30 transition-colors"
      aria-label={`${match.memberAName}과 ${match.memberBName} 매칭`}
    >
      {/* 멤버 A */}
      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
        <span className="text-xs font-medium truncate max-w-[60px]">
          {match.memberAName}
        </span>
        {memberA && (
          <span
            className={`text-[9px] rounded border px-1 ${SKILL_LEVEL_COLORS[memberA.skillLevel]}`}
            aria-label={`스킬 레벨: ${SKILL_LEVEL_LABELS[memberA.skillLevel]}`}
          >
            {SKILL_LEVEL_LABELS[memberA.skillLevel]}
          </span>
        )}
      </div>

      {/* 연결 아이콘 */}
      <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" aria-hidden="true" />

      {/* 멤버 B */}
      <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
        <span className="text-xs font-medium truncate max-w-[60px]">
          {match.memberBName}
        </span>
        {memberB && (
          <span
            className={`text-[9px] rounded border px-1 ${SKILL_LEVEL_COLORS[memberB.skillLevel]}`}
            aria-label={`스킬 레벨: ${SKILL_LEVEL_LABELS[memberB.skillLevel]}`}
          >
            {SKILL_LEVEL_LABELS[memberB.skillLevel]}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* 매칭일 */}
      <span className="text-[10px] text-muted-foreground shrink-0">
        {formatYearMonthDay(match.matchedAt)}
      </span>

      {/* 액션 버튼 */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        aria-label="매칭 액션"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 gap-0.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          onClick={onRateA}
          aria-label={`${match.memberAName}으로 평가`}
          title={`${match.memberAName}으로 평가`}
        >
          <Star className="h-3 w-3" aria-hidden="true" />A 평가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 gap-0.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          onClick={onRateB}
          aria-label={`${match.memberBName}으로 평가`}
          title={`${match.memberBName}으로 평가`}
        >
          <Star className="h-3 w-3" aria-hidden="true" />B 평가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onEnd}
          aria-label={`${match.memberAName}과 ${match.memberBName} 매칭 해제`}
          title="매칭 해제"
        >
          <Link2Off className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});

// ============================================
// 매칭 이력 행
// ============================================

interface HistoryMatchRowProps {
  match: PracticePartnerMatch;
}

export const HistoryMatchRow = memo(function HistoryMatchRow({
  match,
}: HistoryMatchRowProps) {
  return (
    <div
      role="listitem"
      className="flex items-start gap-2 rounded border bg-muted/20 px-2.5 py-2 text-[10px] text-muted-foreground"
      aria-label={`${match.memberAName}과 ${match.memberBName} 과거 매칭`}
    >
      <span className="font-medium text-foreground">{match.memberAName}</span>
      <span aria-hidden="true">+</span>
      <span className="font-medium text-foreground">{match.memberBName}</span>
      <div className="flex-1" />
      <div className="flex flex-col items-end gap-0.5">
        <span>{formatYearMonthDay(match.matchedAt)}</span>
        {match.endedAt && (
          <span className="text-[9px]">
            ~ {formatYearMonthDay(match.endedAt)}
          </span>
        )}
      </div>
      {/* 평점 */}
      <div className="flex flex-col gap-0.5" aria-label="평가 결과">
        {match.ratingAtoB !== undefined && (
          <div className="flex items-center gap-0.5">
            <span aria-label={`${match.memberAName.slice(0, 2)} 평가`}>
              {match.memberAName.slice(0, 2)}:
            </span>
            <StarRating value={match.ratingAtoB} readonly />
          </div>
        )}
        {match.ratingBtoA !== undefined && (
          <div className="flex items-center gap-0.5">
            <span aria-label={`${match.memberBName.slice(0, 2)} 평가`}>
              {match.memberBName.slice(0, 2)}:
            </span>
            <StarRating value={match.ratingBtoA} readonly />
          </div>
        )}
      </div>
    </div>
  );
});
