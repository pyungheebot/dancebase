"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PeerScoreEntry, PeerScoreDimension, PeerScoreSummary } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── 상수 ────────────────────────────────────────────────────

export const PEER_SCORE_DIMENSIONS: PeerScoreDimension[] = [
  "timing",
  "expression",
  "energy",
  "technique",
  "teamwork",
];

export const PEER_SCORE_DIMENSION_LABELS: Record<PeerScoreDimension, string> = {
  timing: "타이밍",
  expression: "표현력",
  energy: "에너지",
  technique: "테크닉",
  teamwork: "팀워크",
};

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:peer-scoring:${groupId}`;

// ─── 통계 헬퍼 ───────────────────────────────────────────────

function buildSummary(
  targetName: string,
  entries: PeerScoreEntry[]
): PeerScoreSummary {
  const targetEntries = entries.filter((e) => e.targetName === targetName);

  const dimensionAvgs = {} as Record<PeerScoreDimension, number>;
  for (const dim of PEER_SCORE_DIMENSIONS) {
    const dimEntries = targetEntries.filter((e) => e.dimension === dim);
    if (dimEntries.length === 0) {
      dimensionAvgs[dim] = 0;
    } else {
      const sum = dimEntries.reduce((s, e) => s + e.score, 0);
      dimensionAvgs[dim] = Math.round((sum / dimEntries.length) * 10) / 10;
    }
  }

  const validDims = PEER_SCORE_DIMENSIONS.filter((d) => dimensionAvgs[d] > 0);
  const avgScore =
    validDims.length === 0
      ? 0
      : Math.round(
          (validDims.reduce((s, d) => s + dimensionAvgs[d], 0) / validDims.length) * 10
        ) / 10;

  return {
    targetName,
    avgScore,
    dimensionAvgs,
    totalRatings: targetEntries.length,
  };
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePeerScoring(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.peerScoring(groupId) : null,
    () => loadFromStorage<PeerScoreEntry[]>(LS_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const entries = data ?? [];

  // ── 점수 추가 ────────────────────────────────────────────

  function addScore(
    entry: Omit<PeerScoreEntry, "id" | "createdAt">
  ): boolean {
    try {
      const stored = loadFromStorage<PeerScoreEntry[]>(LS_KEY(groupId), []);
      const newEntry: PeerScoreEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newEntry];
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 점수 삭제 ────────────────────────────────────────────

  function deleteScore(id: string): boolean {
    try {
      const stored = loadFromStorage<PeerScoreEntry[]>(LS_KEY(groupId), []);
      const next = stored.filter((e) => e.id !== id);
      if (next.length === stored.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 멤버별 평균 요약 ─────────────────────────────────────

  function getSummaryForMember(name: string): PeerScoreSummary {
    return buildSummary(name, entries);
  }

  // ── 전체 멤버 요약 (avgScore 높은 순) ───────────────────

  function getAllSummaries(): PeerScoreSummary[] {
    const names = Array.from(new Set(entries.map((e) => e.targetName)));
    return names
      .map((name) => buildSummary(name, entries))
      .sort((a, b) => b.avgScore - a.avgScore);
  }

  // ── 세션별 필터 ─────────────────────────────────────────

  function getBySession(date: string): PeerScoreEntry[] {
    return entries.filter((e) => e.sessionDate === date);
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalEntries = entries.length;
  const uniqueMembers = new Set(entries.map((e) => e.targetName)).size;
  const overallAvg =
    totalEntries === 0
      ? 0
      : Math.round(
          (entries.reduce((s, e) => s + e.score, 0) / totalEntries) * 10
        ) / 10;

  // ── 세션 날짜 목록 ───────────────────────────────────────

  const sessionDates = Array.from(
    new Set(entries.map((e) => e.sessionDate))
  ).sort((a, b) => b.localeCompare(a));

  return {
    entries,
    // CRUD
    addScore,
    deleteScore,
    // 조회
    getSummaryForMember,
    getAllSummaries,
    getBySession,
    // 통계
    totalEntries,
    uniqueMembers,
    overallAvg,
    sessionDates,
    // SWR
    refetch: () => mutate(),
  };
}
