"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ListMusic,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Check,
  Pencil,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDancePlaylist,
  DANCE_PLAYLIST_GENRES,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
  PURPOSE_BAR_COLORS,
} from "@/hooks/use-dance-playlist";
import type { MyPlaylist, MyPlaylistSong, MyPlaylistSongPurpose } from "@/types";

// ============================================================
// 상수
// ============================================================

const ALL_PURPOSES: MyPlaylistSongPurpose[] = [
  "warmup",
  "main",
  "cooldown",
  "performance",
];

// ============================================================
// 곡 폼 상태
// ============================================================

type SongFormState = {
  title: string;
  artist: string;
  bpm: string;
  genre: string;
  purpose: MyPlaylistSongPurpose;
};

const EMPTY_SONG_FORM: SongFormState = {
  title: "",
  artist: "",
  bpm: "",
  genre: "",
  purpose: "main",
};

// ============================================================
// 서브 컴포넌트: 곡 아이템
// ============================================================

function SongItem({
  song,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  song: MyPlaylistSong;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-b-0 group">
      {/* 순서 번호 */}
      <span className="text-[10px] text-gray-400 w-4 flex-shrink-0 text-center font-mono">
        {song.order + 1}
      </span>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
            {song.title}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
              PURPOSE_COLORS[song.purpose]
            }`}
          >
            {PURPOSE_LABELS[song.purpose]}
          </span>
          {song.genre && (
            <span className="text-[10px] px-1.5 py-0 rounded-full bg-gray-100 text-gray-600 font-medium">
              {song.genre}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-500 truncate max-w-[120px]">
            {song.artist}
          </span>
          {song.bpm != null && (
            <span className="text-[10px] text-gray-400">{song.bpm} BPM</span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-5 w-5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="위로 이동"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="h-5 w-5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="아래로 이동"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="h-5 w-5 text-gray-400 hover:text-blue-500"
          aria-label="수정"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="h-5 w-5 text-gray-300 hover:text-red-500"
          aria-label="삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 곡 추가/수정 폼
// ============================================================

function SongForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: SongFormState;
  onSubmit: (form: SongFormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<SongFormState>(initial);

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("곡명을 입력해주세요");
      return;
    }
    if (!form.artist.trim()) {
      toast.error("아티스트를 입력해주세요");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 space-y-2 mt-2">
      <p className="text-xs font-medium text-blue-700">{submitLabel}</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">
            곡명 <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="곡명"
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">
            아티스트 <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.artist}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, artist: e.target.value }))
            }
            placeholder="아티스트"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">용도</label>
          <select
            value={form.purpose}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                purpose: e.target.value as MyPlaylistSongPurpose,
              }))
            }
            className="w-full h-7 text-xs border border-gray-200 rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {ALL_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {PURPOSE_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">장르</label>
          <select
            value={form.genre}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, genre: e.target.value }))
            }
            className="w-full h-7 text-xs border border-gray-200 rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">선택</option>
            {DANCE_PLAYLIST_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">BPM</label>
          <Input
            type="number"
            value={form.bpm}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bpm: e.target.value }))
            }
            placeholder="120"
            className="h-7 text-xs"
            min={40}
            max={300}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 용도별 바 차트
// ============================================================

function PurposeBarChart({
  purposeStats,
}: {
  purposeStats: { purpose: MyPlaylistSongPurpose; count: number; percent: number }[];
}) {
  const hasData = purposeStats.some((s) => s.count > 0);
  if (!hasData) return null;

  return (
    <div className="space-y-1.5">
      {purposeStats.map((item) => (
        <div key={item.purpose} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 w-14 flex-shrink-0">
            {PURPOSE_LABELS[item.purpose]}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                PURPOSE_BAR_COLORS[item.purpose]
              }`}
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 w-8 text-right flex-shrink-0">
            {item.count}곡
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 개별 플레이리스트 패널
// ============================================================

