"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ListMusic,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useScheduleSetlist } from "@/hooks/use-schedule-setlist";
import type { ProjectSong, Schedule } from "@/types";

type ScheduleSetlistSectionProps = {
  schedule: Schedule;
  /** 프로젝트에 등록된 곡 목록 (곡 선택 팔레트용) */
  projectSongs: ProjectSong[];
  /** 리더/매니저만 편집 가능 */
  canEdit: boolean;
};

/** 분 → "Xh Ym" 형식 변환 */
function formatMinutes(totalMin: number): string {
  if (totalMin <= 0) return "0분";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 일정 지속 시간 계산 (분) */
function getScheduleDurationMinutes(schedule: Schedule): number {
  const start = new Date(schedule.starts_at).getTime();
  const end = new Date(schedule.ends_at).getTime();
  return Math.max(0, Math.floor((end - start) / 60000));
}

export function ScheduleSetlistSection({
  schedule,
  projectSongs,
  canEdit,
}: ScheduleSetlistSectionProps) {
  const {
    items,
    totalMinutes,
    addSong,
    removeSong,
    moveUp,
    moveDown,
    updateMinutes,
    clearAll,
  } = useScheduleSetlist(schedule.id);

  const [pickerOpen, setPickerOpen] = useState(false);

  const scheduleDuration = getScheduleDurationMinutes(schedule);
  const isOvertime = scheduleDuration > 0 && totalMinutes > scheduleDuration;

  // 이미 세트리스트에 추가된 songId 집합
  const addedSongIds = new Set(items.map((item) => item.songId));

  // 추가 가능한 곡 목록
  const availableSongs = projectSongs.filter(
    (song) => !addedSongIds.has(song.id)
  );

  const handleAddSong = (song: ProjectSong) => {
    addSong({
      songId: song.id,
      songTitle: song.title,
      artist: song.artist,
    });
  };

  const handleMinutesChange = (songId: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateMinutes(songId, parsed);
    }
  };

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            세트리스트
          </span>
          {items.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 ml-0.5 bg-muted text-muted-foreground"
            >
              {items.length}곡
            </Badge>
          )}
          {items.length > 0 && (
            <div
              className={`flex items-center gap-0.5 ml-1 ${
                isOvertime ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {isOvertime ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="text-[10px]">
                {formatMinutes(totalMinutes)}
                {scheduleDuration > 0 && (
                  <span className="opacity-70">
                    {" "}
                    / {formatMinutes(scheduleDuration)}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                전체 삭제
              </Button>
            )}
            {projectSongs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2 gap-0.5"
                onClick={() => setPickerOpen((v) => !v)}
              >
                <Plus className="h-3 w-3" />
                곡 추가
                {pickerOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 곡 선택 팔레트 */}
      {canEdit && pickerOpen && (
        <div className="rounded border p-2 bg-muted/30 space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">
            곡 트래커에서 선택
          </p>
          {availableSongs.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-1">
              {projectSongs.length === 0
                ? "프로젝트에 등록된 곡이 없습니다"
                : "모든 곡이 이미 추가되었습니다"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {availableSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleAddSong(song)}
                  className="flex items-center gap-1 rounded border bg-background px-2 py-1 text-[11px] hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Plus className="h-2.5 w-2.5 shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">
                    {song.title}
                  </span>
                  {song.artist && (
                    <span className="text-muted-foreground truncate max-w-[80px]">
                      {song.artist}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 세트리스트 항목 목록 */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div
              key={item.songId}
              className="flex items-center gap-1.5 rounded border px-2 py-1.5 group bg-background"
            >
              {/* 순번 */}
              <span className="shrink-0 w-5 text-center text-[11px] font-mono text-muted-foreground">
                {idx + 1}
              </span>

              {/* 제목 + 아티스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.songTitle}</p>
                {item.artist && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.artist}
                  </p>
                )}
              </div>

              {/* 예상 시간 */}
              {canEdit ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={item.plannedMinutes}
                    onChange={(e) =>
                      handleMinutesChange(item.songId, e.target.value)
                    }
                    className="h-6 w-14 text-xs text-right px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-muted-foreground">분</span>
                </div>
              ) : (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {item.plannedMinutes}분
                </span>
              )}

              {/* 위/아래 버튼 */}
              {canEdit && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveUp(item.songId)}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="위로 이동"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveDown(item.songId)}
                    disabled={idx === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    aria-label="아래로 이동"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeSong(item.songId)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    aria-label={`${item.songTitle} 삭제`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 합계 시간 + 초과 경고 */}
      {items.length > 0 && (
        <div
          className={`flex items-center justify-between rounded px-2 py-1 ${
            isOvertime
              ? "bg-red-50 border border-red-200"
              : "bg-muted/40 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-1">
            {isOvertime ? (
              <>
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-[11px] text-red-600 font-medium">
                  일정 시간 초과
                </span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  합계 시간
                </span>
              </>
            )}
          </div>
          <span
            className={`text-xs font-semibold tabular-nums ${
              isOvertime ? "text-red-600" : "text-foreground"
            }`}
          >
            {formatMinutes(totalMinutes)}
            {scheduleDuration > 0 && (
              <span
                className={`text-[10px] font-normal ml-1 ${
                  isOvertime ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                / {formatMinutes(scheduleDuration)}
              </span>
            )}
          </span>
        </div>
      )}

      {/* 빈 상태 */}
      {items.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          {canEdit
            ? projectSongs.length > 0
              ? "곡 추가 버튼을 눌러 세트리스트를 구성하세요"
              : "프로젝트의 곡 트래커에 곡을 먼저 등록하세요"
            : "등록된 세트리스트가 없습니다"}
        </p>
      )}
    </div>
  );
}
