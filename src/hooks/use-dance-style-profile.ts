"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberDanceStyleProfile, DanceStyleEntry, DanceStyleLevel } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return `dancebase:dance-style-profile:${memberId}`;
}

function loadProfile(memberId: string): MemberDanceStyleProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    return raw ? (JSON.parse(raw) as MemberDanceStyleProfile) : null;
  } catch {
    return null;
  }
}

function persistProfile(profile: MemberDanceStyleProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(profile.memberId), JSON.stringify(profile));
}

function createEmptyProfile(memberId: string): MemberDanceStyleProfile {
  return {
    id: crypto.randomUUID(),
    memberId,
    styles: [],
    strengths: [],
    weaknesses: [],
    goals: [],
    influences: [],
    bio: "",
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 훅
// ============================================================

export function useMemberDanceStyleProfile(memberId: string) {
  const { data: profile, mutate } = useSWR(
    memberId ? swrKeys.danceStyleProfile(memberId) : null,
    () => loadProfile(memberId) ?? createEmptyProfile(memberId),
    { fallbackData: createEmptyProfile(memberId) }
  );

  const current: MemberDanceStyleProfile = profile ?? createEmptyProfile(memberId);

  // ── 프로필 전체 저장 ──────────────────────────────────────

  async function saveProfile(patch: Partial<Omit<MemberDanceStyleProfile, "id" | "memberId">>) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 댄스 스타일 관리 ──────────────────────────────────────

  async function addStyle(entry: DanceStyleEntry) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      styles: [...current.styles, entry],
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function removeStyle(styleName: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      styles: current.styles.filter((s) => s.style !== styleName),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function updateStyle(styleName: string, patch: Partial<DanceStyleEntry>) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      styles: current.styles.map((s) =>
        s.style === styleName ? { ...s, ...patch } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function toggleStyleFavorite(styleName: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      styles: current.styles.map((s) =>
        s.style === styleName ? { ...s, isFavorite: !s.isFavorite } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 강점 관리 ─────────────────────────────────────────────

  async function addStrength(strength: string) {
    if (current.strengths.includes(strength)) return;
    const updated: MemberDanceStyleProfile = {
      ...current,
      strengths: [...current.strengths, strength],
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function removeStrength(strength: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      strengths: current.strengths.filter((s) => s !== strength),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 약점 관리 ─────────────────────────────────────────────

  async function addWeakness(weakness: string) {
    if (current.weaknesses.includes(weakness)) return;
    const updated: MemberDanceStyleProfile = {
      ...current,
      weaknesses: [...current.weaknesses, weakness],
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function removeWeakness(weakness: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      weaknesses: current.weaknesses.filter((w) => w !== weakness),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 목표 관리 ─────────────────────────────────────────────

  async function addGoal(goal: string) {
    if (current.goals.includes(goal)) return;
    const updated: MemberDanceStyleProfile = {
      ...current,
      goals: [...current.goals, goal],
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function removeGoal(goal: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      goals: current.goals.filter((g) => g !== goal),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 영향 받은 댄서 관리 ───────────────────────────────────

  async function addInfluence(influence: string) {
    if (current.influences.includes(influence)) return;
    const updated: MemberDanceStyleProfile = {
      ...current,
      influences: [...current.influences, influence],
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  async function removeInfluence(influence: string) {
    const updated: MemberDanceStyleProfile = {
      ...current,
      influences: current.influences.filter((i) => i !== influence),
      updatedAt: new Date().toISOString(),
    };
    persistProfile(updated);
    await mutate(updated, false);
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalStyles = current.styles.length;
  const expertStyles = current.styles.filter((s) => s.level === "expert").length;
  const averageExperience =
    totalStyles > 0
      ? Math.round(
          (current.styles.reduce((sum, s) => sum + s.yearsOfExperience, 0) /
            totalStyles) *
            10
        ) / 10
      : 0;

  const levelCounts: Record<DanceStyleLevel, number> = {
    beginner: current.styles.filter((s) => s.level === "beginner").length,
    intermediate: current.styles.filter((s) => s.level === "intermediate").length,
    advanced: current.styles.filter((s) => s.level === "advanced").length,
    expert: current.styles.filter((s) => s.level === "expert").length,
  };

  const stats = {
    totalStyles,
    expertStyles,
    averageExperience,
    levelCounts,
    favoriteStyles: current.styles.filter((s) => s.isFavorite).length,
  };

  return {
    profile: current,
    saveProfile,
    addStyle,
    removeStyle,
    updateStyle,
    toggleStyleFavorite,
    addStrength,
    removeStrength,
    addWeakness,
    removeWeakness,
    addGoal,
    removeGoal,
    addInfluence,
    removeInfluence,
    stats,
    refetch: () => mutate(),
  };
}
