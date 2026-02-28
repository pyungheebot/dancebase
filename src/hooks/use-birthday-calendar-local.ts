"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  BirthdayCalendarStore,
  BirthdayCalendarEntry,
  BirthdayCalendarMessage,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:birthday-calendar";

function getStorageKey(groupId: string): string {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function loadStore(groupId: string): BirthdayCalendarStore {
  if (typeof window === "undefined") {
    return createEmptyStore(groupId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as BirthdayCalendarStore) : createEmptyStore(groupId);
  } catch {
    return createEmptyStore(groupId);
  }
}

function saveStore(store: BirthdayCalendarStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(store.groupId), JSON.stringify(store));
}

function createEmptyStore(groupId: string): BirthdayCalendarStore {
  return {
    groupId,
    entries: [],
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// D-Day 계산 헬퍼
// ============================================================

/**
 * MM-DD 형식 생일 문자열을 받아 오늘 기준 D-Day 반환.
 * - 양수: N일 후
 * - 0: 오늘
 * - 음수: N일 전 (이미 지남)
 */
export function calcDDay(birthday: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [mm, dd] = birthday.split("-").map(Number);
  if (!mm || !dd) return NaN;

  let nextBirthday = new Date(today.getFullYear(), mm - 1, dd);
  nextBirthday.setHours(0, 0, 0, 0);

  // 이미 지났으면 내년으로
  if (nextBirthday.getTime() < today.getTime()) {
    nextBirthday = new Date(today.getFullYear() + 1, mm - 1, dd);
    nextBirthday.setHours(0, 0, 0, 0);
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * MM-DD 형식 생일 문자열로부터 월(1~12)을 반환.
 */
export function getBirthdayMonth(birthday: string): number {
  const [mm] = birthday.split("-").map(Number);
  return mm ?? 0;
}

// ============================================================
// 훅
// ============================================================

export function useBirthdayCalendarLocal(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.birthdayCalendarLocal(groupId) : null,
    async () => loadStore(groupId)
  );

  const store = data ?? createEmptyStore(groupId);

  /** 저장 후 SWR 캐시 업데이트 */
  function persist(updated: BirthdayCalendarStore): void {
    const withTimestamp: BirthdayCalendarStore = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveStore(withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 생일 항목 추가 ──
  function addEntry(
    input: Omit<BirthdayCalendarEntry, "id" | "groupId" | "createdAt" | "updatedAt">
  ): BirthdayCalendarEntry {
    const now = new Date().toISOString();
    const newEntry: BirthdayCalendarEntry = {
      ...input,
      id: crypto.randomUUID(),
      groupId,
      createdAt: now,
      updatedAt: now,
    };
    persist({ ...store, entries: [...store.entries, newEntry] });
    return newEntry;
  }

  // ── 생일 항목 수정 ──
  function updateEntry(
    entryId: string,
    fields: Partial<
      Omit<BirthdayCalendarEntry, "id" | "groupId" | "createdAt" | "updatedAt">
    >
  ): void {
    const updated = store.entries.map((e) =>
      e.id === entryId
        ? { ...e, ...fields, updatedAt: new Date().toISOString() }
        : e
    );
    persist({ ...store, entries: updated });
  }

  // ── 생일 항목 삭제 ──
  function deleteEntry(entryId: string): void {
    const filtered = store.entries.filter((e) => e.id !== entryId);
    // 해당 항목의 메시지도 함께 삭제
    const filteredMessages = store.messages.filter(
      (m) => m.entryId !== entryId
    );
    persist({ ...store, entries: filtered, messages: filteredMessages });
  }

  // ── 축하 메시지 추가 ──
  function addMessage(
    input: Omit<BirthdayCalendarMessage, "id" | "groupId" | "createdAt">
  ): BirthdayCalendarMessage {
    const newMsg: BirthdayCalendarMessage = {
      ...input,
      id: crypto.randomUUID(),
      groupId,
      createdAt: new Date().toISOString(),
    };
    persist({ ...store, messages: [...store.messages, newMsg] });
    return newMsg;
  }

  // ── 축하 메시지 삭제 ──
  function deleteMessage(messageId: string): void {
    const filtered = store.messages.filter((m) => m.id !== messageId);
    persist({ ...store, messages: filtered });
  }

  // ── 파티 계획 토글 ──
  function togglePartyPlanned(entryId: string): void {
    const entry = store.entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { partyPlanned: !entry.partyPlanned });
  }

  // ── 다가오는 생일 (D-Day 기준 오름차순, 30일 이내) ──
  const upcomingBirthdays = store.entries
    .map((e) => ({ ...e, dDay: calcDDay(e.birthday) }))
    .filter((e) => e.dDay >= 0 && e.dDay <= 30)
    .sort((a, b) => a.dDay - b.dDay);

  // ── 오늘 생일 ──
  const todayBirthdays = store.entries.filter(
    (e) => calcDDay(e.birthday) === 0
  );

  // ── 월별 생일 목록 (1~12월 순서) ──
  const byMonth: Record<number, BirthdayCalendarEntry[]> = {};
  for (const entry of store.entries) {
    const month = getBirthdayMonth(entry.birthday);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(entry);
  }
  // 각 월 내부를 날짜 오름차순으로 정렬
  for (const month of Object.keys(byMonth)) {
    byMonth[Number(month)].sort((a, b) =>
      a.birthday.localeCompare(b.birthday)
    );
  }

  // ── 특정 항목의 메시지 조회 ──
  function getMessages(entryId: string): BirthdayCalendarMessage[] {
    return store.messages.filter((m) => m.entryId === entryId);
  }

  return {
    entries: store.entries,
    messages: store.messages,
    loading: isLoading,
    // 파생 데이터
    upcomingBirthdays,
    todayBirthdays,
    byMonth,
    // CRUD
    addEntry,
    updateEntry,
    deleteEntry,
    togglePartyPlanned,
    // 메시지
    addMessage,
    deleteMessage,
    getMessages,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
