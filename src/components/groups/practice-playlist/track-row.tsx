"use client";

import { memo } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { secondsToMmss } from "@/hooks/use-practice-playlist-card";
import { GenreBadge } from "./genre-badge";
import { PURPOSE_LABELS, PURPOSE_COLORS } from "./types";
import type { PracticePlaylistTrack } from "./types";

export interface TrackRowProps {
  track: PracticePlaylistTrack;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const TrackRow = memo(function TrackRow({
  track,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TrackRowProps) {
  const durationLabel = secondsToMmss(track.duration);
  const trackDescId = `track-desc-${track.id}`;

  return (
    <div
      className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 group hover:bg-muted/30 transition-colors"
      role="listitem"
      aria-describedby={track.notes ? trackDescId : undefined}
    >
      {/* 순번 */}
      <span
        className="text-[10px] text-muted-foreground w-4 text-right shrink-0"
        aria-label={`순번 ${track.order}`}
      >
        {track.order}
      </span>

      {/* 제목 + 아티스트 + 메모 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">
          {track.title}
        </p>
        {track.artist && (
          <p className="text-[10px] text-muted-foreground truncate">
            {track.artist}
          </p>
        )}
        {track.notes && (
          <p
            id={trackDescId}
            className="text-[10px] text-muted-foreground/70 truncate italic"
          >
            {track.notes}
          </p>
        )}
      </div>

      {/* 배지 영역 */}
      <div className="flex items-center gap-1 shrink-0" aria-label="트랙 정보">
        {/* 용도 배지 */}
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${PURPOSE_COLORS[track.purpose]}`}
          aria-label={`용도: ${PURPOSE_LABELS[track.purpose]}`}
        >
          {PURPOSE_LABELS[track.purpose]}
        </span>
        {track.genre && <GenreBadge genre={track.genre} />}
        {track.bpm && (
          <span
            className="inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200"
            aria-label={`BPM: ${track.bpm}`}
          >
            {track.bpm} BPM
          </span>
        )}
        <time
          className="text-[10px] text-muted-foreground tabular-nums"
          dateTime={`PT${Math.floor(track.duration / 60)}M${track.duration % 60}S`}
          aria-label={`재생시간: ${durationLabel}`}
        >
          {durationLabel}
        </time>
      </div>

      {/* 순서 이동 버튼 */}
      <div
        className="flex flex-col gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        role="group"
        aria-label="순서 변경"
      >
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={`${track.title} 위로 이동`}
          onKeyDown={(e) => e.key === "Enter" && !isFirst && onMoveUp()}
        >
          <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={`${track.title} 아래로 이동`}
          onKeyDown={(e) => e.key === "Enter" && !isLast && onMoveDown()}
        >
          <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </div>

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        aria-label={`${track.title} 삭제`}
        onKeyDown={(e) => e.key === "Enter" && onRemove()}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
});
