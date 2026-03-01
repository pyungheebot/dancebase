"use client";

import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceDashRecord, AttendanceDashStatus, AttendanceDashSummary } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 헬퍼 ───────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:attendance-dashboard:${groupId}`;

// ─── 유틸 ────────────────────────────────────────────────────

function calcAttendanceRate(
  presentCount: number,
  lateCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round(((presentCount + lateCount) / totalCount) * 100);
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useAttendanceDashboard(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.attendanceDashboard(groupId) : null,
    () => loadFromStorage<AttendanceDashRecord[]>(LS_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const records = data ?? [];

  // ── 기록 추가 ────────────────────────────────────────────────

  function addRecord(input: {
    memberName: string;
    date: string;
    status: AttendanceDashStatus;
    notes?: string;
  }): boolean {
    if (!input.memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return false;
    }
    if (!input.date) {
      toast.error("날짜를 입력해주세요.");
      return false;
    }
    try {
      const newRecord: AttendanceDashRecord = {
        id: crypto.randomUUID(),
        memberName: input.memberName.trim(),
        date: input.date,
        status: input.status,
        notes: input.notes?.trim() || undefined,
      };
      const updated = [...records, newRecord];
      saveToStorage(LS_KEY(groupId), updated);
      mutate(updated, false);
      toast.success("출석 기록이 추가되었습니다.");
      return true;
    } catch {
      toast.error("출석 기록 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 기록 수정 ────────────────────────────────────────────────

  function updateRecord(
    id: string,
    updates: Partial<Omit<AttendanceDashRecord, "id">>
  ): boolean {
    try {
      const updated = records.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveToStorage(LS_KEY(groupId), updated);
      mutate(updated, false);
      toast.success("출석 기록이 수정되었습니다.");
      return true;
    } catch {
      toast.error("출석 기록 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 기록 삭제 ────────────────────────────────────────────────

  function deleteRecord(id: string): boolean {
    try {
      const updated = records.filter((r) => r.id !== id);
      saveToStorage(LS_KEY(groupId), updated);
      mutate(updated, false);
      toast.success("출석 기록이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("출석 기록 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 월별 필터 ────────────────────────────────────────────────

  function getByMonth(year: number, month: number): AttendanceDashRecord[] {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return records.filter((r) => r.date.startsWith(prefix));
  }

  // ── 멤버별 필터 ──────────────────────────────────────────────

  function getByMember(memberName: string): AttendanceDashRecord[] {
    return records.filter(
      (r) => r.memberName.toLowerCase() === memberName.toLowerCase()
    );
  }

  // ── 멤버별 요약 ──────────────────────────────────────────────

  function getMemberSummaries(): AttendanceDashSummary[] {
    const map = new Map<string, AttendanceDashSummary>();

    for (const r of records) {
      if (!map.has(r.memberName)) {
        map.set(r.memberName, {
          memberName: r.memberName,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          excusedCount: 0,
          attendanceRate: 0,
        });
      }
      const summary = map.get(r.memberName)!;
      if (r.status === "present") summary.presentCount++;
      else if (r.status === "late") summary.lateCount++;
      else if (r.status === "absent") summary.absentCount++;
      else if (r.status === "excused") summary.excusedCount++;
    }

    const summaries = Array.from(map.values()).map((s) => {
      const total =
        s.presentCount + s.lateCount + s.absentCount + s.excusedCount;
      return {
        ...s,
        attendanceRate: calcAttendanceRate(s.presentCount, s.lateCount, total),
      };
    });

    return summaries.sort((a, b) => b.attendanceRate - a.attendanceRate);
  }

  // ── 월별 출석률 추이 ──────────────────────────────────────────

  function getMonthlyTrend(
    months: number
  ): Array<{ label: string; rate: number; year: number; month: number }> {
    const now = new Date();
    const result: Array<{ label: string; rate: number; year: number; month: number }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthRecords = getByMonth(year, month);

      const total = monthRecords.length;
      const present = monthRecords.filter((r) => r.status === "present").length;
      const late = monthRecords.filter((r) => r.status === "late").length;
      const rate = calcAttendanceRate(present, late, total);

      result.push({
        label: `${month}월`,
        rate,
        year,
        month,
      });
    }

    return result;
  }

  // ── 전체 통계 ────────────────────────────────────────────────

  const totalRecords = records.length;
  const presentTotal = records.filter((r) => r.status === "present").length;
  const lateTotal = records.filter((r) => r.status === "late").length;
  const overallAttendanceRate = calcAttendanceRate(
    presentTotal,
    lateTotal,
    totalRecords
  );

  const summaries = getMemberSummaries();
  const perfectAttendanceMembers = summaries
    .filter((s) => s.attendanceRate === 100 && s.presentCount + s.lateCount > 0)
    .map((s) => s.memberName);

  const stats = {
    totalRecords,
    overallAttendanceRate,
    perfectAttendanceMembers,
  };

  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getByMonth,
    getByMember,
    getMemberSummaries,
    getMonthlyTrend,
    stats,
    refetch: () => mutate(),
  };
}
