"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceStyleProfileV2,
  DanceProfileGenreEntry,
  DanceProfilePosition,
  DanceProfilePracticeTime,
  DanceProfileInspirationEntry,
  DanceProfileBpmRange,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return `dancebase:dance-style-profile-v2:${memberId}`;
}

function loadProfile(memberId: string): DanceStyleProfileV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    return raw ? (JSON.parse(raw) as DanceStyleProfileV2) : null;
  } catch {
    return null;
  }
}

function persistProfile(profile: DanceStyleProfileV2): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(profile.memberId), JSON.stringify(profile));
  } catch {
    // 무시
  }
}

function createEmptyProfile(memberId: string): DanceStyleProfileV2 {
  return {
    memberId,
    genres: [],
    position: null,
    bio: "",
    inspirations: [],
    practiceTimes: [],
    bpmRange: { min: 80, max: 140 },
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 훅
// ============================================================

export function useDanceStyleProfileV2(memberId: string) {
  const { data: profile, mutate } = useSWR(
    memberId ? swrKeys.danceStyleProfileV2(memberId) : null,
    () => loadProfile(memberId) ?? createEmptyProfile(memberId),
    { fallbackData: createEmptyProfile(memberId) }
  );

  const current: DanceStyleProfileV2 = profile ?? createEmptyProfile(memberId);

  // ── 내부 저장 헬퍼 ──────────────────────────────────────
  async function persist(next: DanceStyleProfileV2): Promise<void> {
    persistProfile(next);
    await mutate(next, false);
  }

  // ── 프로필 전체 업데이트 ──────────────────────────────────
  async function saveProfile(
    patch: Partial<Omit<DanceStyleProfileV2, "memberId" | "updatedAt">>
  ): Promise<void> {
    await persist({ ...current, ...patch, updatedAt: new Date().toISOString() });
  }

  // ── 장르 관리 ─────────────────────────────────────────────

  async function addGenre(entry: DanceProfileGenreEntry): Promise<void> {
    if (current.genres.some((g) => g.genre === entry.genre)) return;
    await persist({
      ...current,
      genres: [...current.genres, entry],
      updatedAt: new Date().toISOString(),
    });
  }

  async function updateGenre(
    genreName: string,
    patch: Partial<DanceProfileGenreEntry>
  ): Promise<void> {
    await persist({
      ...current,
      genres: current.genres.map((g) =>
        g.genre === genreName ? { ...g, ...patch } : g
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  async function removeGenre(genreName: string): Promise<void> {
    await persist({
      ...current,
      genres: current.genres.filter((g) => g.genre !== genreName),
      updatedAt: new Date().toISOString(),
    });
  }

  // ── 포지션 ────────────────────────────────────────────────

  async function setPosition(position: DanceProfilePosition | null): Promise<void> {
    await persist({ ...current, position, updatedAt: new Date().toISOString() });
  }

  // ── 자기소개 ──────────────────────────────────────────────

  async function setBio(bio: string): Promise<void> {
    await persist({ ...current, bio, updatedAt: new Date().toISOString() });
  }

  // ── 영감 댄서 관리 ────────────────────────────────────────

  async function addInspiration(entry: DanceProfileInspirationEntry): Promise<void> {
    if (current.inspirations.some((i) => i.name === entry.name)) return;
    await persist({
      ...current,
      inspirations: [...current.inspirations, entry],
      updatedAt: new Date().toISOString(),
    });
  }

  async function updateInspiration(
    name: string,
    patch: Partial<DanceProfileInspirationEntry>
  ): Promise<void> {
    await persist({
      ...current,
      inspirations: current.inspirations.map((i) =>
        i.name === name ? { ...i, ...patch } : i
      ),
      updatedAt: new Date().toISOString(),
    });
  }

  async function removeInspiration(name: string): Promise<void> {
    await persist({
      ...current,
      inspirations: current.inspirations.filter((i) => i.name !== name),
      updatedAt: new Date().toISOString(),
    });
  }

  // ── 연습 시간 선호도 ──────────────────────────────────────

  async function togglePracticeTime(time: DanceProfilePracticeTime): Promise<void> {
    const exists = current.practiceTimes.includes(time);
    await persist({
      ...current,
      practiceTimes: exists
        ? current.practiceTimes.filter((t) => t !== time)
        : [...current.practiceTimes, time],
      updatedAt: new Date().toISOString(),
    });
  }

  // ── BPM 범위 ──────────────────────────────────────────────

  async function setBpmRange(range: DanceProfileBpmRange): Promise<void> {
    await persist({ ...current, bpmRange: range, updatedAt: new Date().toISOString() });
  }

  // ── 통계 ──────────────────────────────────────────────────

  const stats = {
    totalGenres: current.genres.length,
    maxStarGenre:
      current.genres.length > 0
        ? current.genres.reduce((a, b) => (a.stars >= b.stars ? a : b))
        : null,
    averageStars:
      current.genres.length > 0
        ? Math.round(
            (current.genres.reduce((sum, g) => sum + g.stars, 0) /
              current.genres.length) *
              10
          ) / 10
        : 0,
  };

  return {
    profile: current,
    saveProfile,
    addGenre,
    updateGenre,
    removeGenre,
    setPosition,
    setBio,
    addInspiration,
    updateInspiration,
    removeInspiration,
    togglePracticeTime,
    setBpmRange,
    stats,
    refetch: () => mutate(),
  };
}
