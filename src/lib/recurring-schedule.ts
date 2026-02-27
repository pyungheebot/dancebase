/**
 * 반복 일정 날짜 생성 유틸리티
 * weekly / biweekly / monthly 패턴으로 날짜 배열을 생성합니다.
 */

export type RecurringPattern = "weekly" | "biweekly" | "monthly";

export type GenerateRecurringDatesOptions = {
  /** monthly 패턴에서 기준일이 없을 때 마지막 날로 조정 여부 (기본 true) */
  clampToLastDay?: boolean;
};

const MAX_DATES = 52;

/**
 * startDate 부터 endDate 까지 pattern 에 따른 날짜 배열을 반환합니다.
 *
 * - weekly  : 매주 startDate 와 같은 요일
 * - biweekly: 격주 startDate 와 같은 요일
 * - monthly : 매월 startDate 와 같은 일자 (해당 월에 그 일이 없으면 마지막 날로 조정)
 *
 * 최대 MAX_DATES(52)개까지 생성합니다.
 *
 * @param startDate - 시작일 (yyyy-MM-dd)
 * @param endDate   - 종료일 (yyyy-MM-dd)
 * @param pattern   - 반복 패턴
 * @param options   - 추가 옵션
 * @returns 날짜 문자열 배열 (yyyy-MM-dd)
 */
export function generateRecurringDates(
  startDate: string,
  endDate: string,
  pattern: RecurringPattern,
  options: GenerateRecurringDatesOptions = {}
): string[] {
  const { clampToLastDay = true } = options;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  if (start > end) return [];

  const results: string[] = [];

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const lastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  if (pattern === "weekly") {
    const cur = new Date(start);
    while (cur <= end && results.length < MAX_DATES) {
      results.push(formatDate(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else if (pattern === "biweekly") {
    const cur = new Date(start);
    while (cur <= end && results.length < MAX_DATES) {
      results.push(formatDate(cur));
      cur.setDate(cur.getDate() + 14);
    }
  } else if (pattern === "monthly") {
    const targetDay = start.getDate();
    const cur = new Date(start);

    while (cur <= end && results.length < MAX_DATES) {
      results.push(formatDate(cur));

      // 다음 달 같은 날짜로 이동
      const nextMonth = cur.getMonth() + 1;
      const nextYear = nextMonth > 11 ? cur.getFullYear() + 1 : cur.getFullYear();
      const nextMonthNormalized = nextMonth > 11 ? 0 : nextMonth;

      const maxDay = lastDayOfMonth(nextYear, nextMonthNormalized);
      const nextDay = clampToLastDay ? Math.min(targetDay, maxDay) : targetDay;

      // 해당 달에 targetDay 가 없으면 건너뜀
      if (!clampToLastDay && nextDay > maxDay) {
        cur.setFullYear(nextYear, nextMonthNormalized, 1);
        cur.setMonth(cur.getMonth() + 1); // 한 달 더 넘김
        continue;
      }

      cur.setFullYear(nextYear, nextMonthNormalized, nextDay);
    }
  }

  return results;
}

/**
 * 날짜 배열을 한글로 포맷합니다. (M월 D일 (요일))
 */
export function formatKoreanDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = days[d.getDay()];
  return `${month}월 ${day}일 (${dow})`;
}
