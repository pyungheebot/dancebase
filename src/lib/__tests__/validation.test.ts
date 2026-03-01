import { describe, it, expect } from "vitest";
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePositiveNumber,
  validateDateRange,
  validateTimeRange,
  formatCurrency,
  validateUrl,
  sanitizeUrl,
} from "@/lib/validation";

describe("validateRequired", () => {
  it("값이 있으면 null 반환", () => {
    expect(validateRequired("홍길동", "이름")).toBeNull();
  });

  it("빈 문자열이면 오류 메시지 반환", () => {
    expect(validateRequired("", "이름")).toBe("이름은(는) 필수 입력 항목입니다");
  });

  it("공백만 있으면 오류 메시지 반환", () => {
    expect(validateRequired("   ", "이름")).toBe("이름은(는) 필수 입력 항목입니다");
  });
});

describe("validateMinLength", () => {
  it("최소 길이 이상이면 null 반환", () => {
    expect(validateMinLength("안녕하세요", 2, "제목")).toBeNull();
  });

  it("최소 길이 미만이면 오류 메시지 반환", () => {
    expect(validateMinLength("안", 2, "제목")).toBe("제목은(는) 최소 2자 이상이어야 합니다");
  });
});

describe("validateMaxLength", () => {
  it("최대 길이 이하이면 null 반환", () => {
    expect(validateMaxLength("안녕", 10, "제목")).toBeNull();
  });

  it("최대 길이 초과이면 오류 메시지 반환", () => {
    expect(validateMaxLength("안녕하세요반갑습니다", 5, "제목")).toBe(
      "제목은(는) 최대 5자 이하여야 합니다"
    );
  });
});

describe("validatePositiveNumber", () => {
  it("양의 정수는 null 반환", () => {
    expect(validatePositiveNumber("1000")).toBeNull();
  });

  it("빈 값이면 오류 메시지 반환", () => {
    expect(validatePositiveNumber("")).toBe("금액을 입력해주세요");
  });

  it("숫자가 아니면 오류 메시지 반환", () => {
    expect(validatePositiveNumber("abc")).toBe("올바른 숫자를 입력해주세요");
  });

  it("0이면 오류 메시지 반환", () => {
    expect(validatePositiveNumber("0")).toBe("금액은 0보다 큰 값이어야 합니다");
  });

  it("음수이면 오류 메시지 반환", () => {
    expect(validatePositiveNumber("-100")).toBe("금액은 0보다 큰 값이어야 합니다");
  });

  it("소수이면 오류 메시지 반환", () => {
    expect(validatePositiveNumber("1.5")).toBe("금액은 정수로 입력해주세요");
  });
});

describe("validateDateRange", () => {
  it("시작일이 종료일보다 이전이면 null 반환", () => {
    expect(validateDateRange("2026-01-01", "2026-12-31")).toBeNull();
  });

  it("시작일과 종료일이 같으면 null 반환", () => {
    expect(validateDateRange("2026-06-01", "2026-06-01")).toBeNull();
  });

  it("시작일이 종료일보다 이후이면 오류 메시지 반환", () => {
    expect(validateDateRange("2026-12-31", "2026-01-01")).toBe(
      "종료일은 시작일보다 이후여야 합니다"
    );
  });

  it("빈 값이면 null 반환 (선택 필드)", () => {
    expect(validateDateRange("", "")).toBeNull();
    expect(validateDateRange("2026-01-01", "")).toBeNull();
  });
});

describe("validateTimeRange", () => {
  it("시작 시간이 종료 시간보다 이전이면 null 반환", () => {
    expect(validateTimeRange("09:00", "18:00")).toBeNull();
  });

  it("시작 시간과 종료 시간이 같으면 오류 메시지 반환", () => {
    expect(validateTimeRange("09:00", "09:00")).toBe(
      "종료 시간은 시작 시간보다 이후여야 합니다"
    );
  });

  it("시작 시간이 종료 시간보다 이후이면 오류 메시지 반환", () => {
    expect(validateTimeRange("18:00", "09:00")).toBe(
      "종료 시간은 시작 시간보다 이후여야 합니다"
    );
  });

  it("빈 값이면 null 반환 (선택 필드)", () => {
    expect(validateTimeRange("", "")).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("숫자를 쉼표 포맷으로 변환", () => {
    expect(formatCurrency(1000000)).toBe("1,000,000");
  });

  it("문자열 숫자도 변환", () => {
    expect(formatCurrency("50000")).toBe("50,000");
  });

  it("이미 쉼표가 있는 문자열도 변환", () => {
    expect(formatCurrency("1,000")).toBe("1,000");
  });

  it("잘못된 값이면 빈 문자열 반환", () => {
    expect(formatCurrency("abc")).toBe("");
  });
});

describe("validateUrl", () => {
  it("유효한 https URL은 null 반환", () => {
    expect(validateUrl("https://example.com")).toBeNull();
  });

  it("유효한 http URL은 null 반환", () => {
    expect(validateUrl("http://example.com")).toBeNull();
  });

  it("프로토콜 없는 URL도 null 반환 (https로 보완)", () => {
    expect(validateUrl("example.com")).toBeNull();
  });

  it("빈 값은 null 반환 (선택 필드)", () => {
    expect(validateUrl("")).toBeNull();
    expect(validateUrl("   ")).toBeNull();
  });

  it("javascript: 프로토콜은 오류 메시지 반환", () => {
    const result = validateUrl("javascript:alert(1)");
    // javascript:alert(1)는 URL 파싱 자체가 실패하므로 "올바른 URL 형식이 아닙니다" 반환
    expect(result).not.toBeNull();
  });

  it("잘못된 URL 형식은 오류 메시지 반환", () => {
    expect(validateUrl("not a url!!")).toBe("올바른 URL 형식이 아닙니다");
  });
});

describe("sanitizeUrl", () => {
  it("정상 https URL은 그대로 반환", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("정상 http URL은 그대로 반환", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("프로토콜 없는 URL은 https로 보완하여 반환", () => {
    expect(sanitizeUrl("example.com")).toBe("https://example.com/");
  });

  it("javascript: 프로토콜은 # 반환", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });

  it("null은 # 반환", () => {
    expect(sanitizeUrl(null)).toBe("#");
  });

  it("undefined는 # 반환", () => {
    expect(sanitizeUrl(undefined)).toBe("#");
  });

  it("빈 문자열은 # 반환", () => {
    expect(sanitizeUrl("")).toBe("#");
  });

  it("공백만 있으면 # 반환", () => {
    expect(sanitizeUrl("   ")).toBe("#");
  });
});
