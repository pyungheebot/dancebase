"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  TimeCapsule,
  TimeCapsuleMessage,
  TimeCapsuleEntry,
  TimeCapsuleMemberMessage,
} from "@/types";

// ============================================
// 상수
// ============================================

const MAX_CAPSULES = 30;
const LS_KEY = (groupId: string) =>
  `dancebase:time-capsules:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadCapsules(groupId: string): TimeCapsule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    return raw ? (JSON.parse(raw) as TimeCapsule[]) : [];
  } catch {
    return [];
  }
}

function saveCapsules(groupId: string, capsules: TimeCapsule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(capsules));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 날짜 헬퍼
// ============================================

/** 오늘 날짜를 YYYY-MM-DD 문자열로 반환 */
function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 개봉일까지 남은 날 수 (음수면 지난 것) */
export function calcDaysLeft(openDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const open = new Date(openDate + "T00:00:00");
  open.setHours(0, 0, 0, 0);
  return Math.round((open.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** 개봉 가능 여부: openDate <= today */
function isOpenable(openDate: string): boolean {
  return openDate <= todayString();
}

// ============================================
// 훅
// ============================================

export function useTimeCapsule(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.timeCapsule(groupId) : null,
    () => loadCapsules(groupId),
    { revalidateOnFocus: false }
  );

  const capsules: TimeCapsule[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ──────────────────────────────────

  function update(next: TimeCapsule[]): void {
    saveCapsules(groupId, next);
    mutate(next, false);
  }

  // ── 캡슐 생성 ──────────────────────────────────────────

  function createCapsule(title: string, openDate: string): boolean {
    if (!title.trim()) return false;
    const stored = loadCapsules(groupId);
    if (stored.length >= MAX_CAPSULES) return false;

    const newCapsule: TimeCapsule = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: title.trim(),
      openDate,
      messages: [],
      isSealed: false,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };

    update([...stored, newCapsule]);
    return true;
  }

  // ── 캡슐 삭제 ──────────────────────────────────────────

  function deleteCapsule(capsuleId: string): void {
    const stored = loadCapsules(groupId);
    update(stored.filter((c) => c.id !== capsuleId));
  }

  // ── 메시지 추가 ─────────────────────────────────────────

  function addMessage(
    capsuleId: string,
    authorName: string,
    content: string
  ): boolean {
    if (!authorName.trim() || !content.trim()) return false;
    const stored = loadCapsules(groupId);
    const idx = stored.findIndex((c) => c.id === capsuleId);
    if (idx === -1) return false;
    const capsule = stored[idx];
    if (capsule.isSealed) return false; // 봉인된 캡슐엔 메시지 추가 불가

    const newMsg: TimeCapsuleMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      authorName: authorName.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = stored.map((c, i) =>
      i === idx ? { ...c, messages: [...c.messages, newMsg] } : c
    );
    update(next);
    return true;
  }

  // ── 봉인 ────────────────────────────────────────────────

  function sealCapsule(capsuleId: string): boolean {
    const stored = loadCapsules(groupId);
    const idx = stored.findIndex((c) => c.id === capsuleId);
    if (idx === -1) return false;
    if (stored[idx].isSealed) return false;

    const next = stored.map((c, i) =>
      i === idx ? { ...c, isSealed: true } : c
    );
    update(next);
    return true;
  }

  // ── 개봉 ────────────────────────────────────────────────

  function openCapsule(capsuleId: string): boolean {
    const stored = loadCapsules(groupId);
    const idx = stored.findIndex((c) => c.id === capsuleId);
    if (idx === -1) return false;
    const capsule = stored[idx];
    if (!isOpenable(capsule.openDate)) return false; // 개봉일 이후만 가능
    if (capsule.isOpened) return false;

    const next = stored.map((c, i) =>
      i === idx ? { ...c, isOpened: true } : c
    );
    update(next);
    return true;
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalCapsules = capsules.length;
  const sealedCount = capsules.filter((c) => c.isSealed).length;
  const openedCount = capsules.filter((c) => c.isOpened).length;

  /** 아직 열리지 않은 캡슐 중 가장 빠른 개봉일 */
  const nextOpenDate: string | null = (() => {
    const pending = capsules
      .filter((c) => !c.isOpened)
      .map((c) => c.openDate)
      .sort();
    return pending[0] ?? null;
  })();

  return {
    capsules,
    // CRUD
    createCapsule,
    deleteCapsule,
    addMessage,
    sealCapsule,
    openCapsule,
    // 헬퍼
    isOpenable,
    calcDaysLeft,
    // 통계
    totalCapsules,
    sealedCount,
    openedCount,
    nextOpenDate,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}

// ============================================
// TimeCapsuleEntry 기반 훅 (확장 기능)
// ============================================

const ENTRY_LS_KEY = (groupId: string) =>
  `dancebase:time-capsule-entries:${groupId}`;

const MAX_ENTRIES = 30;

function loadEntries(groupId: string): TimeCapsuleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ENTRY_LS_KEY(groupId));
    return raw ? (JSON.parse(raw) as TimeCapsuleEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: TimeCapsuleEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ENTRY_LS_KEY(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

/** 연습 타임캡슐 엔트리 CRUD 훅 (목표/레퍼토리/사진 포함) */
export function usePracticeTimeCapsule(groupId: string) {
  const swrKey = groupId
    ? `${swrKeys.timeCapsule(groupId)}-entries`
    : null;

  const { data, mutate } = useSWR(
    swrKey,
    () => loadEntries(groupId),
    { revalidateOnFocus: false }
  );

  const entries: TimeCapsuleEntry[] = data ?? [];

  function updateStore(next: TimeCapsuleEntry[]): void {
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 엔트리 생성 ─────────────────────────────────────────

  function createEntry(params: {
    title: string;
    openDate: string;
    currentGoal?: string;
    currentRepertoire?: string[];
    photoUrl?: string;
  }): boolean {
    if (!params.title.trim()) return false;
    const stored = loadEntries(groupId);
    if (stored.length >= MAX_ENTRIES) return false;

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const newEntry: TimeCapsuleEntry = {
      id: `tce-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: params.title.trim(),
      writtenAt: today,
      openDate: params.openDate,
      messages: [],
      currentGoal: params.currentGoal?.trim() || undefined,
      currentRepertoire: params.currentRepertoire ?? [],
      photoUrl: params.photoUrl?.trim() || undefined,
      isSealed: false,
      isOpened: false,
      createdAt: now,
    };

    updateStore([...stored, newEntry]);
    return true;
  }

  // ── 엔트리 수정 ─────────────────────────────────────────

  function updateEntry(
    entryId: string,
    params: Partial<{
      title: string;
      openDate: string;
      currentGoal: string;
      currentRepertoire: string[];
      photoUrl: string;
    }>
  ): boolean {
    const stored = loadEntries(groupId);
    const idx = stored.findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    if (stored[idx].isSealed) return false;

    const existing = stored[idx];
    const updated: TimeCapsuleEntry = {
      ...existing,
      ...(params.title !== undefined && { title: params.title.trim() }),
      ...(params.openDate !== undefined && { openDate: params.openDate }),
      ...(params.currentGoal !== undefined && {
        currentGoal: params.currentGoal.trim() || undefined,
      }),
      ...(params.currentRepertoire !== undefined && {
        currentRepertoire: params.currentRepertoire,
      }),
      ...(params.photoUrl !== undefined && {
        photoUrl: params.photoUrl.trim() || undefined,
      }),
    };

    updateStore(stored.map((e, i) => (i === idx ? updated : e)));
    return true;
  }

  // ── 엔트리 삭제 ─────────────────────────────────────────

  function deleteEntry(entryId: string): boolean {
    const stored = loadEntries(groupId);
    const exists = stored.some((e) => e.id === entryId);
    if (!exists) return false;
    updateStore(stored.filter((e) => e.id !== entryId));
    return true;
  }

  // ── 메시지 추가 ─────────────────────────────────────────

  function addEntryMessage(
    entryId: string,
    authorName: string,
    content: string
  ): boolean {
    if (!authorName.trim() || !content.trim()) return false;
    const stored = loadEntries(groupId);
    const idx = stored.findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    if (stored[idx].isSealed) return false;

    const newMsg: TimeCapsuleMemberMessage = {
      id: `emsg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      authorName: authorName.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = stored.map((e, i) =>
      i === idx ? { ...e, messages: [...e.messages, newMsg] } : e
    );
    updateStore(next);
    return true;
  }

  // ── 봉인 ────────────────────────────────────────────────

  function sealEntry(entryId: string): boolean {
    const stored = loadEntries(groupId);
    const idx = stored.findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    if (stored[idx].isSealed) return false;

    updateStore(
      stored.map((e, i) => (i === idx ? { ...e, isSealed: true } : e))
    );
    return true;
  }

  // ── 개봉 ────────────────────────────────────────────────

  function openEntry(entryId: string): boolean {
    const stored = loadEntries(groupId);
    const idx = stored.findIndex((e) => e.id === entryId);
    if (idx === -1) return false;
    const entry = stored[idx];
    if (entry.isOpened) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (entry.openDate > today) return false;

    updateStore(
      stored.map((e, i) => (i === idx ? { ...e, isOpened: true } : e))
    );
    return true;
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalEntries = entries.length;
  const sealedCount = entries.filter((e) => e.isSealed).length;
  const openedCount = entries.filter((e) => e.isOpened).length;

  const nextOpenDate: string | null = (() => {
    const pending = entries
      .filter((e) => !e.isOpened)
      .map((e) => e.openDate)
      .sort();
    return pending[0] ?? null;
  })();

  return {
    entries,
    // CRUD
    createEntry,
    updateEntry,
    deleteEntry,
    addEntryMessage,
    sealEntry,
    openEntry,
    // 통계
    totalEntries,
    sealedCount,
    openedCount,
    nextOpenDate,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
