"use client";

import { useState } from "react";
import {
  Music2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticePlaylistCardProject } from "@/hooks/use-practice-playlist-card-project";
import type { PracticeCardTrack } from "@/types";

// ============================================
// 상수
// ============================================

const GENRE_OPTIONS = [
  "팝", "힙합", "R&B", "K-POP", "EDM", "재즈", "록", "클래식", "발라드", "댄스", "하우스", "트랩",
];

// ============================================
// duration 유효성 검사
// ============================================

function isValidDuration(value: string): boolean {
  if (!value.trim()) return true; // 빈 값은 허용
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

// ============================================
// 서브 컴포넌트: 곡 추가 다이얼로그
// ============================================

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (track: Omit<PracticeCardTrack, "id" | "order" | "createdAt">) => void;
  trackCount: number;
  maxTracks: number;
}

function AddTrackDialog({ open, onOpenChange, onAdd, trackCount, maxTracks }: AddTrackDialogProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState("");
  const [duration, setDuration] = useState("");
  const [genre, setGenre] = useState("");

  function reset() {
    setTitle("");
    setArtist("");
    setBpm("");
    setDuration("");
    setGenre("");
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimTitle = title.trim();
    if (!trimTitle) {
      toast.error(TOAST.PRACTICE_PLAYLIST.SONG_REQUIRED);
      return;
    }
    if (trackCount >= maxTracks) {
      toast.error(`플레이리스트는 최대 ${maxTracks}곡까지 추가할 수 있습니다.`);
      return;
    }

    let bpmNum: number | null = null;
    if (bpm.trim()) {
      bpmNum = parseInt(bpm.trim(), 10);
      if (isNaN(bpmNum) || bpmNum < 1 || bpmNum > 300) {
        toast.error(TOAST.PRACTICE_PLAYLIST.BPM_RANGE);
        return;
      }
    }

    if (duration.trim() && !isValidDuration(duration)) {
      toast.error("시간은 \"분:초\" 형식으로 입력해주세요. (예: 3:45)");
      return;
    }

    onAdd({
      title: trimTitle,
      artist: artist.trim(),
      bpm: bpmNum,
      duration: duration.trim(),
      genre: genre.trim(),
    });

    reset();
    onOpenChange(false);
    toast.success(TOAST.PRACTICE_PLAYLIST.SONG_ADDED);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">곡 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 곡명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">곡명 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="곡명을 입력하세요"
              className="h-8 text-xs"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1.5">
            <Label className="text-xs">아티스트</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="아티스트명"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>

          {/* BPM + 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">BPM</Label>
              <Input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="예: 128"
                className="h-8 text-xs"
                min={1}
                max={300}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">시간</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 3:45"
                className="h-8 text-xs"
                maxLength={7}
              />
            </div>
          </div>

          {/* 장르 */}
          <div className="space-y-1.5">
            <Label className="text-xs">장르</Label>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="예: 팝, 힙합"
              className="h-8 text-xs"
              list="practice-playlist-genre-options"
              maxLength={50}
            />
            <datalist id="practice-playlist-genre-options">
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 서브 컴포넌트: 트랙 아이템
// ============================================

interface TrackItemProps {
  track: PracticeCardTrack;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function TrackItem({
  track,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TrackItemProps) {
  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0 group">
      {/* 순번 */}
      <span className="text-[10px] text-muted-foreground w-5 text-center font-mono flex-shrink-0">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate max-w-[120px]">{track.title}</span>
          {track.artist && (
            <span className="text-[10px] text-muted-foreground truncate">{track.artist}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {track.bpm !== null && (
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
              {track.bpm} BPM
            </Badge>
          )}
          {track.genre && (
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100">
              {track.genre}
            </Badge>
          )}
          {track.duration && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {track.duration}
            </span>
          )}
        </div>
      </div>

      {/* 위/아래 이동 버튼 */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로 이동"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로 이동"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={onRemove}
        title="곡 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface PracticePlaylistCardProps {
  groupId: string;
  projectId: string;
}

export function PracticePlaylistCard({ groupId, projectId }: PracticePlaylistCardProps) {
  const {
    sortedTracks,
    trackCount,
    maxTracks,
    totalDuration,
    addTrack,
    removeTrack,
    reorderTracks,
  } = usePracticePlaylistCardProject(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleRemove(trackId: string, title: string) {
    removeTrack(trackId);
    toast.success(`"${title}" 곡이 삭제되었습니다.`);
  }

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium">연습 플레이리스트</span>
            {trackCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                {trackCount}곡
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              disabled={trackCount >= maxTracks}
              title={trackCount >= maxTracks ? `최대 ${maxTracks}곡까지 추가 가능` : "곡 추가"}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">곡 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼쳐지는 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t">
            {trackCount === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Music2 className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 곡이 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 곡 추가하기
                </Button>
              </div>
            ) : (
              <>
                {/* 트랙 목록 */}
                <ScrollArea className="max-h-72 mt-2">
                  <div>
                    {sortedTracks.map((track, idx) => (
                      <TrackItem
                        key={track.id}
                        track={track}
                        index={idx}
                        isFirst={idx === 0}
                        isLast={idx === sortedTracks.length - 1}
                        onRemove={() => handleRemove(track.id, track.title)}
                        onMoveUp={() => reorderTracks(idx, idx - 1)}
                        onMoveDown={() => reorderTracks(idx, idx + 1)}
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* 하단 요약 */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t">
                  <span className="text-[10px] text-muted-foreground">
                    총 {trackCount} / {maxTracks}곡
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    총 {totalDuration}
                  </span>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 곡 추가 다이얼로그 */}
      <AddTrackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addTrack}
        trackCount={trackCount}
        maxTracks={maxTracks}
      />
    </div>
  );
}
