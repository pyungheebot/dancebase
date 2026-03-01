"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SeatReservationLayout,
  SeatReservationEntry,

} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:seat-reservation:${groupId}:${projectId}`;
}

function loadLayouts(
  groupId: string,
  projectId: string
): SeatReservationLayout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as SeatReservationLayout[]) : [];
  } catch {
    return [];
  }
}

function saveLayouts(
  groupId: string,
  projectId: string,
  layouts: SeatReservationLayout[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(layouts)
  );
}

// 행 인덱스(0~)를 A, B, C ... Z, AA, AB ... 로 변환
function rowLabel(index: number): string {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < 26) return alpha[index];
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return alpha[first] + alpha[second];
}

// 좌석 배치 자동 생성
function generateSeats(rows: number, seatsPerRow: number): SeatReservationEntry[] {
  const seats: SeatReservationEntry[] = [];
  for (let r = 0; r < rows; r++) {
    const row = rowLabel(r);
    for (let n = 1; n <= seatsPerRow; n++) {
      seats.push({
        id: crypto.randomUUID(),
        seatLabel: `${row}${n}`,
        row,
        number: n,
        status: "available",
      });
    }
  }
  return seats;
}

// ============================================================
// 훅
// ============================================================

export function useSeatReservation(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.seatReservation(groupId, projectId),
    async () => loadLayouts(groupId, projectId)
  );

  const layouts = data ?? [];

  // ── 배치 생성 ──
  async function createLayout(
    name: string,
    rows: number,
    seatsPerRow: number
  ): Promise<void> {
    const newLayout: SeatReservationLayout = {
      id: crypto.randomUUID(),
      projectId,
      layoutName: name,
      rows,
      seatsPerRow,
      seats: generateSeats(rows, seatsPerRow),
      createdAt: new Date().toISOString(),
    };
    const updated = [...layouts, newLayout];
    saveLayouts(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 배치 삭제 ──
  async function deleteLayout(layoutId: string): Promise<void> {
    const updated = layouts.filter((l) => l.id !== layoutId);
    saveLayouts(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 좌석 상태 변경 공통 유틸 ──
  async function updateSeatStatus(
    layoutId: string,
    seatId: string,
    changes: Partial<SeatReservationEntry>
  ): Promise<void> {
    const updated = layouts.map((layout) => {
      if (layout.id !== layoutId) return layout;
      return {
        ...layout,
        seats: layout.seats.map((seat) =>
          seat.id === seatId ? { ...seat, ...changes } : seat
        ),
      };
    });
    saveLayouts(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 좌석 예약 ──
  async function reserveSeat(
    layoutId: string,
    seatId: string,
    reservedBy: string,
    reservedFor: string,
    phone?: string,
    notes?: string
  ): Promise<void> {
    await updateSeatStatus(layoutId, seatId, {
      status: "reserved",
      reservedBy,
      reservedFor,
      phone,
      notes,
      reservedAt: new Date().toISOString(),
    });
  }

  // ── 예약 취소 ──
  async function cancelReservation(
    layoutId: string,
    seatId: string
  ): Promise<void> {
    await updateSeatStatus(layoutId, seatId, {
      status: "available",
      reservedBy: undefined,
      reservedFor: undefined,
      phone: undefined,
      notes: undefined,
      reservedAt: undefined,
    });
  }

  // ── 좌석 차단 ──
  async function blockSeat(layoutId: string, seatId: string): Promise<void> {
    await updateSeatStatus(layoutId, seatId, { status: "blocked" });
  }

  // ── 좌석 차단 해제 ──
  async function unblockSeat(layoutId: string, seatId: string): Promise<void> {
    await updateSeatStatus(layoutId, seatId, {
      status: "available",
      reservedBy: undefined,
      reservedFor: undefined,
      phone: undefined,
      notes: undefined,
      reservedAt: undefined,
    });
  }

  // ── 통계 계산 ──
  function getStats(layout: SeatReservationLayout) {
    const totalSeats = layout.seats.length;
    const reservedSeats = layout.seats.filter(
      (s) => s.status === "reserved" || s.status === "occupied"
    ).length;
    const availableSeats = layout.seats.filter(
      (s) => s.status === "available"
    ).length;
    const blockedSeats = layout.seats.filter(
      (s) => s.status === "blocked"
    ).length;
    const occupancyRate =
      totalSeats > 0
        ? Math.round((reservedSeats / (totalSeats - blockedSeats || 1)) * 100)
        : 0;
    return { totalSeats, reservedSeats, availableSeats, blockedSeats, occupancyRate };
  }

  return {
    layouts,
    loading: isLoading,
    refetch: () => mutate(),
    createLayout,
    deleteLayout,
    reserveSeat,
    cancelReservation,
    blockSeat,
    unblockSeat,
    getStats,
  };
}
