import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 날짜 입력을 Date 객체로 정규화하는 내부 헬퍼
function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

// 범용 한국어 포맷 함수
export function formatKo(date: Date | string, pattern: string): string {
  return format(toDate(date), pattern, { locale: ko });
}

// "2026년 2월"
export function formatYearMonth(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월", { locale: ko });
}

// "2026년 2월 28일"
export function formatYearMonthDay(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월 d일", { locale: ko });
}

// "2026년 2월 28일 (토)"
export function formatFullDate(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월 d일 (EEE)", { locale: ko });
}

// "2월 28일"
export function formatMonthDay(date: Date | string): string {
  return format(toDate(date), "M월 d일", { locale: ko });
}

// "2/28 (토)"
export function formatShortDate(date: Date | string): string {
  return format(toDate(date), "M/d (EEE)", { locale: ko });
}

// "2/28 (토) 14:30"
export function formatShortDateTime(date: Date | string): string {
  return format(toDate(date), "M/d (EEE) HH:mm", { locale: ko });
}

// "14:30"
export function formatTime(date: Date | string): string {
  return format(toDate(date), "HH:mm");
}

// "3분 전"
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { locale: ko, addSuffix: true });
}
