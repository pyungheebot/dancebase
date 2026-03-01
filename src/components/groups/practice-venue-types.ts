/**
 * 연습 장소 관리 카드 - 타입, 상수, 유효성 검증
 */

import type { PracticeVenueFacility, PracticeVenueStatus } from "@/types";

// ─── 시설 레이블 ──────────────────────────────────────────────

export const FACILITY_LABELS: Record<PracticeVenueFacility, string> = {
  mirror: "거울",
  sound: "음향",
  parking: "주차",
  shower: "샤워실",
  locker: "사물함",
  aircon: "에어컨",
  heating: "난방",
  piano: "피아노",
  stage: "무대",
  bar: "연습봉",
};

export const ALL_FACILITIES: PracticeVenueFacility[] = [
  "mirror",
  "sound",
  "parking",
  "shower",
  "locker",
  "aircon",
  "heating",
  "piano",
  "stage",
  "bar",
];

// ─── 상태 레이블 / 배지 색상 ──────────────────────────────────

export const STATUS_LABELS: Record<PracticeVenueStatus, string> = {
  available: "예약 가능",
  booked: "예약됨",
  unavailable: "이용 불가",
  unknown: "미확인",
};

export const STATUS_BADGE_CLASS: Record<PracticeVenueStatus, string> = {
  available: "bg-green-50 text-green-700 border-green-200",
  booked: "bg-blue-50 text-blue-700 border-blue-200",
  unavailable: "bg-red-50 text-red-700 border-red-200",
  unknown: "bg-gray-50 text-gray-600 border-gray-200",
};

// ─── 유효성 검증 ──────────────────────────────────────────────

export type VenueFormInput = {
  name: string;
  address: string;
  phone: string;
  website: string;
  costPerHour: string;
  capacity: string;
  size: string;
  lastUsedAt: string;
};

export type VenueFormValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateVenueForm(
  input: VenueFormInput
): VenueFormValidationResult {
  if (!input.name.trim()) {
    return { ok: false, message: "장소명을 입력해주세요." };
  }
  if (input.costPerHour.trim()) {
    const cost = Number(input.costPerHour);
    if (isNaN(cost) || cost < 0) {
      return { ok: false, message: "시간당 비용은 0 이상의 숫자여야 합니다." };
    }
  }
  if (input.capacity.trim()) {
    const cap = Number(input.capacity);
    if (isNaN(cap) || cap < 1) {
      return { ok: false, message: "수용 인원은 1 이상의 숫자여야 합니다." };
    }
  }
  if (input.size.trim()) {
    const sz = Number(input.size);
    if (isNaN(sz) || sz < 1) {
      return { ok: false, message: "면적은 1 이상의 숫자여야 합니다." };
    }
  }
  return { ok: true };
}

export const VENUE_FORM_INITIAL: VenueFormInput = {
  name: "",
  address: "",
  phone: "",
  website: "",
  costPerHour: "",
  capacity: "",
  size: "",
  lastUsedAt: "",
};
