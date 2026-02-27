"use client";

import { useState } from "react";
import {
  Music,
  Plus,
  ExternalLink,
  X,
  Heart,
  ListMusic,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePracticePlaylist, detectPlatform, CATEGORY_LABELS } from "@/hooks/use-practice-playlist";
import type { PlaylistTrack } from "@/types";
import { toast } from "sonner";

// ============================================
// 타입
// ============================================

interface PracticePlaylistSectionProps {
  groupId: string;
}

type TrackCategory = PlaylistTrack["category"];
type FilterCategory = "all" | TrackCategory;

// ============================================
// 플랫폼 배지 색상
// ============================================

function PlatformBadge({ platform }: { platform: PlaylistTrack["platform"] }) {
  const configs: Record<PlaylistTrack["platform"], { label: string; className: string }> = {
    youtube: { label: "YouTube", className: "bg-red-100 text-red-700 border-red-200" },
    spotify: { label: "Spotify", className: "bg-green-100 text-green-700 border-green-200" },
    soundcloud: { label: "SoundCloud", className: "bg-orange-100 text-orange-700 border-orange-200" },
    other: { label: "링크", className: "bg-gray-100 text-gray-700 border-gray-200" },
  };
  const { label, className } = configs[platform];
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TrackCategory }) {
  const configs: Record<TrackCategory, string> = {
    warmup: "bg-yellow-100 text-yellow-700 border-yellow-200",
    practice: "bg-blue-100 text-blue-700 border-blue-200",
    cooldown: "bg-cyan-100 text-cyan-700 border-cyan-200",
    freestyle: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${configs[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ============================================
// 곡 추가 다이얼로그
// ============================================

interface AddTrackDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (track: Omit<PlaylistTrack, "id" | "addedAt" | "likes">) => void;
}

const DEFAULT_TRACK_FORM = {
  url: "",
  title: "",
  artist: "",
  category: "practice" as TrackCategory,
};

function AddTrackDialog({ open, onClose, onAdd }: AddTrackDialogProps) {
  const [form, setForm] = useState(DEFAULT_TRACK_FORM);
  const detectedPlatform = form.url.trim() ? detectPlatform(form.url) : null;

  const handleChange = <K extends keyof typeof DEFAULT_TRACK_FORM>(
    key: K,
    value: (typeof DEFAULT_TRACK_FORM)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.url.trim() || !form.title.trim()) return;
    onAdd({
      url: form.url.trim(),
      title: form.title.trim(),
      artist: form.artist.trim(),
      category: form.category,
      platform: detectPlatform(form.url),
      addedBy: "나",
    });
    setForm(DEFAULT_TRACK_FORM);
    onClose();
    toast.success("곡이 추가되었습니다.");
  };

  const handleClose = () => {
    setForm(DEFAULT_TRACK_FORM);
    onClose();
  };

  const isValid = form.url.trim().length > 0 && form.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">곡 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* URL */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.url}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="h-7 text-xs"
            />
            {detectedPlatform && (
              <div className="mt-1">
                <PlatformBadge platform={detectedPlatform} />
              </div>
            )}
          </div>

          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="곡 제목"
              className="h-7 text-xs"
            />
          </div>

          {/* 아티스트 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              아티스트 <span className="text-muted-foreground">(선택)</span>
            </Label>
            <Input
              value={form.artist}
              onChange={(e) => handleChange("artist", e.target.value)}
              placeholder="아티스트 이름"
              className="h-7 text-xs"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              카테고리
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleChange("category", v as TrackCategory)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [TrackCategory, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
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
            disabled={!isValid}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 새 플레이리스트 다이얼로그
// ============================================

interface CreatePlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

function CreatePlaylistDialog({ open, onClose, onCreate }: CreatePlaylistDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
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
          <Label className="text-[10px] text-muted-foreground mb-1 block">이름</Label>
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
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClose}>
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
// 메인 컴포넌트
// ============================================

export function PracticePlaylistSection({ groupId }: PracticePlaylistSectionProps) {
  const {
    playlists,
    totalTracks,
    createPlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    toggleLike,
  } = usePracticePlaylist(groupId);

  const [collapsed, setCollapsed] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  // 선택된 플레이리스트 (첫 번째가 기본값)
  const selectedPlaylist =
    playlists.find((p) => p.id === selectedPlaylistId) ?? playlists[0] ?? null;

  // 카테고리 필터 적용
  const filteredTracks =
    selectedPlaylist?.tracks.filter(
      (t) => filterCategory === "all" || t.category === filterCategory
    ) ?? [];

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
    if (selectedPlaylistId === id) {
      setSelectedPlaylistId("");
    }
    toast.success("플레이리스트가 삭제되었습니다.");
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!selectedPlaylist) return;
    removeTrack(selectedPlaylist.id, trackId);
    toast.success("곡이 삭제되었습니다.");
  };

  const handleToggleLike = (trackId: string) => {
    if (!selectedPlaylist) return;
    toggleLike(selectedPlaylist.id, trackId);
  };

  const handleAddTrack = (
    track: Omit<PlaylistTrack, "id" | "addedAt" | "likes">
  ) => {
    if (!selectedPlaylist) return;
    addTrack(selectedPlaylist.id, track);
  };

  const FILTER_BUTTONS: { value: FilterCategory; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "warmup", label: "워밍업" },
    { value: "practice", label: "연습" },
    { value: "cooldown", label: "쿨다운" },
    { value: "freestyle", label: "프리스타일" },
  ];

  return (
    <>
      <div className="rounded border bg-card px-3 py-2.5">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            onClick={() => setCollapsed((v) => !v)}
          >
            <Music className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium">
              연습 플레이리스트
            </span>
            {totalTracks > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                {totalTracks}
              </Badge>
            )}
            <ChevronDown
              className={`h-3 w-3 text-muted-foreground transition-transform ${
                collapsed ? "" : "rotate-180"
              }`}
            />
          </button>

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-1.5 py-0 gap-0.5"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-3 w-3" />
              새 플레이리스트
            </Button>
          )}
        </div>

        {!collapsed && (
          <>
            {playlists.length === 0 ? (
              <div className="py-4 text-center">
                <ListMusic className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  플레이리스트가 없습니다
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs mt-2"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  만들기
                </Button>
              </div>
            ) : (
              <>
                {/* 플레이리스트 선택 + 삭제 + 곡 추가 */}
                <div className="flex items-center gap-1.5 mb-2">
                  {playlists.length === 1 ? (
                    <span className="text-xs font-medium flex-1 truncate">
                      {playlists[0].name}
                    </span>
                  ) : (
                    <Select
                      value={selectedPlaylist?.id ?? ""}
                      onValueChange={(v) => setSelectedPlaylistId(v)}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="플레이리스트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {playlists.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">
                            {p.name} ({p.tracks.length}곡)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedPlaylist && (
                    <>
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
                        onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                        title="플레이리스트 삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>

                {/* 카테고리 필터 */}
                {selectedPlaylist && selectedPlaylist.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {FILTER_BUTTONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilterCategory(value)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          filterCategory === value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* 곡 목록 */}
                {selectedPlaylist && (
                  <>
                    {filteredTracks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {selectedPlaylist.tracks.length === 0
                          ? "아직 등록된 곡이 없습니다"
                          : "해당 카테고리의 곡이 없습니다"}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {filteredTracks.map((track) => (
                          <TrackRow
                            key={track.id}
                            track={track}
                            onRemove={() => handleRemoveTrack(track.id)}
                            onToggleLike={() => handleToggleLike(track.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

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

// ============================================
// 곡 행 컴포넌트
// ============================================

interface TrackRowProps {
  track: PlaylistTrack;
  onRemove: () => void;
  onToggleLike: () => void;
}

function TrackRow({ track, onRemove, onToggleLike }: TrackRowProps) {
  const href = track.url.startsWith("http") ? track.url : `https://${track.url}`;
  const isLiked = track.likes > 0;

  return (
    <div className="flex items-center gap-1.5 rounded border bg-background px-2 py-1.5 group hover:bg-muted/30 transition-colors">
      {/* 제목 + 아티스트 */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">{track.title}</p>
        {track.artist && (
          <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
        )}
      </div>

      {/* 배지들 */}
      <div className="flex items-center gap-1 shrink-0">
        <PlatformBadge platform={track.platform} />
        <CategoryBadge category={track.category} />
      </div>

      {/* 좋아요 */}
      <button
        type="button"
        onClick={onToggleLike}
        className={`flex items-center gap-0.5 text-[10px] shrink-0 transition-colors ${
          isLiked
            ? "text-red-500 hover:text-red-400"
            : "text-muted-foreground hover:text-red-400"
        }`}
      >
        <Heart className={`h-3 w-3 ${isLiked ? "fill-current" : ""}`} />
        {track.likes > 0 && <span>{track.likes}</span>}
      </button>

      {/* 외부 링크 */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        title="열기"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="h-3 w-3" />
      </a>

      {/* 삭제 */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        title="삭제"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
