"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePracticeTimer } from "@/hooks/use-practice-timer";
import type { TimerSegment, TimerStatus } from "@/hooks/use-practice-timer";

// ============================================
// 포맷 유틸
// ============================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================
// 구간 행 컴포넌트
// ============================================

type SegmentRowProps = {
  segment: TimerSegment;
  index: number;
  currentIndex: number;
  status: TimerStatus;
  onRemove: (id: string) => void;
};

function SegmentRow({
  segment,
  index,
  currentIndex,
  status,
  onRemove,
}: SegmentRowProps) {
  const isCurrent = index === currentIndex;
  const isDone = index < currentIndex;
  const isPending = index > currentIndex;

  return (
    <div
      className={[
        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs",
        isCurrent
          ? "bg-primary/10 border border-primary/30 text-foreground font-medium"
          : isDone
          ? "text-muted-foreground"
          : "text-muted-foreground/60",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{segment.icon}</span>
        <span>{segment.label}</span>
        {isCurrent && status === "running" && (
          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 animate-pulse" variant="outline">
            진행 중
          </Badge>
        )}
        {isCurrent && status === "paused" && (
          <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200" variant="outline">
            일시정지
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {(isDone || (isCurrent && status === "finished")) && (
          <span className="font-mono text-xs text-muted-foreground">
            {formatTime(segment.elapsed)}
          </span>
        )}
        {isPending && status === "idle" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground/50 hover:text-destructive"
            onClick={() => onRemove(segment.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// 결과 요약 테이블
// ============================================

type ResultSummaryProps = {
  segments: TimerSegment[];
  totalElapsed: number;
};

function ResultSummary({ segments, totalElapsed }: ResultSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">연습 완료 요약</div>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">구간</th>
              <th className="text-right px-3 py-2 font-medium">경과 시간</th>
              <th className="text-right px-3 py-2 font-medium">비율</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg) => {
              const pct =
                totalElapsed > 0
                  ? Math.round((seg.elapsed / totalElapsed) * 100)
                  : 0;
              return (
                <tr key={seg.id} className="border-b last:border-0">
                  <td className="px-3 py-1.5">
                    <span className="mr-1">{seg.icon}</span>
                    {seg.label}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono">
                    {formatTime(seg.elapsed)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground">
                    {pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30">
              <td className="px-3 py-1.5 font-medium">합계</td>
              <td className="px-3 py-1.5 text-right font-mono font-medium">
                {formatTime(totalElapsed)}
              </td>
              <td className="px-3 py-1.5 text-right text-muted-foreground">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================
// 타이머 내부 콘텐츠
// ============================================

function PracticeTimerContent() {
  const {
    segments,
    currentIndex,
    status,
    totalElapsed,
    start,
    pause,
    resume,
    nextSegment,
    reset,
    addSegment,
    removeSegment,
  } = usePracticeTimer();

  const [newSegmentLabel, setNewSegmentLabel] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const currentSegment = segments[currentIndex];
  const isFinished = status === "finished";
  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";

  const handleAddSegment = () => {
    if (!newSegmentLabel.trim()) return;
    addSegment(newSegmentLabel);
    setNewSegmentLabel("");
    setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 현재 구간 + 타이머 디스플레이 */}
      {!isFinished ? (
        <div className="flex flex-col items-center gap-1.5 py-4 rounded-lg bg-muted/30">
          {currentSegment && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-lg">{currentSegment.icon}</span>
              <span>{isIdle ? "시작 준비" : currentSegment.label}</span>
            </div>
          )}
          <div
            className={[
              "font-mono text-5xl font-bold tabular-nums tracking-tight",
              isRunning ? "text-foreground" : "text-muted-foreground",
            ].join(" ")}
          >
            {currentSegment ? formatTime(currentSegment.elapsed) : "00:00"}
          </div>
          <div className="text-xs text-muted-foreground">
            전체{" "}
            <span className="font-mono font-medium">
              {formatTime(totalElapsed)}
            </span>
          </div>
        </div>
      ) : (
        // 완료 상태
        <div className="flex flex-col items-center gap-1.5 py-4 rounded-lg bg-green-50 dark:bg-green-950/20">
          <span className="text-2xl">🎉</span>
          <div className="text-sm font-medium text-green-700 dark:text-green-400">
            연습 완료!
          </div>
          <div className="font-mono text-3xl font-bold text-green-700 dark:text-green-400">
            {formatTime(totalElapsed)}
          </div>
        </div>
      )}

      {/* 구간 목록 */}
      <div className="space-y-1">
        {segments.map((seg, idx) => (
          <SegmentRow
            key={seg.id}
            segment={seg}
            index={idx}
            currentIndex={currentIndex}
            status={status}
            onRemove={removeSegment}
          />
        ))}
      </div>

      {/* 구간 추가 (idle 상태에서만) */}
      {isIdle && (
        <div>
          {addOpen ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={newSegmentLabel}
                onChange={(e) => setNewSegmentLabel(e.target.value)}
                placeholder="구간 이름 입력"
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSegment();
                  if (e.key === "Escape") {
                    setAddOpen(false);
                    setNewSegmentLabel("");
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleAddSegment}
                disabled={!newSegmentLabel.trim()}
              >
                추가
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => {
                  setAddOpen(false);
                  setNewSegmentLabel("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full gap-1"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3 w-3" />
              구간 추가
            </Button>
          )}
        </div>
      )}

      {/* 컨트롤 버튼 */}
      {!isFinished ? (
        <div className="flex gap-1.5">
          {isIdle && (
            <Button
              className="flex-1 h-8 text-xs gap-1"
              onClick={start}
            >
              <Play className="h-3.5 w-3.5" />
              시작
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs gap-1"
              onClick={pause}
            >
              <Pause className="h-3.5 w-3.5" />
              일시정지
            </Button>
          )}
          {isPaused && (
            <Button
              className="flex-1 h-8 text-xs gap-1"
              onClick={resume}
            >
              <Play className="h-3.5 w-3.5" />
              재개
            </Button>
          )}
          {(isRunning || isPaused) && (
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs gap-1"
              onClick={nextSegment}
            >
              <SkipForward className="h-3.5 w-3.5" />
              {currentIndex >= segments.length - 1 ? "완료" : "다음 구간"}
            </Button>
          )}
          {!isIdle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <ResultSummary segments={segments} totalElapsed={totalElapsed} />
          <Button
            variant="outline"
            className="w-full h-8 text-xs gap-1"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            다시 시작
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 외부 노출 컴포넌트 (Dialog 트리거 포함)
// ============================================

export function PracticeTimer() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Timer className="h-3 w-3" />
          연습 타이머
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4" />
            연습 구간 타이머
          </DialogTitle>
        </DialogHeader>
        <PracticeTimerContent />
      </DialogContent>
    </Dialog>
  );
}
