"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PracticeEntry,
  PracticeJournalData,
  PracticeWeeklyStats,
} from "@/types";

const DEFAULT_WEEKLY_GOAL = 180; // 기본 주간 목표: 180분

function getStorageKey(userId: string) {
  return `dancebase:practice-journal:${userId}`;
}

function loadData(userId: string): PracticeJournalData {
  if (typeof window === "undefined") {
    return { entries: [], weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return { entries: [], weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL };
    }
    return JSON.parse(raw) as PracticeJournalData;
  } catch {
    return { entries: [], weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL };
  }
}

function saveData(userId: string, data: PracticeJournalData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

/** YYYY-MM-DD 형식 날짜 문자열 반환 */
function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 이번 주 월요일 날짜 반환 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ... 6=토
  const diff = (day + 6) % 7; // 월요일 기준 오프셋
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function usePracticeJournal() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<PracticeJournalData>({
    entries: [],
    weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL,
  });

  // 현재 로그인 사용자 ID 가져오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: authData }: { data: { user: { id: string } | null } }) => {
      const uid = authData.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        setData(loadData(uid));
      }
    });
  }, []);

  /** 데이터 영속화 */
  const persist = useCallback(
    (next: PracticeJournalData) => {
      if (!userId) return;
      saveData(userId, next);
      setData(next);
    },
    [userId]
  );

  /** 연습 기록 추가 */
  const addEntry = useCallback(
    (
      entry: Omit<PracticeEntry, "id" | "createdAt">
    ): PracticeEntry => {
      const newEntry: PracticeEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next: PracticeJournalData = {
        ...data,
        entries: [newEntry, ...data.entries],
      };
      persist(next);
      return newEntry;
    },
    [data, persist]
  );

  /** 연습 기록 수정 */
  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<PracticeEntry, "id" | "createdAt">>) => {
      const next: PracticeJournalData = {
        ...data,
        entries: data.entries.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      };
      persist(next);
    },
    [data, persist]
  );

  /** 연습 기록 삭제 */
  const deleteEntry = useCallback(
    (id: string) => {
      const next: PracticeJournalData = {
        ...data,
        entries: data.entries.filter((e) => e.id !== id),
      };
      persist(next);
    },
    [data, persist]
  );

  /** 주간 목표 설정 */
  const setWeeklyGoal = useCallback(
    (minutes: number) => {
      const next: PracticeJournalData = {
        ...data,
        weeklyGoalMinutes: minutes,
      };
      persist(next);
    },
    [data, persist]
  );

  /** 이번 주 통계 계산 */
  const getWeeklyStats = useCallback((): PracticeWeeklyStats => {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekEntries = data.entries.filter((e) => {
      const d = new Date(e.date);
      return d >= weekStart && d < weekEnd;
    });

    const totalMinutes = weekEntries.reduce(
      (sum, e) => sum + e.durationMinutes,
      0
    );
    const practiceCount = weekEntries.length;
    const averageRating =
      practiceCount > 0
        ? weekEntries.reduce((sum, e) => sum + e.selfRating, 0) / practiceCount
        : 0;

    const goalMinutes = data.weeklyGoalMinutes;
    const goalProgress =
      goalMinutes > 0
        ? Math.min(100, Math.round((totalMinutes / goalMinutes) * 100))
        : 0;

    return {
      totalMinutes,
      practiceCount,
      averageRating: Math.round(averageRating * 10) / 10,
      goalMinutes,
      goalProgress,
    };
  }, [data]);

  /** 이번 달 통계 계산 */
  const getMonthlyStats = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthEntries = data.entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalMinutes = monthEntries.reduce(
      (sum, e) => sum + e.durationMinutes,
      0
    );
    const practiceCount = monthEntries.length;
    const averageRating =
      practiceCount > 0
        ? monthEntries.reduce((sum, e) => sum + e.selfRating, 0) / practiceCount
        : 0;

    return {
      totalMinutes,
      practiceCount,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }, [data]);

  /** 최근 30일 연습 패턴 (일별 연습 여부) */
  const getLast30DaysPattern = useCallback((): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result[toDateStr(d)] = false;
    }

    data.entries.forEach((e) => {
      if (result[e.date] !== undefined) {
        result[e.date] = true;
      }
    });

    return result;
  }, [data]);

  /** 이번 달 달력용 연습 날짜 Set */
  const getMonthPracticedDays = useCallback((): Set<string> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const practiced = new Set<string>();
    data.entries.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        practiced.add(e.date);
      }
    });
    return practiced;
  }, [data]);

  return {
    entries: data.entries,
    weeklyGoalMinutes: data.weeklyGoalMinutes,
    loading: userId === null,
    addEntry,
    updateEntry,
    deleteEntry,
    setWeeklyGoal,
    getWeeklyStats,
    getMonthlyStats,
    getLast30DaysPattern,
    getMonthPracticedDays,
  };
}
