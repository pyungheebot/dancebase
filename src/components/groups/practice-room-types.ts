// 연습실 예약 관련 공유 타입 및 상수 정의

import { todayYMD } from "@/hooks/use-practice-room-booking";

// ─── 연습실 폼 타입 ─────────────────────────────────────────

export type RoomFormValues = {
  name: string;
  address: string;
  capacity: string;
  costPerHour: string;
  contact: string;
};

export const EMPTY_ROOM_FORM: RoomFormValues = {
  name: "",
  address: "",
  capacity: "",
  costPerHour: "",
  contact: "",
};

// ─── 예약 폼 타입 ────────────────────────────────────────────

export type BookingFormValues = {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  bookedBy: string;
  memo: string;
};

export function makeEmptyBookingForm(): BookingFormValues {
  return {
    roomId: "",
    date: todayYMD(),
    startTime: "10:00",
    endTime: "12:00",
    bookedBy: "",
    memo: "",
  };
}

// ─── 유효성 검사 ─────────────────────────────────────────────

/** 연습실 폼 유효성 검사 */
export function validateRoomForm(v: RoomFormValues): string | null {
  if (!v.name.trim()) return "연습실 이름을 입력해주세요.";
  if (v.name.trim().length > 50) return "연습실 이름은 50자 이하로 입력해주세요.";
  if (!v.address.trim()) return "주소를 입력해주세요.";
  if (v.address.trim().length > 200) return "주소는 200자 이하로 입력해주세요.";
  const cap = parseInt(v.capacity, 10);
  if (isNaN(cap) || cap < 1 || cap > 1000)
    return "수용 인원은 1명 이상 1000명 이하이어야 합니다.";
  const cost = parseInt(v.costPerHour, 10);
  if (isNaN(cost) || cost < 0 || cost > 9_999_999)
    return "비용은 0원 이상 9,999,999원 이하이어야 합니다.";
  if (v.contact.trim() && !/^[\d\-+\s()]+$/.test(v.contact.trim()))
    return "연락처 형식이 올바르지 않습니다.";
  return null;
}

/** 예약 폼 유효성 검사 */
export function validateBookingForm(v: BookingFormValues): string | null {
  if (!v.roomId) return "연습실을 선택해주세요.";
  if (!v.date) return "날짜를 입력해주세요.";
  if (!v.startTime || !v.endTime) return "시작/종료 시간을 입력해주세요.";
  if (v.startTime >= v.endTime)
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  if (!v.bookedBy.trim()) return "예약자를 입력해주세요.";
  return null;
}

// ─── 헬퍼 ────────────────────────────────────────────────────

/** 비용을 한국어 원 단위로 포맷 */
export function formatCost(cost: number): string {
  return cost.toLocaleString("ko-KR") + "원";
}

/** 주간 날짜 배열에서 레이블 문자열 생성 */
export function formatWeekLabel(weekDates: string[]): string {
  const first = weekDates[0]!;
  const last = weekDates[6]!;
  const f = new Date(first);
  const l = new Date(last);
  return `${f.getFullYear()}년 ${f.getMonth() + 1}월 ${f.getDate()}일 ~ ${l.getMonth() + 1}월 ${l.getDate()}일`;
}

/** baseDate 기준으로 delta 주 이동한 날짜 YYYY-MM-DD 반환 */
export function addWeeks(baseDate: string, delta: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + delta * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 요일 레이블 (월~일)
export const WEEK_DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;
