"use client";

import { useCallback, useEffect, useState } from "react";
import type { JournalCondition, PracticeJournalEntry } from "@/types";

// ============================================
// 상수
// ============================================

export const CONDITION_EMOJI: Record<JournalCondition, string> = {
  excellent: "😄",
  good: "🙂",
  normal: "😐",
  tired: "😓",
  bad: "😞",
};

export const CONDITION_LABEL: Record<JournalCondition, string> = {
  excellent: "최고",
  good: "좋음",
  normal: "보통",
  tired: "피곤",
  bad: "나쁨",
};

export const CONDITION_ORDER: JournalCondition[] = [
  "excellent",
  "good",
  "normal",
  "tired",
  "bad",
];

const MAX_ENTRIES = 200;

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:practice-journal:${groupId}:${userId}`;
}

// ============================================
// 날짜 유틸
// ============================================

export function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dd}`;
}

// ============================================
// 저장/불러오기
// ============================================

function loadEntries(groupId: string, userId: string): PracticeJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeJournalEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  userId: string,
  entries: PracticeJournalEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(entries));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function usePracticeJournalEntry(groupId: string, userId: string) {
  const [entries, setEntries] = useState<PracticeJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !userId) {
      setLoading(false);
      return;
    }
    const stored = loadEntries(groupId, userId);
    // 날짜 내림차순 정렬 (최신 우선)
    stored.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(stored);
    setLoading(false);
  }, [groupId, userId]);

  // 내부 저장 + 상태 갱신
  const persist = useCallback(
    (next: PracticeJournalEntry[]) => {
      saveEntries(groupId, userId, next);
      setEntries(next);
    },
    [groupId, userId]
  );

  // ── 일지 추가 ──────────────────────────────
  const addEntry = useCallback(
    (
      input: Omit<PracticeJournalEntry, "id" | "createdAt">
    ): PracticeJournalEntry => {
      const newEntry: PracticeJournalEntry = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...entries].slice(0, MAX_ENTRIES);
      updated.sort((a, b) => b.date.localeCompare(a.date));
      persist(updated);
      return newEntry;
    },
    [entries, persist]
  );

  // ── 일지 수정 ──────────────────────────────
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<Omit<PracticeJournalEntry, "id" | "createdAt">>
    ): void => {
      const updated = entries.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      updated.sort((a, b) => b.date.localeCompare(a.date));
      persist(updated);
    },
    [entries, persist]
  );

  // ── 일지 삭제 ──────────────────────────────
  const deleteEntry = useCallback(
    (id: string): void => {
      const updated = entries.filter((e) => e.id !== id);
      persist(updated);
    },
    [entries, persist]
  );

  // ── 태그 필터 ──────────────────────────────
  const filterByTag = useCallback(
    (tag: string): PracticeJournalEntry[] => {
      if (!tag) return entries;
      return entries.filter((e) => e.tags.includes(tag));
    },
    [entries]
  );

  // ── 텍스트 검색 ────────────────────────────
  const search = useCallback(
    (query: string): PracticeJournalEntry[] => {
      if (!query.trim()) return entries;
      const q = query.trim().toLowerCase();
      return entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.learned.toLowerCase().includes(q) ||
          e.improvement.toLowerCase().includes(q) ||
          e.feeling.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    },
    [entries]
  );

  // ── 최근 N일 기록 ──────────────────────────
  const getRecentEntries = useCallback(
    (days = 30): PracticeJournalEntry[] => {
      const cutoff = daysAgo(days);
      return entries.filter((e) => e.date >= cutoff);
    },
    [entries]
  );

  // ── 통계 ───────────────────────────────────
  const getStats = useCallback(() => {
    const total = entries.length;

    // 최근 7일 기록 수
    const cutoff7 = daysAgo(7);
    const recentWeekCount = entries.filter((e) => e.date >= cutoff7).length;

    // 전체 태그 빈도
    const tagFreq: Record<string, number> = {};
    for (const entry of entries) {
      for (const tag of entry.tags) {
        tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
      }
    }

    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return { total, recentWeekCount, topTags };
  }, [entries]);

  // ── 고유 태그 목록 ─────────────────────────
  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [entries]);

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    filterByTag,
    search,
    getRecentEntries,
    getStats,
    getAllTags,
  };
}
