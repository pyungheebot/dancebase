"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ============================================
// 타입 정의
// ============================================

export type TimerSegment = {
  id: string;
  label: string;
  icon: string;
  elapsed: number; // 초 단위
};

export type TimerStatus = "idle" | "running" | "paused" | "finished";

type UsePracticeTimerReturn = {
  segments: TimerSegment[];
  currentIndex: number;
  status: TimerStatus;
  totalElapsed: number;
  // 액션
  start: () => void;
  pause: () => void;
  resume: () => void;
  nextSegment: () => void;
  reset: () => void;
  addSegment: (label: string) => void;
  removeSegment: (id: string) => void;
};

// ============================================
// 기본 구간
// ============================================

const DEFAULT_SEGMENTS: Omit<TimerSegment, "elapsed">[] = [
  { id: "warmup", label: "워밍업", icon: "⚡" },
  { id: "choreo", label: "안무 연습", icon: "💃" },
  { id: "runthrough", label: "런스루", icon: "🎭" },
  { id: "cooldown", label: "쿨다운", icon: "🧘" },
];

function createDefaultSegments(): TimerSegment[] {
  return DEFAULT_SEGMENTS.map((s) => ({ ...s, elapsed: 0 }));
}

// ============================================
// 훅
// ============================================

export function usePracticeTimer(): UsePracticeTimerReturn {
  const [segments, setSegments] = useState<TimerSegment[]>(
    createDefaultSegments
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [totalElapsed, setTotalElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0); // 현재 구간 시작 시각 (Date.now())
  const accumulatedRef = useRef<number>(0); // 현재 구간 일시정지까지 누적 시간 (초)

  // 타이머 정리
  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 전체 경과 시간 업데이트 (현재 구간 포함)
  const updateTotalElapsed = useCallback(
    (currentSegmentElapsed: number, idx: number, segs: TimerSegment[]) => {
      const pastTotal = segs
        .slice(0, idx)
        .reduce((sum, s) => sum + s.elapsed, 0);
      setTotalElapsed(pastTotal + currentSegmentElapsed);
    },
    []
  );

  // 1초마다 현재 구간 elapsed 업데이트
  const startInterval = useCallback(
    (segIdx: number, segs: TimerSegment[]) => {
      clearTimer();
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const delta = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );
        const newElapsed = accumulatedRef.current + delta;

        setSegments((prev) => {
          const next = prev.map((s, i) =>
            i === segIdx ? { ...s, elapsed: newElapsed } : s
          );
          return next;
        });
        updateTotalElapsed(newElapsed, segIdx, segs);
      }, 1000);
    },
    [clearTimer, updateTotalElapsed]
  );

  // 시작
  const start = useCallback(() => {
    if (status !== "idle") return;
    accumulatedRef.current = 0;
    setStatus("running");
    setSegments((prev) => {
      startInterval(0, prev);
      return prev;
    });
  }, [status, startInterval]);

  // 일시정지
  const pause = useCallback(() => {
    if (status !== "running") return;
    clearTimer();
    // 현재까지 경과 시간 저장
    const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
    accumulatedRef.current = accumulatedRef.current + delta;
    setStatus("paused");
  }, [status, clearTimer]);

  // 재개
  const resume = useCallback(() => {
    if (status !== "paused") return;
    setStatus("running");
    setSegments((prev) => {
      startInterval(currentIndex, prev);
      return prev;
    });
  }, [status, currentIndex, startInterval]);

  // 다음 구간
  const nextSegment = useCallback(() => {
    if (status === "idle" || status === "finished") return;

    clearTimer();

    // 현재 구간 최종 경과 저장
    const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const finalElapsed =
      status === "paused"
        ? accumulatedRef.current
        : accumulatedRef.current + delta;

    setSegments((prev) => {
      const nextSegs = prev.map((s, i) =>
        i === currentIndex ? { ...s, elapsed: finalElapsed } : s
      );

      const nextIdx = currentIndex + 1;
      if (nextIdx >= nextSegs.length) {
        // 모든 구간 완료
        const total = nextSegs.reduce((sum, s) => sum + s.elapsed, 0);
        setTotalElapsed(total);
        setCurrentIndex(nextIdx);
        setStatus("finished");
      } else {
        // 다음 구간 시작
        accumulatedRef.current = 0;
        setCurrentIndex(nextIdx);
        setStatus("running");
        startInterval(nextIdx, nextSegs);
      }

      return nextSegs;
    });
  }, [status, currentIndex, clearTimer, startInterval]);

  // 리셋
  const reset = useCallback(() => {
    clearTimer();
    accumulatedRef.current = 0;
    setSegments(createDefaultSegments());
    setCurrentIndex(0);
    setStatus("idle");
    setTotalElapsed(0);
  }, [clearTimer]);

  // 구간 추가
  const addSegment = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const newSeg: TimerSegment = {
      id: `custom-${Date.now()}`,
      label: trimmed,
      icon: "🎵",
      elapsed: 0,
    };
    setSegments((prev) => [...prev, newSeg]);
  }, []);

  // 구간 삭제 (아직 시작 전이거나 완료된 구간만 삭제 허용)
  const removeSegment = useCallback(
    (id: string) => {
      setSegments((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        // 현재 진행 중인 구간 삭제 불가
        if (idx === currentIndex && status === "running") return prev;
        return prev.filter((s) => s.id !== id);
      });
    },
    [currentIndex, status]
  );

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
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
  };
}
