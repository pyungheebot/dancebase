"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupAnniversaryData, GroupAnniversaryItem, GroupAnniversaryType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:group-anniversary";

function getStorageKey(groupId: string): string {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function loadData(groupId: string): GroupAnniversaryData {
  if (typeof window === "undefined") {
    return createEmptyData(groupId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as GroupAnniversaryData) : createEmptyData(groupId);
  } catch {
    return createEmptyData(groupId);
  }
}

function saveData(data: GroupAnniversaryData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
}

function createEmptyData(groupId: string): GroupAnniversaryData {
  return {
    groupId,
    anniversaries: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 날짜 계산 헬퍼
// ============================================================

/**
 * YYYY-MM-DD 날짜 문자열을 기준으로 오늘부터의 D-Day를 반환.
 * - isRecurring=true: 매년 반복 기준 (해당 월일까지 남은 날)
 * - isRecurring=false: 해당 날짜까지 남은 날 (지나면 음수)
 *
 * 반환값:
 * - 양수: N일 후
 * - 0: 오늘
 * - 음수: N일 전 (이미 지남)
 */
export function calcAnniversaryDDay(date: string, isRecurring: boolean): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [yyyy, mm, dd] = date.split("-").map(Number);
  if (!yyyy || !mm || !dd) return NaN;

  if (isRecurring) {
    // 이번 연도 기준 해당 월일
    let target = new Date(today.getFullYear(), mm - 1, dd);
    target.setHours(0, 0, 0, 0);
    // 이미 지났으면 내년으로
    if (target.getTime() < today.getTime()) {
      target = new Date(today.getFullYear() + 1, mm - 1, dd);
      target.setHours(0, 0, 0, 0);
    }
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } else {
    const target = new Date(yyyy, mm - 1, dd);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
}

/**
 * 창립/최초 날짜로부터 현재까지 몇 주년인지 계산.
 * - 1년 미만이면 0 반환
 */
export function calcYearsSince(date: string): number {
  const today = new Date();
  const [yyyy, mm, dd] = date.split("-").map(Number);
  if (!yyyy || !mm || !dd) return 0;

  const origin = new Date(yyyy, mm - 1, dd);
  const diffMs = today.getTime() - origin.getTime();
  if (diffMs < 0) return 0;

  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  return years;
}

/**
 * isRecurring 기념일의 "이번 연도 기념일 날짜"를 반환.
 * 이미 지났으면 내년도 기준.
 */
function getNextOccurrenceDate(date: string): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, mm, dd] = date.split("-").map(Number);
  let target = new Date(today.getFullYear(), (mm ?? 1) - 1, dd ?? 1);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() < today.getTime()) {
    target = new Date(today.getFullYear() + 1, (mm ?? 1) - 1, dd ?? 1);
    target.setHours(0, 0, 0, 0);
  }
  return target;
}

// ============================================================
// 훅
// ============================================================

export type AnniversaryInput = Omit<GroupAnniversaryItem, "id" | "createdAt">;

export function useGroupAnniversary(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupAnniversary(groupId) : null,
    async () => loadData(groupId)
  );

  const store = data ?? createEmptyData(groupId);

  /** 저장 후 SWR 캐시 업데이트 */
  function persist(updated: GroupAnniversaryData): void {
    const withTimestamp: GroupAnniversaryData = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveData(withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 기념일 추가 ──
  function addAnniversary(input: AnniversaryInput): GroupAnniversaryItem {
    const now = new Date().toISOString();
    const item: GroupAnniversaryItem = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    persist({ ...store, anniversaries: [...store.anniversaries, item] });
    return item;
  }

  // ── 기념일 수정 ──
  function updateAnniversary(
    id: string,
    fields: Partial<AnniversaryInput>
  ): void {
    const updated = store.anniversaries.map((a) =>
      a.id === id ? { ...a, ...fields } : a
    );
    persist({ ...store, anniversaries: updated });
  }

  // ── 기념일 삭제 ──
  function deleteAnniversary(id: string): void {
    const filtered = store.anniversaries.filter((a) => a.id !== id);
    persist({ ...store, anniversaries: filtered });
  }

  // ── 다가오는 기념일 (30일 이내, D-Day 오름차순) ──
  function getUpcoming(withinDays = 30): (GroupAnniversaryItem & { dDay: number })[] {
    return store.anniversaries
      .map((a) => ({ ...a, dDay: calcAnniversaryDDay(a.date, a.isRecurring) }))
      .filter((a) => {
        if (a.isRecurring) return a.dDay >= 0 && a.dDay <= withinDays;
        // 반복 없는 경우 아직 지나지 않은 것만
        return a.dDay >= 0 && a.dDay <= withinDays;
      })
      .sort((a, b) => a.dDay - b.dDay);
  }

  // ── 오늘이 기념일인 항목 ──
  function getToday(): GroupAnniversaryItem[] {
    return store.anniversaries.filter(
      (a) => calcAnniversaryDDay(a.date, a.isRecurring) === 0
    );
  }

  // ── 유형별 레이블 ──
  const TYPE_LABELS: Record<GroupAnniversaryType, string> = {
    founding: "창립",
    performance: "공연",
    achievement: "성과",
    custom: "기타",
  };

  // ── 통계 ──
  const totalAnniversaries = store.anniversaries.length;
  const upcomingCount = getUpcoming(30).length;

  // ── 날짜 정렬 목록 (생성일 내림차순) ──
  const sortedAnniversaries = [...store.anniversaries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    anniversaries: store.anniversaries,
    sortedAnniversaries,
    loading: isLoading,
    // 통계
    totalAnniversaries,
    upcomingCount,
    // 파생 데이터
    getUpcoming,
    getToday,
    // 날짜 계산 유틸
    calcYearsSince,
    calcAnniversaryDDay,
    getNextOccurrenceDate,
    // CRUD
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    // 레이블
    TYPE_LABELS,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
