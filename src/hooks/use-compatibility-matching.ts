"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  CompatibilityDimension,
  MemberCompatibilityProfile,
  CompatibilityPairResult,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================
// 상수
// ============================================

const ALL_DIMENSIONS: CompatibilityDimension[] = [
  "personality",
  "skill_level",
  "schedule",
  "communication",
  "dance_style",
];

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string) =>
  `dancebase:compatibility:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadProfiles(groupId: string): MemberCompatibilityProfile[] {
  return loadFromStorage<MemberCompatibilityProfile[]>(LS_KEY(groupId), []);
}

function saveProfiles(
  groupId: string,
  profiles: MemberCompatibilityProfile[]
): void {
  saveToStorage(LS_KEY(groupId), profiles);
}

// ============================================
// 점수 계산 유틸
// ============================================

/**
 * 두 멤버 간 단일 차원 호환도 점수를 계산합니다.
 * 차이(0~4)를 역수로 변환하여 0~100 스케일로 반환합니다.
 * 차이 0 → 100점, 차이 4 → 0점
 */
function calcDimensionScore(a: number, b: number): number {
  const diff = Math.abs(a - b); // 0 ~ 4
  return Math.round(((4 - diff) / 4) * 100);
}

/**
 * 두 프로필 간 전체 호환도 점수와 차원별 점수를 계산합니다.
 */
function calcCompatibility(
  profileA: MemberCompatibilityProfile,
  profileB: MemberCompatibilityProfile
): CompatibilityPairResult {
  const dimensionScores = {} as Record<CompatibilityDimension, number>;
  let total = 0;

  for (const dim of ALL_DIMENSIONS) {
    const score = calcDimensionScore(
      profileA.dimensions[dim],
      profileB.dimensions[dim]
    );
    dimensionScores[dim] = score;
    total += score;
  }

  const overallScore = Math.round(total / ALL_DIMENSIONS.length);

  return {
    memberA: profileA.memberName,
    memberB: profileB.memberName,
    overallScore,
    dimensionScores,
  };
}

// ============================================
// 훅
// ============================================

export function useCompatibilityMatching(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.compatibilityMatching(groupId) : null,
    () => loadProfiles(groupId),
    { revalidateOnFocus: false }
  );

  const profiles: MemberCompatibilityProfile[] = data ?? [];

  // ── 프로필 설정/업데이트 ──────────────────────────────────

  function setProfile(
    memberName: string,
    dimensions: Record<CompatibilityDimension, number>
  ): void {
    const existing = profiles.find((p) => p.memberName === memberName);
    let next: MemberCompatibilityProfile[];

    if (existing) {
      next = profiles.map((p) =>
        p.memberName === memberName ? { ...p, dimensions } : p
      );
    } else {
      const newProfile: MemberCompatibilityProfile = {
        id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        memberName,
        dimensions,
        createdAt: new Date().toISOString(),
      };
      next = [...profiles, newProfile];
    }

    saveProfiles(groupId, next);
    mutate(next, false);
  }

  // ── 프로필 삭제 ──────────────────────────────────────────

  function deleteProfile(memberName: string): void {
    const next = profiles.filter((p) => p.memberName !== memberName);
    saveProfiles(groupId, next);
    mutate(next, false);
  }

  // ── 두 멤버 간 호환도 계산 ───────────────────────────────

  function calculateCompatibility(
    memberA: string,
    memberB: string
  ): CompatibilityPairResult | null {
    const profileA = profiles.find((p) => p.memberName === memberA);
    const profileB = profiles.find((p) => p.memberName === memberB);

    if (!profileA || !profileB) return null;

    return calcCompatibility(profileA, profileB);
  }

  // ── 특정 멤버와 호환도 높은 Top N 반환 ───────────────────

  function getBestMatches(
    memberName: string,
    top = 3
  ): CompatibilityPairResult[] {
    const profile = profiles.find((p) => p.memberName === memberName);
    if (!profile) return [];

    const results: CompatibilityPairResult[] = [];

    for (const other of profiles) {
      if (other.memberName === memberName) continue;
      results.push(calcCompatibility(profile, other));
    }

    return results
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, top);
  }

  // ── 통계 ────────────────────────────────────────────────

  const profileCount = profiles.length;

  let averageCompatibility = 0;
  if (profileCount >= 2) {
    let totalScore = 0;
    let pairCount = 0;

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const result = calcCompatibility(profiles[i], profiles[j]);
        totalScore += result.overallScore;
        pairCount++;
      }
    }

    averageCompatibility =
      pairCount > 0 ? Math.round(totalScore / pairCount) : 0;
  }

  return {
    // 데이터
    profiles,
    // 액션
    setProfile,
    deleteProfile,
    calculateCompatibility,
    getBestMatches,
    // 통계
    profileCount,
    averageCompatibility,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
