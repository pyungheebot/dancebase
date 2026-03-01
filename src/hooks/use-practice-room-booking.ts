"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeRoom,
  PracticeRoomBooking,
  PracticeRoomBookingData,
  PracticeRoomBookingStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const BOOKING_STATUS_LIST: PracticeRoomBookingStatus[] = [
  "예약됨",
  "확정됨",
  "취소됨",
  "완료됨",
];

export const BOOKING_STATUS_COLORS: Record<
  PracticeRoomBookingStatus,
  { bg: string; text: string; badge: string }
> = {
  예약됨: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  확정됨: {
    bg: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
  },
  취소됨: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-600",
  },
  완료됨: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
  },
};

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return swrKeys.practiceRoomBooking(groupId);
}

// ============================================================
// 날짜/시간 헬퍼
// ============================================================

/** 오늘 날짜 YYYY-MM-DD */
export function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 이번 주 월요일 ~ 일요일 날짜 배열 (YYYY-MM-DD) */
export function getWeekDates(baseDate?: string): string[] {
  const base = baseDate ? new Date(baseDate) : new Date();
  const day = base.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 이동
  const monday = new Date(base);
  monday.setDate(base.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

/** HH:MM 두 시간 비교 (분 단위) */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** 두 예약이 시간상 충돌하는지 검사 */
function hasTimeConflict(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

// ============================================================
// 통계 타입
// ============================================================

export type PracticeRoomBookingStats = {
  /** 이번 주 예약 수 (취소 제외) */
  thisWeekCount: number;
  /** 가장 많이 사용하는 연습실 (없으면 null) */
  mostUsedRoom: PracticeRoom | null;
  /** 전체 예약 수 */
  totalCount: number;
  /** 활성 예약 수 (예약됨 + 확정됨) */
  activeCount: number;
};

// ============================================================
// 훅
// ============================================================

export function usePracticeRoomBooking(groupId: string) {
  const [rooms, setRooms] = useState<PracticeRoom[]>(() => loadFromStorage<PracticeRoomBookingData>(storageKey(groupId), {} as PracticeRoomBookingData).rooms);
  const [bookings, setBookings] = useState<PracticeRoomBooking[]>([]);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadFromStorage<PracticeRoomBookingData>(storageKey(groupId), {} as PracticeRoomBookingData);
    setRooms(data.rooms);
    setBookings(data.bookings);
  }, [groupId]);

  const persist = useCallback(
    (updatedRooms: PracticeRoom[], updatedBookings: PracticeRoomBooking[]) => {
      const data: PracticeRoomBookingData = {
        groupId,
        rooms: updatedRooms,
        bookings: updatedBookings,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), data);
      setRooms(updatedRooms);
      setBookings(updatedBookings);
    },
    [groupId]
  );

  // ── 연습실 CRUD ──────────────────────────────────────────────

  /** 연습실 추가 */
  const addRoom = useCallback(
    (
      params: Omit<PracticeRoom, "id" | "createdAt">
    ): PracticeRoom => {
      const newRoom: PracticeRoom = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([...rooms, newRoom], bookings);
      return newRoom;
    },
    [rooms, bookings, persist]
  );

  /** 연습실 수정 */
  const updateRoom = useCallback(
    (
      roomId: string,
      params: Partial<Omit<PracticeRoom, "id" | "createdAt">>
    ): boolean => {
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx === -1) return false;
      const updated = rooms.map((r) =>
        r.id === roomId ? { ...r, ...params } : r
      );
      persist(updated, bookings);
      return true;
    },
    [rooms, bookings, persist]
  );

  /** 연습실 삭제 (관련 예약도 함께 삭제) */
  const deleteRoom = useCallback(
    (roomId: string): boolean => {
      const exists = rooms.some((r) => r.id === roomId);
      if (!exists) return false;
      const updatedRooms = rooms.filter((r) => r.id !== roomId);
      const updatedBookings = bookings.filter((b) => b.roomId !== roomId);
      persist(updatedRooms, updatedBookings);
      return true;
    },
    [rooms, bookings, persist]
  );

  // ── 예약 CRUD ────────────────────────────────────────────────

  /**
   * 충돌 감지: 같은 연습실, 같은 날짜에 시간이 겹치는 예약 반환
   * excludeId 가 있으면 해당 예약 제외 (수정 시 자기 자신 제외)
   */
  const findConflicts = useCallback(
    (
      roomId: string,
      date: string,
      startTime: string,
      endTime: string,
      excludeId?: string
    ): PracticeRoomBooking[] => {
      return bookings.filter(
        (b) =>
          b.roomId === roomId &&
          b.date === date &&
          b.status !== "취소됨" &&
          b.id !== excludeId &&
          hasTimeConflict({ startTime, endTime }, b)
      );
    },
    [bookings]
  );

  /** 예약 추가 (충돌 시 null 반환) */
  const addBooking = useCallback(
    (
      params: Omit<PracticeRoomBooking, "id" | "createdAt">
    ): PracticeRoomBooking | null => {
      const conflicts = findConflicts(
        params.roomId,
        params.date,
        params.startTime,
        params.endTime
      );
      if (conflicts.length > 0) return null;

      const newBooking: PracticeRoomBooking = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist(rooms, [...bookings, newBooking]);
      return newBooking;
    },
    [rooms, bookings, persist, findConflicts]
  );

  /** 예약 수정 (충돌 시 false 반환) */
  const updateBooking = useCallback(
    (
      bookingId: string,
      params: Partial<
        Omit<PracticeRoomBooking, "id" | "createdAt">
      >
    ): boolean => {
      const existing = bookings.find((b) => b.id === bookingId);
      if (!existing) return false;

      const merged = { ...existing, ...params };
      const conflicts = findConflicts(
        merged.roomId,
        merged.date,
        merged.startTime,
        merged.endTime,
        bookingId
      );
      if (conflicts.length > 0) return false;

      const updated = bookings.map((b) =>
        b.id === bookingId ? merged : b
      );
      persist(rooms, updated);
      return true;
    },
    [rooms, bookings, persist, findConflicts]
  );

  /** 예약 삭제 */
  const deleteBooking = useCallback(
    (bookingId: string): boolean => {
      const exists = bookings.some((b) => b.id === bookingId);
      if (!exists) return false;
      persist(rooms, bookings.filter((b) => b.id !== bookingId));
      return true;
    },
    [rooms, bookings, persist]
  );

  /** 예약 상태 변경 */
  const changeBookingStatus = useCallback(
    (bookingId: string, status: PracticeRoomBookingStatus): boolean => {
      return updateBooking(bookingId, { status });
    },
    [updateBooking]
  );

  // ── 조회 헬퍼 ────────────────────────────────────────────────

  /** 특정 날짜 범위의 예약 반환 */
  const getBookingsByDateRange = useCallback(
    (startDate: string, endDate: string): PracticeRoomBooking[] => {
      return bookings
        .filter((b) => b.date >= startDate && b.date <= endDate)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
    },
    [bookings]
  );

  /** 특정 연습실의 예약 반환 */
  const getBookingsByRoom = useCallback(
    (roomId: string): PracticeRoomBooking[] => {
      return bookings
        .filter((b) => b.roomId === roomId)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
    },
    [bookings]
  );

  /** roomId로 연습실 정보 조회 */
  const getRoomById = useCallback(
    (roomId: string): PracticeRoom | undefined => {
      return rooms.find((r) => r.id === roomId);
    },
    [rooms]
  );

  // ── 통계 ────────────────────────────────────────────────────

  const stats: PracticeRoomBookingStats = (() => {
    const weekDates = getWeekDates();
    const weekStart = weekDates[0]!;
    const weekEnd = weekDates[6]!;

    const thisWeekBookings = bookings.filter(
      (b) =>
        b.date >= weekStart &&
        b.date <= weekEnd &&
        b.status !== "취소됨"
    );

    // 가장 많이 사용하는 연습실
    const roomUsageMap: Record<string, number> = {};
    for (const b of bookings) {
      if (b.status === "취소됨") continue;
      roomUsageMap[b.roomId] = (roomUsageMap[b.roomId] ?? 0) + 1;
    }
    let mostUsedRoomId: string | null = null;
    let maxUsage = 0;
    for (const [rId, count] of Object.entries(roomUsageMap)) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedRoomId = rId;
      }
    }
    const mostUsedRoom = mostUsedRoomId
      ? (rooms.find((r) => r.id === mostUsedRoomId) ?? null)
      : null;

    const activeCount = bookings.filter(
      (b) => b.status === "예약됨" || b.status === "확정됨"
    ).length;

    return {
      thisWeekCount: thisWeekBookings.length,
      mostUsedRoom,
      totalCount: bookings.length,
      activeCount,
    };
  })();

  return {
    rooms,
    bookings,
    loading: false,
    stats,
    // 연습실 CRUD
    addRoom,
    updateRoom,
    deleteRoom,
    // 예약 CRUD
    addBooking,
    updateBooking,
    deleteBooking,
    changeBookingStatus,
    // 충돌 감지
    findConflicts,
    // 조회
    getBookingsByDateRange,
    getBookingsByRoom,
    getRoomById,
    refetch: reload,
  };
}
