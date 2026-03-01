"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Music,
  Clock,
  User,
  Users,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EncoreSong } from "@/types";
import { formatDuration } from "./encore-plan-types";

// ============================================================
// 앵콜 곡 행 컴포넌트 (타임라인 스타일)
// React.memo로 불필요한 리렌더링 방지
// ============================================================

type SongRowProps = {
  song: EncoreSong;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export const SongRow = memo(function SongRow({
  song,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SongRowProps) {
  return (
    <div className="flex gap-2.5">
      {/* 타임라인 세로선 + 순서 번호 */}
      <div className="flex flex-col items-center w-6 flex-shrink-0">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-400 text-[9px] font-bold text-indigo-700 z-10 flex-shrink-0">
          {song.order}
        </div>
        {/* 마지막 곡이 아니면 세로 연결선 표시 */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 bg-indigo-200 mt-0.5"
            style={{ minHeight: "20px" }}
          />
        )}
      </div>

      {/* 곡 내용 카드 */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="rounded-md border bg-card hover:bg-muted/20 transition-colors p-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0 space-y-1">
              {/* 곡명 + 아티스트 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Music className="h-3 w-3 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium">{song.songTitle}</span>
                {song.artist && (
                  <span className="text-[10px] text-muted-foreground">
                    — {song.artist}
                  </span>
                )}
              </div>

              {/* 출연자 태그 */}
              {song.performers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {song.performers.length === 1 ? (
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {song.performers.map((name) => (
                      <span
                        key={name}
                        className="text-[9px] px-1.5 py-0 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 재생 시간 + 메모 */}
              <div className="flex items-center gap-2 flex-wrap">
                {song.durationSeconds > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(song.durationSeconds)}
                    </span>
                  </div>
                )}
                {song.notes && (
                  <span className="text-[10px] text-muted-foreground">
                    {song.notes}
                  </span>
                )}
              </div>
            </div>

            {/* 액션 버튼 영역 */}
            <div className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label={`${song.songTitle} 곡 액션`}>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveUp}
                disabled={isFirst}
                aria-label={`${song.songTitle} 위로 이동`}
              >
                <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveDown}
                disabled={isLast}
                aria-label={`${song.songTitle} 아래로 이동`}
              >
                <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onEdit}
                aria-label={`${song.songTitle} 수정`}
              >
                <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
                aria-label={`${song.songTitle} 삭제`}
              >
                <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
