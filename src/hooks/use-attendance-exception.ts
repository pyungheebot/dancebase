"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  AttendanceExceptionEntry,
  AttendanceExceptionType,
} from "@/types";

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string) =>
  `dancebase:attendance-exception:${groupId}`;

// ============================================
// 훅
// ============================================

export function useAttendanceException(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.attendanceException(groupId) : null,
    () => loadFromStorage<AttendanceExceptionEntry[]>(LS_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const entries: AttendanceExceptionEntry[] = useMemo(() => data ?? [], [data]);

  // ── 예외 추가 ────────────────────────────────────────────

  const addException = useCallback((
    memberName: string,
    date: string,
    type: AttendanceExceptionType,
    reason: string,
    duration?: number
  ): void => {
    const now = new Date().toISOString();
    const newEntry: AttendanceExceptionEntry = {
      id: `exception-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      memberName,
      date,
      type,
      reason,
      duration,
      status: "pending",
      createdAt: now,
    };
    const next = [...entries, newEntry];
    saveToStorage(LS_KEY(groupId),next);
    mutate(next, false);
  }, [entries, groupId, mutate]);

  // ── 승인 ─────────────────────────────────────────────────

  function approveException(id: string, approverName: string): void {
    const next = entries.map((e) =>
      e.id === id
        ? {
            ...e,
            status: "approved" as const,
            approvedBy: approverName,
          }
        : e
    );
    saveToStorage(LS_KEY(groupId),next);
    mutate(next, false);
  }

  // ── 거절 ─────────────────────────────────────────────────

  function rejectException(id: string): void {
    const next = entries.map((e) =>
      e.id === id ? { ...e, status: "rejected" as const } : e
    );
    saveToStorage(LS_KEY(groupId),next);
    mutate(next, false);
  }

  // ── 삭제 ─────────────────────────────────────────────────

  function deleteException(id: string): void {
    const next = entries.filter((e) => e.id !== id);
    saveToStorage(LS_KEY(groupId),next);
    mutate(next, false);
  }

  // ── 멤버별 조회 ──────────────────────────────────────────

  function getByMember(memberName: string): AttendanceExceptionEntry[] {
    return entries.filter((e) => e.memberName === memberName);
  }

  // ── 날짜별 조회 ──────────────────────────────────────────

  function getByDate(date: string): AttendanceExceptionEntry[] {
    return entries.filter((e) => e.date === date);
  }

  // ── 유형별 조회 ──────────────────────────────────────────

  function getByType(
    type: AttendanceExceptionType
  ): AttendanceExceptionEntry[] {
    return entries.filter((e) => e.type === type);
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalExceptions = entries.length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  // 유형별 분포
  const typeDistribution: Record<AttendanceExceptionType, number> = {
    late: 0,
    early_leave: 0,
    excused: 0,
    sick: 0,
    personal: 0,
    emergency: 0,
  };
  for (const e of entries) {
    typeDistribution[e.type] = (typeDistribution[e.type] ?? 0) + 1;
  }

  // 멤버별 예외 횟수 (상위 5명)
  const memberCountMap: Record<string, number> = {};
  for (const e of entries) {
    memberCountMap[e.memberName] = (memberCountMap[e.memberName] ?? 0) + 1;
  }
  const memberExceptionCount = Object.entries(memberCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    // 데이터
    entries,
    // 액션
    addException,
    approveException,
    rejectException,
    deleteException,
    // 조회
    getByMember,
    getByDate,
    getByType,
    // 통계
    totalExceptions,
    pendingCount,
    typeDistribution,
    memberExceptionCount,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
