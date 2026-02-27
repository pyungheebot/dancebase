"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useProjectSongs } from "@/hooks/use-project-songs";
import type { EntityContext } from "@/types/entity-context";
import type { ProjectSong } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Music,
  Play,
  CheckCircle,
  Youtube,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Circle,
} from "lucide-react";

interface SongTrackerSectionProps {
  ctx: EntityContext;
}

// ============================================
// 상태 설정
// ============================================

const STATUS_CONFIG: Record<
  ProjectSong["status"],
  {
    label: string;
    badgeClass: string;
    icon: React.ReactNode;
    sectionBadgeClass: string;
  }
> = {
  not_started: {
    label: "미시작",
    badgeClass:
      "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer border-gray-200",
    icon: <Circle className="h-3 w-3" />,
    sectionBadgeClass: "bg-gray-100 text-gray-700",
  },
  in_progress: {
    label: "연습중",
    badgeClass:
      "bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer border-blue-200",
    icon: <Play className="h-3 w-3" />,
    sectionBadgeClass: "bg-blue-100 text-blue-700",
  },
  mastered: {
    label: "완료",
    badgeClass:
      "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
    sectionBadgeClass: "bg-green-100 text-green-700",
  },
};

// ============================================
// 섹션 헤더 (접이식)
// ============================================

interface SectionHeaderProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  badgeClass?: string;
}

