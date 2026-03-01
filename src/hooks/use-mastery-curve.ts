"use client";

import { useCallback, useState } from "react";
import type { MasteryCurveEntry, MasteryCheckpoint } from "@/types";

// ============================================
// 상수
// ============================================

const MAX_ENTRIES = 10;

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:mastery-curve:${groupId}:${userId}`;
}

// ============================================
// 날짜 유틸
// ============================================

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// 저장/불러오기
// ============================================

function saveEntries(
  groupId: string,
  userId: string,
  entries: MasteryCurveEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(entries));
  } catch {
    // 무시
  }
}

// ============================================
// 예상 완성일 추정 (선형 회귀)
// ============================================

export function estimateCompletionDate(
  checkpoints: MasteryCheckpoint[]
): string | null {
  if (checkpoints.length < 2) return null;

  // 날짜 오름차순 정렬
  const sorted = [...checkpoints].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // x: 날짜를 숫자(ms)로, y: 진도
  const points = sorted.map((cp) => ({
    x: new Date(cp.date).getTime(),
    y: cp.progress,
  }));

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  if (slope <= 0) return null;

  // 100% 도달 시점 계산
  const intercept = (sumY - slope * sumX) / n;
  const targetX = (100 - intercept) / slope;

  if (!isFinite(targetX) || targetX < 0) return null;

  const date = new Date(targetX);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// 훅
// ============================================

export function useMasteryCurve(groupId: string, userId: string) {
  const [entries, setEntries] = useState<MasteryCurveEntry[]>([]);

  // 내부 저장 + 상태 갱신
  const persist = useCallback(
    (next: MasteryCurveEntry[]) => {
      saveEntries(groupId, userId, next);
      setEntries(next);
    },
    [groupId, userId]
  );

  // ── 안무 추가 ──────────────────────────────
  const addEntry = useCallback(
    (input: {
      choreographyName: string;
      targetDate: string;
      initialProgress?: number;
    }): MasteryCurveEntry | null => {
      if (entries.length >= MAX_ENTRIES) return null;

      const initialCheckpoint: MasteryCheckpoint = {
        date: getTodayStr(),
        progress: input.initialProgress ?? 0,
        note: "초기 기록",
      };

      const newEntry: MasteryCurveEntry = {
        id: crypto.randomUUID(),
        choreographyName: input.choreographyName,
        targetDate: input.targetDate,
        checkpoints: [initialCheckpoint],
        currentProgress: input.initialProgress ?? 0,
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...entries];
      persist(updated);
      return newEntry;
    },
    [entries, persist]
  );

  // ── 안무 삭제 ──────────────────────────────
  const deleteEntry = useCallback(
    (id: string): void => {
      const updated = entries.filter((e) => e.id !== id);
      persist(updated);
    },
    [entries, persist]
  );

  // ── 체크포인트 추가 ────────────────────────
  const addCheckpoint = useCallback(
    (entryId: string, checkpoint: MasteryCheckpoint): void => {
      const updated = entries.map((e) => {
        if (e.id !== entryId) return e;

        // 같은 날짜 체크포인트가 있으면 덮어씀
        const filtered = e.checkpoints.filter(
          (cp) => cp.date !== checkpoint.date
        );
        const newCheckpoints = [...filtered, checkpoint].sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        return {
          ...e,
          checkpoints: newCheckpoints,
          currentProgress: checkpoint.progress,
        };
      });
      persist(updated);
    },
    [entries, persist]
  );

  // ── 체크포인트 삭제 ────────────────────────
  const removeCheckpoint = useCallback(
    (entryId: string, checkpointDate: string): void => {
      const updated = entries.map((e) => {
        if (e.id !== entryId) return e;
        const newCheckpoints = e.checkpoints.filter(
          (cp) => cp.date !== checkpointDate
        );
        const latest = newCheckpoints[newCheckpoints.length - 1];
        return {
          ...e,
          checkpoints: newCheckpoints,
          currentProgress: latest?.progress ?? 0,
        };
      });
      persist(updated);
    },
    [entries, persist]
  );

  // ── 현재 진도 계산 ─────────────────────────
  const getCurrentProgress = useCallback(
    (entryId: string): number => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry || entry.checkpoints.length === 0) return 0;
      const sorted = [...entry.checkpoints].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      return sorted[0].progress;
    },
    [entries]
  );

  // ── 예상 완성일 추정 ──────────────────────
  const getEstimatedDate = useCallback(
    (entryId: string): string | null => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return null;
      return estimateCompletionDate(entry.checkpoints);
    },
    [entries]
  );

  // ── 목표 달성률 계산 ──────────────────────
  const getTargetAchievementRate = useCallback(
    (entryId: string): number => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return 0;
      return Math.min(100, entry.currentProgress);
    },
    [entries]
  );

  return {
    entries,
    loading: false,
    canAdd: entries.length < MAX_ENTRIES,
    addEntry,
    deleteEntry,
    addCheckpoint,
    removeCheckpoint,
    getCurrentProgress,
    getEstimatedDate,
    getTargetAchievementRate,
  };
}
