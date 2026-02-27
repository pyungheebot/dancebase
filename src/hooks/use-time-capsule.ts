"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { TimeCapsule, TimeCapsuleMessage } from "@/types";

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
