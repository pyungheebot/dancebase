"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SessionTimerPreset, SessionTimerSegment } from "@/types";

// ============================================
// 상수
// ============================================

export const MAX_PRESETS = 5;
export const MAX_SEGMENTS = 10;

// 기본 색상 팔레트
export const SEGMENT_COLORS = [
  "#f97316", // orange
  "#3b82f6", // blue
  "#a855f7", // purple
  "#22c55e", // green
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ef4444", // red
  "#14b8a6", // teal
  "#8b5cf6", // violet
];

// 기본 프리셋
const DEFAULT_PRESET: SessionTimerPreset = {
  id: "default",
  title: "기본 2시간 연습",
  segments: [
    { id: "s1", label: "워밍업", durationMinutes: 15, color: "#f97316" },
    { id: "s2", label: "기본기", durationMinutes: 30, color: "#3b82f6" },
    { id: "s3", label: "안무 연습", durationMinutes: 60, color: "#a855f7" },
    { id: "s4", label: "정리", durationMinutes: 15, color: "#22c55e" },
  ],
  totalMinutes: 120,
  createdAt: new Date().toISOString(),
};

// ============================================
// 타이머 실행 상태 타입
// ============================================

export type SessionTimerStatus = "idle" | "running" | "paused" | "finished";

// ============================================
// localStorage 유틸
// ============================================

function loadPresets(groupId: string): SessionTimerPreset[] {
  if (typeof window === "undefined") return [DEFAULT_PRESET];
  try {
    const raw = localStorage.getItem(`dancebase:session-timer:${groupId}`);
    if (!raw) return [DEFAULT_PRESET];
    const parsed = JSON.parse(raw) as SessionTimerPreset[];
    return parsed.length > 0 ? parsed : [DEFAULT_PRESET];
  } catch {
    return [DEFAULT_PRESET];
  }
}

function savePresets(groupId: string, presets: SessionTimerPreset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `dancebase:session-timer:${groupId}`,
    JSON.stringify(presets)
  );
}

function calcTotal(segments: SessionTimerSegment[]): number {
  return segments.reduce((sum, s) => sum + s.durationMinutes, 0);
}

// ============================================
// 훅
// ============================================

