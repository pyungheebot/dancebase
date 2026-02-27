"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SkillMatrixConfig, SkillMatrixLevel } from "@/types";

// ============================================
// 상수 및 기본값
// ============================================

const LS_KEY = (groupId: string) =>
  `dancebase:skill-matrix:${groupId}`;

const DEFAULT_MATRIX = (now: string): SkillMatrixConfig => ({
  skillNames: [],
  entries: [],
  createdAt: now,
  updatedAt: now,
});

// ============================================
// localStorage 헬퍼
// ============================================

function loadMatrix(groupId: string): SkillMatrixConfig {
  if (typeof window === "undefined") {
    const now = new Date().toISOString();
    return DEFAULT_MATRIX(now);
  }
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) {
      const now = new Date().toISOString();
      return DEFAULT_MATRIX(now);
    }
    return JSON.parse(raw) as SkillMatrixConfig;
  } catch {
    const now = new Date().toISOString();
    return DEFAULT_MATRIX(now);
  }
}

function saveMatrix(groupId: string, config: SkillMatrixConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(config));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useSkillMatrix(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.skillMatrix(groupId) : null,
    () => loadMatrix(groupId),
    { revalidateOnFocus: false }
  );

  const config: SkillMatrixConfig = data ?? DEFAULT_MATRIX(new Date().toISOString());

  // ── 저장 헬퍼 ────────────────────────────────────────────

  function persist(next: SkillMatrixConfig) {
    const withTimestamp: SkillMatrixConfig = {
      ...next,
      updatedAt: new Date().toISOString(),
    };
    saveMatrix(groupId, withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 스킬 관리 ────────────────────────────────────────────

  function addSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed || config.skillNames.includes(trimmed)) return false;
    const next: SkillMatrixConfig = {
      ...config,
      skillNames: [...config.skillNames, trimmed],
    };
    persist(next);
    return true;
  }

  function removeSkill(name: string) {
    const next: SkillMatrixConfig = {
      ...config,
      skillNames: config.skillNames.filter((s) => s !== name),
      entries: config.entries.map((entry) => {
        const { [name]: _removed, ...rest } = entry.skills;
        return { ...entry, skills: rest as Record<string, SkillMatrixLevel> };
      }),
    };
    persist(next);
  }

  // ── 멤버 관리 ────────────────────────────────────────────

  function addMember(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const exists = config.entries.some((e) => e.memberName === trimmed);
    if (exists) return false;
    const next: SkillMatrixConfig = {
      ...config,
      entries: [...config.entries, { memberName: trimmed, skills: {} }],
    };
    persist(next);
    return true;
  }

  function removeMember(name: string) {
    const next: SkillMatrixConfig = {
      ...config,
      entries: config.entries.filter((e) => e.memberName !== name),
    };
    persist(next);
  }

  // ── 레벨 업데이트 ────────────────────────────────────────

  function updateLevel(memberName: string, skillName: string, level: SkillMatrixLevel) {
    const next: SkillMatrixConfig = {
      ...config,
      entries: config.entries.map((entry) => {
        if (entry.memberName !== memberName) return entry;
        return {
          ...entry,
          skills: { ...entry.skills, [skillName]: level },
        };
      }),
    };
    persist(next);
  }

  // ── 분석 함수 ────────────────────────────────────────────

  function getSkillAvg(skillName: string): number {
    const levels = config.entries
      .map((e) => e.skills[skillName] ?? 0)
      .filter((lv) => lv > 0);
    if (levels.length === 0) return 0;
    const sum = levels.reduce((a, b) => a + b, 0 as number) as number;
    return Math.round((sum / levels.length) * 10) / 10;
  }

  function getTopPerformer(skillName: string): string | null {
    let topName: string | null = null;
    let topLevel: SkillMatrixLevel = 0;
    for (const entry of config.entries) {
      const lv = (entry.skills[skillName] ?? 0) as SkillMatrixLevel;
      if (lv > topLevel) {
        topLevel = lv;
        topName = entry.memberName;
      }
    }
    return topName;
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalMembers = config.entries.length;
  const totalSkills = config.skillNames.length;

  const allLevels: number[] = config.entries.flatMap((entry) =>
    config.skillNames.map((skill) => entry.skills[skill] ?? 0)
  );
  const evaluatedLevels = allLevels.filter((lv) => lv > 0);
  const overallAvg =
    evaluatedLevels.length === 0
      ? 0
      : Math.round(
          (evaluatedLevels.reduce((a, b) => a + b, 0) / evaluatedLevels.length) * 10
        ) / 10;

  return {
    config,
    loading: data === undefined,
    // 스킬 관리
    addSkill,
    removeSkill,
    // 멤버 관리
    addMember,
    removeMember,
    // 레벨 업데이트
    updateLevel,
    // 분석
    getTopPerformer,
    getSkillAvg,
    // 통계
    totalMembers,
    totalSkills,
    overallAvg,
    // SWR
    refetch: () => mutate(),
  };
}
