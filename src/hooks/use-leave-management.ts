"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MemberLeaveEntry,
  MemberLeaveReason,
  MemberLeaveStatus,
} from "@/types";

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string) => `dancebase:leave:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadEntries(groupId: string): MemberLeaveEntry[] {
  return loadFromStorage<MemberLeaveEntry[]>(LS_KEY(groupId), []);
}

function saveEntries(groupId: string, entries: MemberLeaveEntry[]): void {
  saveToStorage(LS_KEY(groupId), entries);
}

// ============================================
// 훅
// ============================================

export function useLeaveManagement(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.leaveManagement(groupId) : null,
    () => loadEntries(groupId),
    { revalidateOnFocus: false }
  );

  const entries: MemberLeaveEntry[] = data ?? [];

  // ── 오늘 날짜 (YYYY-MM-DD) ────────────────────────────────

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ── 휴가 신청 ────────────────────────────────────────────

  function applyLeave(
    memberName: string,
    reason: MemberLeaveReason,
    reasonDetail: string,
    startDate: string,
    endDate: string
  ): void {
    const now = new Date().toISOString();
    const newEntry: MemberLeaveEntry = {
      id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      memberName,
      reason,
      reasonDetail,
      startDate,
      endDate,
      status: "applied",
      appliedAt: now,
      createdAt: now,
    };
    const next = [...entries, newEntry];
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 승인 ─────────────────────────────────────────────────

  function approveLeave(id: string, approverName: string): void {
    const next = entries.map((e) =>
      e.id === id
        ? { ...e, status: "approved" as MemberLeaveStatus, approvedBy: approverName }
        : e
    );
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 거절 ─────────────────────────────────────────────────

  function rejectLeave(id: string): void {
    const next = entries.map((e) =>
      e.id === id ? { ...e, status: "rejected" as MemberLeaveStatus } : e
    );
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 진행 중으로 전환 (복귀 처리 전 단계) ─────────────────

  function activateLeave(id: string): void {
    const next = entries.map((e) =>
      e.id === id ? { ...e, status: "active" as MemberLeaveStatus } : e
    );
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 복귀 처리 (완료) ─────────────────────────────────────

  function completeLeave(id: string): void {
    const next = entries.map((e) =>
      e.id === id ? { ...e, status: "completed" as MemberLeaveStatus } : e
    );
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 삭제 ─────────────────────────────────────────────────

  function deleteLeave(id: string): void {
    const next = entries.filter((e) => e.id !== id);
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ── 멤버별 조회 ──────────────────────────────────────────

  function getByMember(memberName: string): MemberLeaveEntry[] {
    return entries.filter((e) => e.memberName === memberName);
  }

  // ── 상태별 조회 ──────────────────────────────────────────

  function getByStatus(status: MemberLeaveStatus): MemberLeaveEntry[] {
    return entries.filter((e) => e.status === status);
  }

  // ── 현재 휴가중인 멤버 ───────────────────────────────────
  // startDate <= today <= endDate, status = active

  function getCurrentlyOnLeave(): MemberLeaveEntry[] {
    const today = todayStr();
    return entries.filter(
      (e) =>
        e.status === "active" &&
        e.startDate <= today &&
        e.endDate >= today
    );
  }

  // ── D-day 계산 ────────────────────────────────────────────

  function calcDday(endDate: string): number {
    const today = new Date(todayStr());
    const end = new Date(endDate);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalLeaves = entries.length;
  const activeCount = entries.filter((e) => e.status === "active").length;
  const pendingCount = entries.filter((e) => e.status === "applied").length;

  return {
    // 데이터
    entries,
    // 액션
    applyLeave,
    approveLeave,
    rejectLeave,
    activateLeave,
    completeLeave,
    deleteLeave,
    // 조회
    getByMember,
    getByStatus,
    getCurrentlyOnLeave,
    // 유틸
    calcDday,
    // 통계
    totalLeaves,
    activeCount,
    pendingCount,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
