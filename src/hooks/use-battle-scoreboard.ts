"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { BattleMatch, BattleStats } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const STORAGE_KEY = (groupId: string) => `dancebase:battles:${groupId}`;

function loadMatches(groupId: string): BattleMatch[] {
  return loadFromStorage<BattleMatch[]>(STORAGE_KEY(groupId), []);
}

function saveMatches(groupId: string, matches: BattleMatch[]): void {
  saveToStorage(STORAGE_KEY(groupId), matches);
}

// ─── 전적 계산 ───────────────────────────────────────────────

function calcStats(matches: BattleMatch[]): BattleStats[] {
  const map = new Map<string, { wins: number; losses: number; draws: number }>();

  const ensure = (name: string) => {
    if (!map.has(name)) map.set(name, { wins: 0, losses: 0, draws: 0 });
  };

  for (const m of matches) {
    ensure(m.participant1);
    ensure(m.participant2);

    if (m.winner === null) {
      // 무승부
      map.get(m.participant1)!.draws++;
      map.get(m.participant2)!.draws++;
    } else if (m.winner === m.participant1) {
      map.get(m.participant1)!.wins++;
      map.get(m.participant2)!.losses++;
    } else if (m.winner === m.participant2) {
      map.get(m.participant2)!.wins++;
      map.get(m.participant1)!.losses++;
    }
  }

  const stats: BattleStats[] = [];
  for (const [name, record] of map.entries()) {
    const total = record.wins + record.losses + record.draws;
    const winRate = total > 0 ? Math.round((record.wins / total) * 100) : 0;
    stats.push({ name, ...record, winRate });
  }

  // 승률 내림차순 → 동일 시 승수 내림차순
  stats.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.wins - a.wins;
  });

  return stats;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useBattleScoreboard(groupId: string) {
  const key = swrKeys.battleScoreboard(groupId);

  const { data: matches = [], mutate } = useSWR<BattleMatch[]>(
    key,
    () => loadMatches(groupId),
    { revalidateOnFocus: false }
  );

  // ── 매치 추가 ─────────────────────────────────────────────

  function addMatch(
    input: Omit<BattleMatch, "id" | "createdAt">
  ): boolean {
    try {
      const stored = loadMatches(groupId);
      const newMatch: BattleMatch = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [newMatch, ...stored];
      saveMatches(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 매치 삭제 ─────────────────────────────────────────────

  function deleteMatch(id: string): boolean {
    try {
      const stored = loadMatches(groupId);
      const updated = stored.filter((m) => m.id !== id);
      saveMatches(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 스타일별 필터 ─────────────────────────────────────────

  function getMatchesByStyle(style: string): BattleMatch[] {
    if (!style || style === "전체") return matches;
    return matches.filter((m) => m.style === style);
  }

  // ── 최근 매치 ─────────────────────────────────────────────

  function getRecentMatches(limit = 10): BattleMatch[] {
    return [...matches]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  // ── 특정 참가자 전적 ──────────────────────────────────────

  function getStatsForName(name: string): BattleStats | null {
    return calcStats(matches).find((s) => s.name === name) ?? null;
  }

  // ── 전체 통계 ─────────────────────────────────────────────

  const ranking = calcStats(matches);
  const totalBattles = matches.length;
  const styles = Array.from(new Set(matches.map((m) => m.style).filter(Boolean)));
  const avgWinRate =
    ranking.length > 0
      ? Math.round(ranking.reduce((sum, s) => sum + s.winRate, 0) / ranking.length)
      : 0;

  return {
    matches,
    ranking,
    totalBattles,
    styles,
    avgWinRate,
    // 함수
    addMatch,
    deleteMatch,
    getMatchesByStyle,
    getRecentMatches,
    getStatsForName,
    // SWR
    refetch: () => mutate(),
  };
}
