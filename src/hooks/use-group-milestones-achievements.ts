"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupMilestone, GroupMilestoneCategory } from "@/types";
import { loadFromStorage } from "@/lib/local-storage";

const STORAGE_KEY_PREFIX = "dancebase:group-milestones:";

// ============================================
// 기본 마일스톤 정의
// ============================================

type DefaultMilestoneTemplate = {
  title: string;
  category: GroupMilestoneCategory;
  targetValue: number;
};

const DEFAULT_MILESTONE_TEMPLATES: DefaultMilestoneTemplate[] = [
  { title: "멤버 10명 달성", category: "members", targetValue: 10 },
  { title: "멤버 20명 달성", category: "members", targetValue: 20 },
  { title: "멤버 50명 달성", category: "members", targetValue: 50 },
  { title: "일정 50회 개최", category: "schedules", targetValue: 50 },
  { title: "일정 100회 개최", category: "schedules", targetValue: 100 },
  { title: "게시글 100개 달성", category: "posts", targetValue: 100 },
];

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function persistToStorage(groupId: string, milestones: GroupMilestone[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(milestones));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 현재 값 조회 (Supabase)
// ============================================

type CurrentValues = {
  members: number;
  schedules: number;
  posts: number;
};

async function fetchCurrentValues(groupId: string): Promise<CurrentValues> {
  const supabase = createClient();

  const [membersRes, schedulesRes, postsRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
    supabase
      .from("schedules")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
    supabase
      .from("board_posts")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  return {
    members: membersRes.count ?? 0,
    schedules: schedulesRes.count ?? 0,
    posts: postsRes.count ?? 0,
  };
}

// ============================================
// 기본 마일스톤 생성
// ============================================

function createDefaultMilestones(groupId: string): GroupMilestone[] {
  const now = new Date().toISOString();
  return DEFAULT_MILESTONE_TEMPLATES.map((tpl, index) => ({
    id: `${groupId}-default-${index}-${Math.random().toString(36).slice(2, 9)}`,
    title: tpl.title,
    category: tpl.category,
    targetValue: tpl.targetValue,
    currentValue: 0,
    achieved: false,
    achievedAt: null,
    isDefault: true,
    // createdAt은 타입에 없으므로 내부 식별용으로만 사용
    _createdAt: now,
  })) as GroupMilestone[];
}

// ============================================
// 달성 상태 동기화
// ============================================

function syncAchievedStatus(
  milestones: GroupMilestone[],
  currentValues: CurrentValues
): GroupMilestone[] {
  const now = new Date().toISOString();

  return milestones.map((m) => {
    let current = m.currentValue;

    if (m.category === "members") current = currentValues.members;
    else if (m.category === "schedules") current = currentValues.schedules;
    else if (m.category === "posts") current = currentValues.posts;
    // custom 카테고리는 currentValue를 외부에서 수동 관리

    const wasAchieved = m.achieved;
    const nowAchieved = current >= m.targetValue;

    return {
      ...m,
      currentValue: current,
      achieved: nowAchieved,
      // 새로 달성된 경우에만 달성일 기록
      achievedAt: nowAchieved
        ? wasAchieved
          ? m.achievedAt
          : (m.achievedAt ?? now)
        : null,
    };
  });
}

// ============================================
// 훅
// ============================================

export type GroupMilestonesAchievementsResult = {
  milestones: GroupMilestone[];
  recentlyAchieved: GroupMilestone | null;
  addCustomMilestone: (title: string, targetValue: number) => void;
  deleteMilestone: (id: string) => void;
  loading: boolean;
  refetch: () => void;
};

export function useGroupMilestonesAchievements(
  groupId: string
): GroupMilestonesAchievementsResult {
  // localStorage에서 초기 상태 로드 (기본 마일스톤 자동 생성 포함)
  const [milestones, setMilestones] = useState<GroupMilestone[]>(() => {
    const stored = loadFromStorage<GroupMilestone[] | null>(getStorageKey(groupId), {} as GroupMilestone[] | null);
    if (stored !== null) return stored;
    const defaults = createDefaultMilestones(groupId);
    persistToStorage(groupId, defaults);
    return defaults;
  });

  // Supabase에서 현재 값 조회 후 달성 상태 동기화
  const { isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupMilestonesAchievements(groupId) : null,
    async () => {
      const currentValues = await fetchCurrentValues(groupId);
      return currentValues;
    },
    {
      onSuccess: (currentValues) => {
        setMilestones((prev) => {
          const synced = syncAchievedStatus(prev, currentValues);
          persistToStorage(groupId, synced);
          return synced;
        });
      },
    }
  );

  // 최근 달성 마일스톤: 달성된 것 중 achievedAt이 가장 최근인 것
  const recentlyAchieved: GroupMilestone | null = (() => {
    const achieved = milestones.filter((m) => m.achieved && m.achievedAt !== null);
    if (achieved.length === 0) return null;
    return achieved.reduce((latest, m) =>
      (m.achievedAt ?? "") > (latest.achievedAt ?? "") ? m : latest
    );
  })();

  const addCustomMilestone = useCallback(
    (title: string, targetValue: number) => {
      const newMilestone: GroupMilestone = {
        id: `${groupId}-custom-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        title,
        category: "custom",
        targetValue,
        currentValue: 0,
        achieved: false,
        achievedAt: null,
        isDefault: false,
      };
      setMilestones((prev) => {
        const next = [...prev, newMilestone];
        persistToStorage(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  const deleteMilestone = useCallback(
    (id: string) => {
      setMilestones((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persistToStorage(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  return {
    milestones,
    recentlyAchieved,
    addCustomMilestone,
    deleteMilestone,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