function PlaylistPanel({
  playlist,
  onDelete,
  onAddSong,
  onUpdateSong,
  onDeleteSong,
  onMoveSong,
}: {
  playlist: MyPlaylist;
  onDelete: (id: string) => void;
  onAddSong: (
    playlistId: string,
    form: SongFormState
  ) => void;
  onUpdateSong: (
    playlistId: string,
    songId: string,
    form: SongFormState
  ) => void;
  onDeleteSong: (playlistId: string, songId: string) => void;
  onMoveSong: (
    playlistId: string,
    songId: string,
    direction: "up" | "down"
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  const sortedSongs = [...playlist.songs].sort((a, b) => a.order - b.order);

  const handleAddSong = (form: SongFormState) => {
    onAddSong(playlist.id, form);
    setShowAddForm(false);
  };

  const handleUpdateSong = (form: SongFormState) => {
    if (!editingSongId) return;
    onUpdateSong(playlist.id, editingSongId, form);
    setEditingSongId(null);
  };

  const editingTarget = editingSongId
    ? sortedSongs.find((s) => s.id === editingSongId)
    : null;

  const editInitial: SongFormState = editingTarget
    ? {
        title: editingTarget.title,
        artist: editingTarget.artist,
        bpm: editingTarget.bpm != null ? String(editingTarget.bpm) : "",
        genre: editingTarget.genre,
        purpose: editingTarget.purpose,
      }
    : EMPTY_SONG_FORM;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
            <ListMusic className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {playlist.name}
              </p>
              {playlist.description && (
                <p className="text-[10px] text-gray-400 truncate">
                  {playlist.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-400">
                {playlist.songs.length}곡
              </span>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(playlist.id);
                }}
                className="h-5 w-5 text-gray-300 hover:text-red-500 transition-colors"
                aria-label="플레이리스트 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 곡 목록 */}
        <CollapsibleContent>
          <div className="px-3 pt-0 pb-2 bg-gray-50/50">
            {sortedSongs.length === 0 && !showAddForm && !editingSongId ? (
              <div className="py-4 flex flex-col items-center gap-1 text-gray-400">
                <ListMusic className="h-6 w-6" />
                <p className="text-xs">아직 곡이 없습니다</p>
              </div>
            ) : (
              <div className="py-1">
                {sortedSongs.map((song, idx) =>
                  editingSongId === song.id ? (
                    <div key={song.id} className="py-1">
                      <SongForm
                        initial={editInitial}
                        onSubmit={handleUpdateSong}
                        onCancel={() => setEditingSongId(null)}
                        submitLabel="수정 완료"
                      />
                    </div>
                  ) : (
                    <SongItem
                      key={song.id}
                      song={song}
                      isFirst={idx === 0}
                      isLast={idx === sortedSongs.length - 1}
                      onMoveUp={() =>
                        onMoveSong(playlist.id, song.id, "up")
                      }
                      onMoveDown={() =>
                        onMoveSong(playlist.id, song.id, "down")
                      }
                      onEdit={() => setEditingSongId(song.id)}
                      onDelete={() => onDeleteSong(playlist.id, song.id)}
                    />
                  )
                )}
              </div>
            )}

            {showAddForm ? (
              <SongForm
                initial={EMPTY_SONG_FORM}
                onSubmit={handleAddSong}
                onCancel={() => setShowAddForm(false)}
                submitLabel="곡 추가"
              />
            ) : (
              !editingSongId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs w-full mt-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  곡 추가
                </Button>
              )
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DancePlaylistCard({ memberId }: { memberId: string }) {
  const {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addSong,
    updateSong,
    deleteSong,
    moveSong,
    stats,
  } = useDancePlaylist(memberId);

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showStats, setShowStats] = useState(false);

  // 활성 탭 결정: 탭이 없으면 첫 번째 플레이리스트
  const activeId = activeTabId ?? playlists[0]?.id ?? null;
  const activePlaylist = playlists.find((p) => p.id === activeId) ?? null;

  // ── 플레이리스트 생성 ──────────────────────────────────────

  const handleCreatePlaylist = () => {
    if (!newName.trim()) {
      toast.error("플레이리스트 이름을 입력해주세요");
      return;
    }
    const created = createPlaylist({ name: newName, description: newDesc });
    toast.success("플레이리스트를 만들었습니다");
    setNewName("");
    setNewDesc("");
    setShowNewForm(false);
    setActiveTabId(created.id);
  };

  // ── 플레이리스트 삭제 ──────────────────────────────────────

  const handleDeletePlaylist = (playlistId: string) => {
    const ok = deletePlaylist(playlistId);
    if (ok) {
      toast.success("플레이리스트를 삭제했습니다");
      if (activeTabId === playlistId) setActiveTabId(null);
    }
  };

  // ── 곡 추가 ──────────────────────────────────────────────

  const handleAddSong = (playlistId: string, form: SongFormState) => {
    const result = addSong(playlistId, {
      title: form.title,
      artist: form.artist,
      bpm: form.bpm ? Number(form.bpm) : null,
      genre: form.genre,
      purpose: form.purpose,
    });
    if (result) {
      toast.success("곡을 추가했습니다");
    } else {
      toast.error("곡 추가에 실패했습니다");
    }
  };

  // ── 곡 수정 ──────────────────────────────────────────────

  const handleUpdateSong = (
    playlistId: string,
    songId: string,
    form: SongFormState
  ) => {
    const ok = updateSong(playlistId, songId, {
      title: form.title,
      artist: form.artist,
      bpm: form.bpm ? Number(form.bpm) : null,
      genre: form.genre,
      purpose: form.purpose,
    });
    if (ok) {
      toast.success("곡을 수정했습니다");
    } else {
      toast.error("곡 수정에 실패했습니다");
    }
  };

  // ── 곡 삭제 ──────────────────────────────────────────────

  const handleDeleteSong = (playlistId: string, songId: string) => {
    const ok = deleteSong(playlistId, songId);
    if (ok) {
      toast.success("곡을 삭제했습니다");
    } else {
      toast.error("곡 삭제에 실패했습니다");
    }
  };

  // ── 순서 이동 ────────────────────────────────────────────

  const handleMoveSong = (
    playlistId: string,
    songId: string,
    direction: "up" | "down"
  ) => {
    moveSong(playlistId, songId, direction);
  };

  // ── 로딩 ──────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // ── 렌더 ──────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ListMusic className="h-4 w-4 text-indigo-500" />
            댄스 플레이리스트
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2"
              onClick={() => setShowStats((prev) => !prev)}
            >
              <BarChart2 className="h-3.5 w-3.5 mr-1" />
              통계
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowNewForm((prev) => !prev)}
            >
              <Plus className="h-3 w-3 mr-1" />
              새 목록
            </Button>
          </div>
        </div>

        {/* 요약 배지 */}
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700"
          >
            <ListMusic className="h-3 w-3 mr-0.5" />
            {stats.totalPlaylists}개 목록
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700"
          >
            {stats.totalSongs}곡
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 통계 영역 */}
        {showStats && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
              용도별 분류
            </p>
            {stats.totalSongs === 0 ? (
              <p className="text-xs text-gray-400">
                곡을 추가하면 용도별 통계가 표시됩니다
              </p>
            ) : (
              <PurposeBarChart purposeStats={stats.purposeStats} />
            )}
          </div>
        )}

        {/* 새 플레이리스트 폼 */}
        {showNewForm && (
          <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/50 space-y-2">
            <p className="text-xs font-medium text-indigo-700">새 플레이리스트</p>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="플레이리스트 이름 *"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePlaylist();
              }}
            />
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
              className="h-7 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleCreatePlaylist}
              >
                <Check className="h-3 w-3 mr-1" />
                만들기
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setShowNewForm(false);
                  setNewName("");
                  setNewDesc("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {playlists.length === 0 && !showNewForm ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <ListMusic className="h-6 w-6 text-indigo-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              아직 플레이리스트가 없습니다
            </p>
            <p className="text-xs text-center text-gray-400">
              연습 / 공연용 곡 목록을
              <br />
              플레이리스트로 관리해 보세요
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs mt-1"
              onClick={() => setShowNewForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              첫 플레이리스트 만들기
            </Button>
          </div>
        ) : playlists.length > 0 ? (
          <>
            {/* 탭 (플레이리스트 전환) */}
            {playlists.length > 1 && (
              <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-2">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => setActiveTabId(pl.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                      activeId === pl.id
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {pl.name}
                    <span className="ml-1 text-[10px] opacity-70">
                      {pl.songs.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 활성 플레이리스트 */}
            {activePlaylist && (
              <PlaylistPanel
                key={activePlaylist.id}
                playlist={activePlaylist}
                onDelete={handleDeletePlaylist}
                onAddSong={handleAddSong}
                onUpdateSong={handleUpdateSong}
                onDeleteSong={handleDeleteSong}
                onMoveSong={handleMoveSong}
              />
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
