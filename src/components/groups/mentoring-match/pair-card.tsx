"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  ArrowRight,
  BookOpen,
  Star,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_BADGE } from "./types";
import type { PairCardProps } from "./types";

export const PairCard = memo(function PairCard({
  pair,
  onDelete,
  onStatusChange,
  onAddSession,
  onDeleteSession,
}: PairCardProps) {
  const [expanded, setExpanded] = useState(false);

  const avgRating = (() => {
    const rated = pair.sessions.filter((s) => s.menteeRating != null);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc, s) => acc + (s.menteeRating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  })();

  const collapsibleId = `sessions-${pair.id}`;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2" role="listitem">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium">{pair.mentorName}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">멘티:</span>
          <span className="text-xs font-medium">{pair.menteeName}</span>
          <Badge
            className={cn("text-[10px] px-1.5 py-0", STATUS_BADGE[pair.status])}
            aria-label={`상태: ${STATUS_LABEL[pair.status]}`}
          >
            {STATUS_LABEL[pair.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0" role="toolbar" aria-label="매칭 관리">
          {pair.status === "active" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label="일시중지"
                onClick={() => onStatusChange("paused")}
              >
                <PauseCircle className="h-3 w-3 text-yellow-500" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label="완료"
                onClick={() => onStatusChange("completed")}
              >
                <CheckCircle2 className="h-3 w-3 text-green-600" aria-hidden="true" />
              </Button>
            </>
          )}
          {pair.status === "paused" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              aria-label="재개"
              onClick={() => onStatusChange("active")}
            >
              <PlayCircle className="h-3 w-3 text-blue-500" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            aria-label="매칭 삭제"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 스킬 포커스 */}
      {pair.skillFocus.length > 0 && (
        <div className="flex flex-wrap gap-1" role="list" aria-label="스킬 포커스">
          {pair.skillFocus.map((skill) => (
            <Badge
              key={skill}
              role="listitem"
              className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700"
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* 메타 정보 */}
      <dl className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex gap-1">
          <dt className="sr-only">시작일</dt>
          <dd>
            <time dateTime={pair.startDate}>시작: {pair.startDate}</time>
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">총 세션 수</dt>
          <dd>세션 {pair.sessions.length}회</dd>
        </div>
        {avgRating !== null && (
          <div className="flex gap-1 items-center">
            <dt className="sr-only">평균 만족도</dt>
            <dd className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" aria-hidden="true" />
              <span>{avgRating}</span>
            </dd>
          </div>
        )}
      </dl>

      {/* 목표 */}
      {pair.goals.length > 0 && (
        <ul className="space-y-0.5" aria-label="목표 목록">
          {pair.goals.map((g, i) => (
            <li key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="text-green-500" aria-hidden="true">•</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 세션 목록 토글 */}
      {pair.sessions.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
              aria-expanded={expanded}
              aria-controls={collapsibleId}
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              세션 기록 {expanded ? "접기" : "펼치기"}
              {expanded ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent id={collapsibleId}>
            <div className="mt-2 space-y-1.5" role="list" aria-label="세션 기록">
              {pair.sessions
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((s) => (
                  <div
                    key={s.id}
                    role="listitem"
                    className="flex items-start justify-between gap-2 rounded bg-gray-50 px-2 py-1.5"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium">{s.topic}</span>
                        <time
                          dateTime={s.date}
                          className="text-[10px] text-muted-foreground"
                        >
                          {s.date}
                        </time>
                        <span className="text-[10px] text-muted-foreground">
                          {s.durationMinutes}분
                        </span>
                        {s.menteeRating != null && (
                          <span className="flex items-center gap-0.5 text-[10px] text-yellow-600">
                            <Star
                              className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400"
                              aria-hidden="true"
                            />
                            <span>
                              <span className="sr-only">만족도 </span>
                              {s.menteeRating}
                            </span>
                          </span>
                        )}
                      </div>
                      {s.notes && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteSession(s.id)}
                      className="text-red-300 hover:text-red-500 mt-0.5 shrink-0"
                      aria-label={`세션 "${s.topic}" 삭제`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 세션 추가 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-blue-600 hover:text-blue-800 px-1"
        aria-label={`${pair.mentorName} → ${pair.menteeName} 세션 추가`}
        onClick={onAddSession}
      >
        <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
        세션 추가
      </Button>
    </div>
  );
});
