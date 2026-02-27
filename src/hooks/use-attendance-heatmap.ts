"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { HeatmapDayData, AttendanceHeatmapData } from "@/types";

// ─── localStorage 헬퍼 ───────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:heatmap:${groupId}`;

/** localStorage에서 멤버 맵 로드 */
function loadData(groupId: string): Record<string, HeatmapDayData[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, HeatmapDayData[]>;
  } catch {
    return {};
  }
}

/** localStorage에 멤버 맵 저장 */
function saveData(groupId: string, data: Record<string, HeatmapDayData[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// ─── 날짜 헬퍼 ──────────────────────────────────────────────

/** 오늘 날짜 (YYYY-MM-DD) */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 해당 연도의 첫째 날 (YYYY-MM-DD) */
function yearStart(year: number): string {
  return `${year}-01-01`;
}

/** 해당 연도의 마지막 날 (YYYY-MM-DD) */
function yearEnd(year: number): string {
  return `${year}-12-31`;
}

// ─── 통계 계산 헬퍼 ─────────────────────────────────────────

/** 활성 날짜 배열에서 최장 연속 스트릭 계산 */
function calcLongestStreak(activeDates: string[]): number {
  if (activeDates.length === 0) return 0;

  const sorted = [...activeDates].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

// ─── 데모 데이터 생성 ────────────────────────────────────────

const DEMO_ACTIVITIES = ["연습", "공연", "이벤트", "모임", "스터디"];

/** 특정 멤버의 시뮬레이션 데이터 생성 (현재 연도 기준) */
function generateDemoData(year: number): HeatmapDayData[] {
  const start = new Date(yearStart(year));
  const end = new Date(yearEnd(year));
  const today = new Date(todayStr());
  const clampedEnd = end < today ? end : today;

  const days: HeatmapDayData[] = [];
  const cursor = new Date(start);

  while (cursor <= clampedEnd) {
    const dateStr = cursor.toISOString().slice(0, 10);

    // 약 35% 확률로 활동 있음
    if (Math.random() < 0.35) {
      const count = Math.floor(Math.random() * 4) + 1; // 1~4
      const activities: string[] = [];
      for (let i = 0; i < count; i++) {
        const act = DEMO_ACTIVITIES[Math.floor(Math.random() * DEMO_ACTIVITIES.length)];
        if (!activities.includes(act)) activities.push(act);
      }
      days.push({ date: dateStr, count: activities.length, activities });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

// ─── 히트맵 데이터 조회 ──────────────────────────────────────

/** 멤버의 특정 연도 히트맵 데이터 계산 */
function getHeatmapData(
  days: HeatmapDayData[],
  memberName: string,
  year: number
): AttendanceHeatmapData {
  const start = yearStart(year);
  const end = yearEnd(year);

  // 해당 연도 데이터만 필터링
  const yearDays = days.filter((d) => d.date >= start && d.date <= end);

  const activeDates = yearDays.filter((d) => d.count > 0).map((d) => d.date);
  const totalActiveDays = activeDates.length;
  const longestStreak = calcLongestStreak(activeDates);

  return {
    memberName,
    year,
    days: yearDays,
    totalActiveDays,
    longestStreak,
  };
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useAttendanceHeatmap(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.attendanceHeatmap(groupId) : null,
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  // 멤버별 활동 맵: { [memberName]: HeatmapDayData[] }
  const memberMap: Record<string, HeatmapDayData[]> = data ?? {};
  const memberNames = Object.keys(memberMap);

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: Record<string, HeatmapDayData[]>): void {
    saveData(groupId, next);
    mutate(next, false);
  }

  // ── 멤버 추가 ────────────────────────────────────────────

  function addMember(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const stored = loadData(groupId);
    if (trimmed in stored) return false;
    update({ ...stored, [trimmed]: [] });
    return true;
  }

  // ── 멤버 삭제 ────────────────────────────────────────────

  function removeMember(name: string): boolean {
    const stored = loadData(groupId);
    if (!(name in stored)) return false;
    const next = { ...stored };
    delete next[name];
    update(next);
    return true;
  }

  // ── 활동 추가 ────────────────────────────────────────────

  function addActivity(memberName: string, date: string, activity: string): boolean {
    const trimmedName = memberName.trim();
    const trimmedActivity = activity.trim();
    if (!trimmedName || !date || !trimmedActivity) return false;

    const stored = loadData(groupId);
    if (!(trimmedName in stored)) return false;

    const days = stored[trimmedName];
    const existingIdx = days.findIndex((d) => d.date === date);

    let nextDays: HeatmapDayData[];
    if (existingIdx !== -1) {
      const existing = days[existingIdx];
      if (existing.activities.includes(trimmedActivity)) return true; // 이미 있음
      const updatedActivities = [...existing.activities, trimmedActivity];
      nextDays = days.map((d, i) =>
        i === existingIdx
          ? { ...d, activities: updatedActivities, count: updatedActivities.length }
          : d
      );
    } else {
      nextDays = [
        ...days,
        { date, count: 1, activities: [trimmedActivity] },
      ];
    }

    update({ ...stored, [trimmedName]: nextDays });
    return true;
  }

  // ── 활동 제거 ────────────────────────────────────────────

  function removeActivity(memberName: string, date: string, activity?: string): boolean {
    const stored = loadData(groupId);
    if (!(memberName in stored)) return false;

    const days = stored[memberName];
    const existingIdx = days.findIndex((d) => d.date === date);
    if (existingIdx === -1) return false;

    let nextDays: HeatmapDayData[];
    if (!activity) {
      // 해당 날짜 전체 삭제
      nextDays = days.filter((d) => d.date !== date);
    } else {
      const existing = days[existingIdx];
      const updatedActivities = existing.activities.filter((a) => a !== activity);
      if (updatedActivities.length === 0) {
        nextDays = days.filter((d) => d.date !== date);
      } else {
        nextDays = days.map((d, i) =>
          i === existingIdx
            ? { ...d, activities: updatedActivities, count: updatedActivities.length }
            : d
        );
      }
    }

    update({ ...stored, [memberName]: nextDays });
    return true;
  }

  // ── 데모 데이터 생성 ─────────────────────────────────────

  function generateDemoDataForMember(memberName: string): boolean {
    const stored = loadData(groupId);
    if (!(memberName in stored)) return false;

    const year = new Date().getFullYear();
    const demoDays = generateDemoData(year);
    update({ ...stored, [memberName]: demoDays });
    return true;
  }

  // ── 히트맵 데이터 조회 ───────────────────────────────────

  function getMemberHeatmapData(memberName: string, year: number): AttendanceHeatmapData {
    const days = memberMap[memberName] ?? [];
    return getHeatmapData(days, memberName, year);
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalMembers = memberNames.length;

  const mostActiveMember: string | null = (() => {
    if (memberNames.length === 0) return null;
    const year = new Date().getFullYear();
    let best: string | null = null;
    let bestCount = -1;

    for (const name of memberNames) {
      const days = memberMap[name] ?? [];
      const yearDays = days.filter(
        (d) => d.date >= yearStart(year) && d.date <= yearEnd(year) && d.count > 0
      );
      if (yearDays.length > bestCount) {
        bestCount = yearDays.length;
        best = name;
      }
    }

    return best;
  })();

  return {
    memberNames,
    memberMap,
    // CRUD
    addMember,
    removeMember,
    addActivity,
    removeActivity,
    generateDemoData: generateDemoDataForMember,
    // 조회
    getHeatmapData: getMemberHeatmapData,
    // 통계
    totalMembers,
    mostActiveMember,
    // SWR
    refetch: () => mutate(),
  };
}
