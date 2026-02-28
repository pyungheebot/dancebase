"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  BattleTournamentEntry,
  TournamentFormat,
  TournamentMatch,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:battle-tournament:${groupId}`;
}

function loadData(groupId: string): BattleTournamentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as BattleTournamentEntry[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: BattleTournamentEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 매치 자동 생성 로직
// ============================================================

/**
 * single_elimination: 1라운드 매치를 참가자 순서대로 짝지음
 * double_elimination: single_elimination과 동일하게 1라운드 매치 생성
 * round_robin: 모든 조합의 매치 생성 (라운드 1)
 */
function generateMatches(
  participants: string[],
  format: TournamentFormat
): TournamentMatch[] {
  const matches: TournamentMatch[] = [];

  if (format === "round_robin") {
    // 모든 가능한 조합
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: crypto.randomUUID(),
          round: 1,
          player1: participants[i],
          player2: participants[j],
        });
      }
    }
  } else {
    // single_elimination / double_elimination: 1라운드 대진 생성
    const shuffled = [...participants];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      matches.push({
        id: crypto.randomUUID(),
        round: 1,
        player1: shuffled[i],
        player2: shuffled[i + 1],
      });
    }
    // 홀수 참가자면 부전승으로 마지막 한 명 처리 (round 1, player2 = "부전승")
    if (shuffled.length % 2 !== 0) {
      matches.push({
        id: crypto.randomUUID(),
        round: 1,
        player1: shuffled[shuffled.length - 1],
        player2: "부전승",
        winner: shuffled[shuffled.length - 1],
      });
    }
  }

  return matches;
}

// ============================================================
// 통계 타입
// ============================================================

export type BattleTournamentStats = {
  totalTournaments: number;
  activeTournament: BattleTournamentEntry | null;
  recentChampion: string | null;
};

// ============================================================
// 훅
// ============================================================

export function useBattleTournament(groupId: string) {
  const [tournaments, setTournaments] = useState<BattleTournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setTournaments(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: BattleTournamentEntry[]) => {
      saveData(groupId, next);
      setTournaments(next);
    },
    [groupId]
  );

  // 토너먼트 생성
  const createTournament = useCallback(
    (
      name: string,
      format: TournamentFormat,
      participants: string[],
      createdBy: string
    ): BattleTournamentEntry => {
      const matches = generateMatches(participants, format);
      const entry: BattleTournamentEntry = {
        id: crypto.randomUUID(),
        name,
        format,
        status: "upcoming",
        participants,
        matches,
        createdBy,
        createdAt: new Date().toISOString(),
      };
      persist([...tournaments, entry]);
      return entry;
    },
    [tournaments, persist]
  );

  // 토너먼트 시작
  const startTournament = useCallback(
    (id: string): boolean => {
      const idx = tournaments.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      const target = tournaments[idx];
      if (target.status !== "upcoming") return false;
      const updated: BattleTournamentEntry = { ...target, status: "in_progress" };
      const next = [...tournaments];
      next[idx] = updated;
      persist(next);
      return true;
    },
    [tournaments, persist]
  );

  // 매치 결과 기록
  const recordResult = useCallback(
    (
      tournamentId: string,
      matchId: string,
      winner: string,
      score1?: number,
      score2?: number
    ): boolean => {
      const tIdx = tournaments.findIndex((t) => t.id === tournamentId);
      if (tIdx === -1) return false;
      const tournament = tournaments[tIdx];
      const mIdx = tournament.matches.findIndex((m) => m.id === matchId);
      if (mIdx === -1) return false;

      const updatedMatch: TournamentMatch = {
        ...tournament.matches[mIdx],
        winner,
        score1,
        score2,
      };
      const updatedMatches = [...tournament.matches];
      updatedMatches[mIdx] = updatedMatch;

      const updatedTournament: BattleTournamentEntry = {
        ...tournament,
        matches: updatedMatches,
      };
      const next = [...tournaments];
      next[tIdx] = updatedTournament;
      persist(next);
      return true;
    },
    [tournaments, persist]
  );

  // 토너먼트 완료 (챔피언 자동 결정)
  const completeTournament = useCallback(
    (id: string): boolean => {
      const idx = tournaments.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      const target = tournaments[idx];
      if (target.status === "completed") return false;

      // 챔피언 결정: 가장 많이 이긴 참가자
      const winCount: Record<string, number> = {};
      for (const match of target.matches) {
        if (match.winner && match.winner !== "부전승") {
          winCount[match.winner] = (winCount[match.winner] ?? 0) + 1;
        }
      }
      let champion: string | undefined;
      let maxWins = -1;
      for (const [name, wins] of Object.entries(winCount)) {
        if (wins > maxWins) {
          maxWins = wins;
          champion = name;
        }
      }

      const updated: BattleTournamentEntry = {
        ...target,
        status: "completed",
        champion,
      };
      const next = [...tournaments];
      next[idx] = updated;
      persist(next);
      return true;
    },
    [tournaments, persist]
  );

  // 토너먼트 삭제
  const deleteTournament = useCallback(
    (id: string): boolean => {
      const next = tournaments.filter((t) => t.id !== id);
      if (next.length === tournaments.length) return false;
      persist(next);
      return true;
    },
    [tournaments, persist]
  );

  // 통계
  const stats: BattleTournamentStats = (() => {
    const activeTournament =
      tournaments.find((t) => t.status === "in_progress") ?? null;

    const completed = tournaments
      .filter((t) => t.status === "completed" && t.champion)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    const recentChampion = completed[0]?.champion ?? null;

    return {
      totalTournaments: tournaments.length,
      activeTournament,
      recentChampion,
    };
  })();

  return {
    tournaments,
    loading,
    createTournament,
    startTournament,
    recordResult,
    completeTournament,
    deleteTournament,
    stats,
    refetch: reload,
  };
}
