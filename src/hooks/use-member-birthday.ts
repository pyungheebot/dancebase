"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberBirthdayData,
  MemberBirthdayEntry,
  BirthdayCelebration,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:member-birthday-calendar";

function getStorageKey(groupId: string): string {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function loadData(groupId: string): MemberBirthdayData {
  if (typeof window === "undefined") {
    return createEmptyData(groupId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as MemberBirthdayData) : createEmptyData(groupId);
  } catch {
    return createEmptyData(groupId);
  }
}

function saveData(data: MemberBirthdayData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
}

function createEmptyData(groupId: string): MemberBirthdayData {
  return {
    groupId,
    birthdays: [],
    celebrations: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// D-Day 계산 헬퍼
// ============================================================

/**
 * 생일 월/일을 받아 오늘 기준 D-Day(일수)를 반환.
 * - 0: 오늘
 * - 양수: N일 후
 * 이미 지난 생일은 다음 해 기준으로 계산.
 */
export function calcMemberBirthdayDDay(month: number, day: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nextBirthday = new Date(today.getFullYear(), month - 1, day);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
    nextBirthday.setHours(0, 0, 0, 0);
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================
// 훅
// ============================================================

export function useMemberBirthday(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberBirthdayCalendar(groupId) : null,
    async () => loadData(groupId)
  );

  const store = data ?? createEmptyData(groupId);

  /** 저장 후 SWR 캐시 업데이트 */
  function persist(updated: MemberBirthdayData): void {
    const withTimestamp: MemberBirthdayData = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveData(withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 생일 추가 ──
  function addBirthday(
    input: Pick<MemberBirthdayEntry, "memberName" | "birthMonth" | "birthDay" | "wishMessage">
  ): MemberBirthdayEntry {
    const newEntry: MemberBirthdayEntry = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist({ ...store, birthdays: [...store.birthdays, newEntry] });
    return newEntry;
  }

  // ── 생일 수정 ──
  function updateBirthday(
    id: string,
    fields: Partial<Pick<MemberBirthdayEntry, "memberName" | "birthMonth" | "birthDay" | "wishMessage">>
  ): void {
    const updated = store.birthdays.map((b) =>
      b.id === id ? { ...b, ...fields } : b
    );
    persist({ ...store, birthdays: updated });
  }

  // ── 생일 삭제 ──
  function deleteBirthday(id: string): void {
    const filtered = store.birthdays.filter((b) => b.id !== id);
    const filteredCelebrations = store.celebrations.filter(
      (c) => c.birthdayId !== id
    );
    persist({ ...store, birthdays: filtered, celebrations: filteredCelebrations });
  }

  // ── 축하 메시지 추가 ──
  function addCelebration(
    input: Pick<BirthdayCelebration, "birthdayId" | "fromName" | "message">
  ): BirthdayCelebration {
    const newCelebration: BirthdayCelebration = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist({
      ...store,
      celebrations: [...store.celebrations, newCelebration],
    });
    return newCelebration;
  }

  // ── 축하 메시지 삭제 ──
  function deleteCelebration(id: string): void {
    const filtered = store.celebrations.filter((c) => c.id !== id);
    persist({ ...store, celebrations: filtered });
  }

  // ── 특정 생일의 축하 메시지 조회 ──
  function getCelebrations(birthdayId: string): BirthdayCelebration[] {
    return store.celebrations.filter((c) => c.birthdayId === birthdayId);
  }

  // ── 다가오는 생일 (D-Day 기준 오름차순, 60일 이내) ──
  function getUpcoming(withinDays = 60): Array<MemberBirthdayEntry & { dDay: number }> {
    return store.birthdays
      .map((b) => ({
        ...b,
        dDay: calcMemberBirthdayDDay(b.birthMonth, b.birthDay),
      }))
      .filter((b) => b.dDay <= withinDays)
      .sort((a, b) => a.dDay - b.dDay);
  }

  // ── 오늘 생일 ──
  function getTodayBirthdays(): MemberBirthdayEntry[] {
    return store.birthdays.filter(
      (b) => calcMemberBirthdayDDay(b.birthMonth, b.birthDay) === 0
    );
  }

  // ── 월별 분포 (1~12월 멤버 수) ──
  const monthlyDistribution: Record<number, MemberBirthdayEntry[]> = {};
  for (let m = 1; m <= 12; m++) {
    monthlyDistribution[m] = [];
  }
  for (const b of store.birthdays) {
    const m = b.birthMonth;
    if (m >= 1 && m <= 12) {
      monthlyDistribution[m].push(b);
    }
  }
  // 각 월 내부를 날짜 오름차순으로 정렬
  for (let m = 1; m <= 12; m++) {
    monthlyDistribution[m].sort((a, b) => a.birthDay - b.birthDay);
  }

  // ── 통계 ──
  const totalMembers = store.birthdays.length;
  const todayBirthdays = getTodayBirthdays();
  const upcomingBirthdays = getUpcoming();

  return {
    birthdays: store.birthdays,
    celebrations: store.celebrations,
    loading: isLoading,
    // 파생 데이터
    upcomingBirthdays,
    todayBirthdays,
    monthlyDistribution,
    // 통계
    totalMembers,
    // CRUD
    addBirthday,
    updateBirthday,
    deleteBirthday,
    // 축하 메시지
    addCelebration,
    deleteCelebration,
    getCelebrations,
    // 헬퍼
    getUpcoming,
    getTodayBirthdays,
    // SWR
    refetch: () => mutate(),
  };
}
