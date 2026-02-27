/**
 * 공용 유효성 검사 유틸리티
 * 각 함수는 에러 메시지(string) 또는 null(유효)을 반환합니다.
 */

/** 필수 입력 검증 */
export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) {
    return `${fieldName}은(는) 필수 입력 항목입니다`;
  }
  return null;
}

/** 최소 길이 검증 */
export function validateMinLength(value: string, min: number, fieldName: string): string | null {
  if (value.trim().length < min) {
    return `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다`;
  }
  return null;
}

/** 최대 길이 검증 */
export function validateMaxLength(value: string, max: number, fieldName: string): string | null {
  if (value.trim().length > max) {
    return `${fieldName}은(는) 최대 ${max}자 이하여야 합니다`;
  }
  return null;
}

/** 양수 숫자 검증 */
export function validatePositiveNumber(value: string): string | null {
  if (!value || !value.trim()) {
    return "금액을 입력해주세요";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "올바른 숫자를 입력해주세요";
  }
  if (num <= 0) {
    return "금액은 0보다 큰 값이어야 합니다";
  }
  if (!Number.isInteger(num)) {
    return "금액은 정수로 입력해주세요";
  }
  return null;
}

/** 날짜 범위 검증 (시작일 <= 종료일) */
export function validateDateRange(start: string, end: string): string | null {
  if (!start || !end) return null;
  if (new Date(start) > new Date(end)) {
    return "종료일은 시작일보다 이후여야 합니다";
  }
  return null;
}

/** 시간 범위 검증 (시작 시간 < 종료 시간) */
export function validateTimeRange(start: string, end: string): string | null {
  if (!start || !end) return null;
  if (start >= end) {
    return "종료 시간은 시작 시간보다 이후여야 합니다";
  }
  return null;
}

/** 숫자를 쉼표 포맷으로 변환 (예: 1000000 → "1,000,000") */
export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("ko-KR");
}
