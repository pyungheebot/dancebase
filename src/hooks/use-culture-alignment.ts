"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { CultureDimension, CultureProfile, GroupCultureConfig } from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────

const DIMENSIONS: CultureDimension[] = [
  "teamwork",
  "creativity",
  "discipline",
  "fun",
  "growth",
];

const DEFAULT_IDEAL_SCORES: Record<CultureDimension, number> = {
  teamwork: 7,
  creativity: 7,
  discipline: 7,
  fun: 7,
  growth: 7,
};

const DEFAULT_CONFIG: GroupCultureConfig = {
  idealScores: { ...DEFAULT_IDEAL_SCORES },
  profiles: [],
  createdAt: new Date().toISOString(),
};

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:culture-alignment:${groupId}`;

// ─── 맞춤도 계산 헬퍼 ─────────────────────────────────────────

/**
 * 이상 가치와 멤버 프로필의 유클리드 거리 기반 맞춤도 계산 (0-100%)
 * 각 차원 최대 차이는 9 (10-1), 5개 차원이므로 최대 거리 = sqrt(5 * 81)
 */
function computeAlignment(
  idealScores: Record<CultureDimension, number>,
  profile: CultureProfile
): number {
  const maxDistance = Math.sqrt(DIMENSIONS.length * Math.pow(9, 2));
  const distance = Math.sqrt(
    DIMENSIONS.reduce((sum, dim) => {
      const diff = (idealScores[dim] ?? 5) - (profile.scores[dim] ?? 5);
      return sum + diff * diff;
    }, 0)
  );
  return Math.round(Math.max(0, (1 - distance / maxDistance) * 100));
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useCultureAlignment(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.cultureAlignment(groupId) : null,
    () => loadFromStorage<GroupCultureConfig>(LS_KEY(groupId), DEFAULT_CONFIG),
    { revalidateOnFocus: false }
  );

  const config = data ?? {
    idealScores: { ...DEFAULT_IDEAL_SCORES },
    profiles: [],
    createdAt: new Date().toISOString(),
  };

  // ── 그룹 이상 가치 설정 ──────────────────────────────────────

  function setIdealScores(scores: Record<CultureDimension, number>): boolean {
    try {
      const stored = loadFromStorage<GroupCultureConfig>(LS_KEY(groupId), DEFAULT_CONFIG);
      const next: GroupCultureConfig = {
        ...stored,
        idealScores: scores,
      };
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("그룹 이상 가치가 저장되었습니다.");
      return true;
    } catch {
      toast.error("이상 가치 저장에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 프로필 추가 ─────────────────────────────────────────

  function addProfile(
    memberName: string,
    scores: Record<CultureDimension, number>
  ): boolean {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<GroupCultureConfig>(LS_KEY(groupId), DEFAULT_CONFIG);
      const duplicate = stored.profiles.some(
        (p) => p.memberName.toLowerCase() === memberName.trim().toLowerCase()
      );
      if (duplicate) {
        toast.error("이미 등록된 멤버 이름입니다.");
        return false;
      }
      const newProfile: CultureProfile = {
        id: crypto.randomUUID(),
        memberName: memberName.trim(),
        scores,
        updatedAt: new Date().toISOString(),
      };
      const next: GroupCultureConfig = {
        ...stored,
        profiles: [...stored.profiles, newProfile],
      };
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success(`${memberName.trim()}님의 프로필이 추가되었습니다.`);
      return true;
    } catch {
      toast.error("프로필 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 프로필 업데이트 ────────────────────────────────────

  function updateProfile(
    profileId: string,
    scores: Record<CultureDimension, number>
  ): boolean {
    try {
      const stored = loadFromStorage<GroupCultureConfig>(LS_KEY(groupId), DEFAULT_CONFIG);
      const exists = stored.profiles.some((p) => p.id === profileId);
      if (!exists) {
        toast.error("프로필을 찾을 수 없습니다.");
        return false;
      }
      const next: GroupCultureConfig = {
        ...stored,
        profiles: stored.profiles.map((p) =>
          p.id === profileId
            ? { ...p, scores, updatedAt: new Date().toISOString() }
            : p
        ),
      };
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("프로필이 업데이트되었습니다.");
      return true;
    } catch {
      toast.error("프로필 업데이트에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버 프로필 삭제 ─────────────────────────────────────────

  function deleteProfile(id: string): boolean {
    try {
      const stored = loadFromStorage<GroupCultureConfig>(LS_KEY(groupId), DEFAULT_CONFIG);
      const next: GroupCultureConfig = {
        ...stored,
        profiles: stored.profiles.filter((p) => p.id !== id),
      };
      if (next.profiles.length === stored.profiles.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("프로필이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("프로필 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 맞춤도 계산 ──────────────────────────────────────────────

  function calculateAlignment(profile: CultureProfile): number {
    return computeAlignment(config.idealScores, profile);
  }

  // ── 전체 멤버 맞춤도 (높은 순) ──────────────────────────────

  function getAllAlignments(): Array<{ profile: CultureProfile; alignment: number }> {
    return config.profiles
      .map((profile) => ({
        profile,
        alignment: computeAlignment(config.idealScores, profile),
      }))
      .sort((a, b) => b.alignment - a.alignment);
  }

  // ── 그룹 평균 프로필 ────────────────────────────────────────

  function groupAverage(): Record<CultureDimension, number> {
    if (config.profiles.length === 0) {
      return { ...DEFAULT_IDEAL_SCORES };
    }
    const sums = DIMENSIONS.reduce(
      (acc, dim) => {
        acc[dim] = config.profiles.reduce(
          (s, p) => s + (p.scores[dim] ?? 5),
          0
        );
        return acc;
      },
      {} as Record<CultureDimension, number>
    );
    return DIMENSIONS.reduce(
      (acc, dim) => {
        acc[dim] = Math.round((sums[dim] / config.profiles.length) * 10) / 10;
        return acc;
      },
      {} as Record<CultureDimension, number>
    );
  }

  // ── 그룹 평균 맞춤도 ────────────────────────────────────────

  const averageAlignment =
    config.profiles.length > 0
      ? Math.round(
          config.profiles.reduce(
            (sum, p) => sum + computeAlignment(config.idealScores, p),
            0
          ) / config.profiles.length
        )
      : 0;

  return {
    config,
    // CRUD
    setIdealScores,
    addProfile,
    updateProfile,
    deleteProfile,
    // 분석
    calculateAlignment,
    getAllAlignments,
    groupAverage,
    // 통계
    averageAlignment,
    memberCount: config.profiles.length,
    // SWR
    refetch: () => mutate(),
  };
}
