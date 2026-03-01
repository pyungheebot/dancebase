"use client";

import { memo } from "react";
import { Trophy, Medal, Pencil, Trash2, Calendar, MapPin, Link, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DanceCompetitionRecord } from "@/types";
import { TeamOrSoloBadge } from "./team-or-solo-badge";
import { isPlacement } from "./types";

// ============================================================
// 타임라인 기록 아이템
// ============================================================

interface RecordItemProps {
  record: DanceCompetitionRecord;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecordItem = memo(function RecordItem({
  record,
  onEdit,
  onDelete,
}: RecordItemProps) {
  const placed = isPlacement(record.placement);

  return (
    <div className="relative flex gap-3" role="listitem">
      {/* 타임라인 선 */}
      <div className="flex flex-col items-center" aria-hidden="true">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            placed
              ? "border-yellow-400 bg-yellow-50 text-yellow-600"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {placed ? (
            <Trophy className="h-3.5 w-3.5" />
          ) : (
            <Medal className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* 콘텐츠 */}
      <div className="mb-4 flex-1 rounded-lg border bg-card p-3 shadow-sm">
        {/* 상단: 대회명 + 배지들 + 액션 버튼 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-sm font-semibold leading-tight">
                {record.competitionName}
              </span>
              {placed && record.placement && (
                <span
                  className="inline-flex items-center gap-0.5 rounded border border-yellow-300 bg-yellow-50 px-1.5 py-0 text-[10px] font-medium text-yellow-700"
                  aria-label={`입상: ${record.placement}`}
                >
                  <Trophy className="h-2.5 w-2.5" aria-hidden="true" />
                  {record.placement}
                </span>
              )}
              {!placed && record.placement && (
                <span
                  className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0 text-[10px] text-muted-foreground"
                  aria-label={`결과: ${record.placement}`}
                >
                  {record.placement}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <TeamOrSoloBadge value={record.teamOrSolo} />
              {record.teamName && (
                <span className="text-[10px] text-muted-foreground">
                  {record.teamName}
                </span>
              )}
              {record.genre && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {record.genre}
                </Badge>
              )}
              {record.category && (
                <span className="text-[10px] text-muted-foreground">
                  {record.category}
                </span>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              aria-label={`${record.competitionName} 기록 수정`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label={`${record.competitionName} 기록 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* 메타 정보 */}
        <dl className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <dt className="sr-only">날짜</dt>
            <dd>
              <time dateTime={record.date}>{record.date}</time>
            </dd>
          </div>
          {record.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <dt className="sr-only">장소</dt>
              <dd>{record.location}</dd>
            </div>
          )}
          {record.certificateUrl && (
            <div className="flex items-center gap-1">
              <dt className="sr-only">수상 증명서</dt>
              <dd>
                <a
                  href={record.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:underline"
                  aria-label="수상 증명서 보기 (새 탭에서 열림)"
                >
                  <Link className="h-3 w-3" aria-hidden="true" />
                  증명서
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* 메모 */}
        {record.notes && (
          <p
            className="mt-2 flex items-start gap-1 rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground leading-relaxed"
            aria-label={`메모: ${record.notes}`}
          >
            <StickyNote
              className="mt-0.5 h-3 w-3 shrink-0"
              aria-hidden="true"
            />
            {record.notes}
          </p>
        )}
      </div>
    </div>
  );
});
