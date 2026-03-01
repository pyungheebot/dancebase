"use client";

// ============================================
// 단일 일지 카드 컴포넌트 (React.memo 적용)
// ============================================

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GrowthJournalEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { MOOD_EMOJI, MOOD_LABEL } from "./growth-journal-types";
import { StarRating } from "./growth-journal-star-rating";

interface EntryCardProps {
  entry: GrowthJournalEntry;
  onEdit: (entry: GrowthJournalEntry) => void;
  onDelete: (id: string) => void;
}

export const EntryCard = memo(function EntryCard({
  entry,
  onEdit,
  onDelete,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const entryId = `entry-${entry.id}`;

  return (
    <article
      className="rounded-md border bg-card p-3 space-y-2"
      aria-labelledby={`${entryId}-title`}
    >
      {/* 상단: 날짜 + 무드 + 제목 + 액션 버튼 */}
      <div className="flex items-start gap-2">
        <span
          className="text-lg leading-none mt-0.5 flex-shrink-0"
          aria-label={MOOD_LABEL[entry.mood]}
          role="img"
        >
          {MOOD_EMOJI[entry.mood]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              {formatYearMonthDay(entry.date)}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {MOOD_LABEL[entry.mood]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {entry.memberName}
            </span>
          </div>
          <p
            id={`${entryId}-title`}
            className="text-xs font-medium mt-0.5 truncate"
          >
            {entry.title}
          </p>
          <StarRating value={entry.selfRating} readonly />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            aria-label={expanded ? "일지 접기" : "일지 펼치기"}
            aria-expanded={expanded}
            aria-controls={`${entryId}-detail`}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            aria-label={`${entry.title} 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-1 rounded hover:bg-muted text-red-500 transition-colors"
            aria-label={`${entry.title} 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 연습한 스킬 칩 */}
      {entry.skillsPracticed.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="연습한 스킬"
        >
          {entry.skillsPracticed.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-1"
              role="listitem"
            >
              <Dumbbell className="h-2.5 w-2.5" aria-hidden="true" />
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* 상세 내용 (펼치기) */}
      {expanded && (
        <div
          id={`${entryId}-detail`}
          className="space-y-2 pt-1.5 border-t"
        >
          {/* 본문 */}
          {entry.content && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          )}

          {/* 오늘의 성취 */}
          {entry.achievementsToday.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                오늘의 성취
              </p>
              <ul className="space-y-0.5" role="list">
                {entry.achievementsToday.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-green-500 mt-0.5" aria-hidden="true">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 도전 과제 */}
          {entry.challengesFaced.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-orange-600 mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                도전 과제
              </p>
              <ul className="space-y-0.5" role="list">
                {entry.challengesFaced.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-orange-500 mt-0.5" aria-hidden="true">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 다음 목표 */}
          {entry.nextGoals.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-blue-600 mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" aria-hidden="true" />
                다음 목표
              </p>
              <ul className="space-y-0.5" role="list">
                {entry.nextGoals.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-blue-500 mt-0.5" aria-hidden="true">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
});
