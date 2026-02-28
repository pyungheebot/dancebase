"use client";

import { useState } from "react";
import {
  ListMusic,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Music,
  Clock,
  GripVertical,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import { useMusicQueue } from "@/hooks/use-music-queue";
import type { MusicQueueTrack } from "@/types";

// ─── 시간 포맷 헬퍼 ──────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseDuration(value: string): number {
  const parts = value.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + Math.min(s, 59);
  }
  return parseInt(value, 10) || 0;
}

function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}시간 ${m}분 ${String(s).padStart(2, "0")}초`;
  if (m > 0) return `${m}분 ${String(s).padStart(2, "0")}초`;
  return `${s}초`;
}

// ─── BPM 배지 색상 ────────────────────────────────────────────

function bpmColor(bpm: number): string {
  if (bpm >= 160) return "bg-red-50 text-red-600";
  if (bpm >= 130) return "bg-orange-50 text-orange-600";
  if (bpm >= 100) return "bg-yellow-50 text-yellow-600";
  return "bg-green-50 text-green-600";
}

// ─── 트랙 추가 다이얼로그 ─────────────────────────────────────

interface TrackForm {
  title: string;
  artist: string;
  durationRaw: string;
  bpmRaw: string;
  genre: string;
  notes: string;
}

function emptyTrackForm(): TrackForm {
  return { title: "", artist: "", durationRaw: "3:00", bpmRaw: "", genre: "", notes: "" };
}

function AddTrackDialog({ onAdd }: { onAdd: (payload: Omit<MusicQueueTrack, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TrackForm>(emptyTrackForm());

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("곡 제목을 입력해주세요.");
      return;
    }
    const durationSeconds = parseDuration(form.durationRaw);
    if (durationSeconds <= 0) {
      toast.error("올바른 시간을 입력해주세요. (예: 3:30)");
      return;
    }
    onAdd({
      title: form.title.trim(),
      artist: form.artist.trim() || undefined,
      durationSeconds,
      bpm: form.bpmRaw ? Number(form.bpmRaw) : undefined,
      genre: form.genre.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setOpen(false);
    setForm(emptyTrackForm());
    toast.success("트랙이 추가되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          트랙 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">트랙 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              곡 제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예) Permission to Dance"
              className="text-xs h-8"
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">아티스트</label>
            <Input
              value={form.artist}
              onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
              placeholder="예) BTS"
              className="text-xs h-8"
            />
          </div>

          {/* 시간 + BPM */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                시간 (분:초) <span className="text-red-400">*</span>
              </label>
              <Input
                value={form.durationRaw}
                onChange={(e) => setForm((f) => ({ ...f, durationRaw: e.target.value }))}
                placeholder="3:30"
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">BPM</label>
              <Input
                type="number"
                value={form.bpmRaw}
                onChange={(e) => setForm((f) => ({ ...f, bpmRaw: e.target.value }))}
                placeholder="예) 128"
                min={40}
                max={250}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* 장르 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">장르</label>
            <Input
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              placeholder="예) K-POP, 힙합, 팝"
              className="text-xs h-8"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">메모</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="연습 포인트, 특이사항 등..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 세트 추가 다이얼로그 ─────────────────────────────────────

function AddSetDialog({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("세트 이름을 입력해주세요.");
      return;
    }
    onAdd(name.trim());
    setOpen(false);
    setName("");
    toast.success("세트가 추가되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          세트 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 세트 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              세트 이름 <span className="text-red-400">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="예) 웜업 세트, 메인 세트"
              className="text-xs h-8"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              만들기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 트랙 행 ─────────────────────────────────────────────────

function TrackRow({
  track,
  index,
  cumulativeSeconds,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  track: MusicQueueTrack;
  index: number;
  cumulativeSeconds: number;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white">
        {/* 순서 번호 */}
        <span className="text-[10px] text-gray-400 w-4 shrink-0 text-center">
          {index + 1}
        </span>

        {/* 드래그 핸들(시각) + 순서 이동 */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="text-gray-200 hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="text-gray-200 hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* 곡 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-gray-800 truncate">
              {track.title}
            </span>
            {track.artist && (
              <span className="text-[10px] text-gray-400 truncate">
                {track.artist}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
              <Clock className="h-2.5 w-2.5" />
              {formatDuration(track.durationSeconds)}
            </span>
            {track.bpm !== undefined && (
              <Badge
                className={`text-[10px] px-1.5 py-0 ${bpmColor(track.bpm)} hover:opacity-80`}
              >
                {track.bpm} BPM
              </Badge>
            )}
            {track.genre && (
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 hover:bg-purple-50">
                {track.genre}
              </Badge>
            )}
          </div>
          {track.notes && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{track.notes}</p>
          )}
        </div>

        {/* 삭제 */}
        <button
          onClick={onDelete}
          className="text-gray-200 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* 누적 시간 */}
      <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 border-t border-gray-100">
        <GripVertical className="h-2.5 w-2.5 text-gray-300" />
        <span className="text-[10px] text-gray-400">
          누적: {formatTotalDuration(cumulativeSeconds)}
        </span>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function MusicQueueCard({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const {
    sets,
    addSet,
    deleteSet,
    setActive,
    addTrack,
    deleteTrack,
    reorderTracks,
    stats,
  } = useMusicQueue(groupId);

  // 현재 선택된 세트 (탭)
  const currentSetId = activeTab ?? sets.find((s) => s.isActive)?.id ?? sets[0]?.id ?? null;
  const currentSet = sets.find((s) => s.id === currentSetId) ?? null;

  async function handleAddSet(name: string) {
    const id = await addSet(name);
    if (id) setActiveTab(id);
  }

  async function handleDeleteSet(setId: string) {
    await deleteSet(setId);
    if (activeTab === setId) setActiveTab(null);
  }

  async function handleSetActive(setId: string) {
    await setActive(setId);
    toast.success("활성 세트가 변경되었습니다.");
  }

  async function handleAddTrack(payload: Omit<MusicQueueTrack, "id">) {
    if (!currentSetId) return;
    await addTrack(currentSetId, payload);
  }

  async function handleDeleteTrack(trackId: string) {
    if (!currentSetId) return;
    await deleteTrack(currentSetId, trackId);
    toast.success("트랙이 삭제되었습니다.");
  }

  async function handleMoveTrack(fromIndex: number, toIndex: number) {
    if (!currentSetId) return;
    await reorderTracks(currentSetId, fromIndex, toIndex);
  }

  // 누적 시간 계산
  function getCumulativeSeconds(upToIndex: number): number {
    if (!currentSet) return 0;
    return currentSet.tracks
      .slice(0, upToIndex + 1)
      .reduce((sum, t) => sum + t.durationSeconds, 0);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-100 rounded-xl bg-white shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-gray-800">
                그룹 연습 음악 큐
              </span>
              {stats.totalTracks > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 hover:bg-violet-50">
                  {stats.totalTracks}곡
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {stats.totalDuration > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 mr-1">
                  <Clock className="h-3 w-3" />
                  {formatTotalDuration(stats.totalDuration)}
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            {/* 세트가 없을 때 */}
            {sets.length === 0 ? (
              <div className="text-center py-8">
                <Music className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-xs text-gray-400">아직 음악 세트가 없습니다.</p>
                <p className="text-[10px] text-gray-300 mt-0.5 mb-3">
                  세트를 만들고 트랙을 추가해보세요.
                </p>
                <AddSetDialog onAdd={handleAddSet} />
              </div>
            ) : (
              <>
                {/* 세트 탭 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-600">
                      세트 목록{" "}
                      <span className="font-normal text-gray-400">
                        ({stats.totalSets}개)
                      </span>
                    </p>
                    <AddSetDialog onAdd={handleAddSet} />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sets.map((s) => {
                      const isCurrent = s.id === currentSetId;
                      return (
                        <div
                          key={s.id}
                          className={`group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors cursor-pointer ${
                            isCurrent
                              ? "bg-violet-50 border-violet-200"
                              : "bg-white border-gray-100 hover:border-violet-200"
                          }`}
                          onClick={() => setActiveTab(s.id)}
                        >
                          {/* 활성 표시 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetActive(s.id);
                            }}
                            title={s.isActive ? "활성 세트" : "활성으로 설정"}
                            className="shrink-0"
                          >
                            {s.isActive ? (
                              <CheckCircle2 className="h-3 w-3 text-violet-500" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-300 group-hover:text-violet-300 transition-colors" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p
                              className={`text-xs font-medium truncate ${
                                isCurrent ? "text-violet-700" : "text-gray-700"
                              }`}
                            >
                              {s.setName}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {s.tracks.length}곡 · {formatTotalDuration(s.totalDuration)}
                            </p>
                          </div>

                          {/* 세트 삭제 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSet(s.id);
                            }}
                            className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* 현재 세트 트랙 목록 */}
                {currentSet ? (
                  <div className="space-y-3">
                    {/* 세트 헤더 */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {currentSet.setName}
                          {currentSet.isActive && (
                            <Badge className="ml-1.5 text-[10px] px-1.5 py-0 bg-violet-100 text-violet-600 hover:bg-violet-100">
                              활성
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          총 재생 시간:{" "}
                          <span className="font-medium text-gray-600">
                            {formatTotalDuration(currentSet.totalDuration)}
                          </span>
                        </p>
                      </div>
                      <AddTrackDialog onAdd={handleAddTrack} />
                    </div>

                    {/* 트랙 목록 */}
                    {currentSet.tracks.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                        <Music className="h-7 w-7 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">트랙이 없습니다.</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          트랙 추가 버튼으로 곡을 추가해보세요.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentSet.tracks.map((track, idx) => (
                          <TrackRow
                            key={track.id}
                            track={track}
                            index={idx}
                            cumulativeSeconds={getCumulativeSeconds(idx)}
                            onDelete={() => handleDeleteTrack(track.id)}
                            onMoveUp={() => handleMoveTrack(idx, idx - 1)}
                            onMoveDown={() => handleMoveTrack(idx, idx + 1)}
                            isFirst={idx === 0}
                            isLast={idx === currentSet.tracks.length - 1}
                          />
                        ))}

                        {/* 전체 재생 시간 푸터 */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-100">
                          <Clock className="h-3 w-3 text-violet-400" />
                          <span className="text-xs font-semibold text-violet-600">
                            전체 재생 시간: {formatTotalDuration(currentSet.totalDuration)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
