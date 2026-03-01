"use client";

import { useState } from "react";
import { Music, ListMusic, Plus, Trash2, ChevronLeft, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMusicPlaylist } from "@/hooks/use-music-playlist";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { MusicPlaylist, MusicPlaylistTrack } from "@/types";

// ============================================
// 상수
// ============================================

const GENRE_SUGGESTIONS = ["팝", "힙합", "R&B", "K-POP", "EDM", "재즈", "록", "클래식", "발라드", "댄스"];

// ============================================
// 서브 컴포넌트: 곡 추가 폼
// ============================================

interface AddTrackFormProps {
  onAdd: (track: Omit<MusicPlaylistTrack, "id" | "order">) => void;
  trackCount: number;
  maxTracks: number;
}

function AddTrackForm({ onAdd, trackCount, maxTracks }: AddTrackFormProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState("");
  const [genre, setGenre] = useState("");
  const [memo, setMemo] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimTitle = title.trim();
    const trimArtist = artist.trim();
    if (!trimTitle || !trimArtist) {
      toast.error("곡명과 아티스트는 필수입니다.");
      return;
    }
    if (trackCount >= maxTracks) {
      toast.error(`플레이리스트는 최대 ${maxTracks}곡까지 추가할 수 있습니다.`);
      return;
    }
    const bpmNum = bpm.trim() ? parseInt(bpm.trim(), 10) : null;
    if (bpm.trim() && (isNaN(bpmNum!) || bpmNum! <= 0 || bpmNum! > 300)) {
      toast.error("BPM은 1~300 사이의 숫자를 입력해주세요.");
      return;
    }
    onAdd({
      title: trimTitle,
      artist: trimArtist,
      bpm: bpmNum,
      genre: genre.trim(),
      memo: memo.trim(),
    });
    setTitle("");
    setArtist("");
    setBpm("");
    setGenre("");
    setMemo("");
    setOpen(false);
    toast.success("곡이 추가되었습니다.");
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={() => setOpen(true)}
        disabled={trackCount >= maxTracks}
      >
        <Plus className="h-3 w-3 mr-1" />
        곡 추가
        {trackCount >= maxTracks && (
          <span className="ml-1 text-muted-foreground">({maxTracks}곡 제한)</span>
        )}
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-3 space-y-2 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground">새 곡 추가</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">곡명 *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="곡명"
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">아티스트 *</Label>
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="아티스트"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">BPM</Label>
          <Input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            placeholder="예: 128"
            className="h-7 text-xs"
            min={1}
            max={300}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">장르</Label>
          <Input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="예: 팝, 힙합"
            className="h-7 text-xs"
            list="genre-suggestions"
          />
          <datalist id="genre-suggestions">
            {GENRE_SUGGESTIONS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="곡에 대한 메모 (선택)"
          className="text-xs resize-none h-16"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          추가
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 서브 컴포넌트: 곡 목록 아이템
// ============================================

interface TrackItemProps {
  track: MusicPlaylistTrack;
  index: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function TrackItem({ track, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: TrackItemProps) {
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-0 group">
      {/* 순번 + 이동 버튼 */}
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <span className="text-[10px] text-muted-foreground w-5 text-center font-mono">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-5 p-0"
            onClick={onMoveUp}
            disabled={isFirst}
            title="위로"
          >
            <GripVertical className="h-3 w-3 rotate-[-90deg]" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-5 p-0"
            onClick={onMoveDown}
            disabled={isLast}
            title="아래로"
          >
            <GripVertical className="h-3 w-3 rotate-90" />
          </Button>
        </div>
      </div>

      {/* 곡 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{track.title}</span>
          <span className="text-[10px] text-muted-foreground">{track.artist}</span>
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
        </div>
        {track.memo && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{track.memo}</p>
        )}
      </div>

      {/* 삭제 버튼 */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        onClick={onRemove}
        title="곡 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 플레이리스트 상세 뷰
// ============================================

interface PlaylistDetailProps {
  playlist: MusicPlaylist;
  onBack: () => void;
  onAddTrack: (track: Omit<MusicPlaylistTrack, "id" | "order">) => void;
  onRemoveTrack: (trackId: string) => void;
  onReorderTrack: (fromIndex: number, toIndex: number) => void;
  onDeletePlaylist: () => void;
  maxTracks: number;
}

function PlaylistDetail({
  playlist,
  onBack,
  onAddTrack,
  onRemoveTrack,
  onReorderTrack,
  onDeletePlaylist,
  maxTracks,
}: PlaylistDetailProps) {
  const sortedTracks = [...playlist.tracks].sort((a, b) => a.order - b.order);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function handleDelete() {
    onDeletePlaylist();
    onBack();
    toast.success("플레이리스트가 삭제되었습니다.");
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={onBack}
          title="목록으로"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{playlist.name}</p>
          {playlist.description && (
            <p className="text-[10px] text-muted-foreground truncate">{playlist.description}</p>
          )}
        </div>
        <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
          {playlist.tracks.length} / {maxTracks}곡
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => setDeleteConfirmOpen(true)}
          title="플레이리스트 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 곡 목록 */}
      <ScrollArea className="flex-1 py-2">
        {sortedTracks.length === 0 ? (
          <EmptyState icon={Music} title="아직 곡이 없습니다. 첫 곡을 추가해보세요." />
        ) : (
          <div>
            {sortedTracks.map((track, idx) => (
              <TrackItem
                key={track.id}
                track={track}
                index={idx}
                onRemove={() => {
                  onRemoveTrack(track.id);
                  toast.success("곡이 삭제되었습니다.");
                }}
                onMoveUp={() => onReorderTrack(idx, idx - 1)}
                onMoveDown={() => onReorderTrack(idx, idx + 1)}
                isFirst={idx === 0}
                isLast={idx === sortedTracks.length - 1}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 곡 추가 폼 */}
      <div className="pt-3 border-t">
        <AddTrackForm
          onAdd={onAddTrack}
          trackCount={playlist.tracks.length}
          maxTracks={maxTracks}
        />
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="플레이리스트 삭제"
        description={`"${playlist.name}" 플레이리스트를 삭제하시겠습니까? 곡 목록도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 플레이리스트 생성 다이얼로그
// ============================================

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description: string) => void;
  playlistCount: number;
  maxPlaylists: number;
}

function CreatePlaylistDialog({
  open,
  onOpenChange,
  onCreate,
  playlistCount,
  maxPlaylists,
}: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimName = name.trim();
    if (!trimName) {
      toast.error("플레이리스트 이름을 입력해주세요.");
      return;
    }
    if (playlistCount >= maxPlaylists) {
      toast.error(`플레이리스트는 최대 ${maxPlaylists}개까지 만들 수 있습니다.`);
      return;
    }
    onCreate(trimName, description);
    setName("");
    setDescription("");
    onOpenChange(false);
    toast.success("플레이리스트가 생성되었습니다.");
  }

  function handleClose() {
    setName("");
    setDescription("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 플레이리스트</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="플레이리스트 이름"
              className="h-8 text-xs"
              autoFocus
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="플레이리스트에 대한 설명 (선택)"
              className="text-xs resize-none h-20"
              maxLength={200}
            />
          </div>
          <DialogFooter>
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
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface MusicPlaylistManagerProps {
  groupId: string;
}

export function MusicPlaylistManager({ groupId }: MusicPlaylistManagerProps) {
  const {
    playlists,
    maxPlaylists,
    maxTracks,
    createPlaylist,
    updatePlaylist: _updatePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    reorderTrack,
  } = useMusicPlaylist(groupId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId) ?? null
    : null;

  // Sheet 닫힐 때 선택 초기화
  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setSelectedPlaylistId(null);
  }

  return (
    <>
      {/* Sheet 트리거 */}
      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
          >
            <ListMusic className="h-3 w-3" />
            음악 플레이리스트
            {playlists.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 ml-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                {playlists.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:w-96 flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Music className="h-4 w-4 text-indigo-500" />
              음악 플레이리스트
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden flex flex-col px-4 py-3">
            {selectedPlaylist ? (
              /* 플레이리스트 상세 뷰 */
              <PlaylistDetail
                playlist={selectedPlaylist}
                onBack={() => setSelectedPlaylistId(null)}
                onAddTrack={(track) => addTrack(selectedPlaylist.id, track)}
                onRemoveTrack={(trackId) => removeTrack(selectedPlaylist.id, trackId)}
                onReorderTrack={(from, to) => reorderTrack(selectedPlaylist.id, from, to)}
                onDeletePlaylist={() => {
                  deletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }}
                maxTracks={maxTracks}
              />
            ) : (
              /* 플레이리스트 목록 뷰 */
              <div className="flex flex-col h-full">
                {/* 생성 버튼 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {playlists.length} / {maxPlaylists}개
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={playlists.length >= maxPlaylists}
                  >
                    <Plus className="h-3 w-3" />
                    새 플레이리스트
                  </Button>
                </div>

                {/* 플레이리스트 목록 */}
                <ScrollArea className="flex-1">
                  {playlists.length === 0 ? (
                    <EmptyState icon={Music} title="플레이리스트가 없습니다. 새 플레이리스트를 만들어보세요." />
                  ) : (
                    <div className="space-y-1">
                      {playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left group"
                          onClick={() => setSelectedPlaylistId(playlist.id)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center">
                            <Music className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{playlist.name}</p>
                            {playlist.description && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {playlist.description}
                              </p>
                            )}
                          </div>
                          <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground flex-shrink-0">
                            {playlist.tracks.length}곡
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 플레이리스트 생성 다이얼로그 */}
      <CreatePlaylistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createPlaylist}
        playlistCount={playlists.length}
        maxPlaylists={maxPlaylists}
      />
    </>
  );
}
