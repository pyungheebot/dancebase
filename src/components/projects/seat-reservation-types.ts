// ============================================================
// 좌석 예약 — 타입, 상수, 유효성 검증
// ============================================================

import type { SeatReservationStatus } from "@/types";

// ── 상수 & 레이블 ──────────────────────────────────────────

export const STATUS_LABELS: Record<SeatReservationStatus, string> = {
  available: "예약 가능",
  reserved: "예약됨",
  occupied: "사용 중",
  blocked: "차단됨",
};

export const STATUS_COLORS: Record<SeatReservationStatus, string> = {
  available: "bg-green-100 text-green-700 border-green-300",
  reserved: "bg-blue-100 text-blue-700 border-blue-300",
  occupied: "bg-red-100 text-red-700 border-red-300",
  blocked: "bg-gray-100 text-gray-500 border-gray-300",
};

export const SEAT_BG: Record<SeatReservationStatus, string> = {
  available:
    "bg-green-100 border-green-400 hover:bg-green-200 text-green-800 cursor-pointer",
  reserved:
    "bg-blue-100 border-blue-400 hover:bg-blue-200 text-blue-800 cursor-pointer",
  occupied:
    "bg-red-100 border-red-400 text-red-800 cursor-pointer",
  blocked:
    "bg-gray-100 border-gray-300 text-gray-400 cursor-pointer",
};

/** 상태 순서 (범례용) */
export const SEAT_STATUS_ORDER: SeatReservationStatus[] = [
  "available",
  "reserved",
  "occupied",
  "blocked",
];

// ── 배치 생성 폼 ───────────────────────────────────────────

export type LayoutFormData = {
  name: string;
  rows: string;
  seatsPerRow: string;
};

export function emptyLayoutForm(): LayoutFormData {
  return { name: "", rows: "5", seatsPerRow: "10" };
}

// ── 예약 폼 ────────────────────────────────────────────────

export type ReserveFormData = {
  reservedBy: string;
  reservedFor: string;
  phone: string;
  notes: string;
};

export function emptyReserveForm(): ReserveFormData {
  return { reservedBy: "", reservedFor: "", phone: "", notes: "" };
}

// ── 유효성 검증 규칙 ────────────────────────────────────────

export const LAYOUT_VALIDATION = {
  ROW_MIN: 1,
  ROW_MAX: 26,
  SEAT_MIN: 1,
  SEAT_MAX: 50,
} as const;
