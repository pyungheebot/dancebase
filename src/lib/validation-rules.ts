/**
 * 공통 검증 규칙 정의
 *
 * 각 규칙은 { min?, max?, pattern?, message } 형태이며
 * validateField() 함수로 검증합니다.
 *
 * 사용 예시:
 * ```ts
 * const error = validateField(name, VALIDATION.name);
 * // → null (유효) 또는 "2~50자 이내로 입력해주세요"
 * ```
 */

export type ValidationRule = {
  min?: number;
  max?: number;
  pattern?: RegExp;
  message: string;
};

/** 도메인별 검증 규칙 모음 */
export const VALIDATION = {
  /** 이름 (그룹명, 멤버명 등): 2~50자 */
  name: { min: 2, max: 50, message: "2~50자 이내로 입력해주세요" },

  /** 제목 (게시글, 일정 등): 1~100자 */
  title: { min: 1, max: 100, message: "1~100자 이내로 입력해주세요" },

  /** 설명/본문: 0~500자 (선택 필드) */
  description: { min: 0, max: 500, message: "500자 이내로 입력해주세요" },

  /** 짧은 텍스트 (메모, 태그 등): 0~200자 */
  shortText: { min: 0, max: 200, message: "200자 이내로 입력해주세요" },

  /** 긴 텍스트 (피드백, 내용 등): 0~2000자 */
  longText: { min: 0, max: 2000, message: "2000자 이내로 입력해주세요" },

  /** 금액: 0~9,999,999 */
  amount: { min: 0, max: 9_999_999, message: "0~9,999,999 범위로 입력해주세요" },

  /** 이메일 주소 */
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "올바른 이메일을 입력해주세요",
  },

  /** 한국 전화번호 (010-1234-5678, 02-123-4567 등) */
  phone: {
    pattern: /^0\d{1,2}-?\d{3,4}-?\d{4}$/,
    message: "올바른 전화번호를 입력해주세요",
  },

  /** 결석 사유 등 최소 5자 이상 짧은 글 */
  reason: { min: 5, max: 500, message: "5자 이상 500자 이내로 입력해주세요" },

  /** 피드백/익명 내용: 5~300자 */
  feedback: { min: 5, max: 300, message: "5자 이상 300자 이내로 입력해주세요" },
} as const;

/**
 * 단일 필드 값을 규칙에 따라 검증합니다.
 *
 * @param value   검증할 문자열 값 (trim 처리 후 검증)
 * @param rule    ValidationRule 객체 (VALIDATION.xxx 또는 직접 정의)
 * @returns       에러 메시지(string) 또는 null(유효)
 */
export function validateField(
  value: string,
  rule: ValidationRule
): string | null {
  const trimmed = value.trim();

  // min 검증: min이 1 이상이면 필수 입력 포함
  if (rule.min !== undefined && rule.min > 0 && trimmed.length < rule.min) {
    return rule.message;
  }

  // max 검증
  if (rule.max !== undefined && trimmed.length > rule.max) {
    return rule.message;
  }

  // 패턴 검증: 빈 값은 통과 (필수 체크는 min으로 처리)
  if (rule.pattern && trimmed.length > 0 && !rule.pattern.test(trimmed)) {
    return rule.message;
  }

  return null;
}

/**
 * 여러 필드를 한번에 검증합니다.
 *
 * @param fields  { value, rule, key } 배열
 * @returns       { [key]: 에러메시지 } 객체. 유효한 필드는 포함되지 않음
 *
 * 사용 예시:
 * ```ts
 * const errors = validateFields([
 *   { key: "title", value: title, rule: VALIDATION.title },
 *   { key: "memo", value: memo, rule: VALIDATION.shortText },
 * ]);
 * if (Object.keys(errors).length > 0) return; // 검증 실패
 * ```
 */
export function validateFields(
  fields: Array<{ key: string; value: string; rule: ValidationRule }>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const { key, value, rule } of fields) {
    const error = validateField(value, rule);
    if (error !== null) {
      errors[key] = error;
    }
  }
  return errors;
}
