"use client";

import { useState, useMemo } from "react";
import {
  Music,
  Plus,
  Star,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Heart,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupMusicLibrary } from "@/hooks/use-group-music-library";
import type { GroupMusicTrack, MusicTrackUseCase } from "@/types";
import { validateUrl, sanitizeUrl } from "@/lib/validation";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const USE_CASE_LABEL: Record<MusicTrackUseCase, string> = {
  practice: "연습",
  performance: "공연",
  warmup: "워밍업",
  cooldown: "쿨다운",
  other: "기타",
};

const USE_CASE_COLOR: Record<MusicTrackUseCase, string> = {
  practice: "bg-orange-100 text-orange-700",
  performance: "bg-purple-100 text-purple-700",
  warmup: "bg-green-100 text-green-700",
  cooldown: "bg-cyan-100 text-cyan-700",
  other: "bg-gray-100 text-gray-600",
};

const GENRE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-yellow-100 text-yellow-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

// ─── 초기 폼 값 ───────────────────────────────────────────────────────────────

type TrackFormValues = {
  title: string;
  artist: string;
  genre: string;
  bpm: string;
  duration: string;
  url: string;
  addedBy: string;
  tags: string;
  useCase: MusicTrackUseCase;
};

const EMPTY_FORM: TrackFormValues = {
  title: "",
  artist: "",
  genre: "",
  bpm: "",
  duration: "",
  url: "",
  addedBy: "",
  tags: "",
  useCase: "practice",
};

function formToTrackInput(
  form: TrackFormValues
): Omit<GroupMusicTrack, "id" | "createdAt" | "isFavorite"> {
  return {
    title: form.title.trim(),
    artist: form.artist.trim(),
    genre: form.genre.trim() || null,
    bpm: form.bpm ? Number(form.bpm) : null,
    duration: form.duration.trim() || null,
    url: form.url.trim() || null,
    addedBy: form.addedBy.trim() || "익명",
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    useCase: form.useCase,
  };
}

function trackToForm(track: GroupMusicTrack): TrackFormValues {
  return {
    title: track.title,
    artist: track.artist,
    genre: track.genre ?? "",
    bpm: track.bpm != null ? String(track.bpm) : "",
    duration: track.duration ?? "",
    url: track.url ?? "",
    addedBy: track.addedBy,
    tags: track.tags.join(", "),
    useCase: track.useCase,
  };
}

// ─── 트랙 폼 다이얼로그 ────────────────────────────────────────────────────────

