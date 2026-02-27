"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceStyleDimension,
  DanceStyleProfile,
  StyleCompatibilityResult,
} from "@/types";
import { DANCE_STYLE_DIMENSIONS } from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:dance-style:${groupId}`;
}

function loadProfiles(groupId: string): DanceStyleProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as DanceStyleProfile[];
  } catch {
    return [];
  }
}

function saveProfiles(groupId: string, profiles: DanceStyleProfile[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(groupId), JSON.stringify(profiles));
}

// ============================================
// 기본 스코어
// ============================================

export function defaultDanceStyleScores(): Record<DanceStyleDimension, number> {
  return {
    rhythm:      3,
    flexibility: 3,
    power:       3,
    groove:      3,
    precision:   3,
  };
}

// ============================================
// 호환성 계산 로직
// ============================================

/**
 * 두 프로필 간의 호환성 점수를 계산합니다.
 *
 * - 보완적 영역 (diff >= 2): 한쪽이 강하고 다른 쪽이 약한 항목 → +15점
 * - 유사 영역    (diff <= 1): 비슷한 수준의 항목 → +10점
 * - 기본 점수: 30점
 * - clamp: 0-100
 */
function calcCompatibility(
  a: DanceStyleProfile,
  b: DanceStyleProfile
): StyleCompatibilityResult {
  const complementaryAreas: DanceStyleDimension[] = [];
  const similarAreas: DanceStyleDimension[] = [];

  for (const dim of DANCE_STYLE_DIMENSIONS) {
    const diff = Math.abs((a.scores[dim] ?? 3) - (b.scores[dim] ?? 3));
    if (diff >= 2) {
      complementaryAreas.push(dim);
    } else {
      // diff <= 1
      similarAreas.push(dim);
    }
  }

  const raw =
    complementaryAreas.length * 15 + similarAreas.length * 10 + 30;
  const compatibilityScore = Math.min(100, Math.max(0, raw));

  return {
    partnerId:         b.userId,
    partnerName:       b.userName,
    compatibilityScore,
    complementaryAreas,
    similarAreas,
  };
}

// ============================================
// 훅
// ============================================

export type UseDanceStyleCompatibilityReturn = {
  /** 전체 프로필 목록 */
  profiles: DanceStyleProfile[];
  /** 내 프로필 (없으면 null) */
  myProfile: DanceStyleProfile | null;
  /** 내 프로필 저장/업데이트 */
  saveMyProfile: (
    userId: string,
    userName: string,
    scores: Record<DanceStyleDimension, number>,
    preferredStyle: string
  ) => void;
  /** 특정 사용자 기준 호환성 결과 (점수 내림차순) */
  getCompatibilityResults: (userId: string) => StyleCompatibilityResult[];
  loading: boolean;
  refetch: () => void;
};

export function useDanceStyleCompatibility(
  groupId: string,
  myUserId: string
): UseDanceStyleCompatibilityReturn {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.danceStyleCompatibility(groupId),
    () => loadProfiles(groupId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const profiles = data ?? [];
  const myProfile =
    profiles.find((p) => p.userId === myUserId) ?? null;

  function saveMyProfile(
    userId: string,
    userName: string,
    scores: Record<DanceStyleDimension, number>,
    preferredStyle: string
  ): void {
    const next = profiles.filter((p) => p.userId !== userId);
    const newProfile: DanceStyleProfile = {
      userId,
      userName,
      scores,
      preferredStyle,
      updatedAt: new Date().toISOString(),
    };
    next.push(newProfile);
    saveProfiles(groupId, next);
    mutate(next, false);
  }

  function getCompatibilityResults(userId: string): StyleCompatibilityResult[] {
    const me = profiles.find((p) => p.userId === userId);
    if (!me) return [];

    const others = profiles.filter((p) => p.userId !== userId);
    const results = others.map((partner) => calcCompatibility(me, partner));

    // 호환성 점수 내림차순 정렬
    return results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  return {
    profiles,
    myProfile,
    saveMyProfile,
    getCompatibilityResults,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
