"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SkillShareData,
  SkillShareItem,
  SkillShareRequest,
  SkillShareRequestStatus,
} from "@/types";

const STORAGE_KEY = (groupId: string) => `group-skill-share-${groupId}`;

function loadData(groupId: string): SkillShareData {
  if (typeof window === "undefined") {
    return { groupId, skills: [], requests: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (raw) {
      return JSON.parse(raw) as SkillShareData;
    }
  } catch {
    // 파싱 실패 시 기본값 반환
  }
  return { groupId, skills: [], requests: [], updatedAt: new Date().toISOString() };
}

function saveData(data: SkillShareData): void {
  localStorage.setItem(STORAGE_KEY(data.groupId), JSON.stringify(data));
}

export function useGroupSkillShare(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupSkillShare(groupId),
    () => loadData(groupId)
  );

  const skillShareData = data ?? { groupId, skills: [], requests: [], updatedAt: new Date().toISOString() };

  // 스킬 등록
  async function addSkill(
    input: Omit<SkillShareItem, "id" | "createdAt">
  ): Promise<void> {
    const newSkill: SkillShareItem = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated: SkillShareData = {
      ...skillShareData,
      skills: [newSkill, ...skillShareData.skills],
      updatedAt: new Date().toISOString(),
    };
    saveData(updated);
    await mutate(updated, false);
  }

  // 스킬 삭제
  async function removeSkill(skillId: string): Promise<void> {
    const updated: SkillShareData = {
      ...skillShareData,
      skills: skillShareData.skills.filter((s) => s.id !== skillId),
      requests: skillShareData.requests.filter((r) => r.skillId !== skillId),
      updatedAt: new Date().toISOString(),
    };
    saveData(updated);
    await mutate(updated, false);
  }

  // 학습 요청 추가
  async function addRequest(
    input: Omit<SkillShareRequest, "id" | "createdAt" | "status">
  ): Promise<void> {
    const newRequest: SkillShareRequest = {
      ...input,
      id: crypto.randomUUID(),
      status: "요청",
      createdAt: new Date().toISOString(),
    };
    const updated: SkillShareData = {
      ...skillShareData,
      requests: [newRequest, ...skillShareData.requests],
      updatedAt: new Date().toISOString(),
    };
    saveData(updated);
    await mutate(updated, false);
  }

  // 요청 상태 변경
  async function updateRequestStatus(
    requestId: string,
    status: SkillShareRequestStatus
  ): Promise<void> {
    const updated: SkillShareData = {
      ...skillShareData,
      requests: skillShareData.requests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
      updatedAt: new Date().toISOString(),
    };
    saveData(updated);
    await mutate(updated, false);
  }

  // 요청 삭제
  async function removeRequest(requestId: string): Promise<void> {
    const updated: SkillShareData = {
      ...skillShareData,
      requests: skillShareData.requests.filter((r) => r.id !== requestId),
      updatedAt: new Date().toISOString(),
    };
    saveData(updated);
    await mutate(updated, false);
  }

  // 통계
  const totalSkills = skillShareData.skills.length;
  const totalRequests = skillShareData.requests.length;

  // 카테고리별 스킬 수
  const categoryStats = skillShareData.skills.reduce<Record<string, number>>(
    (acc, skill) => {
      acc[skill.category] = (acc[skill.category] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // 인기 스킬 (요청 수 기준 내림차순)
  const popularSkills = [...skillShareData.skills]
    .map((skill) => ({
      skill,
      requestCount: skillShareData.requests.filter((r) => r.skillId === skill.id)
        .length,
    }))
    .sort((a, b) => b.requestCount - a.requestCount);

  return {
    data: skillShareData,
    loading: isLoading,
    totalSkills,
    totalRequests,
    categoryStats,
    popularSkills,
    addSkill,
    removeSkill,
    addRequest,
    updateRequestStatus,
    removeRequest,
    refetch: () => mutate(),
  };
}
