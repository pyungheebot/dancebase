"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRunthroughSession } from "@/hooks/use-runthrough-session";
import type { RunthroughSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  StickyNote,
  Clock,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ============================================
// 유틸 함수
// ============================================

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function calcTotalSeconds(startedAt: string, endedAt: string | null): number {
  if (!endedAt) return 0;
  return Math.floor(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
}

// ============================================
// 과거 세션 상세 패널
// ============================================

interface SessionDetailProps {
  session: RunthroughSession;
  songTitles: Record<string, string>;
  onClose: () => void;
}

function SessionDetail({ session, songTitles, onClose }: SessionDetailProps) {
  const totalSec = calcTotalSeconds(session.startedAt, session.endedAt);

  // 곡별로 메모 그룹화
  const notesBySong: Record<string, { title: string; notes: typeof session.notes }> = {};
  for (const songId of session.songOrder) {
    notesBySong[songId] = {
      title: songTitles[songId] ?? songId,
      notes: session.notes.filter((n) => n.songId === songId),
    };
  }
  // songOrder에 없는 songId도 포함
  for (const note of session.notes) {
    if (!notesBySong[note.songId]) {
      notesBySong[note.songId] = {
        title: note.songTitle,
        notes: [],
      };
    }
    if (!notesBySong[note.songId].notes.includes(note)) {
      notesBySong[note.songId].notes.push(note);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDate(session.startedAt)}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            총 {formatSeconds(totalSec)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            메모 {session.notes.length}개
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={onClose}
        >
          목록
        </Button>
      </div>

      {session.notes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          메모가 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {Object.entries(notesBySong).map(([songId, { title, notes }]) => {
            if (notes.length === 0) return null;
            return (
              <div key={songId} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{title}</span>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0"
                  >
                    {notes.length}
                  </Badge>
                </div>
                <div className="pl-2 space-y-0.5">
                  {notes.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                        [{formatSeconds(note.timestamp)}]
                      </span>
                      <span className="text-xs">{note.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// 과거 세션 탭
// ============================================

interface PastSessionsTabProps {
  sessions: RunthroughSession[];
  songTitles: Record<string, string>;
  onDelete: (sessionId: string) => void;
}

function PastSessionsTab({
  sessions,
  songTitles,
  onDelete,
}: PastSessionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-xs">이전 런스루 기록이 없습니다.</p>
      </div>
    );
  }

  if (expandedId) {
    const session = sessions.find((s) => s.id === expandedId);
    if (session) {
      return (
        <SessionDetail
          session={session}
          songTitles={songTitles}
          onClose={() => setExpandedId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => {
        const totalSec = calcTotalSeconds(session.startedAt, session.endedAt);
        return (
          <div
            key={session.id}
            className="flex items-center gap-2 py-2 px-2 rounded hover:bg-muted/40 cursor-pointer group"
            onClick={() => setExpandedId(session.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">
                  {formatDate(session.startedAt)}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {formatSeconds(totalSec)}
                </Badge>
                {session.notes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700"
                  >
                    <StickyNote className="h-2.5 w-2.5 mr-0.5" />
                    {session.notes.length}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                곡 {session.songOrder.length}개
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 런스루 결과 화면
// ============================================

interface ResultViewProps {
  session: RunthroughSession;
  songTitles: Record<string, string>;
  onClose: () => void;
}

function ResultView({ session, songTitles, onClose }: ResultViewProps) {
  const totalSec = calcTotalSeconds(session.startedAt, session.endedAt);

  const notesBySong = session.songOrder.map((songId) => ({
    songId,
    title: songTitles[songId] ?? songId,
    notes: session.notes.filter((n) => n.songId === songId),
  }));

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">런스루 완료</p>
        <p className="text-2xl font-mono font-bold">{formatSeconds(totalSec)}</p>
        <p className="text-xs text-muted-foreground">
          총 {session.notes.length}개 메모 기록
        </p>
      </div>

      <div className="border rounded-lg divide-y">
        {notesBySong.map(({ songId, title, notes }, idx) => (
          <div key={songId} className="px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] text-muted-foreground">
                {idx + 1}.
              </span>
              <span className="text-xs font-medium">{title}</span>
              {notes.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 ml-auto bg-orange-100 text-orange-700"
                >
                  {notes.length}개
                </Badge>
              )}
            </div>
            {notes.length > 0 && (
              <div className="pl-3 space-y-0.5">
                {notes.map((note, ni) => (
                  <div key={ni} className="flex items-start gap-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                      [{formatSeconds(note.timestamp)}]
                    </span>
                    <span className="text-xs">{note.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button className="w-full h-8 text-xs" onClick={onClose}>
        닫기
      </Button>
    </div>
  );
}

// ============================================
// 메인 다이얼로그 컴포넌트
// ============================================

interface RunthroughModeDialogProps {
  projectId: string;
  songs: Array<{ id: string; title: string }>;
}

export function RunthroughModeDialog({
  projectId,
  songs,
}: RunthroughModeDialogProps) {
  const {
    sessions,
    currentSession,
    startSession,
    endSession,
    addNote,
    deleteSession,
  } = useRunthroughSession(projectId);

  const [open, setOpen] = useState(false);

  // 런스루 진행 상태
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // 현재 곡 경과 초
  const [isPaused, setIsPaused] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 결과 화면용 완료 세션
  const [completedSession, setCompletedSession] =
    useState<RunthroughSession | null>(null);

  // 현재 진행 중 여부
  const isRunning = currentSession !== null && completedSession === null;

  // songTitles 맵
  const songTitles: Record<string, string> = {};
  for (const s of songs) {
    songTitles[s.id] = s.title;
  }

  // 타이머
  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused]);

  // 다이얼로그 닫을 때 상태 초기화
  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v && completedSession) {
      setCompletedSession(null);
    }
  }

  // 런스루 시작
  function handleStart() {
    startSession(songs);
    setCurrentSongIndex(0);
    setElapsed(0);
    setIsPaused(false);
    setCompletedSession(null);
  }

  // 다음 곡
  function handleNext() {
    if (!currentSession) return;
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex((i) => i + 1);
      setElapsed(0);
    }
  }

  // 이전 곡
  function handlePrev() {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((i) => i - 1);
      setElapsed(0);
    }
  }

  // 일시정지/재개
  function handlePauseResume() {
    setIsPaused((v) => !v);
  }

  // 종료
  function handleEnd() {
    if (!currentSession) return;
    endSession();
    // 최신 세션을 completedSession으로 설정 (endSession 직후 sessions에 반영 전이므로 직접 구성)
    const ended = {
      ...currentSession,
      endedAt: new Date().toISOString(),
    };
    setCompletedSession(ended);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // 메모 추가
  function handleAddNote() {
    const trimmed = noteInput.trim();
    if (!trimmed || !currentSession) return;
    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;
    addNote(currentSong.id, currentSong.title, elapsed, trimmed);
    setNoteInput("");
  }

  // 결과 화면 닫기 (탭으로 이동)
  function handleResultClose() {
    setCompletedSession(null);
  }

  const currentSong = songs[currentSongIndex];
  const progressPercent =
    songs.length > 0
      ? Math.round(((currentSongIndex + 1) / songs.length) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
        >
          <Play className="h-3 w-3" />
          런스루
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Play className="h-4 w-4 text-muted-foreground" />
            공연 런스루 모드
          </DialogTitle>
        </DialogHeader>

        {/* 결과 화면 */}
        {completedSession && (
          <ResultView
            session={completedSession}
            songTitles={songTitles}
            onClose={handleResultClose}
          />
        )}

        {/* 런스루 진행 화면 */}
        {isRunning && !completedSession && currentSong && (
          <div className="space-y-4">
            {/* 진행바 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  진행률
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {currentSongIndex + 1}/{songs.length}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 현재 곡 */}
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground">
                {currentSongIndex + 1} / {songs.length}
              </p>
              <h2 className="text-xl font-bold leading-tight line-clamp-2">
                {currentSong.title}
              </h2>
            </div>

            {/* 타이머 */}
            <div className="text-center">
              <span
                className={`text-3xl font-mono font-bold ${
                  isPaused ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {formatSeconds(elapsed)}
              </span>
              {isPaused && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  일시정지됨
                </p>
              )}
            </div>

            {/* 컨트롤 */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePrev}
                disabled={currentSongIndex === 0}
                title="이전 곡"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePauseResume}
                title={isPaused ? "재개" : "일시정지"}
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleEnd}
                title="종료"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleNext}
                disabled={currentSongIndex === songs.length - 1}
                title="다음 곡"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* 메모 입력 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <StickyNote className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  메모 ({formatSeconds(elapsed)} 기준)
                </span>
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="수정 메모 입력 (Enter)"
                  className="h-8 text-xs flex-1"
                />
                <Button
                  size="sm"
                  className="h-8 text-xs px-3 shrink-0"
                  onClick={handleAddNote}
                  disabled={!noteInput.trim()}
                >
                  메모 추가
                </Button>
              </div>
            </div>

            {/* 현재 곡 메모 미리보기 */}
            {currentSession &&
              currentSession.notes.filter(
                (n) => n.songId === currentSong.id
              ).length > 0 && (
                <div className="bg-muted/30 rounded p-2 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    이 곡 메모
                  </p>
                  {currentSession.notes
                    .filter((n) => n.songId === currentSong.id)
                    .map((note, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                          [{formatSeconds(note.timestamp)}]
                        </span>
                        <span className="text-xs">{note.content}</span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}

        {/* 런스루 미시작 화면 (Tabs) */}
        {!isRunning && !completedSession && (
          <Tabs defaultValue="start">
            <TabsList className="w-full h-8">
              <TabsTrigger value="start" className="flex-1 text-xs h-7">
                런스루 시작
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-xs h-7">
                과거 기록
                {sessions.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 text-[10px] px-1 py-0"
                  >
                    {sessions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="start" className="mt-3 space-y-3">
              {/* 곡 순서 미리보기 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2">
                  총 {songs.length}곡을 순서대로 진행합니다.
                </p>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {songs.map((song, idx) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-2 px-3 py-1.5"
                    >
                      <span className="text-[10px] text-muted-foreground w-4 shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-xs">{song.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-9 text-sm gap-2"
                onClick={handleStart}
              >
                <Play className="h-4 w-4" />
                런스루 시작
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              <PastSessionsTab
                sessions={sessions}
                songTitles={songTitles}
                onDelete={deleteSession}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
