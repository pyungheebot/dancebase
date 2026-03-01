"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MemberAttendStatRecord,
  MemberAttendStatStatus,
  MemberAttendStatPeriod,
  MemberAttendStatSummary,
  MemberAttendStatOverall,
} from "@/types";

// ─── localStorage 헬퍼 ───────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:member-attendance-stats:${groupId}`;

function loadRecords(groupId: string): MemberAttendStatRecord[] {
  return loadFromStorage<MemberAttendStatRecord[]>(LS_KEY(groupId), []);
}

function saveRecords(groupId: string, records: MemberAttendStatRecord[]): void {
  saveToStorage(LS_KEY(groupId), records);
}

// ─── 유틸 ────────────────────────────────────────────────────

function calcAttendanceRate(
  presentCount: number,
  lateCount: number,
  earlyLeaveCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  const effective = presentCount + lateCount + earlyLeaveCount;
  return Math.round((effective / totalCount) * 100);
}

/**
 * 정렬된 날짜 배열에서 현재 연속 스트릭과 최장 스트릭을 계산합니다.
 */
function calcStreaks(
  sortedDates: string[]
): { currentStreak: number; longestStreak: number } {
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let maxStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // 현재 스트릭: 오늘 또는 어제 기준으로 연속
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  lastDate.setHours(0, 0, 0, 0);
  const diffFromToday = Math.round(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentStreak = 0;
  if (diffFromToday <= 1) {
    currentStreak = 1;
    for (let i = sortedDates.length - 1; i >= 1; i--) {
      const prev = new Date(sortedDates[i - 1]);
      prev.setHours(0, 0, 0, 0);
      const curr = new Date(sortedDates[i]);
      curr.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: maxStreak };
}

/**
 * 기간 필터에 대한 날짜 범위를 반환합니다.
 */
function getPeriodRange(period: MemberAttendStatPeriod): {
  from: string | null;
  to: string | null;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "weekly") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return { from: fmt(monday), to: fmt(now) };
  }

  if (period === "monthly") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: fmt(now) };
  }

  return { from: null, to: null };
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useMemberAttendanceStatsDashboard(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.memberAttendanceStatsDashboard(groupId) : null,
    () => loadRecords(groupId),
    { revalidateOnFocus: false }
  );

  const records = data ?? [];

  // ── 기록 추가 ────────────────────────────────────────────────

  function addRecord(input: {
    memberName: string;
    date: string;
    status: MemberAttendStatStatus;
    notes?: string;
  }): boolean {
    if (!input.memberName.trim()) {
      toast.error(TOAST.MEMBER_NAME_REQUIRED_DOT);
      return false;
    }
    if (!input.date) {
      toast.error(TOAST.DATE_REQUIRED_DOT);
      return false;
    }
    try {
      const newRecord: MemberAttendStatRecord = {
        id: crypto.randomUUID(),
        groupId,
        memberName: input.memberName.trim(),
        date: input.date,
        status: input.status,
        notes: input.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [...records, newRecord];
      saveRecords(groupId, updated);
      mutate(updated, false);
      toast.success(TOAST.ATTENDANCE.ADDED);
      return true;
    } catch {
      toast.error(TOAST.ATTENDANCE.ADD_ERROR);
      return false;
    }
  }

  // ── 기록 삭제 ────────────────────────────────────────────────

  function deleteRecord(id: string): boolean {
    try {
      const updated = records.filter((r) => r.id !== id);
      saveRecords(groupId, updated);
      mutate(updated, false);
      toast.success(TOAST.ATTENDANCE.DELETED);
      return true;
    } catch {
      toast.error(TOAST.ATTENDANCE.DELETE_ERROR);
      return false;
    }
  }

  // ── 기간별 필터 ──────────────────────────────────────────────

  function getFilteredRecords(
    period: MemberAttendStatPeriod
  ): MemberAttendStatRecord[] {
    const { from, to } = getPeriodRange(period);
    if (!from || !to) return records;
    return records.filter((r) => r.date >= from && r.date <= to);
  }

  // ── 멤버별 통계 요약 ──────────────────────────────────────────

  function getMemberSummaries(
    period: MemberAttendStatPeriod = "all"
  ): MemberAttendStatSummary[] {
    const filtered = getFilteredRecords(period);
    const map = new Map<
      string,
      {
        memberName: string;
        totalCount: number;
        presentCount: number;
        lateCount: number;
        earlyLeaveCount: number;
        absentCount: number;
        attendanceRate: number;
      }
    >();

    for (const r of filtered) {
      if (!map.has(r.memberName)) {
        map.set(r.memberName, {
          memberName: r.memberName,
          totalCount: 0,
          presentCount: 0,
          lateCount: 0,
          earlyLeaveCount: 0,
          absentCount: 0,
          attendanceRate: 0,
        });
      }
      const s = map.get(r.memberName)!;
      s.totalCount++;
      if (r.status === "present") s.presentCount++;
      else if (r.status === "late") s.lateCount++;
      else if (r.status === "early_leave") s.earlyLeaveCount++;
      else if (r.status === "absent") s.absentCount++;
    }

    return Array.from(map.values())
      .map((s) => {
        const attendanceRate = calcAttendanceRate(
          s.presentCount,
          s.lateCount,
          s.earlyLeaveCount,
          s.totalCount
        );

        // 스트릭은 전체 기록(기간 무관) 기준, 유효 출석 날짜만
        const memberDates = records
          .filter(
            (r) =>
              r.memberName === s.memberName &&
              (r.status === "present" ||
                r.status === "late" ||
                r.status === "early_leave")
          )
          .map((r) => r.date)
          .sort();

        const { currentStreak, longestStreak } = calcStreaks(memberDates);

        return { ...s, attendanceRate, currentStreak, longestStreak };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  // ── 전체 통계 ────────────────────────────────────────────────

  function getOverallStats(
    period: MemberAttendStatPeriod = "all"
  ): MemberAttendStatOverall {
    const filtered = getFilteredRecords(period);
    const totalRecords = filtered.length;

    const presentTotal = filtered.filter((r) => r.status === "present").length;
    const lateTotal = filtered.filter((r) => r.status === "late").length;
    const earlyLeaveTotal = filtered.filter(
      (r) => r.status === "early_leave"
    ).length;
    const overallAttendanceRate = calcAttendanceRate(
      presentTotal,
      lateTotal,
      earlyLeaveTotal,
      totalRecords
    );

    const summaries = getMemberSummaries(period);

    const topAttendee =
      summaries.length > 0 &&
      summaries[0].totalCount > 0 &&
      summaries[0].attendanceRate > 0
        ? summaries[0].memberName
        : null;

    const mostAbsentee =
      summaries.length > 0
        ? (() => {
            const top = summaries.reduce(
              (prev, curr) =>
                curr.absentCount > prev.absentCount ? curr : prev,
              summaries[0]
            );
            return top.absentCount > 0 ? top.memberName : null;
          })()
        : null;

    const perfectAttendanceMembers = summaries
      .filter((s) => s.attendanceRate === 100 && s.totalCount > 0)
      .map((s) => s.memberName);

    return {
      totalRecords,
      overallAttendanceRate,
      topAttendee,
      mostAbsentee,
      perfectAttendanceMembers,
    };
  }

  // ── 월별 출석률 추이 (바 차트용) ──────────────────────────────

  function getMonthlyTrend(
    months: number = 6
  ): Array<{ label: string; rate: number }> {
    const now = new Date();
    const result: Array<{ label: string; rate: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const pad = (n: number) => String(n).padStart(2, "0");
      const fromStr = `${year}-${pad(month)}-01`;
      // 해당 월의 마지막 날: 다음 달 1일 - 1
      const lastDay = new Date(year, month, 0).getDate();
      const toStr = `${year}-${pad(month)}-${pad(lastDay)}`;

      const monthRecords = records.filter(
        (r) => r.date >= fromStr && r.date <= toStr
      );
      const total = monthRecords.length;
      const present = monthRecords.filter(
        (r) => r.status === "present"
      ).length;
      const late = monthRecords.filter((r) => r.status === "late").length;
      const earlyLeave = monthRecords.filter(
        (r) => r.status === "early_leave"
      ).length;
      const rate = calcAttendanceRate(present, late, earlyLeave, total);

      result.push({ label: `${month}월`, rate });
    }

    return result;
  }

  return {
    records,
    addRecord,
    deleteRecord,
    getFilteredRecords,
    getMemberSummaries,
    getOverallStats,
    getMonthlyTrend,
    refetch: () => mutate(),
  };
}
