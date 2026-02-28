"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SkillMatrixData,
  SkillMatrixSkill,
  SkillMatrixMemberEntry,
  SkillMatrixMemberScore,
  SkillMatrixLevel,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:skill-matrix-data:${groupId}`;
}

function loadData(groupId: string): SkillMatrixData {
  if (typeof window === "undefined") {
    return {
      groupId,
      skills: [],
      members: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return {
        groupId,
        skills: [],
        members: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as SkillMatrixData;
  } catch {
    return {
      groupId,
      skills: [],
      members: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function saveData(data: SkillMatrixData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 기본 데이터
// ============================================

function defaultData(groupId: string): SkillMatrixData {
  return {
    groupId,
    skills: [],
    members: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// 통계 계산 유틸
// ============================================

/** 특정 기술의 평균 현재 레벨 (0인 미평가 제외) */
function calcSkillAvg(members: SkillMatrixMemberEntry[], skillId: string): number {
  const levels: number[] = members
    .map((m) => m.scores[skillId]?.currentLevel ?? 0)
    .filter((lv) => lv > 0);
  if (levels.length === 0) return 0;
  const sum = levels.reduce((a: number, b: number) => a + b, 0);
  return Math.round((sum / levels.length) * 10) / 10;
}

/** 특정 멤버의 평균 현재 레벨 (0인 미평가 제외) */
function calcMemberAvg(member: SkillMatrixMemberEntry): number {
  const levels: number[] = Object.values(member.scores)
    .map((s) => s.currentLevel as number)
    .filter((lv) => lv > 0);
  if (levels.length === 0) return 0;
  const sum = levels.reduce((a: number, b: number) => a + b, 0);
  return Math.round((sum / levels.length) * 10) / 10;
}

/** 전체 평균 현재 레벨 (0인 미평가 제외) */
function calcOverallAvg(members: SkillMatrixMemberEntry[]): number {
  const levels: number[] = members
    .flatMap((m) => Object.values(m.scores).map((s) => s.currentLevel as number))
    .filter((lv) => lv > 0);
  if (levels.length === 0) return 0;
  const sum = levels.reduce((a: number, b: number) => a + b, 0);
  return Math.round((sum / levels.length) * 10) / 10;
}

// ============================================
// 훅
// ============================================

export function useSkillMatrixData(groupId: string) {
  const fallback = defaultData(groupId);

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.skillMatrixData(groupId) : null,
    () => loadData(groupId),
    { fallbackData: fallback, revalidateOnFocus: false }
  );

  const current: SkillMatrixData = data ?? fallback;

  // ── 내부 저장 헬퍼 ──────────────────────────────────────

  const persist = useCallback(
    (next: SkillMatrixData) => {
      const withTs: SkillMatrixData = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      saveData(withTs);
      mutate(withTs, false);
    },
    [mutate]
  );

  // ── 기술 추가 ────────────────────────────────────────────

  const addSkill = useCallback(
    (params: { name: string; category?: string; description?: string }): boolean => {
      const name = params.name.trim();
      if (!name) return false;
      if (current.skills.some((s) => s.name === name)) return false;
      const newSkill: SkillMatrixSkill = {
        id: crypto.randomUUID(),
        name,
        category: params.category?.trim() || undefined,
        description: params.description?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        skills: [...current.skills, newSkill],
      });
      return true;
    },
    [current, persist]
  );

  // ── 기술 삭제 ────────────────────────────────────────────

  const removeSkill = useCallback(
    (skillId: string): void => {
      const updatedMembers = current.members.map((m) => {
        const { [skillId]: _removed, ...restScores } = m.scores;
        return { ...m, scores: restScores };
      });
      persist({
        ...current,
        skills: current.skills.filter((s) => s.id !== skillId),
        members: updatedMembers,
      });
    },
    [current, persist]
  );

  // ── 멤버 추가 ────────────────────────────────────────────

  const addMember = useCallback(
    (memberName: string): boolean => {
      const name = memberName.trim();
      if (!name) return false;
      if (current.members.some((m) => m.memberName === name)) return false;
      const newMember: SkillMatrixMemberEntry = {
        memberName: name,
        scores: {},
      };
      persist({
        ...current,
        members: [...current.members, newMember],
      });
      return true;
    },
    [current, persist]
  );

  // ── 멤버 삭제 ────────────────────────────────────────────

  const removeMember = useCallback(
    (memberName: string): void => {
      persist({
        ...current,
        members: current.members.filter((m) => m.memberName !== memberName),
      });
    },
    [current, persist]
  );

  // ── 점수 업데이트 ─────────────────────────────────────────

  const updateScore = useCallback(
    (
      memberName: string,
      skillId: string,
      patch: Partial<SkillMatrixMemberScore>
    ): void => {
      const updatedMembers = current.members.map((m) => {
        if (m.memberName !== memberName) return m;
        const existing = m.scores[skillId] ?? { currentLevel: 0 as SkillMatrixLevel };
        return {
          ...m,
          scores: {
            ...m.scores,
            [skillId]: { ...existing, ...patch },
          },
        };
      });
      persist({ ...current, members: updatedMembers });
    },
    [current, persist]
  );

  // ── 현재 레벨 순환 클릭 ──────────────────────────────────

  const cycleCurrentLevel = useCallback(
    (memberName: string, skillId: string): void => {
      const member = current.members.find((m) => m.memberName === memberName);
      const cur = (member?.scores[skillId]?.currentLevel ?? 0) as SkillMatrixLevel;
      const next = ((cur + 1) % 6) as SkillMatrixLevel;
      updateScore(memberName, skillId, { currentLevel: next });
    },
    [current, updateScore]
  );

  // ── 목표 레벨 설정 ────────────────────────────────────────

  const setTargetLevel = useCallback(
    (memberName: string, skillId: string, level: SkillMatrixLevel | undefined): void => {
      updateScore(memberName, skillId, { targetLevel: level });
    },
    [updateScore]
  );

  // ── 평가일 기록 ───────────────────────────────────────────

  const recordEvaluation = useCallback(
    (memberName: string, skillId: string, date?: string): void => {
      const today = date ?? new Date().toISOString().slice(0, 10);
      updateScore(memberName, skillId, { lastEvaluatedAt: today });
    },
    [updateScore]
  );

  // ── 통계 ────────────────────────────────────────────────

  const getSkillAvg = useCallback(
    (skillId: string): number => calcSkillAvg(current.members, skillId),
    [current.members]
  );

  const getMemberAvg = useCallback(
    (memberName: string): number => {
      const m = current.members.find((m) => m.memberName === memberName);
      return m ? calcMemberAvg(m) : 0;
    },
    [current.members]
  );

  const overallAvg = calcOverallAvg(current.members);
  const totalSkills = current.skills.length;
  const totalMembers = current.members.length;

  return {
    data: current,
    loading: isLoading,
    refetch: () => mutate(),
    // 기술 관리
    addSkill,
    removeSkill,
    // 멤버 관리
    addMember,
    removeMember,
    // 점수 관리
    updateScore,
    cycleCurrentLevel,
    setTargetLevel,
    recordEvaluation,
    // 통계
    getSkillAvg,
    getMemberAvg,
    overallAvg,
    totalSkills,
    totalMembers,
  };
}