function TrackFormDialog({
  trigger,
  initialValues,
  onSubmit,
  title,
}: {
  trigger: React.ReactNode;
  initialValues?: TrackFormValues;
  onSubmit: (form: TrackFormValues) => boolean;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TrackFormValues>(
    initialValues ?? EMPTY_FORM
  );

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) setForm(initialValues ?? EMPTY_FORM);
  }

  function handleField(key: keyof TrackFormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error(TOAST.GROUP_MUSIC_LIBRARY.TITLE_REQUIRED);
      return;
    }
    if (!form.artist.trim()) {
      toast.error(TOAST.GROUP_MUSIC_LIBRARY.ARTIST_REQUIRED);
      return;
    }
    const urlError = validateUrl(form.url);
    if (urlError) {
      toast.error(urlError);
      return;
    }
    const ok = onSubmit(form);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              곡 제목 <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => handleField("title", e.target.value)}
              placeholder="예: Butter"
              className="h-8 text-xs"
            />
          </div>
          {/* 아티스트 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              아티스트 <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.artist}
              onChange={(e) => handleField("artist", e.target.value)}
              placeholder="예: BTS"
              className="h-8 text-xs"
            />
          </div>
          {/* 장르 & BPM */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                장르
              </label>
              <Input
                value={form.genre}
                onChange={(e) => handleField("genre", e.target.value)}
                placeholder="예: K-Pop"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                BPM
              </label>
              <Input
                type="number"
                min={1}
                max={300}
                value={form.bpm}
                onChange={(e) => handleField("bpm", e.target.value)}
                placeholder="예: 128"
                className="h-8 text-xs"
              />
            </div>
          </div>
          {/* 재생 시간 & 용도 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                재생 시간
              </label>
              <Input
                value={form.duration}
                onChange={(e) => handleField("duration", e.target.value)}
                placeholder="예: 3:42"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                용도
              </label>
              <Select
                value={form.useCase}
                onValueChange={(v) =>
                  handleField("useCase", v as MusicTrackUseCase)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(USE_CASE_LABEL) as [
                      MusicTrackUseCase,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* URL */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              링크 (URL)
            </label>
            <Input
              value={form.url}
              onChange={(e) => handleField("url", e.target.value)}
              placeholder="예: https://youtube.com/..."
              className="h-8 text-xs"
            />
          </div>
          {/* 태그 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              태그 (쉼표 구분)
            </label>
            <Input
              value={form.tags}
              onChange={(e) => handleField("tags", e.target.value)}
              placeholder="예: 신나는, 여름, 챌린지"
              className="h-8 text-xs"
            />
          </div>
          {/* 추가한 사람 */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              추가한 사람
            </label>
            <Input
              value={form.addedBy}
              onChange={(e) => handleField("addedBy", e.target.value)}
              placeholder="예: 홍길동"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 장르 분포 차트 ────────────────────────────────────────────────────────────

function GenreDistributionChart({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0 || total === 0) return null;

  return (
    <div className="space-y-1.5">
      {entries.map(([genre, count], idx) => {
        const pct = Math.round((count / total) * 100);
        const colorClass = GENRE_COLORS[idx % GENRE_COLORS.length];
        return (
          <div key={genre} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 w-16 shrink-0 truncate">
              {genre}
            </span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorClass.split(" ")[0]} opacity-80`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 용도 분포 배지 목록 ──────────────────────────────────────────────────────

function UseCaseStats({
  distribution,
}: {
  distribution: Record<MusicTrackUseCase, number>;
}) {
  const entries = (
    Object.entries(distribution) as [MusicTrackUseCase, number][]
  ).filter(([, count]) => count > 0);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([useCase, count]) => (
        <span
          key={useCase}
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${USE_CASE_COLOR[useCase]}`}
        >
          {USE_CASE_LABEL[useCase]} {count}
        </span>
      ))}
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function GroupMusicLibraryCard({ groupId }: { groupId: string }) {
  const {
    tracks,
    loading,
    totalTracks,
    favoriteCount,
    genreDistribution,
    useCaseDistribution,
    addTrack,
    updateTrack,
    deleteTrack,
    toggleFavorite,
  } = useGroupMusicLibrary(groupId);

  const [open, setOpen] = useState(true);
  const [filterUseCase, setFilterUseCase] = useState<
    MusicTrackUseCase | "all" | "favorite"
  >("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [showChart, setShowChart] = useState(false);

  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.genre?.trim() || "미분류"));
    return Array.from(set).sort();
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    let list = [...tracks];
    if (filterUseCase === "favorite") {
      list = list.filter((t) => t.isFavorite);
    } else if (filterUseCase !== "all") {
      list = list.filter((t) => t.useCase === filterUseCase);
    }
    if (filterGenre !== "all") {
      list = list.filter(
        (t) => (t.genre?.trim() || "미분류") === filterGenre
      );
    }
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tracks, filterUseCase, filterGenre]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            음악 라이브러리
          </span>
          {totalTracks > 0 && (
            <span className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 rounded-full font-medium">
              {totalTracks}곡
            </span>
          )}
          {favoriteCount > 0 && (
            <span className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-600 rounded-full font-medium flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
              {favoriteCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {totalTracks > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowChart((v) => !v)}
              title="장르 분포 차트"
            >
              <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          )}
          <TrackFormDialog
            title="트랙 추가"
            onSubmit={(form) => addTrack(formToTrackInput(form))}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                추가
              </Button>
            }
          />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="mt-1 border border-gray-200 rounded-xl bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-gray-400">
              불러오는 중...
            </div>
          ) : totalTracks === 0 ? (
            /* 빈 상태 */
            <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
              <Music className="h-8 w-8 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">
                아직 등록된 트랙이 없습니다
              </p>
              <p className="text-xs text-gray-300">
                연습·공연·워밍업에 사용하는 음악을 공유해 보세요
              </p>
              <TrackFormDialog
                title="트랙 추가"
                onSubmit={(form) => addTrack(formToTrackInput(form))}
                trigger={
                  <Button size="sm" className="h-7 text-xs mt-2 gap-1">
                    <Plus className="h-3 w-3" />
                    첫 트랙 추가
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* 장르 분포 차트 */}
              {showChart && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                    <BarChart2 className="h-3 w-3" />
                    장르 분포
                  </p>
                  <GenreDistributionChart
                    distribution={genreDistribution}
                    total={totalTracks}
                  />
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">
                      용도별 현황
                    </p>
                    <UseCaseStats distribution={useCaseDistribution} />
                  </div>
                </div>
              )}

              {/* 필터 */}
              <div className="px-4 py-2 border-b border-gray-100 flex flex-wrap gap-2 items-center">
                <Filter className="h-3 w-3 text-gray-400" />
                {/* 용도 필터 */}
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["all", "전체"],
                      ["favorite", "즐겨찾기"],
                      ...Object.entries(USE_CASE_LABEL),
                    ] as [string, string][]
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() =>
                        setFilterUseCase(
                          val as MusicTrackUseCase | "all" | "favorite"
                        )
                      }
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterUseCase === val
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-background text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* 장르 필터 */}
                {genres.length > 0 && (
                  <Select value={filterGenre} onValueChange={setFilterGenre}>
                    <SelectTrigger className="h-6 text-[10px] w-28 border-gray-200">
                      <SelectValue placeholder="장르 전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        장르 전체
                      </SelectItem>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g} className="text-xs">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 트랙 목록 */}
              {filteredTracks.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  조건에 맞는 트랙이 없습니다
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {filteredTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onToggleFavorite={() => toggleFavorite(track.id)}
                      onDelete={() => deleteTrack(track.id)}
                      onUpdate={(form) =>
                        updateTrack(track.id, formToTrackInput(form))
                      }
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 트랙 행 ──────────────────────────────────────────────────────────────────

function TrackRow({
  track,
  onToggleFavorite,
  onDelete,
  onUpdate,
}: {
  track: GroupMusicTrack;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onUpdate: (form: TrackFormValues) => boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete();
  }

  return (
    <li className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-2">
        {/* 즐겨찾기 버튼 */}
        <button
          onClick={onToggleFavorite}
          className="mt-0.5 shrink-0 focus:outline-none"
          title={track.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              track.isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>

        {/* 트랙 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">
              {track.title}
            </span>
            <span className="text-[10px] text-gray-400">{track.artist}</span>
            {track.url && (
              <a
                href={sanitizeUrl(track.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
                title="링크 열기"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {/* 용도 배지 */}
            <span
              className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${USE_CASE_COLOR[track.useCase]}`}
            >
              {USE_CASE_LABEL[track.useCase]}
            </span>
            {/* 장르 */}
            {track.genre && (
              <span className="text-[10px] px-1.5 py-0 rounded-full bg-gray-100 text-gray-600 font-medium">
                {track.genre}
              </span>
            )}
            {/* BPM */}
            {track.bpm != null && (
              <span className="text-[10px] text-gray-400">{track.bpm} BPM</span>
            )}
            {/* 재생 시간 */}
            {track.duration && (
              <span className="text-[10px] text-gray-400">{track.duration}</span>
            )}
          </div>
          {/* 태그 */}
          {track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {track.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1 py-0 bg-indigo-50 text-indigo-400 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-[9px] text-gray-300 mt-1">
            추가: {track.addedBy}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <TrackFormDialog
            title="트랙 수정"
            initialValues={trackToForm(track)}
            onSubmit={onUpdate}
            trigger={
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Pencil className="h-3 w-3 text-gray-400" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${confirmDelete ? "bg-red-50" : ""}`}
            onClick={handleDelete}
            title={confirmDelete ? "한 번 더 클릭하면 삭제됩니다" : "삭제"}
          >
            <Trash2
              className={`h-3 w-3 ${confirmDelete ? "text-red-500" : "text-gray-400"}`}
            />
          </Button>
        </div>
      </div>
    </li>
  );
}
