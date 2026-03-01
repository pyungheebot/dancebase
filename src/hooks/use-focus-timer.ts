"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { FocusTimerConfig, FocusTimerPhase, FocusTimerSession } from "@/types";

// ============================================
// 상수 및 기본값
// ============================================

const DEFAULT_CONFIG: FocusTimerConfig = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLongBreak: 4,
};

const CONFIG_LS_KEY = (groupId: string) =>
  `dancebase:focus-timer:${groupId}:config`;

const SESSIONS_LS_KEY = (groupId: string) =>
  `dancebase:focus-timer:${groupId}:sessions`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadConfig(groupId: string): FocusTimerConfig {
  return loadFromStorage<FocusTimerConfig>(CONFIG_LS_KEY(groupId), DEFAULT_CONFIG);
}

function saveConfig(groupId: string, config: FocusTimerConfig): void {
  saveToStorage(CONFIG_LS_KEY(groupId), config);
}

function loadSessions(groupId: string): FocusTimerSession[] {
  return loadFromStorage<FocusTimerSession[]>(SESSIONS_LS_KEY(groupId), []);
}

function saveSessions(groupId: string, sessions: FocusTimerSession[]): void {
  saveToStorage(SESSIONS_LS_KEY(groupId), sessions);
}

// ============================================
// 날짜 헬퍼
// ============================================

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekStartYMD(): string {
  const d = new Date();
  const day = d.getDay(); // 0=일
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
  const monday = new Date(d);
  monday.setDate(diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

// ============================================
// 페이즈 한글 레이블
// ============================================

export function phaseLabel(phase: FocusTimerPhase): string {
  if (phase === "focus") return "집중";
  if (phase === "short_break") return "짧은 휴식";
  return "긴 휴식";
}

// ============================================
// 훅
// ============================================

export function useFocusTimer(groupId: string) {
  // ── 설정 SWR ────────────────────────────────────────────
  const { data: configData, mutate: mutateConfig } = useSWR(
    groupId ? swrKeys.focusTimer(groupId) + ":config" : null,
    () => loadConfig(groupId),
    { revalidateOnFocus: false }
  );

  // ── 세션 SWR ────────────────────────────────────────────
  const { data: sessionsData, mutate: mutateSessions } = useSWR(
    groupId ? swrKeys.focusTimer(groupId) + ":sessions" : null,
    () => loadSessions(groupId),
    { revalidateOnFocus: false }
  );

  const config: FocusTimerConfig = configData ?? DEFAULT_CONFIG;
  const sessions: FocusTimerSession[] = sessionsData ?? [];

  // ── 타이머 상태 ──────────────────────────────────────────
  const [phase, setPhase] = useState<FocusTimerPhase>("focus");
  const [cycleCount, setCycleCount] = useState(0); // 완료된 집중 사이클 수
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(config.focusDuration * 60);

  // 현재 페이즈 전체 초
  const totalSeconds = useCallback(
    (p: FocusTimerPhase, cfg: FocusTimerConfig): number => {
      if (p === "focus") return cfg.focusDuration * 60;
      if (p === "short_break") return cfg.shortBreak * 60;
      return cfg.longBreak * 60;
    },
    []
  );

  // config가 변경되면 secondsLeft 리셋 (타이머 정지 중일 때만)
  const prevConfigRef = useRef(config);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isRunning) {
      const prev = prevConfigRef.current;
      const changed =
        prev.focusDuration !== config.focusDuration ||
        prev.shortBreak !== config.shortBreak ||
        prev.longBreak !== config.longBreak;
      if (changed) {
        setSecondsLeft(totalSeconds(phase, config));
      }
    }
    prevConfigRef.current = config;
  }, [config, isRunning, phase, totalSeconds]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── 인터벌 ──────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 페이즈 완료 처리
  const handlePhaseComplete = useCallback(
    (currentPhase: FocusTimerPhase, currentCycle: number, cfg: FocusTimerConfig) => {
      setIsRunning(false);
      clearTimer();

      if (currentPhase === "focus") {
        const newCycle = currentCycle + 1;
        setCycleCount(newCycle);

        // 세션 저장
        const today = todayYMD();
        const stored = loadSessions(groupId);
        const session: FocusTimerSession = {
          id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: today,
          focusMinutes: cfg.focusDuration,
          breakMinutes:
            newCycle % cfg.cyclesBeforeLongBreak === 0
              ? cfg.longBreak
              : cfg.shortBreak,
          completedCycles: 1,
          totalFocusTime: cfg.focusDuration,
          note: "",
          createdAt: new Date().toISOString(),
        };
        const next = [...stored, session];
        saveSessions(groupId, next);
        mutateSessions(next, false);

        // 다음 페이즈 결정
        if (newCycle % cfg.cyclesBeforeLongBreak === 0) {
          setPhase("long_break");
          setSecondsLeft(cfg.longBreak * 60);
        } else {
          setPhase("short_break");
          setSecondsLeft(cfg.shortBreak * 60);
        }
      } else {
        // 휴식 완료 → 집중으로
        setPhase("focus");
        setSecondsLeft(cfg.focusDuration * 60);
      }
    },
    [groupId, mutateSessions, clearTimer]
  );

  // 현재 값들을 ref로 유지 (인터벌 클로저 문제 해결)
  const stateRef = useRef({ phase, cycleCount, config });
  useEffect(() => {
    stateRef.current = { phase, cycleCount, config };
  }, [phase, cycleCount, config]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const { phase: p, cycleCount: c, config: cfg } = stateRef.current;
          handlePhaseComplete(p, c, cfg);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer, handlePhaseComplete]);

  // ── 컨트롤 ──────────────────────────────────────────────

  function start() {
    setIsRunning(true);
  }

  function pause() {
    setIsRunning(false);
  }

  function reset() {
    setIsRunning(false);
    clearTimer();
    setSecondsLeft(totalSeconds(phase, config));
  }

  function skip() {
    setIsRunning(false);
    clearTimer();
    const { phase: p, cycleCount: c, config: cfg } = stateRef.current;
    handlePhaseComplete(p, c, cfg);
  }

  // ── 설정 업데이트 ────────────────────────────────────────

  function updateConfig(partial: Partial<FocusTimerConfig>) {
    const next: FocusTimerConfig = { ...config, ...partial };
    saveConfig(groupId, next);
    mutateConfig(next, false);
  }

  // ── 통계 ────────────────────────────────────────────────

  const today = todayYMD();
  const weekStart = weekStartYMD();

  const todaySessions = sessions.filter((s) => s.date === today);
  const weekSessions = sessions.filter((s) => s.date >= weekStart);

  const todayFocusTime = todaySessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
  const weekFocusTime = weekSessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
  const totalSessionCount = sessions.length;

  // ── 진행률 (0~1) ─────────────────────────────────────────

  const progress =
    1 - secondsLeft / Math.max(totalSeconds(phase, config), 1);

  return {
    // 설정
    config,
    updateConfig,
    // 타이머 상태
    phase,
    cycleCount,
    isRunning,
    secondsLeft,
    progress,
    // 컨트롤
    start,
    pause,
    reset,
    skip,
    // 세션 데이터
    sessions,
    todaySessions,
    weekSessions,
    // 통계
    todayFocusTime,
    weekFocusTime,
    totalSessions: totalSessionCount,
    // SWR
    loading: configData === undefined || sessionsData === undefined,
    refetch: () => {
      mutateConfig();
      mutateSessions();
    },
  };
}