function SectionHeader({
  label,
  count,
  isOpen,
  onToggle,
  badgeClass,
}: SectionHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 w-full text-left py-1 hover:bg-muted/20 rounded px-1"
    >
      {isOpen ? (
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
      <span className="text-xs font-medium">{label}</span>
      {count > 0 && (
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 ml-0.5 ${badgeClass ?? ""}`}
        >
          {count}
        </Badge>
      )}
    </button>
  );
}

// ============================================
// 곡 항목 컴포넌트
// ============================================

interface SongItemProps {
  song: ProjectSong;
  onCycleStatus: (song: ProjectSong) => void;
  onDelete: (songId: string) => void;
  canDelete: boolean;
}

function SongItem({ song, onCycleStatus, onDelete, canDelete }: SongItemProps) {
  const config = STATUS_CONFIG[song.status];

  return (
    <div className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/30 group">
      {/* 상태 뱃지 (클릭 시 순환) */}
      <button
        type="button"
        onClick={() => onCycleStatus(song)}
        title="클릭하여 상태 변경"
        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium transition-colors shrink-0 ${config.badgeClass}`}
      >
        {config.icon}
        {config.label}
      </button>

      {/* 곡 제목 */}
      <span
        className={`text-xs font-medium min-w-0 truncate ${
          song.status === "mastered"
            ? "line-through text-muted-foreground"
            : "text-foreground"
        }`}
      >
        {song.title}
      </span>

      {/* 아티스트 */}
      {song.artist && (
        <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[80px]">
          {song.artist}
        </span>
      )}

      {/* 여백 */}
      <span className="flex-1" />

      {/* YouTube 링크 */}
      {song.youtube_url && (
        <a
          href={song.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-red-500 hover:text-red-600 transition-colors"
          title="YouTube에서 보기"
          onClick={(e) => e.stopPropagation()}
        >
          <Youtube className="h-3.5 w-3.5" />
        </a>
      )}

      {/* 삭제 버튼 */}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={() => onDelete(song.id)}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}

// ============================================
// 인라인 추가 폼
// ============================================

interface InlineAddFormProps {
  onAdd: (payload: {
    title: string;
    artist?: string;
    youtube_url?: string;
  }) => Promise<boolean>;
}

function InlineAddForm({ onAdd }: InlineAddFormProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setAdding(true);
    const ok = await onAdd({
      title: trimmedTitle,
      artist: artist.trim() || undefined,
      youtube_url: youtubeUrl.trim() || undefined,
    });
    if (ok) {
      setTitle("");
      setArtist("");
      setYoutubeUrl("");
      setExpanded(false);
      titleRef.current?.focus();
    }
    setAdding(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setExpanded(false);
    }
  }

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex items-center gap-1.5">
        <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value && !expanded) setExpanded(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (title) setExpanded(true);
          }}
          placeholder="곡 제목 추가 (Enter)"
          className="h-7 text-xs flex-1 border-dashed"
          disabled={adding}
        />
        {adding && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {/* 확장 필드: 아티스트 + YouTube URL */}
      {expanded && (
        <div className="pl-4 space-y-1">
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="아티스트 (선택)"
            className="h-7 text-xs border-dashed"
            disabled={adding}
          />
          <div className="flex items-center gap-1.5">
            <Input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube URL (선택)"
              className="h-7 text-xs flex-1 border-dashed"
              disabled={adding}
            />
            <Button
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleAdd}
              disabled={adding || !title.trim()}
            >
              추가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 트래커 컴포넌트
// ============================================

export function SongTrackerSection({ ctx }: SongTrackerSectionProps) {
  const {
    notStartedSongs,
    inProgressSongs,
    masteredSongs,
    loading,
    totalCount,
    masteredCount,
    completionRate,
    addSong,
    cycleSongStatus,
    deleteSong,
  } = useProjectSongs(ctx.projectId ?? "");

  const [notStartedOpen, setNotStartedOpen] = useState(true);
  const [inProgressOpen, setInProgressOpen] = useState(true);
  const [masteredOpen, setMasteredOpen] = useState(false);

  const canManage =
    ctx.permissions.canEdit || ctx.permissions.canManageMembers;

  // projectId가 없으면 렌더 안 함
  if (!ctx.projectId) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="px-3 py-2.5 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Music className="h-3.5 w-3.5 text-muted-foreground" />
          곡/안무 트래커
          {totalCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 ml-1"
            >
              {masteredCount}/{totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-3 py-3">
        {/* 진행률 프로그레스 바 */}
        {totalCount > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">완료율</span>
              <span className="text-[10px] font-medium text-foreground">
                {completionRate}%
              </span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Music className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">등록된 곡이 없습니다</p>
            {canManage && (
              <p className="text-[10px] mt-0.5">아래에서 첫 곡을 추가하세요</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 미시작 섹션 */}
            <div>
              <SectionHeader
                label="미시작"
                count={notStartedSongs.length}
                isOpen={notStartedOpen}
                onToggle={() => setNotStartedOpen((v) => !v)}
                badgeClass={STATUS_CONFIG.not_started.sectionBadgeClass}
              />
              {notStartedOpen && notStartedSongs.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {notStartedSongs.map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      onCycleStatus={cycleSongStatus}
                      onDelete={deleteSong}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 연습중 섹션 */}
            <div>
              <SectionHeader
                label="연습 중"
                count={inProgressSongs.length}
                isOpen={inProgressOpen}
                onToggle={() => setInProgressOpen((v) => !v)}
                badgeClass={STATUS_CONFIG.in_progress.sectionBadgeClass}
              />
              {inProgressOpen && inProgressSongs.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {inProgressSongs.map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      onCycleStatus={cycleSongStatus}
                      onDelete={deleteSong}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 완료 섹션 */}
            <div>
              <SectionHeader
                label="완료"
                count={masteredSongs.length}
                isOpen={masteredOpen}
                onToggle={() => setMasteredOpen((v) => !v)}
                badgeClass={STATUS_CONFIG.mastered.sectionBadgeClass}
              />
              {masteredOpen && masteredSongs.length > 0 && (
                <div className="mt-0.5 ml-1">
                  {masteredSongs.map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      onCycleStatus={cycleSongStatus}
                      onDelete={deleteSong}
                      canDelete={canManage}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 인라인 추가 폼 (리더/매니저만) */}
        {canManage && (
          <div className="mt-3 pt-2 border-t">
            <InlineAddForm onAdd={addSong} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
