"use client";

import { useState } from "react";
import {
  ListMusic,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  usePracticePlaylistCard,
  secondsToMmss,
} from "@/hooks/use-practice-playlist-card";
import type { PracticePlaylistEntry, PracticePlaylistPurpose } from "@/types";

// 서브컴포넌트
import { CreatePlaylistDialog } from "./practice-playlist/create-playlist-dialog";
import { AddTrackDialog } from "./practice-playlist/add-track-dialog";
import { TrackRow } from "./practice-playlist/track-row";
import {
  PURPOSE_LABELS,
  PURPOSE_COLORS,
  type PurposeFilter,
} from "./practice-playlist/types";

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface PracticePlaylistCardProps {
  groupId: string;
}

export function PracticePlaylistCard({ groupId }: PracticePlaylistCardProps) {
  const {
    playlists,
    totalPlaylists,
    totalTracks,
    totalDuration,
    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    moveTrack,
  } = usePracticePlaylistCard(groupId);

  const [open, setOpen] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);

  // 선택된 플레이리스트 (없으면 첫 번째)
  const selectedPlaylist: PracticePlaylistEntry | null =
    playlists.find((p) => p.id === selectedPlaylistId) ??
    playlists[0] ??
    null;

  // order 기준 정렬 후 용도 필터 적용
  const sortedTracks = selectedPlaylist
    ? [...selectedPlaylist.tracks].sort((a, b) => a.order - b.order)
    : [];

  const filteredTracks =
    purposeFilter === "all"
      ? sortedTracks
      : sortedTracks.filter((t) => t.purpose === purposeFilter);

  // 현재 선택된 플레이리스트의 총 재생시간
  const playlistDuration = sortedTracks.reduce(
    (sum, t) => sum + t.duration,
    0
  );

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
    if (selectedPlaylistId === id) setSelectedPlaylistId("");
    toast.success(TOAST.PLAYLIST.DELETED);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!selectedPlaylist) return;
    removeTrack(selectedPlaylist.id, trackId);
    toast.success(TOAST.PLAYLIST.SONG_DELETED);
  };

  const handleMoveTrack = (trackId: string, direction: "up" | "down") => {
    if (!selectedPlaylist) return;
    moveTrack(selectedPlaylist.id, trackId, direction);
  };

  const handleAddTrack = (
    title: string,
    artist: string,
    duration: number,
    purpose: PracticePlaylistPurpose,
    bpm?: number,
    genre?: string,
    notes?: string,
    addedBy?: string
  ) => {
    if (!selectedPlaylist) return;
    addTrack(
      selectedPlaylist.id,
      title,
      artist,
      duration,
      purpose,
      bpm,
      genre,
      notes,
      addedBy
    );
  };

  // 용도별 곡 수 계산
  const purposeCounts = selectedPlaylist
    ? (["warmup", "main", "cooldown"] as PracticePlaylistPurpose[]).reduce(
        (acc, p) => {
          acc[p] = sortedTracks.filter((t) => t.purpose === p).length;
          return acc;
        },
        {} as Record<PracticePlaylistPurpose, number>
      )
    : null;

  const regionId = "practice-playlist-region";
  const trackListId = "practice-playlist-tracklist";

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4 text-violet-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-800">
              연습곡 플레이리스트
            </span>
            {totalTracks > 0 && (
              <Badge
                className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100"
                aria-label={`전체 ${totalTracks}곡`}
              >
                {totalTracks}곡
              </Badge>
            )}
            {totalDuration > 0 && (
              <Badge
                className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-100"
                aria-label={`전체 재생시간 ${secondsToMmss(totalDuration)}`}
              >
                {secondsToMmss(totalDuration)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 gap-0.5"
                onClick={() => setShowCreateDialog(true)}
                aria-label="새 플레이리스트 만들기"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                새 플레이리스트
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-expanded={open}
                aria-controls={regionId}
                aria-label={open ? "플레이리스트 접기" : "플레이리스트 펼치기"}
              >
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div
            id={regionId}
            className="rounded-b-lg border border-gray-200 bg-card p-4"
            aria-live="polite"
          >
            {/* 플레이리스트 없을 때 */}
            {playlists.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                <Music2 className="h-8 w-8 opacity-30" aria-hidden="true" />
                <p className="text-xs">아직 플레이리스트가 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  만들기
                </Button>
              </div>
            ) : (
              <>
                {/* 플레이리스트 탭 */}
                <div
                  className="flex flex-wrap gap-1 mb-3"
                  role="tablist"
                  aria-label="플레이리스트 선택"
                >
                  {playlists.map((p) => {
                    const isSelected = selectedPlaylist?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={isSelected ? trackListId : undefined}
                        onClick={() => {
                          setSelectedPlaylistId(p.id);
                          setPurposeFilter("all");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPlaylistId(p.id);
                            setPurposeFilter("all");
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          isSelected
                            ? "bg-violet-100 text-violet-700 border-violet-300 font-medium"
                            : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                        }`}
                      >
                        {p.name}
                        <span className="ml-1 text-[10px] opacity-60" aria-label={`${p.tracks.length}곡`}>
                          ({p.tracks.length})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 선택된 플레이리스트 상단 */}
                {selectedPlaylist && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {selectedPlaylist.name}
                        </span>
                        {playlistDuration > 0 && (
                          <time
                            className="text-[10px] text-muted-foreground"
                            dateTime={`PT${Math.floor(playlistDuration / 60)}M${playlistDuration % 60}S`}
                            aria-label={`총 재생시간 ${secondsToMmss(playlistDuration)}`}
                          >
                            총 {secondsToMmss(playlistDuration)}
                          </time>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 gap-0.5"
                          onClick={() => setShowAddTrackDialog(true)}
                          aria-label="곡 추가"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          곡 추가
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            handleDeletePlaylist(selectedPlaylist.id)
                          }
                          aria-label={`${selectedPlaylist.name} 플레이리스트 삭제`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {/* 용도별 필터 탭 */}
                    {sortedTracks.length > 0 && (
                      <div
                        className="flex gap-1 mb-2.5"
                        role="group"
                        aria-label="용도별 필터"
                      >
                        {/* 전체 */}
                        <button
                          type="button"
                          onClick={() => setPurposeFilter("all")}
                          aria-pressed={purposeFilter === "all"}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setPurposeFilter("all");
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            purposeFilter === "all"
                              ? "bg-gray-800 text-white border-gray-800"
                              : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                          }`}
                        >
                          전체
                          <span className="ml-0.5 opacity-70" aria-label={`${sortedTracks.length}곡`}>
                            ({sortedTracks.length})
                          </span>
                        </button>
                        {(
                          ["warmup", "main", "cooldown"] as PracticePlaylistPurpose[]
                        ).map((p) => {
                          const count = purposeCounts?.[p] ?? 0;
                          if (count === 0) return null;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPurposeFilter(p)}
                              aria-pressed={purposeFilter === p}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setPurposeFilter(p);
                                }
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                                purposeFilter === p
                                  ? PURPOSE_COLORS[p] + " font-medium"
                                  : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                              }`}
                            >
                              {PURPOSE_LABELS[p]}
                              <span className="ml-0.5 opacity-70" aria-label={`${count}곡`}>
                                ({count})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* 트랙 목록 */}
                {selectedPlaylist && filteredTracks.length === 0 ? (
                  <div className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground">
                    <ListMusic className="h-7 w-7 opacity-30" aria-hidden="true" />
                    <p className="text-xs" role="status">
                      {sortedTracks.length === 0
                        ? "아직 등록된 곡이 없습니다."
                        : "해당 용도의 곡이 없습니다."}
                    </p>
                    {sortedTracks.length === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowAddTrackDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        곡 추가
                      </Button>
                    )}
                  </div>
                ) : (
                  <div
                    id={trackListId}
                    className="space-y-1"
                    role="list"
                    aria-label={`${selectedPlaylist?.name ?? ""} 트랙 목록`}
                  >
                    {filteredTracks.map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isFirst={idx === 0}
                        isLast={idx === filteredTracks.length - 1}
                        onRemove={() => handleRemoveTrack(track.id)}
                        onMoveUp={() => handleMoveTrack(track.id, "up")}
                        onMoveDown={() => handleMoveTrack(track.id, "down")}
                      />
                    ))}
                  </div>
                )}

                {/* 통계 요약 */}
                {totalPlaylists > 0 && (
                  <dl className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-muted-foreground">
                    <div className="flex gap-1">
                      <dt>플레이리스트</dt>
                      <dd>
                        <strong className="text-foreground">{totalPlaylists}</strong>개
                      </dd>
                    </div>
                    <div className="flex gap-1">
                      <dt>전체</dt>
                      <dd>
                        <strong className="text-foreground">{totalTracks}</strong>곡
                      </dd>
                    </div>
                    {totalDuration > 0 && (
                      <div className="flex gap-1">
                        <dt>총</dt>
                        <dd>
                          <strong className="text-foreground">
                            {secondsToMmss(totalDuration)}
                          </strong>
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 다이얼로그 */}
      <CreatePlaylistDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={createPlaylist}
      />
      {selectedPlaylist && (
        <AddTrackDialog
          open={showAddTrackDialog}
          onClose={() => setShowAddTrackDialog(false)}
          onAdd={handleAddTrack}
        />
      )}
    </>
  );
}
