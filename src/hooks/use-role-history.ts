"use client";

import { useState, useEffect, useCallback } from "react";
import type { RoleHistoryEntry, MemberRoleType } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:role-history:${groupId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadEntries(groupId: string): RoleHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as RoleHistoryEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: RoleHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(entries));
  } catch {
    // 무시
  }
}

// ============================================
// 통계 타입
// ============================================

export type RoleDistribution = {
  role: MemberRoleType;
  count: number;
  members: string[];
};

export type RoleHistoryStats = {
  totalEntries: number;
  activeRoles: number;
  roleDistribution: RoleDistribution[];
};

// ============================================
// 멤버 역할 히스토리 훅
// ============================================

export function useRoleHistory(groupId: string) {
  const [entries, setEntries] = useState<RoleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 데이터 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadEntries(groupId);
    setEntries(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 역할 배정
  const assignRole = useCallback(
    (params: {
      memberName: string;
      role: MemberRoleType;
      customRoleTitle?: string;
      startDate: string;
      assignedBy?: string;
      notes?: string;
    }): RoleHistoryEntry => {
      const newEntry: RoleHistoryEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        role: params.role,
        customRoleTitle: params.customRoleTitle,
        startDate: params.startDate,
        endDate: undefined,
        isActive: true,
        assignedBy: params.assignedBy,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };

      const updated = [...entries, newEntry];
      saveEntries(groupId, updated);
      setEntries(updated);
      return newEntry;
    },
    [groupId, entries]
  );

  // 역할 종료
  const endRole = useCallback(
    (id: string, endDate: string) => {
      const updated = entries.map((e) =>
        e.id === id ? { ...e, endDate, isActive: false } : e
      );
      saveEntries(groupId, updated);
      setEntries(updated);
    },
    [groupId, entries]
  );

  // 항목 삭제
  const deleteEntry = useCallback(
    (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      saveEntries(groupId, updated);
      setEntries(updated);
    },
    [groupId, entries]
  );

  // 멤버별 이력 조회
  const getByMember = useCallback(
    (memberName: string): RoleHistoryEntry[] => {
      return entries
        .filter((e) => e.memberName === memberName)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    },
    [entries]
  );

  // 현재 활성 역할 조회
  const getCurrentRole = useCallback(
    (memberName: string): RoleHistoryEntry | undefined => {
      return entries.find((e) => e.memberName === memberName && e.isActive);
    },
    [entries]
  );

  // 역할별 현재 멤버 조회
  const getMembersByRole = useCallback(
    (role: MemberRoleType): string[] => {
      return entries
        .filter((e) => e.role === role && e.isActive)
        .map((e) => e.memberName);
    },
    [entries]
  );

  // 통계
  const stats: RoleHistoryStats = (() => {
    const activeEntries = entries.filter((e) => e.isActive);

    const roleMap = new Map<MemberRoleType, string[]>();
    for (const e of activeEntries) {
      const existing = roleMap.get(e.role) ?? [];
      roleMap.set(e.role, [...existing, e.memberName]);
    }

    const roleDistribution: RoleDistribution[] = Array.from(
      roleMap.entries()
    ).map(([role, members]) => ({ role, count: members.length, members }));

    return {
      totalEntries: entries.length,
      activeRoles: activeEntries.length,
      roleDistribution,
    };
  })();

  return {
    entries,
    loading,
    assignRole,
    endRole,
    deleteEntry,
    getByMember,
    getCurrentRole,
    getMembersByRole,
    stats,
    refetch: reload,
  };
}
