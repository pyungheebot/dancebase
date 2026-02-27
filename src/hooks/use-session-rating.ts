"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SessionRatingEntry, SessionRatingAvg } from "@/types";

// ============================================
// 상수
// ============================================

const MAX_RATINGS = 200;
const LS_KEY = (groupId: string) =>
  `dancebase:session-rating:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadRatings(groupId: string): SessionRatingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    return raw ? (JSON.parse(raw) as SessionRatingEntry[]) : [];
  } catch {
    return [];
  }
}

function saveRatings(groupId: string, ratings: SessionRatingEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(ratings));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 유틸 헬퍼
// ============================================

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================
// 훅
// ============================================

export function useSessionRating(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.sessionRating(groupId) : null,
    () => loadRatings(groupId),
    { revalidateOnFocus: false }
  );

  const ratings: SessionRatingEntry[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ──────────────────────────────────

  function update(next: SessionRatingEntry[]): void {
    saveRatings(groupId, next);
    mutate(next, false);
  }

  // ── 평가 추가 ──────────────────────────────────────────

  function addRating(params: {
    sessionDate: string;
    sessionTitle: string;
    raterName: string;
    satisfaction: number;
    efficiency: number;
    difficulty: number;
    comment: string;
  }): boolean {
    const { sessionDate, sessionTitle, raterName, satisfaction, efficiency, difficulty, comment } = params;
    if (!sessionDate || !sessionTitle.trim() || !raterName.trim()) return false;
    if (
      satisfaction < 1 || satisfaction > 5 ||
      efficiency < 1 || efficiency > 5 ||
      difficulty < 1 || difficulty > 5
    ) return false;

    const stored = loadRatings(groupId);
    if (stored.length >= MAX_RATINGS) return false;

    const entry: SessionRatingEntry = {
      id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sessionDate,
      sessionTitle: sessionTitle.trim(),
      raterName: raterName.trim(),
      satisfaction,
      efficiency,
      difficulty,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    update([...stored, entry]);
    return true;
  }

  // ── 평가 삭제 ──────────────────────────────────────────

  function deleteRating(ratingId: string): void {
    const stored = loadRatings(groupId);
    update(stored.filter((r) => r.id !== ratingId));
  }

  // ── 세션별 평균 (특정 날짜) ─────────────────────────────

  function getSessionAvg(date: string): SessionRatingAvg | null {
    const stored = loadRatings(groupId);
    const group = stored.filter((r) => r.sessionDate === date);
    if (group.length === 0) return null;

    // 같은 날짜에 sessionTitle이 여러 개일 수 있으므로 가장 최신 것 사용
    const sessionTitle = group[group.length - 1].sessionTitle;

    const avgSatisfaction = round2(
      group.reduce((s, r) => s + r.satisfaction, 0) / group.length
    );
    const avgEfficiency = round2(
      group.reduce((s, r) => s + r.efficiency, 0) / group.length
    );
    const avgDifficulty = round2(
      group.reduce((s, r) => s + r.difficulty, 0) / group.length
    );

    return {
      sessionDate: date,
      sessionTitle,
      avgSatisfaction,
      avgEfficiency,
      avgDifficulty,
      ratingCount: group.length,
    };
  }

  // ── 전체 세션 평균 목록 (날짜 내림차순) ────────────────────

  function getAllSessionAvgs(): SessionRatingAvg[] {
    const stored = loadRatings(groupId);

    // date → { title, entries[] } 그루핑
    const map = new Map<string, { title: string; entries: SessionRatingEntry[] }>();
    for (const r of stored) {
      if (!map.has(r.sessionDate)) {
        map.set(r.sessionDate, { title: r.sessionTitle, entries: [] });
      }
      const g = map.get(r.sessionDate)!;
      g.entries.push(r);
      // 가장 최근 등록된 sessionTitle 사용
      g.title = r.sessionTitle;
    }

    const avgs: SessionRatingAvg[] = [];
    for (const [date, { title, entries }] of map.entries()) {
      avgs.push({
        sessionDate: date,
        sessionTitle: title,
        avgSatisfaction: round2(
          entries.reduce((s, r) => s + r.satisfaction, 0) / entries.length
        ),
        avgEfficiency: round2(
          entries.reduce((s, r) => s + r.efficiency, 0) / entries.length
        ),
        avgDifficulty: round2(
          entries.reduce((s, r) => s + r.difficulty, 0) / entries.length
        ),
        ratingCount: entries.length,
      });
    }

    // 날짜 내림차순
    return avgs.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalRatings = ratings.length;

  const avgSatisfaction =
    totalRatings > 0
      ? round2(ratings.reduce((s, r) => s + r.satisfaction, 0) / totalRatings)
      : 0;

  const avgEfficiency =
    totalRatings > 0
      ? round2(ratings.reduce((s, r) => s + r.efficiency, 0) / totalRatings)
      : 0;

  const avgDifficulty =
    totalRatings > 0
      ? round2(ratings.reduce((s, r) => s + r.difficulty, 0) / totalRatings)
      : 0;

  return {
    ratings,
    // CRUD
    addRating,
    deleteRating,
    // 세션별 평균
    getSessionAvg,
    getAllSessionAvgs,
    // 통계
    totalRatings,
    avgSatisfaction,
    avgEfficiency,
    avgDifficulty,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
