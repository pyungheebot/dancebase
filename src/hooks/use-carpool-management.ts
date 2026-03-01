"use client";

import { useState, useCallback } from "react";
import type { CarpoolRide, CarpoolRideStatus } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:carpool:${groupId}`;
}

function loadData(groupId: string): CarpoolRide[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as CarpoolRide[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: CarpoolRide[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type CarpoolStats = {
  totalRides: number;
  openRides: number;
  totalPassengers: number;
};

// ============================================================
// 훅
// ============================================================

export function useCarpoolManagement(groupId: string) {
  const [rides, setRides] = useState<CarpoolRide[]>(() => loadData(groupId));

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setRides(data);
  }, [groupId]);

  const persist = useCallback(
    (next: CarpoolRide[]) => {
      saveData(groupId, next);
      setRides(next);
    },
    [groupId]
  );

  // 카풀 추가
  const addRide = useCallback(
    (
      driverName: string,
      date: string,
      departureTime: string,
      departureLocation: string,
      destination: string,
      totalSeats: number,
      notes?: string
    ): CarpoolRide => {
      const entry: CarpoolRide = {
        id: crypto.randomUUID(),
        driverName,
        date,
        departureTime,
        departureLocation,
        destination,
        totalSeats,
        passengers: [],
        notes,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      persist([...rides, entry]);
      return entry;
    },
    [rides, persist]
  );

  // 카풀 삭제
  const deleteRide = useCallback(
    (id: string): boolean => {
      const next = rides.filter((r) => r.id !== id);
      if (next.length === rides.length) return false;
      persist(next);
      return true;
    },
    [rides, persist]
  );

  // 탑승 (좌석 초과 시 false)
  const joinRide = useCallback(
    (id: string, passengerName: string): boolean => {
      const idx = rides.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      const ride = rides[idx];
      if (ride.status !== "open") return false;
      if (ride.passengers.includes(passengerName)) return false;
      if (ride.passengers.length >= ride.totalSeats) return false;

      const updatedPassengers = [...ride.passengers, passengerName];
      const newStatus: CarpoolRideStatus =
        updatedPassengers.length >= ride.totalSeats ? "full" : "open";

      const next = [...rides];
      next[idx] = {
        ...ride,
        passengers: updatedPassengers,
        status: newStatus,
      };
      persist(next);
      return true;
    },
    [rides, persist]
  );

  // 하차
  const leaveRide = useCallback(
    (id: string, passengerName: string): boolean => {
      const idx = rides.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      const ride = rides[idx];
      if (!ride.passengers.includes(passengerName)) return false;

      const updatedPassengers = ride.passengers.filter(
        (p) => p !== passengerName
      );
      const newStatus: CarpoolRideStatus =
        ride.status === "full" ? "open" : ride.status;

      const next = [...rides];
      next[idx] = {
        ...ride,
        passengers: updatedPassengers,
        status: newStatus,
      };
      persist(next);
      return true;
    },
    [rides, persist]
  );

  // 상태 변경
  const changeStatus = useCallback(
    (id: string, status: CarpoolRideStatus): boolean => {
      const idx = rides.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      const next = [...rides];
      next[idx] = { ...next[idx], status };
      persist(next);
      return true;
    },
    [rides, persist]
  );

  // 날짜별 필터
  const getByDate = useCallback(
    (date: string): CarpoolRide[] => {
      return rides.filter((r) => r.date === date);
    },
    [rides]
  );

  // open 상태만
  const getAvailableRides = useCallback((): CarpoolRide[] => {
    return rides.filter((r) => r.status === "open");
  }, [rides]);

  // 통계
  const stats: CarpoolStats = {
    totalRides: rides.length,
    openRides: rides.filter((r) => r.status === "open").length,
    totalPassengers: rides.reduce((sum, r) => sum + r.passengers.length, 0),
  };

  return {
    rides,
    loading: false,
    addRide,
    deleteRide,
    joinRide,
    leaveRide,
    changeStatus,
    getByDate,
    getAvailableRides,
    stats,
    refetch: reload,
  };
}
