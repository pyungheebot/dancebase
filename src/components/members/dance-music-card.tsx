"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Music2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
  Link2,

  X,
  ListMusic,
  BarChart2,
  Heart,

  Check,
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDanceMusic, DANCE_MUSIC_GENRES } from "@/hooks/use-dance-music";
import type { DanceMusicPlaylist, DanceMusicTrack } from "@/types";
import { validateUrl, sanitizeUrl } from "@/lib/validation";

// ============================================================
// Props
// ============================================================

interface DanceMusicCardProps {
  memberId: string;
}

// ============================================================
// 트랙 폼 상태
// ============================================================

type TrackFormState = {
  title: string;
  artist: string;
  genre: string;
  bpm: string;
  duration: string;
  url: string;
  tagInput: string;
  tags: string[];
  notes: string;
};

const EMPTY_TRACK_FORM: TrackFormState = {
  title: "",
  artist: "",
  genre: "",
  bpm: "",
  duration: "",
  url: "",
  tagInput: "",
  tags: [],
  notes: "",
};

// ============================================================
// 장르별 색상
// ============================================================

const GENRE_COLORS: Record<string, string> = {
  힙합: "bg-purple-100 text-purple-700",
  팝핀: "bg-blue-100 text-blue-700",
  왁킹: "bg-pink-100 text-pink-700",
  하우스: "bg-cyan-100 text-cyan-700",
  락킹: "bg-orange-100 text-orange-700",
  크럼프: "bg-red-100 text-red-700",
  브레이킹: "bg-yellow-100 text-yellow-700",
  재즈: "bg-indigo-100 text-indigo-700",
  케이팝: "bg-rose-100 text-rose-700",
  "R&B": "bg-violet-100 text-violet-700",
  팝: "bg-green-100 text-green-700",
  일렉트로닉: "bg-sky-100 text-sky-700",
  컨템포러리: "bg-teal-100 text-teal-700",
  기타: "bg-gray-100 text-gray-700",
};

function genreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? "bg-gray-100 text-gray-700";
}

// 장르별 차트 색상 (bar)
const CHART_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-green-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-gray-400",
];

// ============================================================
// 서브 컴포넌트: 트랙 아이템
// ============================================================

