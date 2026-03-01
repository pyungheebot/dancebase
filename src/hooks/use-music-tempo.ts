"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MusicTempoEntry, TempoCategory, TempoSection } from "@/types";

// ============================================
// 상수
// ============================================

export const BPM_MIN = 40;
export const BPM_MAX = 240;
export const MAX_ENTRIES = 30;

/** BPM 범위에 따른 카테고리 자동 분류 */
export function classifyTempo(bpm: number): TempoCategory {
  if (bpm <= 70) return "very_slow";
  if (bpm <= 100) return "slow";
  if (bpm <= 130) return "moderate";
  if (bpm <= 170) return "fast";
  return "very_fast";
}

export const TEMPO_CATEGORY_LABELS: Record<TempoCategory, string> = {
  very_slow: "매우 느림",
  slow: "느림",
  moderate: "보통",
  fast: "빠름",
  very_fast: "매우 빠름",
};

export const TEMPO_CATEGORY_BPM_RANGE: Record<TempoCategory, string> = {
  very_slow: "40-70 BPM",
  slow: "71-100 BPM",
  moderate: "101-130 BPM",
  fast: "131-170 BPM",
  very_fast: "171-240 BPM",
};

export const TEMPO_CATEGORY_COLOR: Record<TempoCategory, string> = {
  very_slow: "bg-blue-100 text-blue-700 border-blue-200",
  slow: "bg-cyan-100 text-cyan-700 border-cyan-200",
  moderate: "bg-green-100 text-green-700 border-green-200",
  fast: "bg-orange-100 text-orange-700 border-orange-200",
  very_fast: "bg-red-100 text-red-700 border-red-200",
};

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:music-tempo:${groupId}:${projectId}`;
}

function loadEntries(groupId: string, projectId: string): MusicTempoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as MusicTempoEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: MusicTempoEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(groupId, projectId),
      JSON.stringify(entries)
    );
  } catch {
    // 무시
  }
}

// ============================================
// 탭 BPM 계산
// ============================================

/** 연속 탭 간격 배열로 BPM 계산 */
export function calcBpmFromTaps(tapTimestamps: number[]): number | null {
  if (tapTimestamps.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < tapTimestamps.length; i++) {
    intervals.push(tapTimestamps[i] - tapTimestamps[i - 1]);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avgInterval);
  return Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));
}

// ============================================
// 훅
// ============================================

export function useMusicTempo(groupId: string, projectId: string) {
  const [entries, setEntries] = useState<MusicTempoEntry[]>(() => {
    if (!groupId || !projectId) return [];
    const data = loadEntries(groupId, projectId);
    data.sort((a, b) => a.bpm - b.bpm);
    return data;
  });

  // 메트로놈 상태
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [metronomeBeat, setMetronomeBeat] = useState(false); // 깜빡임용 토글
  const [soundEnabled, setSoundEnabled] = useState(true);
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatCountRef = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);

  // 탭 BPM 상태
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [tappedBpm, setTappedBpm] = useState<number | null>(null);
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 배속 슬라이더 (0.5x ~ 2.0x)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  // soundEnabled를 ref로 동기화 (playClick의 의존성에서 제거하여 메트로놈 재시작 방지)
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // AudioContext cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  // ---- 로드 ----
  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadEntries(groupId, projectId);
    data.sort((a, b) => a.bpm - b.bpm);
    setEntries(data);
  }, [groupId, projectId]);

  // ---- 메트로놈 오디오 ----
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback(
    (isAccent: boolean) => {
      if (!soundEnabledRef.current) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 강박은 높은 톤, 약박은 낮은 톤
        oscillator.frequency.value = isAccent ? 1000 : 800;
        oscillator.type = "sine";

        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.setTargetAtTime(0, now, 0.015);

        oscillator.start(now);
        oscillator.stop(now + 0.05);
      } catch {
        // 오디오 재생 실패 시 무시
      }
    },
    [getAudioContext]
  );

  // ---- 메트로놈 ----
  const effectiveBpm = Math.round(metronomeBpm * speedMultiplier);
  const intervalMs = Math.round(60000 / Math.max(1, effectiveBpm));

  useEffect(() => {
    if (metronomeActive) {
      beatCountRef.current = 0;
      metronomeRef.current = setInterval(() => {
        setMetronomeBeat((v) => !v);
        playClick(beatCountRef.current % 4 === 0);
        beatCountRef.current++;
      }, intervalMs);
    } else {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
        metronomeRef.current = null;
      }
    }
    return () => {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
        metronomeRef.current = null;
      }
    };
  }, [metronomeActive, intervalMs, playClick]);

  const startMetronome = useCallback((bpm?: number) => {
    if (bpm !== undefined) setMetronomeBpm(bpm);
    setMetronomeActive(true);
  }, []);

  const stopMetronome = useCallback(() => {
    setMetronomeActive(false);
    setMetronomeBeat(false);
    beatCountRef.current = 0;
  }, []);

  // ---- 탭 BPM 측정 ----
  const tapBpm = useCallback(() => {
    const now = Date.now();

    // 3초 이상 간격이면 리셋
    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    tapResetRef.current = setTimeout(() => {
      setTapTimestamps([]);
      setTappedBpm(null);
    }, 3000);

    setTapTimestamps((prev) => {
      const next = [...prev, now].slice(-8); // 최근 8개만 유지
      const bpm = calcBpmFromTaps(next);
      if (bpm !== null) setTappedBpm(bpm);
      return next;
    });
  }, []);

  const resetTap = useCallback(() => {
    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    setTapTimestamps([]);
    setTappedBpm(null);
  }, []);

  // ---- 곡 추가 ----
  const addEntry = useCallback(
    (payload: {
      songTitle: string;
      artist: string;
      bpm: number;
      sections: TempoSection[];
      note: string;
    }): boolean => {
      if (entries.length >= MAX_ENTRIES) return false;

      const newEntry: MusicTempoEntry = {
        id: crypto.randomUUID(),
        songTitle: payload.songTitle.trim(),
        artist: payload.artist.trim(),
        bpm: payload.bpm,
        tempoCategory: classifyTempo(payload.bpm),
        sections: payload.sections,
        note: payload.note.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [...entries, newEntry].sort((a, b) => a.bpm - b.bpm);
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
      return true;
    },
    [entries, groupId, projectId]
  );

  // ---- 곡 수정 ----
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<MusicTempoEntry, "songTitle" | "artist" | "bpm" | "sections" | "note">
      >
    ): void => {
      const updated = entries
        .map((e) => {
          if (e.id !== id) return e;
          const nextBpm = patch.bpm ?? e.bpm;
          return {
            ...e,
            ...patch,
            bpm: nextBpm,
            tempoCategory: classifyTempo(nextBpm),
          };
        })
        .sort((a, b) => a.bpm - b.bpm);
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
    },
    [entries, groupId, projectId]
  );

  // ---- 곡 삭제 ----
  const deleteEntry = useCallback(
    (id: string): void => {
      const updated = entries.filter((e) => e.id !== id);
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
    },
    [entries, groupId, projectId]
  );

  const canAdd = entries.length < MAX_ENTRIES;

  return {
    entries,
    loading: false,
    canAdd,
    addEntry,
    updateEntry,
    deleteEntry,
    reload,
    // 메트로놈
    metronomeActive,
    metronomeBpm,
    setMetronomeBpm,
    metronomeBeat,
    effectiveBpm,
    startMetronome,
    stopMetronome,
    // 사운드
    soundEnabled,
    setSoundEnabled,
    // 배속
    speedMultiplier,
    setSpeedMultiplier,
    // 탭 BPM
    tappedBpm,
    tapCount: tapTimestamps.length,
    tapBpm,
    resetTap,
  };
}
