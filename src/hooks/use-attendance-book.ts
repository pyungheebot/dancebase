"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  AttendanceBookData,
  AttendanceSheet,

  BookAttendanceStatus,
} from "@/types";

// ——————————————————————————————
// 훅
// ——————————————————————————————

const STORAGE_KEY = (groupId: string) => `attendance-book-${groupId}`;

export function useAttendanceBook(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.attendanceBook(groupId),
    () => loadFromStorage<AttendanceBookData>(STORAGE_KEY(groupId), {} as AttendanceBookData),
    { revalidateOnFocus: false }
  );

  const book: AttendanceBookData = data ?? {
    groupId,
    sheets: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 출석부 생성 ———
  const createSheet = useCallback(
    (params: { date: string; title: string; memberNames: string[] }) => {
      const current = loadFromStorage<AttendanceBookData>(STORAGE_KEY(groupId), {} as AttendanceBookData);
      const newSheet: AttendanceSheet = {
        id: crypto.randomUUID(),
        date: params.date,
        title: params.title,
        records: params.memberNames.map((name) => ({
          memberName: name,
          status: "present" as BookAttendanceStatus,
          note: null,
        })),
        createdAt: new Date().toISOString(),
      };
      const updated: AttendanceBookData = {
        ...current,
        sheets: [newSheet, ...current.sheets],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 출석부 삭제 ———
  const deleteSheet = useCallback(
    (sheetId: string) => {
      const current = loadFromStorage<AttendanceBookData>(STORAGE_KEY(groupId), {} as AttendanceBookData);
      const updated: AttendanceBookData = {
        ...current,
        sheets: current.sheets.filter((s) => s.id !== sheetId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 멤버 출석 상태 변경 ———
  const updateRecord = useCallback(
    (sheetId: string, memberName: string, status: BookAttendanceStatus, note?: string | null) => {
      const current = loadFromStorage<AttendanceBookData>(STORAGE_KEY(groupId), {} as AttendanceBookData);
      const updated: AttendanceBookData = {
        ...current,
        sheets: current.sheets.map((sheet) =>
          sheet.id !== sheetId
            ? sheet
            : {
                ...sheet,
                records: sheet.records.map((rec) =>
                  rec.memberName === memberName
                    ? { ...rec, status, note: note !== undefined ? note : rec.note }
                    : rec
                ),
              }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 전체 출석 처리 ———
  const bulkSetPresent = useCallback(
    (sheetId: string) => {
      const current = loadFromStorage<AttendanceBookData>(STORAGE_KEY(groupId), {} as AttendanceBookData);
      const updated: AttendanceBookData = {
        ...current,
        sheets: current.sheets.map((sheet) =>
          sheet.id !== sheetId
            ? sheet
            : {
                ...sheet,
                records: sheet.records.map((rec) => ({
                  ...rec,
                  status: "present" as BookAttendanceStatus,
                })),
              }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const sheets = book.sheets;
  const totalSheets = sheets.length;

  // 전체 출석률 (present + late → 출석으로 간주)
  let totalRecords = 0;
  let totalPresent = 0;
  for (const sheet of sheets) {
    for (const rec of sheet.records) {
      totalRecords++;
      if (rec.status === "present" || rec.status === "late") totalPresent++;
    }
  }
  const overallAttendanceRate =
    totalRecords === 0 ? 0 : Math.round((totalPresent / totalRecords) * 100);

  // 멤버별 출석률 통계
  type MemberCounts = { present: number; late: number; absent: number; excused: number; total: number };
  const memberMap = new Map<string, MemberCounts>();
  for (const sheet of sheets) {
    for (const rec of sheet.records) {
      const prev: MemberCounts = memberMap.get(rec.memberName) ?? {
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        total: 0,
      };
      const updated = { ...prev, total: prev.total + 1 } as MemberCounts;
      if (rec.status === "present") updated.present = prev.present + 1;
      else if (rec.status === "late") updated.late = prev.late + 1;
      else if (rec.status === "absent") updated.absent = prev.absent + 1;
      else if (rec.status === "excused") updated.excused = prev.excused + 1;
      memberMap.set(rec.memberName, updated);
    }
  }
  const memberAttendanceStats = Array.from(memberMap.entries())
    .map(([name, counts]) => ({
      memberName: name,
      present: counts.present,
      late: counts.late,
      absent: counts.absent,
      excused: counts.excused,
      total: counts.total,
      rate:
        counts.total === 0
          ? 0
          : Math.round(((counts.present + counts.late) / counts.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate);

  // 최근 5개 시트
  const recentSheets = [...sheets].slice(0, 5);

  return {
    book,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    createSheet,
    deleteSheet,
    updateRecord,
    bulkSetPresent,
    // 통계
    totalSheets,
    overallAttendanceRate,
    memberAttendanceStats,
    recentSheets,
  };
}
