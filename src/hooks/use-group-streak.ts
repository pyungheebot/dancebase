"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { StreakTrackData, StreakTrackMember, StreakTrackRecord } from "@/types";

const STORAGE_KEY_PREFIX = "group-streak-";

function loadData(groupId: string): StreakTrackData {
  if (typeof window === "undefined") {
    return { groupId, members: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}`);
    if (!raw) return { groupId, members: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as StreakTrackData;
  } catch {
    return { groupId, members: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: StreakTrackData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${data.groupId}`,
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  );
}

/** 날짜 배열에서 현재 연속 스트릭 계산 */
export function calcCurrentStreak(records: StreakTrackRecord[]): number {
  const attended = records
    .filter((r) => r.attended)
    .map((r) => r.date)
    .sort((a, b) => b.localeCompare(a)); // 최신순

  if (attended.length === 0) return 0;

  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (attended.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      // 오늘(i=0)은 아직 기록 안 할 수 있으므로 건너뜀
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** 날짜 배열에서 최장 스트릭 계산 */
export function calcLongestStreak(records: StreakTrackRecord[]): number {
  const attended = records
    .filter((r) => r.attended)
    .map((r) => r.date)
    .sort((a, b) => a.localeCompare(b)); // 오래된 순

  if (attended.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < attended.length; i++) {
    const prev = new Date(attended[i - 1]);
    const curr = new Date(attended[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else if (diff > 1) {
      current = 1;
    }
  }
  return longest;
}

/** 이번 달 출석률 (%) */
export function calcMonthlyRate(records: StreakTrackRecord[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const thisMonth = records.filter((r) => r.date.startsWith(prefix));
  if (thisMonth.length === 0) return 0;
  const attended = thisMonth.filter((r) => r.attended).length;
  return Math.round((attended / thisMonth.length) * 100);
}

/** 최근 7일 날짜 목록 (오늘 포함, 오래된 순) */
export function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function useGroupStreak(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupStreak(groupId),
    async () => loadData(groupId)
  );

  const streakData: StreakTrackData = data ?? {
    groupId,
    members: [],
    updatedAt: new Date().toISOString(),
  };

  /** 멤버 추가 */
  async function addMember(name: string): Promise<void> {
    const current = loadData(groupId);
    const newMember: StreakTrackMember = {
      id: crypto.randomUUID(),
      name: name.trim(),
      records: [],
      createdAt: new Date().toISOString(),
    };
    const updated: StreakTrackData = {
      ...current,
      members: [...current.members, newMember],
    };
    saveData(updated);
    await mutate();
  }

  /** 멤버 삭제 */
  async function removeMember(memberId: string): Promise<void> {
    const current = loadData(groupId);
    const updated: StreakTrackData = {
      ...current,
      members: current.members.filter((m) => m.id !== memberId),
    };
    saveData(updated);
    await mutate();
  }

  /** 출석 기록 추가/수정 */
  async function upsertRecord(
    memberId: string,
    date: string,
    attended: boolean
  ): Promise<void> {
    const current = loadData(groupId);
    const updated: StreakTrackData = {
      ...current,
      members: current.members.map((m) => {
        if (m.id !== memberId) return m;
        const existing = m.records.findIndex((r) => r.date === date);
        let newRecords: StreakTrackRecord[];
        if (existing >= 0) {
          newRecords = m.records.map((r, i) =>
            i === existing ? { ...r, attended } : r
          );
        } else {
          newRecords = [...m.records, { date, attended }];
        }
        return { ...m, records: newRecords };
      }),
    };
    saveData(updated);
    await mutate();
  }

  return {
    streakData,
    loading: isLoading,
    refetch: () => mutate(),
    addMember,
    removeMember,
    upsertRecord,
  };
}
