"use client";

import { useState, useCallback } from "react";
import type {
  PersonalityProfile,
  PersonalityDanceRole,
  PersonalityTrait,
} from "@/types";

const DEFAULT_TRAITS: PersonalityTrait[] = [
  { trait: "리더십", score: 3 },
  { trait: "창의성", score: 3 },
  { trait: "체력", score: 3 },
  { trait: "표현력", score: 3 },
  { trait: "협동심", score: 3 },
];

function buildStorageKey(groupId: string, userId: string): string {
  return `dancebase:personality:${groupId}:${userId}`;
}

function loadProfile(
  groupId: string,
  userId: string
): PersonalityProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(buildStorageKey(groupId, userId));
    if (!raw) return null;
    return JSON.parse(raw) as PersonalityProfile;
  } catch {
    return null;
  }
}

function createDefaultProfile(userId: string): PersonalityProfile {
  return {
    userId,
    preferredRoles: [],
    traits: DEFAULT_TRAITS,
    bio: "",
    updatedAt: new Date().toISOString(),
  };
}

export function usePersonalityProfile(groupId: string, userId: string) {
  const [profile, setProfile] = useState<PersonalityProfile>(() => {
    return loadProfile(groupId, userId) ?? createDefaultProfile(userId);
  });

  const [isDirty, setIsDirty] = useState(false);

  /** 특성 점수 업데이트 (1-5 범위 강제) */
  const updateTraitScore = useCallback(
    (trait: PersonalityTrait["trait"], score: number) => {
      const clamped = Math.min(5, Math.max(1, Math.round(score)));
      setProfile((prev) => ({
        ...prev,
        traits: prev.traits.map((t) =>
          t.trait === trait ? { ...t, score: clamped } : t
        ),
      }));
      setIsDirty(true);
    },
    []
  );

  /** 역할 토글 (최대 3개) */
  const toggleRole = useCallback((role: PersonalityDanceRole) => {
    setProfile((prev) => {
      const already = prev.preferredRoles.includes(role);
      if (already) {
        return {
          ...prev,
          preferredRoles: prev.preferredRoles.filter((r) => r !== role),
        };
      }
      if (prev.preferredRoles.length >= 3) return prev;
      return {
        ...prev,
        preferredRoles: [...prev.preferredRoles, role],
      };
    });
    setIsDirty(true);
  }, []);

  /** 한줄 소개 업데이트 (최대 100자) */
  const updateBio = useCallback((bio: string) => {
    setProfile((prev) => ({
      ...prev,
      bio: bio.slice(0, 100),
    }));
    setIsDirty(true);
  }, []);

  /** localStorage에 저장 */
  const saveProfile = useCallback(() => {
    if (typeof window === "undefined") return;
    const updated: PersonalityProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        buildStorageKey(groupId, userId),
        JSON.stringify(updated)
      );
      setProfile(updated);
      setIsDirty(false);
    } catch {
      // localStorage 저장 실패 시 무시
    }
  }, [groupId, userId, profile]);

  /** 저장된 데이터로 초기화 (편집 취소) */
  const resetProfile = useCallback(() => {
    const saved = loadProfile(groupId, userId);
    setProfile(saved ?? createDefaultProfile(userId));
    setIsDirty(false);
  }, [groupId, userId]);

  return {
    profile,
    isDirty,
    updateTraitScore,
    toggleRole,
    updateBio,
    saveProfile,
    resetProfile,
  };
}