export function useSessionTimer(groupId: string) {
  const [presets, setPresets] = useState<SessionTimerPreset[]>(() =>
    loadPresets(groupId)
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    () => loadPresets(groupId)[0]?.id ?? DEFAULT_PRESET.id
  );

  // 타이머 핵심 상태
  const [status, setStatus] = useState<SessionTimerStatus>("idle");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 현재 선택된 프리셋 (최신 presets 참조)
  const selectedPreset =
    presets.find((p) => p.id === selectedPresetId) ?? presets[0];

  // localStorage 동기화
  useEffect(() => {
    savePresets(groupId, presets);
  }, [groupId, presets]);

  // 인터벌 정리
  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 깜빡임 효과
  const triggerFlash = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setIsFlashing(true);
    flashTimerRef.current = setTimeout(() => setIsFlashing(false), 1500);
  }, []);

  // 1초 tick 처리 - useEffect로 status 변화 감지
  useEffect(() => {
    if (status !== "running") {
      clearTimerInterval();
      return;
    }

    clearTimerInterval();
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // 구간 완료 처리 (다음 틱에서 index 이동)
          return 0;
        }
        return prev - 1;
      });
      setElapsedTotal((prev) => prev + 1);
    }, 1000);

    return () => clearTimerInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // remainingSeconds === 0 && running 일 때 구간 전환 처리
  useEffect(() => {
    if (status !== "running" || remainingSeconds !== 0) return;

    // 구간 전환
    setCurrentSegmentIndex((prevIdx) => {
      const preset = presets.find((p) => p.id === selectedPresetId) ?? presets[0];
      if (!preset) return prevIdx;

      const nextIdx = prevIdx + 1;

      if (nextIdx >= preset.segments.length) {
        // 전체 완료
        clearTimerInterval();
        setStatus("finished");
        setElapsedTotal(totalSeconds);
        return prevIdx;
      }

      // 다음 구간으로 전환
      const nextSeg = preset.segments[nextIdx];
      setRemainingSeconds(nextSeg.durationMinutes * 60);
      triggerFlash();
      return nextIdx;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, status]);

  // ============================================
  // 타이머 제어
  // ============================================

  const startTimer = useCallback(() => {
    if (!selectedPreset || selectedPreset.segments.length === 0) return;
    const totalSec = selectedPreset.totalMinutes * 60;
    const firstSeg = selectedPreset.segments[0];

    setCurrentSegmentIndex(0);
    setRemainingSeconds(firstSeg.durationMinutes * 60);
    setElapsedTotal(0);
    setTotalSeconds(totalSec);
    setIsFlashing(false);
    setStatus("running");
  }, [selectedPreset]);

  const pauseTimer = useCallback(() => {
    if (status !== "running") return;
    setStatus("paused");
  }, [status]);

  const resumeTimer = useCallback(() => {
    if (status !== "paused") return;
    setStatus("running");
  }, [status]);

  const skipSegment = useCallback(() => {
    if (status === "idle" || status === "finished") return;
    const preset = presets.find((p) => p.id === selectedPresetId) ?? presets[0];
    if (!preset) return;

    const nextIdx = currentSegmentIndex + 1;

    if (nextIdx >= preset.segments.length) {
      clearTimerInterval();
      setStatus("finished");
      setRemainingSeconds(0);
      setElapsedTotal(totalSeconds);
      return;
    }

    const nextSeg = preset.segments[nextIdx];
    triggerFlash();
    setCurrentSegmentIndex(nextIdx);
    setRemainingSeconds(nextSeg.durationMinutes * 60);
  }, [
    status,
    presets,
    selectedPresetId,
    currentSegmentIndex,
    totalSeconds,
    clearTimerInterval,
    triggerFlash,
  ]);

  const resetTimer = useCallback(() => {
    clearTimerInterval();
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setStatus("idle");
    setCurrentSegmentIndex(0);
    setRemainingSeconds(0);
    setElapsedTotal(0);
    setTotalSeconds(0);
    setIsFlashing(false);
  }, [clearTimerInterval]);

  // ============================================
  // 프리셋 관리
  // ============================================

  const addPreset = useCallback(
    (title: string, segments: SessionTimerSegment[]): boolean => {
      if (presets.length >= MAX_PRESETS) return false;
      const newPreset: SessionTimerPreset = {
        id: `preset-${Date.now()}`,
        title: title.trim() || "새 프리셋",
        segments,
        totalMinutes: calcTotal(segments),
        createdAt: new Date().toISOString(),
      };
      setPresets((prev) => [...prev, newPreset]);
      setSelectedPresetId(newPreset.id);
      return true;
    },
    [presets.length]
  );

  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => {
        if (prev.length <= 1) return prev; // 마지막 프리셋 삭제 불가
        const next = prev.filter((p) => p.id !== id);
        return next;
      });
      setSelectedPresetId((prev) => {
        if (prev !== id) return prev;
        const remaining = presets.filter((p) => p.id !== id);
        return remaining[0]?.id ?? presets[0].id;
      });
    },
    [presets]
  );

  const addSegment = useCallback(
    (presetId: string, segment: Omit<SessionTimerSegment, "id">) => {
      setPresets((prev) =>
        prev.map((p) => {
          if (p.id !== presetId) return p;
          if (p.segments.length >= MAX_SEGMENTS) return p;
          const newSeg: SessionTimerSegment = {
            ...segment,
            id: `seg-${Date.now()}`,
          };
          const updated = [...p.segments, newSeg];
          return { ...p, segments: updated, totalMinutes: calcTotal(updated) };
        })
      );
    },
    []
  );

  const removeSegment = useCallback(
    (presetId: string, segmentId: string) => {
      setPresets((prev) =>
        prev.map((p) => {
          if (p.id !== presetId) return p;
          const updated = p.segments.filter((s) => s.id !== segmentId);
          return { ...p, segments: updated, totalMinutes: calcTotal(updated) };
        })
      );
    },
    []
  );

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearTimerInterval();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [clearTimerInterval]);

  return {
    // 프리셋 데이터
    presets,
    selectedPresetId,
    selectedPreset,
    setSelectedPresetId,
    // 프리셋 관리
    addPreset,
    deletePreset,
    addSegment,
    removeSegment,
    // 타이머 실행 상태
    status,
    currentSegmentIndex,
    remainingSeconds,
    elapsedTotal,
    totalSeconds,
    isFlashing,
    // 타이머 제어
    startTimer,
    pauseTimer,
    resumeTimer,
    skipSegment,
    resetTimer,
  };
}
