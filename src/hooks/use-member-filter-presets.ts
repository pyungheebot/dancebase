"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  MemberFilterPreset,
  MemberFilterCondition,
  MemberFilterRole,
  MemberActivityStatus,
  GroupMemberWithProfile,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "dancebase:member-filter-presets:";

// ============================================
// 기본 프리셋 정의
// ============================================

function buildDefaultPresets(): MemberFilterPreset[] {
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return [
    {
      id: "default-new-members",
      name: "신규 멤버 (30일 이내)",
      isDefault: true,
      createdAt: now,
      filters: {
        role: [],
        joinedAfter: thirtyDaysAgo,
        joinedBefore: null,
        minAttendanceRate: null,
        maxAttendanceRate: null,
        activityStatus: "all",
      },
    },
    {
      id: "default-inactive-members",
      name: "비활성 멤버",
      isDefault: true,
      createdAt: now,
      filters: {
        role: [],
        joinedAfter: null,
        joinedBefore: null,
        minAttendanceRate: null,
        maxAttendanceRate: null,
        activityStatus: "inactive",
      },
    },
    {
      id: "default-leaders-managers",
      name: "리더 & 서브리더",
      isDefault: true,
      createdAt: now,
      filters: {
        role: ["leader", "sub_leader"],
        joinedAfter: null,
        joinedBefore: null,
        minAttendanceRate: null,
        maxAttendanceRate: null,
        activityStatus: "all",
      },
    },
  ];
}

// ============================================
// 빈 필터 조건
// ============================================

export const EMPTY_FILTER_CONDITION: MemberFilterCondition = {
  role: [],
  joinedAfter: null,
  joinedBefore: null,
  minAttendanceRate: null,
  maxAttendanceRate: null,
  activityStatus: "all",
};

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPresetsFromStorage(groupId: string): MemberFilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MemberFilterPreset[];
  } catch {
    return [];
  }
}

function savePresetsToStorage(groupId: string, presets: MemberFilterPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(presets));
  } catch {
    // 무시
  }
}

// ============================================
// 멤버 필터링 함수
// ============================================

/**
 * 멤버 목록에 필터 조건을 적용하여 필터링된 목록을 반환합니다.
 * - activityStatus: 'active' = 최근 90일 이내 가입, 'inactive' = 90일 초과 또는 없음
 */
export function filterMembers(
  members: GroupMemberWithProfile[],
  filters: MemberFilterCondition
): GroupMemberWithProfile[] {
  let result = [...members];

  // 역할 필터
  if (filters.role.length > 0) {
    result = result.filter((m) =>
      filters.role.includes(m.role as MemberFilterRole)
    );
  }

  // 가입 시기 이후
  if (filters.joinedAfter) {
    result = result.filter(
      (m) => m.joined_at && m.joined_at.slice(0, 10) >= filters.joinedAfter!
    );
  }

  // 가입 시기 이전
  if (filters.joinedBefore) {
    result = result.filter(
      (m) => m.joined_at && m.joined_at.slice(0, 10) <= filters.joinedBefore!
    );
  }

  // 활동 상태 필터
  if (filters.activityStatus !== "all") {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    if (filters.activityStatus === "active") {
      result = result.filter(
        (m) => m.joined_at && m.joined_at.slice(0, 10) >= ninetyDaysAgo
      );
    } else {
      // inactive
      result = result.filter(
        (m) => !m.joined_at || m.joined_at.slice(0, 10) < ninetyDaysAgo
      );
    }
  }

  // 최소 출석률 (출석률 데이터가 있는 멤버에만 적용)
  // 출석률은 외부에서 attendanceRate 필드로 전달될 경우에만 적용
  // GroupMemberWithProfile에 attendanceRate 필드가 없으므로 스킵
  // (실제 출석률 필터는 컴포넌트에서 별도 처리)

  return result;
}

// ============================================
// 활성 필터 개수 계산
// ============================================

export function countActiveFilters(filters: MemberFilterCondition): number {
  let count = 0;
  if (filters.role.length > 0) count += 1;
  if (filters.joinedAfter || filters.joinedBefore) count += 1;
  if (filters.minAttendanceRate !== null || filters.maxAttendanceRate !== null) count += 1;
  if (filters.activityStatus !== "all") count += 1;
  return count;
}

// ============================================
// 훅
// ============================================

export function useMemberFilterPresets(groupId: string) {
  const defaultPresets = useMemo(() => buildDefaultPresets(), []);
  const [userPresets, setUserPresets] = useState<MemberFilterPreset[]>([]);

  // 마운트 시 localStorage에서 사용자 프리셋 로드
  useEffect(() => {
    setUserPresets(loadPresetsFromStorage(groupId));
  }, [groupId]);

  // 기본 프리셋 + 사용자 프리셋 합산
  const allPresets = useMemo(
    () => [...defaultPresets, ...userPresets],
    [defaultPresets, userPresets]
  );

  // 프리셋 저장 (이름 + 필터 조건)
  const savePreset = useCallback(
    (name: string, filters: MemberFilterCondition): MemberFilterPreset => {
      const newPreset: MemberFilterPreset = {
        id: crypto.randomUUID(),
        name,
        filters,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      setUserPresets((prev) => {
        const updated = [...prev, newPreset];
        savePresetsToStorage(groupId, updated);
        return updated;
      });
      return newPreset;
    },
    [groupId]
  );

  // 프리셋 불러오기 (필터 조건 반환)
  const loadPreset = useCallback(
    (id: string): MemberFilterCondition | null => {
      const preset = allPresets.find((p) => p.id === id);
      return preset ? preset.filters : null;
    },
    [allPresets]
  );

  // 프리셋 삭제 (기본 프리셋은 삭제 불가)
  const deletePreset = useCallback(
    (id: string): boolean => {
      const preset = allPresets.find((p) => p.id === id);
      if (!preset || preset.isDefault) return false;

      setUserPresets((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        savePresetsToStorage(groupId, updated);
        return updated;
      });
      return true;
    },
    [groupId, allPresets]
  );

  return {
    presets: allPresets,
    userPresets,
    defaultPresets,
    savePreset,
    loadPreset,
    deletePreset,
    filterMembers,
    countActiveFilters,
    EMPTY_FILTER_CONDITION,
  };
}

// 타입 re-export
export type { MemberFilterCondition, MemberFilterRole, MemberActivityStatus };
