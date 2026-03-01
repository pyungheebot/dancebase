import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 날짜 입력을 Date 객체로 정규화하는 내부 헬퍼
function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/**
 * 날짜를 한국어 포맷으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @param pattern - date-fns 포맷 패턴
 * @returns 한국어 포맷된 날짜 문자열
 * @example formatKo(new Date(), "yyyy년 M월 d일") // "2026년 3월 1일"
 */
export function formatKo(date: Date | string, pattern: string): string {
  return format(toDate(date), pattern, { locale: ko });
}

/**
 * 날짜를 "yyyy년 M월" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 연월 문자열 (예: "2026년 2월")
 */
export function formatYearMonth(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월", { locale: ko });
}

/**
 * 날짜를 "yyyy년 M월 d일" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 연월일 문자열 (예: "2026년 2월 28일")
 */
export function formatYearMonthDay(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월 d일", { locale: ko });
}

/**
 * 날짜를 "yyyy년 M월 d일 (요일)" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 요일 포함 날짜 문자열 (예: "2026년 2월 28일 (토)")
 */
export function formatFullDate(date: Date | string): string {
  return format(toDate(date), "yyyy년 M월 d일 (EEE)", { locale: ko });
}

/**
 * 날짜를 "M월 d일" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 월일 문자열 (예: "2월 28일")
 */
export function formatMonthDay(date: Date | string): string {
  return format(toDate(date), "M월 d일", { locale: ko });
}

/**
 * 날짜를 "M/d (요일)" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 짧은 날짜 문자열 (예: "2/28 (토)")
 */
export function formatShortDate(date: Date | string): string {
  return format(toDate(date), "M/d (EEE)", { locale: ko });
}

/**
 * 날짜와 시간을 "M/d (요일) HH:mm" 형식으로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 짧은 날짜+시간 문자열 (예: "2/28 (토) 14:30")
 */
export function formatShortDateTime(date: Date | string): string {
  return format(toDate(date), "M/d (EEE) HH:mm", { locale: ko });
}

/**
 * 날짜를 "HH:mm" 형식의 시간 문자열로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 24시간제 시간 문자열 (예: "14:30")
 */
export function formatTime(date: Date | string): string {
  return format(toDate(date), "HH:mm");
}

/**
 * 날짜를 현재 시각 기준 상대적 시간 문자열로 변환
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 한국어 상대 시간 문자열 (예: "3분 전", "2시간 후")
 */
export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(toDate(date), { locale: ko, addSuffix: true });
}

// ============================================================
// 날짜 필터링 / 정렬 헬퍼
// ============================================================

/**
 * date 필드가 있는 배열을 YYYY-MM 또는 YYYY 접두사로 필터링
 * @param items - { date: string } 형태의 아이템 배열
 * @param prefix - 필터링할 날짜 접두사 (예: "2026-03", "2026")
 * @returns prefix로 시작하는 아이템만 포함한 새 배열
 * @example filterByDatePrefix(events, "2026-03")
 */
export function filterByDatePrefix<T extends { date: string }>(
  items: T[],
  prefix: string
): T[] {
  return items.filter((item) => item.date.startsWith(prefix));
}

/**
 * date 필드가 있는 배열을 오름차순으로 정렬 (원본 배열 불변)
 * @param items - { date: string } 형태의 아이템 배열
 * @returns date 오름차순으로 정렬된 새 배열
 * @example sortByDate(events)
 */
export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}
