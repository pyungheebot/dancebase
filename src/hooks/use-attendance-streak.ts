"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { MemberStreak, StreakRecord } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:streaks:${groupId}`;

function loadMembers(groupId: string): MemberStreak[] {
  return loadFromStorage<MemberStreak[]>(LS_KEY(groupId), []);
}

function saveMembers(groupId: string, members: MemberStreak[]): void {
  saveToStorage(LS_KEY(groupId), members);
}

// ─── 스트릭 계산 헬퍼 ────────────────────────────────────────

/** 날짜 문자열을 숫자(yyyymmdd)로 변환해 정렬 비교 */
function dateNum(d: string): number {
  return parseInt(d.replace(/-/g, ""), 10);
}

/** 출석 기록 배열에서 현재 스트릭 / 최장 스트릭을 계산 */
function calcStreaks(records: StreakRecord[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (records.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // 날짜 오름차순 정렬
  const sorted = [...records].sort((a, b) => dateNum(a.date) - dateNum(b.date));

  // 최장 스트릭: 연속 출석 최대 구간
  let longestStreak = 0;
  let tempStreak = 0;
  for (const rec of sorted) {
    if (rec.attended) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // 현재 스트릭: 가장 최근 기록부터 역순으로 연속 출석 계산
  let currentStreak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].attended) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

/** MemberStreak 객체의 통계 필드를 재계산하여 반환 */
function recalc(member: MemberStreak): MemberStreak {
  const { currentStreak, longestStreak } = calcStreaks(member.records);
  const totalAttended = member.records.filter((r) => r.attended).length;
  const totalSessions = member.records.length;
  return { ...member, currentStreak, longestStreak, totalAttended, totalSessions };
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useAttendanceStreak(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.attendanceStreakGroup(groupId) : null,
    () => loadMembers(groupId),
    { revalidateOnFocus: false }
  );

  const members: MemberStreak[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: MemberStreak[]): void {
    saveMembers(groupId, next);
    mutate(next, false);
  }

  // ── 멤버 추가 ────────────────────────────────────────────

  function addMember(name: string): boolean {
    if (!name.trim()) return false;
    const stored = loadMembers(groupId);
    if (stored.some((m) => m.memberName === name.trim())) return false;
    const newMember: MemberStreak = {
      id: crypto.randomUUID(),
      memberName: name.trim(),
      records: [],
      currentStreak: 0,
      longestStreak: 0,
      totalAttended: 0,
      totalSessions: 0,
    };
    update([...stored, newMember]);
    return true;
  }

  // ── 멤버 삭제 ────────────────────────────────────────────

  function deleteMember(memberId: string): boolean {
    const stored = loadMembers(groupId);
    const next = stored.filter((m) => m.id !== memberId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 출석 기록 추가/수정 ──────────────────────────────────

  function recordAttendance(
    memberId: string,
    date: string,
    attended: boolean
  ): boolean {
    const stored = loadMembers(groupId);
    const idx = stored.findIndex((m) => m.id === memberId);
    if (idx === -1) return false;

    const member = stored[idx];
    const existingIdx = member.records.findIndex((r) => r.date === date);

    let nextRecords: StreakRecord[];
    if (existingIdx !== -1) {
      nextRecords = member.records.map((r, i) =>
        i === existingIdx ? { ...r, attended } : r
      );
    } else {
      nextRecords = [...member.records, { date, attended }];
    }

    const updated = recalc({ ...member, records: nextRecords });
    const next = stored.map((m, i) => (i === idx ? updated : m));
    update(next);
    return true;
  }

  // ── 출석 기록 삭제 ───────────────────────────────────────

  function deleteRecord(memberId: string, date: string): boolean {
    const stored = loadMembers(groupId);
    const idx = stored.findIndex((m) => m.id === memberId);
    if (idx === -1) return false;

    const member = stored[idx];
    const nextRecords = member.records.filter((r) => r.date !== date);
    if (nextRecords.length === member.records.length) return false;

    const updated = recalc({ ...member, records: nextRecords });
    const next = stored.map((m, i) => (i === idx ? updated : m));
    update(next);
    return true;
  }

  // ── 통계 ─────────────────────────────────────────────────

  /** 최장 스트릭 보유자 */
  const bestStreaker: MemberStreak | null =
    members.length === 0
      ? null
      : members.reduce((best, m) =>
          m.longestStreak > best.longestStreak ? m : best
        );

  /** 평균 현재 스트릭 */
  const avgStreak: number =
    members.length === 0
      ? 0
      : Math.round(
          members.reduce((sum, m) => sum + m.currentStreak, 0) / members.length
        );

  /** 그룹 전체 출석률 (%) */
  const groupAttendanceRate: number = (() => {
    const totalSessions = members.reduce((s, m) => s + m.totalSessions, 0);
    if (totalSessions === 0) return 0;
    const totalAttended = members.reduce((s, m) => s + m.totalAttended, 0);
    return Math.round((totalAttended / totalSessions) * 100);
  })();

  return {
    members,
    // CRUD
    addMember,
    deleteMember,
    recordAttendance,
    deleteRecord,
    // 통계
    bestStreaker,
    avgStreak,
    groupAttendanceRate,
    // SWR
    refetch: () => mutate(),
  };
}
