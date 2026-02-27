"use client";

import { useState } from "react";
import {
  ListMusic,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  usePracticePlaylistCard,
  mmssToSeconds,
  secondsToMmss,
} from "@/hooks/use-practice-playlist-card";
import type { PracticeTrack, PracticePlaylistData } from "@/types";

// ============================================
// 장르 배지 색상
// ============================================

function GenreBadge({ genre }: { genre: string }) {
  const colors: Record<string, string> = {
    힙합: "bg-purple-100 text-purple-700 border-purple-200",
    팝핑: "bg-orange-100 text-orange-700 border-orange-200",
    락킹: "bg-yellow-100 text-yellow-700 border-yellow-200",
    브레이킹: "bg-red-100 text-red-700 border-red-200",
    왁킹: "bg-pink-100 text-pink-700 border-pink-200",
    컨템포러리: "bg-teal-100 text-teal-700 border-teal-200",
    하우스: "bg-blue-100 text-blue-700 border-blue-200",
    크럼프: "bg-rose-100 text-rose-700 border-rose-200",
    팝: "bg-sky-100 text-sky-700 border-sky-200",
  };
  const className =
    colors[genre] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${className}`}
    >
      {genre}
    </span>
  );
}

// ============================================
// 플레이리스트 생성 다이얼로그
// ============================================

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

function CreatePlaylistDialog({
  open,
  onClose,
  onCreate,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName("");
    onClose();
    toast.success("플레이리스트가 생성되었습니다.");
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">새 플레이리스트</DialogTitle>
        </DialogHeader>
        <div className="py-1">
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            이름 <span className="text-destructive">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="플레이리스트 이름"
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 곡 추가 다이얼로그
// ============================================

interface AddTrackDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    title: string,
    artist: string,
    duration: number,
    bpm?: number,
    genre?: string,
    notes?: string,
    addedBy?: string
  ) => void;
}

const DEFAULT_FORM = {
  title: "",
  artist: "",
  durationStr: "",
  bpmStr: "",
  genre: "",
  notes: "",
  addedBy: "",
};

function AddTrackDialog({ open, onClose, onAdd }: AddTrackDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [durationError, setDurationError] = useState("");

  const set = <K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateDuration = (val: string) => {
    if (!val.trim()) {
      setDurationError("재생시간을 입력해주세요.");
      return false;
    }
    if (!/^\d{1,3}:\d{2}$/.test(val.trim())) {
      setDurationError("MM:SS 형식으로 입력해주세요. (예: 03:45)");
      return false;
    }
    const secs = mmssToSeconds(val.trim());
    if (secs <= 0) {
      setDurationError("올바른 재생시간을 입력해주세요.");
      return false;
    }
    setDurationError("");
    return true;
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!validateDuration(form.durationStr)) return;
    const duration = mmssToSeconds(form.durationStr.trim());
    const bpm = form.bpmStr.trim() ? parseInt(form.bpmStr, 10) : undefined;
    onAdd(
      form.title,
      form.artist,
      duration,
      bpm && !isNaN(bpm) ? bpm : undefined,
      form.genre || undefined,
      form.notes || undefined,
      form.addedBy || undefined
    );
    setForm(DEFAULT_FORM);
    setDurationError("");
    onClose();
    toast.success("곡이 추가되었습니다.");
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    setDurationError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">곡 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="곡 제목"
              className="h-7 text-xs"
              autoFocus
            />
          </div>
          {/* 아티스트 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              아티스트
            </Label>
            <Input
              value={form.artist}
              onChange={(e) => set("artist", e.target.value)}
              placeholder="아티스트 이름"
              className="h-7 text-xs"
            />
          </div>
          {/* 재생시간 + BPM */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                재생시간 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.durationStr}
                onChange={(e) => {
                  set("durationStr", e.target.value);
                  if (durationError) validateDuration(e.target.value);
                }}
                onBlur={(e) => validateDuration(e.target.value)}
                placeholder="03:45"
                className="h-7 text-xs"
              />
              {durationError && (
                <p className="text-[10px] text-destructive mt-0.5">
                  {durationError}
                </p>
              )}
            </div>
            <div className="w-24">
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                BPM
              </Label>
              <Input
                value={form.bpmStr}
                onChange={(e) =>
                  set("bpmStr", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="120"
                className="h-7 text-xs"
                type="number"
                min={1}
                max={300}
              />
            </div>
          </div>
          {/* 장르 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              장르
            </Label>
            <Input
              value={form.genre}
              onChange={(e) => set("genre", e.target.value)}
              placeholder="힙합, 팝핑, 락킹..."
              className="h-7 text-xs"
            />
          </div>
          {/* 메모 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              메모
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="연습 포인트, 참고사항 등"
              className="min-h-[56px] resize-none text-xs"
            />
          </div>
          {/* 추가자 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              추가자
            </Label>
            <Input
              value={form.addedBy}
              onChange={(e) => set("addedBy", e.target.value)}
              placeholder="이름 (미입력 시 '나')"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 트랙 행
// ============================================

interface TrackRowProps {
  track: PracticeTrack;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function TrackRow({
  track,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TrackRowProps) {
  return (
    <div className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 group hover:bg-muted/30 transition-colors">
      {/* 순번 */}
      <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
        {track.order}
      </span>

      {/* 제목 + 아티스트 */}
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
          <p className="text-[10px] text-muted-foreground/70 truncate italic">
            {track.notes}
          </p>
        )}
      </div>

      {/* 배지 */}
      <div className="flex items-center gap-1 shrink-0">
        {track.genre && <GenreBadge genre={track.genre} />}
        {track.bpm && (
          <span className="inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
            {track.bpm} BPM
          </span>
        )}
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {secondsToMmss(track.duration)}
        </span>
      </div>

      {/* 순서 이동 버튼 */}
      <div className="flex flex-col gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="위로"
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title="아래로"
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* 삭제 */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);

  // 선택된 플레이리스트 (없으면 첫 번째)
  const selectedPlaylist: PracticePlaylistData | null =
    playlists.find((p) => p.id === selectedPlaylistId) ??
    playlists[0] ??
    null;

  // order 기준 정렬
  const sortedTracks = selectedPlaylist
    ? [...selectedPlaylist.tracks].sort((a, b) => a.order - b.order)
    : [];

  // 전체 재생시간 (현재 선택된 플레이리스트)
  const playlistDuration = sortedTracks.reduce(
    (sum, t) => sum + t.duration,
    0
  );

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
    if (selectedPlaylistId === id) setSelectedPlaylistId("");
    toast.success("플레이리스트가 삭제되었습니다.");
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!selectedPlaylist) return;
    removeTrack(selectedPlaylist.id, trackId);
    toast.success("곡이 삭제되었습니다.");
  };

  const handleMoveTrack = (
    trackId: string,
    direction: "up" | "down"
  ) => {
    if (!selectedPlaylist) return;
    moveTrack(selectedPlaylist.id, trackId, direction);
  };

  const handleAddTrack = (
    title: string,
    artist: string,
    duration: number,
    bpm?: number,
    genre?: string,
    notes?: string,
    addedBy?: string
  ) => {
    if (!selectedPlaylist) return;
    addTrack(selectedPlaylist.id, title, artist, duration, bpm, genre, notes, addedBy);
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-gray-800">
              연습곡 플레이리스트
            </span>
            {totalTracks > 0 && (
              <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
                {totalTracks}곡
              </Badge>
            )}
            {totalDuration > 0 && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-600 hover:bg-gray-100">
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
              >
                <Plus className="h-3 w-3" />
                새 플레이리스트
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-gray-200 bg-white p-4">
            {/* 플레이리스트 없을 때 */}
            {playlists.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                <Music2 className="h-8 w-8 opacity-30" />
                <p className="text-xs">아직 플레이리스트가 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  만들기
                </Button>
              </div>
            ) : (
              <>
                {/* 플레이리스트 탭 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {playlists.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlaylistId(p.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        (selectedPlaylist?.id === p.id)
                          ? "bg-violet-100 text-violet-700 border-violet-300 font-medium"
                          : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                      }`}
                    >
                      {p.name}
                      <span className="ml-1 text-[10px] opacity-60">
                        ({p.tracks.length})
                      </span>
                    </button>
                  ))}
                </div>

                {/* 선택된 플레이리스트 상단 버튼 */}
                {selectedPlaylist && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {selectedPlaylist.name}
                      </span>
                      {playlistDuration > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          총 {secondsToMmss(playlistDuration)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 gap-0.5"
                        onClick={() => setShowAddTrackDialog(true)}
                      >
                        <Plus className="h-3 w-3" />
                        곡 추가
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          handleDeletePlaylist(selectedPlaylist.id)
                        }
                        title="플레이리스트 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 트랙 목록 */}
                {selectedPlaylist && sortedTracks.length === 0 ? (
                  <div className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground">
                    <ListMusic className="h-7 w-7 opacity-30" />
                    <p className="text-xs">아직 등록된 곡이 없습니다.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAddTrackDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      곡 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedTracks.map((track, idx) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isFirst={idx === 0}
                        isLast={idx === sortedTracks.length - 1}
                        onRemove={() => handleRemoveTrack(track.id)}
                        onMoveUp={() => handleMoveTrack(track.id, "up")}
                        onMoveDown={() => handleMoveTrack(track.id, "down")}
                      />
                    ))}
                  </div>
                )}

                {/* 통계 요약 */}
                {totalPlaylists > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-muted-foreground">
                    <span>
                      플레이리스트{" "}
                      <strong className="text-foreground">
                        {totalPlaylists}
                      </strong>
                      개
                    </span>
                    <span>
                      전체{" "}
                      <strong className="text-foreground">{totalTracks}</strong>
                      곡
                    </span>
                    {totalDuration > 0 && (
                      <span>
                        총{" "}
                        <strong className="text-foreground">
                          {secondsToMmss(totalDuration)}
                        </strong>
                      </span>
                    )}
                  </div>
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
