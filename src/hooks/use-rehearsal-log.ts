"use client";

import { useState, useEffect, useCallback } from "react";
import type { RehearsalLogEntry, RehearsalIssue } from "@/types";

// ─── localStorage 키 ────────────────────────────────────────

const STORAGE_KEY = (groupId: string, projectId: string) =>
  `dancebase:rehearsal-log:${groupId}:${projectId}`;

// ─── 저장/로드 헬퍼 ──────────────────────────────────────────

function loadEntries(groupId: string, projectId: string): RehearsalLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as RehearsalLogEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: RehearsalLogEntry[]
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId, projectId), JSON.stringify(entries));
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useRehearsalLog(groupId: string, projectId: string) {
  const [entries, setEntries] = useState<RehearsalLogEntry[]>([]);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !projectId) return;
    setEntries(loadEntries(groupId, projectId));
  }, [groupId, projectId]);

  // 상태 동기화 + 저장
  const persist = useCallback(
    (next: RehearsalLogEntry[]) => {
      saveEntries(groupId, projectId, next);
      setEntries(next);
    },
    [groupId, projectId]
  );

  // ── 날짜순 정렬된 항목 ──────────────────────────────────
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // ── 다음 리허설 번호 자동 계산 ───────────────────────────
  const nextRehearsalNumber =
    entries.length === 0
      ? 1
      : Math.max(...entries.map((e) => e.rehearsalNumber)) + 1;

  // ── 미해결 이슈 수 ────────────────────────────────────────
  const unresolvedIssueCount = entries
    .flatMap((e) => e.issues)
    .filter((issue) => !issue.resolved).length;

  // ── 최신 완성도 (날짜 기준 가장 최근) ────────────────────
  const latestCompletionRate =
    sortedEntries.length > 0
      ? sortedEntries[sortedEntries.length - 1].completionRate
      : 0;

  // ── 완성도 추이 (차트용) ──────────────────────────────────
  const completionTrend = sortedEntries.map((e) => ({
    date: e.date,
    rehearsalNumber: e.rehearsalNumber,
    completionRate: e.completionRate,
  }));

  // ── 기록 추가 ──────────────────────────────────────────
  const addEntry = useCallback(
    (
      params: Omit<RehearsalLogEntry, "id" | "rehearsalNumber" | "createdAt">
    ): string => {
      const current = loadEntries(groupId, projectId);
      const maxNum =
        current.length === 0
          ? 0
          : Math.max(...current.map((e) => e.rehearsalNumber));
      const newEntry: RehearsalLogEntry = {
        id: crypto.randomUUID(),
        rehearsalNumber: maxNum + 1,
        createdAt: new Date().toISOString(),
        ...params,
      };
      persist([...current, newEntry]);
      return newEntry.id;
    },
    [groupId, projectId, persist]
  );

  // ── 기록 수정 ──────────────────────────────────────────
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<
        Omit<RehearsalLogEntry, "id" | "rehearsalNumber" | "createdAt">
      >
    ): boolean => {
      const current = loadEntries(groupId, projectId);
      const idx = current.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;
      const updated = current.map((e, i) =>
        i === idx ? { ...e, ...params } : e
      );
      persist(updated);
      return true;
    },
    [groupId, projectId, persist]
  );

  // ── 기록 삭제 ──────────────────────────────────────────
  const deleteEntry = useCallback(
    (entryId: string) => {
      const current = loadEntries(groupId, projectId);
      persist(current.filter((e) => e.id !== entryId));
    },
    [groupId, projectId, persist]
  );

  // ── 이슈 해결 토글 ────────────────────────────────────
  const toggleIssueResolved = useCallback(
    (entryId: string, issueId: string) => {
      const current = loadEntries(groupId, projectId);
      const updated = current.map((e) => {
        if (e.id !== entryId) return e;
        return {
          ...e,
          issues: e.issues.map((issue) =>
            issue.id === issueId
              ? { ...issue, resolved: !issue.resolved }
              : issue
          ),
        };
      });
      persist(updated);
    },
    [groupId, projectId, persist]
  );

  // ── 이슈 추가 ──────────────────────────────────────────
  const addIssue = useCallback(
    (entryId: string, description: string): boolean => {
      if (!description.trim()) return false;
      const current = loadEntries(groupId, projectId);
      const idx = current.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;
      const newIssue: RehearsalIssue = {
        id: crypto.randomUUID(),
        description: description.trim(),
        resolved: false,
      };
      const updated = current.map((e, i) =>
        i === idx ? { ...e, issues: [...e.issues, newIssue] } : e
      );
      persist(updated);
      return true;
    },
    [groupId, projectId, persist]
  );

  return {
    entries,
    sortedEntries,
    nextRehearsalNumber,
    unresolvedIssueCount,
    latestCompletionRate,
    completionTrend,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleIssueResolved,
    addIssue,
  };
}
