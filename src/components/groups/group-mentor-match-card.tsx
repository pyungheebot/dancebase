"use client";

// 개별 매칭 카드 컴포넌트 (React.memo 적용으로 불필요한 리렌더 방지)

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Star,
  Edit2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { StarRating } from "./group-mentor-star-rating";
import { GrowthLineChart } from "./group-mentor-growth-chart";
import { FIELD_COLOR, STATUS_COLOR } from "./group-mentor-types";
import type { GroupMentorMatch, GroupMentorStatus } from "@/types";

type MatchCardProps = {
  /** 매칭 데이터 */
  match: GroupMentorMatch;
  /** 수정 버튼 클릭 핸들러 */
  onEdit: () => void;
  /** 삭제 버튼 클릭 핸들러 */
  onDelete: () => void;
  /** 상태 변경 핸들러 */
  onStatusChange: (status: GroupMentorStatus) => void;
  /** 세션 추가 버튼 클릭 핸들러 */
  onAddSession: () => void;
  /** 세션 삭제 핸들러 */
  onDeleteSession: (sessionId: string) => void;
};

/**
 * 개별 멘토링 매칭 카드
 * - 헤더: 멘토 → 멘티, 분야/상태 배지, 수정/삭제 버튼
 * - 날짜 + 세션 통계
 * - 성장 트래커 차트 (세션 2개 이상)
 * - 세션 목록 (접기/펼치기)
 * - 세션 추가 버튼
 *
 * React.memo로 래핑하여 match 객체가 변경될 때만 리렌더링
 */
export const MatchCard = memo(function MatchCard({
  match,
  onEdit,
  onDelete,
  onAddSession,
  onDeleteSession,
}: MatchCardProps) {
  const [sessionsOpen, setSessionsOpen] = useState(false);

  // 별점이 있는 세션들의 평균 계산
  const avgRating = (() => {
    const rated = match.sessions.filter((s) => s.rating > 0);
    if (rated.length === 0) return null;
    return (
      Math.round(
        (rated.reduce((sum, s) => sum + s.rating, 0) / rated.length) * 10
      ) / 10
    );
  })();

  // 세션을 날짜 내림차순으로 정렬 (최신 세션이 위)
  const sortedSessions = match.sessions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const matchLabel = `${match.mentorName}에서 ${match.menteeName}으로 ${match.field} 멘토링`;

  return (
    <div
      className="rounded-lg border bg-card p-3 space-y-2"
      role="listitem"
      aria-label={matchLabel}
    >
      {/* 헤더: 멘토 → 멘티, 분야/상태 배지, 수정/삭제 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-semibold truncate">
            {match.mentorName}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold truncate">
            {match.menteeName}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              FIELD_COLOR[match.field]
            )}
          >
            {match.field}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              STATUS_COLOR[match.status]
            )}
          >
            {match.status}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label={`${matchLabel} 수정`}
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            aria-label={`${matchLabel} 삭제`}
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 날짜 + 세션 수 + 평균 별점 */}
      <div
        className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap"
        aria-label="매칭 요약 정보"
      >
        <span>시작: {match.startDate}</span>
        {match.endDate && <span>종료: {match.endDate}</span>}
        <span>세션 {match.sessions.length}회</span>
        {avgRating !== null && (
          <span className="flex items-center gap-0.5" aria-label={`평균 평가 ${avgRating}점`}>
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
            {avgRating}
          </span>
        )}
      </div>

      {/* 성장 트래커 차트 (세션 2개 이상 시 표시) */}
      {match.sessions.length >= 2 && (
        <GrowthLineChart sessions={match.sessions} />
      )}

      {/* 세션 목록 (접기/펼치기) */}
      {match.sessions.length > 0 && (
        <Collapsible open={sessionsOpen} onOpenChange={setSessionsOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800"
              aria-expanded={sessionsOpen}
              aria-controls="session-list"
            >
              {sessionsOpen ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
              세션 기록 {sessionsOpen ? "접기" : `(${match.sessions.length}개) 펼치기`}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul
              id="session-list"
              role="list"
              aria-label="세션 기록 목록"
              className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-0.5"
            >
              {sortedSessions.map((s) => (
                <li
                  key={s.id}
                  role="listitem"
                  className="flex items-start justify-between gap-2 rounded bg-gray-50 px-2 py-1.5"
                  aria-label={`${s.date} 세션 기록`}
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">
                        {s.date}
                      </span>
                      <StarRating value={s.rating} readOnly />
                    </div>
                    <p className="text-[11px] leading-snug break-all">
                      {s.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(s.id)}
                    className="text-red-300 hover:text-red-500 mt-0.5 shrink-0"
                    aria-label={`${s.date} 세션 삭제`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 세션 추가 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-indigo-600 hover:text-indigo-800 px-1"
        onClick={onAddSession}
        aria-label={`${matchLabel}에 세션 추가`}
      >
        <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
        세션 추가
      </Button>
    </div>
  );
});
