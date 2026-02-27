"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import {
  DEFAULT_ROLE_BADGES,
  type RoleBadge,
  type RoleBadgeColor,
  type RoleBadgesData,
  type MemberBadgeAssignments,
} from "@/types";

const MAX_BADGES = 12;

// ============================================
// localStorage 헬퍼
// ============================================

function getBadgesKey(groupId: string): string {
  return `dancebase:role-badges:${groupId}`;
}

function getMemberBadgesKey(groupId: string): string {
  return `dancebase:member-badges:${groupId}`;
}

function loadBadges(groupId: string): RoleBadge[] {
  if (typeof window === "undefined") return DEFAULT_ROLE_BADGES;
  try {
    const raw = localStorage.getItem(getBadgesKey(groupId));
    if (!raw) return DEFAULT_ROLE_BADGES;
    const data: RoleBadgesData = JSON.parse(raw);
    return data.badges ?? DEFAULT_ROLE_BADGES;
  } catch {
    return DEFAULT_ROLE_BADGES;
  }
}

function saveBadges(groupId: string, badges: RoleBadge[]): void {
  if (typeof window === "undefined") return;
  const data: RoleBadgesData = { badges };
  localStorage.setItem(getBadgesKey(groupId), JSON.stringify(data));
}

function loadAssignments(groupId: string): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getMemberBadgesKey(groupId));
    if (!raw) return {};
    const data: MemberBadgeAssignments = JSON.parse(raw);
    return data.assignments ?? {};
  } catch {
    return {};
  }
}

function saveAssignments(
  groupId: string,
  assignments: Record<string, string[]>
): void {
  if (typeof window === "undefined") return;
  const data: MemberBadgeAssignments = { assignments };
  localStorage.setItem(getMemberBadgesKey(groupId), JSON.stringify(data));
}

// ============================================
// 그룹 멤버 조회 SWR 훅
// ============================================

export type GroupMemberForBadge = {
  userId: string;
  name: string;
};

export function useGroupMembersForBadge(groupId: string) {
  const { data, isLoading } = useSWR(
    groupId ? swrKeys.groupMembersForRoleBadge(groupId) : null,
    async () => {
      const supabase = createClient();
      const { data: members, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", groupId);

      if (error) return [];

      return (members ?? []).map((m: { user_id: string; profiles: { id: string; name: string } | null }) => ({
        userId: m.user_id,
        name: m.profiles?.name ?? "알 수 없음",
      })) as GroupMemberForBadge[];
    }
  );

  return { members: data ?? [], loading: isLoading };
}

// ============================================
// 역할 배지 관리 훅
// ============================================

export function useMemberRoleBadges(groupId: string) {
  const [badges, setBadges] = useState<RoleBadge[]>(() =>
    loadBadges(groupId)
  );
  const [assignments, setAssignments] = useState<Record<string, string[]>>(
    () => loadAssignments(groupId)
  );

  // 배지 추가
  const addBadge = useCallback(
    (badge: Omit<RoleBadge, "id" | "isDefault">) => {
      if (badges.length >= MAX_BADGES) return false;
      const newBadge: RoleBadge = {
        ...badge,
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        isDefault: false,
      };
      const next = [...badges, newBadge];
      saveBadges(groupId, next);
      setBadges(next);
      return true;
    },
    [badges, groupId]
  );

  // 배지 삭제 (커스텀만 가능)
  const deleteBadge = useCallback(
    (badgeId: string) => {
      const target = badges.find((b) => b.id === badgeId);
      if (!target || target.isDefault) return false;

      // 해당 배지 할당 제거
      const nextAssignments = { ...assignments };
      for (const userId of Object.keys(nextAssignments)) {
        nextAssignments[userId] = nextAssignments[userId].filter(
          (id) => id !== badgeId
        );
      }

      const nextBadges = badges.filter((b) => b.id !== badgeId);
      saveBadges(groupId, nextBadges);
      saveAssignments(groupId, nextAssignments);
      setBadges(nextBadges);
      setAssignments(nextAssignments);
      return true;
    },
    [badges, assignments, groupId]
  );

  // 특정 배지에 멤버 할당/해제 토글
  const toggleMemberBadge = useCallback(
    (userId: string, badgeId: string) => {
      const current = assignments[userId] ?? [];
      const has = current.includes(badgeId);
      const nextForUser = has
        ? current.filter((id) => id !== badgeId)
        : [...current, badgeId];

      const nextAssignments = {
        ...assignments,
        [userId]: nextForUser,
      };
      saveAssignments(groupId, nextAssignments);
      setAssignments(nextAssignments);
    },
    [assignments, groupId]
  );

  // 멤버에게 배지가 할당되어 있는지 확인
  const hasBadge = useCallback(
    (userId: string, badgeId: string): boolean => {
      return (assignments[userId] ?? []).includes(badgeId);
    },
    [assignments]
  );

  // 배지별 할당된 멤버 수
  const getBadgeMemberCount = useCallback(
    (badgeId: string): number => {
      return Object.values(assignments).filter((ids) =>
        ids.includes(badgeId)
      ).length;
    },
    [assignments]
  );

  // 멤버에게 할당된 배지 목록
  const getMemberBadges = useCallback(
    (userId: string): RoleBadge[] => {
      const ids = assignments[userId] ?? [];
      return badges.filter((b) => ids.includes(b.id));
    },
    [badges, assignments]
  );

  return {
    badges,
    assignments,
    totalBadges: badges.length,
    maxBadges: MAX_BADGES,
    addBadge,
    deleteBadge,
    toggleMemberBadge,
    hasBadge,
    getBadgeMemberCount,
    getMemberBadges,
  };
}

// 색상 선택 옵션
export const ROLE_BADGE_COLOR_OPTIONS: {
  value: RoleBadgeColor;
  label: string;
}[] = [
  { value: "purple", label: "보라" },
  { value: "blue", label: "파랑" },
  { value: "green", label: "초록" },
  { value: "orange", label: "주황" },
  { value: "red", label: "빨강" },
  { value: "pink", label: "분홍" },
];