function TrackItem({
  track,
  playlistId,
  onToggleFavorite,
  onRemove,
}: {
  track: DanceMusicTrack;
  playlistId: string;
  onToggleFavorite: (playlistId: string, trackId: string) => void;
  onRemove: (playlistId: string, trackId: string) => void;
}) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-b-0 group">
      {/* 즐겨찾기 버튼 */}
      <button
        onClick={() => onToggleFavorite(playlistId, track.id)}
        className={`mt-0.5 flex-shrink-0 h-4 w-4 transition-colors ${
          track.isFavorite ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
        }`}
        aria-label={track.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      >
        <Star className="h-4 w-4 fill-current" />
      </button>

      {/* 트랙 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-900 truncate max-w-[180px]">
            {track.title}
          </span>
          {track.genre && (
            <span
              className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${genreColor(track.genre)}`}
            >
              {track.genre}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {track.artist && (
            <span className="text-[11px] text-gray-500">{track.artist}</span>
          )}
          {track.bpm != null && (
            <span className="text-[10px] text-gray-400">{track.bpm} BPM</span>
          )}
          {track.duration && (
            <span className="text-[10px] text-gray-400">{track.duration}</span>
          )}
          {track.url && (
            <a
              href={sanitizeUrl(track.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Link2 className="h-3 w-3" />
              링크
            </a>
          )}
        </div>
        {track.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {track.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        {track.notes && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{track.notes}</p>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={() => onRemove(playlistId, track.id)}
        className="flex-shrink-0 h-5 w-5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="트랙 삭제"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 트랙 추가 폼
// ============================================================

function TrackAddForm({
  playlistId,
  onAdd,
  onCancel,
}: {
  playlistId: string;
  onAdd: (playlistId: string, form: TrackFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TrackFormState>(EMPTY_TRACK_FORM);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
      e.preventDefault();
      const newTag = form.tagInput.trim().replace(/^#/, "");
      if (newTag && !form.tags.includes(newTag)) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, newTag], tagInput: "" }));
      } else {
        setForm((prev) => ({ ...prev, tagInput: "" }));
      }
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("곡명을 입력해주세요");
      return;
    }
    if (!form.artist.trim()) {
      toast.error("아티스트를 입력해주세요");
      return;
    }
    const urlError = validateUrl(form.url);
    if (urlError) {
      toast.error(urlError);
      return;
    }
    onAdd(playlistId, form);
  };

  return (
    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 space-y-2 mt-2">
      <p className="text-xs font-medium text-blue-700">새 트랙 추가</p>

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
            onChange={(e) => setForm((prev) => ({ ...prev, artist: e.target.value }))}
            placeholder="아티스트"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">장르</label>
          <select
            value={form.genre}
            onChange={(e) => setForm((prev) => ({ ...prev, genre: e.target.value }))}
            className="w-full h-7 text-xs border border-gray-200 rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">선택</option>
            {DANCE_MUSIC_GENRES.map((g) => (
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
            onChange={(e) => setForm((prev) => ({ ...prev, bpm: e.target.value }))}
            placeholder="120"
            className="h-7 text-xs"
            min={40}
            max={300}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 mb-0.5 block">재생 시간</label>
          <Input
            value={form.duration}
            onChange={(e) => setForm((prev) => ({ ...prev, duration: e.target.value }))}
            placeholder="3:45"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">URL (YouTube/Spotify 등)</label>
        <Input
          value={form.url}
          onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
          className="h-7 text-xs"
        />
      </div>

      {/* 태그 입력 */}
      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">
          태그 (Enter 또는 쉼표로 추가)
        </label>
        <div className="flex flex-wrap gap-1 mb-1">
          {form.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900 ml-0.5"
                aria-label={`태그 ${tag} 삭제`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <Input
          value={form.tagInput}
          onChange={(e) => setForm((prev) => ({ ...prev, tagInput: e.target.value }))}
          onKeyDown={handleTagKeyDown}
          placeholder="태그 입력 후 Enter"
          className="h-7 text-xs"
        />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 mb-0.5 block">메모</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="메모 (선택)"
          className="text-xs min-h-[48px] resize-none"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
        >
          <Check className="h-3 w-3 mr-1" />
          추가
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
// 서브 컴포넌트: 플레이리스트 아이템
// ============================================================

function PlaylistItem({
  playlist,
  onDelete,
  onAddTrack,
  onToggleFavorite,
  onRemoveTrack,
}: {
  playlist: DanceMusicPlaylist;
  onDelete: (id: string) => void;
  onAddTrack: (playlistId: string, form: TrackFormState) => void;
  onToggleFavorite: (playlistId: string, trackId: string) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAddTrack, setShowAddTrack] = useState(false);

  const favoriteCount = playlist.tracks.filter((t) => t.isFavorite).length;

  const handleAddTrack = (playlistId: string, form: TrackFormState) => {
    onAddTrack(playlistId, form);
    setShowAddTrack(false);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-card hover:bg-muted/30 cursor-pointer transition-colors">
            <ListMusic className="h-4 w-4 text-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {playlist.name}
              </p>
              {playlist.description && (
                <p className="text-[10px] text-gray-400 truncate">{playlist.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-400">
                {playlist.tracks.length}곡
              </span>
              {favoriteCount > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600">
                  <Star className="h-3 w-3 fill-current" />
                  {favoriteCount}
                </span>
              )}
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

        {/* 트랙 목록 */}
        <CollapsibleContent>
          <div className="px-3 pt-0 pb-2 bg-gray-50/50">
            {playlist.tracks.length === 0 && !showAddTrack ? (
              <div className="py-4 flex flex-col items-center gap-1 text-gray-400">
                <Music2 className="h-6 w-6" />
                <p className="text-xs">아직 트랙이 없습니다</p>
              </div>
            ) : (
              <div className="py-1">
                {playlist.tracks.map((track) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    playlistId={playlist.id}
                    onToggleFavorite={onToggleFavorite}
                    onRemove={onRemoveTrack}
                  />
                ))}
              </div>
            )}

            {showAddTrack ? (
              <TrackAddForm
                playlistId={playlist.id}
                onAdd={handleAddTrack}
                onCancel={() => setShowAddTrack(false)}
              />
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs w-full mt-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => setShowAddTrack(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                트랙 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 장르 분포 차트 (CSS div 기반)
// ============================================================

function GenreDistributionChart({
  genreDistribution,
}: {
  genreDistribution: { genre: string; count: number; percent: number }[];
}) {
  if (genreDistribution.length === 0) return null;

  const top5 = genreDistribution.slice(0, 5);

  return (
    <div className="space-y-1.5">
      {top5.map((item, idx) => (
        <div key={item.genre} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 w-14 truncate flex-shrink-0">
            {item.genre}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${CHART_COLORS[idx % CHART_COLORS.length]}`}
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
// 메인 컴포넌트
// ============================================================

export function DanceMusicCard({ memberId }: DanceMusicCardProps) {
  const {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    toggleFavorite,
    totalPlaylists,
    totalTracks,
    favoriteCount,
    genreDistribution,
  } = useDanceMusic(memberId);

  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [showStats, setShowStats] = useState(false);

  // ────────────────────────────────────────────
  // 플레이리스트 생성
  // ────────────────────────────────────────────

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("플레이리스트 이름을 입력해주세요");
      return;
    }
    createPlaylist({ name: newPlaylistName, description: newPlaylistDesc });
    toast.success("플레이리스트를 만들었습니다");
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setShowNewPlaylistForm(false);
  };

  // ────────────────────────────────────────────
  // 플레이리스트 삭제
  // ────────────────────────────────────────────

  const handleDeletePlaylist = (playlistId: string) => {
    deletePlaylist(playlistId);
    toast.success("플레이리스트를 삭제했습니다");
  };

  // ────────────────────────────────────────────
  // 트랙 추가
  // ────────────────────────────────────────────

  const handleAddTrack = (playlistId: string, form: TrackFormState) => {
    const result = addTrack(playlistId, {
      title: form.title,
      artist: form.artist,
      genre: form.genre,
      bpm: form.bpm ? Number(form.bpm) : null,
      duration: form.duration || null,
      url: form.url || null,
      tags: form.tags,
      notes: form.notes,
    });
    if (result) {
      toast.success("트랙을 추가했습니다");
    } else {
      toast.error("트랙 추가에 실패했습니다");
    }
  };

  // ────────────────────────────────────────────
  // 로딩
  // ────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // ────────────────────────────────────────────
  // 렌더
  // ────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Music2 className="h-4 w-4 text-purple-500" />
            댄스 뮤직 플레이리스트
          </CardTitle>
          <div className="flex items-center gap-1">
            {/* 통계 토글 */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2"
              onClick={() => setShowStats((prev) => !prev)}
            >
              <BarChart2 className="h-3.5 w-3.5 mr-1" />
              통계
            </Button>
            {/* 새 플레이리스트 */}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowNewPlaylistForm((prev) => !prev)}
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
            className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700"
          >
            <ListMusic className="h-3 w-3 mr-0.5" />
            {totalPlaylists}개 목록
          </Badge>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700"
          >
            <Music2 className="h-3 w-3 mr-0.5" />
            {totalTracks}곡
          </Badge>
          {favoriteCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700"
            >
              <Heart className="h-3 w-3 mr-0.5 fill-current" />
              즐겨찾기 {favoriteCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 통계 영역 */}
        {showStats && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
              장르별 분포
            </p>
            {genreDistribution.length === 0 ? (
              <p className="text-xs text-gray-400">트랙을 추가하면 장르 분포가 표시됩니다</p>
            ) : (
              <GenreDistributionChart genreDistribution={genreDistribution} />
            )}
          </div>
        )}

        {/* 새 플레이리스트 폼 */}
        {showNewPlaylistForm && (
          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50 space-y-2">
            <p className="text-xs font-medium text-purple-700">새 플레이리스트</p>
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="플레이리스트 이름 *"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePlaylist();
              }}
            />
            <Input
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              placeholder="설명 (선택)"
              className="h-7 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs flex-1 bg-purple-600 hover:bg-purple-700"
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
                  setShowNewPlaylistForm(false);
                  setNewPlaylistName("");
                  setNewPlaylistDesc("");
                }}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {playlists.length === 0 && !showNewPlaylistForm ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <Music2 className="h-6 w-6 text-purple-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              아직 플레이리스트가 없습니다
            </p>
            <p className="text-xs text-center text-gray-400">
              개인 연습곡이나 공연곡을
              <br />
              플레이리스트로 관리해 보세요
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs mt-1"
              onClick={() => setShowNewPlaylistForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              첫 플레이리스트 만들기
            </Button>
          </div>
        ) : (
          // 플레이리스트 목록
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <PlaylistItem
                key={playlist.id}
                playlist={playlist}
                onDelete={handleDeletePlaylist}
                onAddTrack={handleAddTrack}
                onToggleFavorite={toggleFavorite}
                onRemoveTrack={removeTrack}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
