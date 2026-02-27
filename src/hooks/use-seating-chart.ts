"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SeatingChart, SeatInfo, SeatStatus } from "@/types";

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string, projectId: string) =>
  `dancebase:seating:${groupId}:${projectId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadCharts(groupId: string, projectId: string): SeatingChart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId, projectId));
    return raw ? (JSON.parse(raw) as SeatingChart[]) : [];
  } catch {
    return [];
  }
}

function saveCharts(
  groupId: string,
  projectId: string,
  charts: SeatingChart[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId, projectId), JSON.stringify(charts));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 좌석 ID 생성 헬퍼
// ============================================

function makeSeatId(row: string, number: number): string {
  return `${row}${number}`;
}

// ============================================
// 행 라벨 생성 (0-based index -> A, B, C ...)
// ============================================

export function rowLabel(index: number): string {
  // 0 -> A, 1 -> B ... 25 -> Z, 26 -> AA ...
  if (index < 26) return String.fromCharCode(65 + index);
  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const second = String.fromCharCode(65 + (index % 26));
  return first + second;
}

// ============================================
// 좌석 그리드 초기 생성
// ============================================

function buildSeats(
  rows: number,
  seatsPerRow: number
): SeatInfo[] {
  const seats: SeatInfo[] = [];
  for (let r = 0; r < rows; r++) {
    const row = rowLabel(r);
    for (let n = 1; n <= seatsPerRow; n++) {
      seats.push({
        id: makeSeatId(row, n),
        row,
        number: n,
        status: "available",
        reservedBy: "",
        tier: "standard",
      });
    }
  }
  return seats;
}

// ============================================
// 훅
// ============================================

export function useSeatingChart(groupId: string, projectId: string) {
  const { data, mutate } = useSWR(
    groupId && projectId
      ? swrKeys.seatingChart(groupId, projectId)
      : null,
    () => loadCharts(groupId, projectId),
    { revalidateOnFocus: false }
  );

  const charts: SeatingChart[] = data ?? [];

  // ── 배치도 생성 ──────────────────────────────────────────

  function createChart(
    eventName: string,
    rows: number,
    seatsPerRow: number
  ): void {
    const newChart: SeatingChart = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventName: eventName.trim(),
      rows,
      seatsPerRow,
      seats: buildSeats(rows, seatsPerRow),
      createdAt: new Date().toISOString(),
    };
    const next = [...charts, newChart];
    saveCharts(groupId, projectId, next);
    mutate(next, false);
  }

  // ── 배치도 삭제 ──────────────────────────────────────────

  function deleteChart(chartId: string): void {
    const next = charts.filter((c) => c.id !== chartId);
    saveCharts(groupId, projectId, next);
    mutate(next, false);
  }

  // ── 특정 좌석 업데이트 내부 헬퍼 ─────────────────────────

  function updateSeat(
    chartId: string,
    seatId: string,
    patch: Partial<SeatInfo>
  ): void {
    const next = charts.map((c) => {
      if (c.id !== chartId) return c;
      return {
        ...c,
        seats: c.seats.map((s) =>
          s.id === seatId ? { ...s, ...patch } : s
        ),
      };
    });
    saveCharts(groupId, projectId, next);
    mutate(next, false);
  }

  // ── 좌석 예약 ────────────────────────────────────────────

  function reserveSeat(chartId: string, seatId: string, name: string): void {
    updateSeat(chartId, seatId, {
      status: "reserved" as SeatStatus,
      reservedBy: name.trim(),
    });
  }

  // ── 좌석 예약 해제 ───────────────────────────────────────

  function releaseSeat(chartId: string, seatId: string): void {
    updateSeat(chartId, seatId, {
      status: "available" as SeatStatus,
      reservedBy: "",
    });
  }

  // ── 좌석 차단 ────────────────────────────────────────────

  function blockSeat(chartId: string, seatId: string): void {
    updateSeat(chartId, seatId, {
      status: "blocked" as SeatStatus,
      reservedBy: "",
    });
  }

  // ── 통계 계산 ────────────────────────────────────────────

  function getStats(chartId: string) {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) {
      return {
        totalSeats: 0,
        reservedCount: 0,
        availableCount: 0,
        blockedCount: 0,
        reservationRate: 0,
      };
    }
    const totalSeats = chart.seats.length;
    const reservedCount = chart.seats.filter(
      (s) => s.status === "reserved"
    ).length;
    const availableCount = chart.seats.filter(
      (s) => s.status === "available"
    ).length;
    const blockedCount = chart.seats.filter(
      (s) => s.status === "blocked"
    ).length;
    const usableSeats = totalSeats - blockedCount;
    const reservationRate =
      usableSeats > 0
        ? Math.round((reservedCount / usableSeats) * 100)
        : 0;
    return {
      totalSeats,
      reservedCount,
      availableCount,
      blockedCount,
      reservationRate,
    };
  }

  return {
    charts,
    loading: data === undefined,
    refetch: () => mutate(),
    // CRUD
    createChart,
    deleteChart,
    reserveSeat,
    releaseSeat,
    blockSeat,
    // 통계
    getStats,
  };
}
