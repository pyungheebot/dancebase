import { describe, it, expect } from "vitest";
import {
  VALIDATION,
  validateField,
  validateFields,
  type ValidationRule,
} from "@/lib/validation-rules";

// ============================================================
// VALIDATION 상수 검증
// ============================================================

describe("VALIDATION 상수", () => {
  it("VALIDATION 객체가 존재하고 비어있지 않다", () => {
    expect(VALIDATION).toBeDefined();
    expect(Object.keys(VALIDATION).length).toBeGreaterThan(0);
  });

  it("name 규칙이 올바른 min/max/message를 가진다", () => {
    expect(VALIDATION.name.min).toBe(2);
    expect(VALIDATION.name.max).toBe(50);
    expect(typeof VALIDATION.name.message).toBe("string");
    expect(VALIDATION.name.message.trim()).not.toBe("");
  });

  it("title 규칙이 올바른 min/max/message를 가진다", () => {
    expect(VALIDATION.title.min).toBe(1);
    expect(VALIDATION.title.max).toBe(100);
    expect(typeof VALIDATION.title.message).toBe("string");
  });

  it("description 규칙이 올바른 min/max를 가진다 (선택 필드 min=0)", () => {
    expect(VALIDATION.description.min).toBe(0);
    expect(VALIDATION.description.max).toBe(500);
  });

  it("shortText 규칙 max가 200이다", () => {
    expect(VALIDATION.shortText.max).toBe(200);
  });

  it("longText 규칙 max가 2000이다", () => {
    expect(VALIDATION.longText.max).toBe(2000);
  });

  it("amount 규칙 범위가 0~9999999이다", () => {
    expect(VALIDATION.amount.min).toBe(0);
    expect(VALIDATION.amount.max).toBe(9_999_999);
  });

  it("email 규칙이 pattern과 message를 가진다", () => {
    expect(VALIDATION.email.pattern).toBeInstanceOf(RegExp);
    expect(typeof VALIDATION.email.message).toBe("string");
    expect(VALIDATION.email.message.trim()).not.toBe("");
  });

  it("phone 규칙이 pattern과 message를 가진다", () => {
    expect(VALIDATION.phone.pattern).toBeInstanceOf(RegExp);
    expect(typeof VALIDATION.phone.message).toBe("string");
  });

  it("reason 규칙 min이 5, max가 500이다", () => {
    expect(VALIDATION.reason.min).toBe(5);
    expect(VALIDATION.reason.max).toBe(500);
  });

  it("feedback 규칙 min이 5, max가 300이다", () => {
    expect(VALIDATION.feedback.min).toBe(5);
    expect(VALIDATION.feedback.max).toBe(300);
  });

  it("모든 규칙의 message가 빈 문자열이 아니다", () => {
    for (const [key, rule] of Object.entries(VALIDATION)) {
      expect(
        (rule as ValidationRule).message.trim(),
        `VALIDATION.${key}.message가 빈 문자열이면 안 됩니다`
      ).not.toBe("");
    }
  });
});

// ============================================================
// validateField - min 검증
// ============================================================

describe("validateField - min 검증", () => {
  const nameRule: ValidationRule = { min: 2, max: 50, message: "2~50자 이내로 입력해주세요" };

  it("값이 min 이상이면 null을 반환한다", () => {
    expect(validateField("홍길동", nameRule)).toBeNull();
  });

  it("값이 정확히 min이면 null을 반환한다 (경계값)", () => {
    expect(validateField("홍길", nameRule)).toBeNull(); // 2자
  });

  it("값이 min 미만이면 에러 메시지를 반환한다", () => {
    expect(validateField("홍", nameRule)).toBe("2~50자 이내로 입력해주세요");
  });

  it("빈 문자열은 min>0 규칙에서 에러 메시지를 반환한다", () => {
    expect(validateField("", nameRule)).toBe("2~50자 이내로 입력해주세요");
  });

  it("공백만 있는 문자열은 trim 후 min 검증에서 에러를 반환한다", () => {
    expect(validateField("  ", nameRule)).toBe("2~50자 이내로 입력해주세요");
  });

  it("min=0인 선택 필드는 빈 문자열에서 null을 반환한다", () => {
    const optionalRule: ValidationRule = { min: 0, max: 500, message: "500자 이내로 입력해주세요" };
    expect(validateField("", optionalRule)).toBeNull();
  });

  it("min=1인 title 규칙은 빈 문자열에서 에러를 반환한다", () => {
    expect(validateField("", VALIDATION.title)).toBe(VALIDATION.title.message);
  });

  it("min=1인 title 규칙은 공백만 있으면 에러를 반환한다", () => {
    expect(validateField("   ", VALIDATION.title)).toBe(VALIDATION.title.message);
  });
});

// ============================================================
// validateField - max 검증
// ============================================================

describe("validateField - max 검증", () => {
  const nameRule: ValidationRule = { min: 2, max: 10, message: "2~10자 이내로 입력해주세요" };

  it("값이 max 이하이면 null을 반환한다", () => {
    expect(validateField("홍길동", nameRule)).toBeNull();
  });

  it("값이 정확히 max이면 null을 반환한다 (경계값)", () => {
    expect(validateField("열자이름이다", nameRule)).toBeNull(); // 7자, max=10이라 통과
    expect(validateField("열글자이름이름이름", nameRule)).toBeNull(); // 9자
    expect(validateField("열글자이름이름이름이", nameRule)).toBeNull(); // 10자
  });

  it("값이 max 초과이면 에러 메시지를 반환한다", () => {
    expect(validateField("열글자이름이름이름이름이", nameRule)).toBe("2~10자 이내로 입력해주세요"); // 12자
  });

  it("description max(500자) 경계 테스트", () => {
    const exactly500 = "a".repeat(500);
    const over500 = "a".repeat(501);
    expect(validateField(exactly500, VALIDATION.description)).toBeNull();
    expect(validateField(over500, VALIDATION.description)).toBe(VALIDATION.description.message);
  });

  it("longText max(2000자) 경계 테스트", () => {
    const exactly2000 = "a".repeat(2000);
    const over2000 = "a".repeat(2001);
    expect(validateField(exactly2000, VALIDATION.longText)).toBeNull();
    expect(validateField(over2000, VALIDATION.longText)).toBe(VALIDATION.longText.message);
  });
});

// ============================================================
// validateField - pattern 검증
// ============================================================

describe("validateField - pattern 검증 (email)", () => {
  it("올바른 이메일 형식은 null을 반환한다", () => {
    expect(validateField("user@example.com", VALIDATION.email)).toBeNull();
  });

  it("서브도메인 이메일도 null을 반환한다", () => {
    expect(validateField("user@mail.example.co.kr", VALIDATION.email)).toBeNull();
  });

  it("@ 없는 이메일은 에러 메시지를 반환한다", () => {
    expect(validateField("notanemail", VALIDATION.email)).toBe(VALIDATION.email.message);
  });

  it("도메인 없는 이메일은 에러 메시지를 반환한다", () => {
    expect(validateField("user@", VALIDATION.email)).toBe(VALIDATION.email.message);
  });

  it("공백이 포함된 이메일은 에러 메시지를 반환한다", () => {
    expect(validateField("user @example.com", VALIDATION.email)).toBe(VALIDATION.email.message);
  });

  it("빈 값은 pattern 검증을 건너뛰고 null을 반환한다 (선택 필드)", () => {
    expect(validateField("", VALIDATION.email)).toBeNull();
  });

  it("공백만 있는 경우 trim 후 빈 값이므로 null을 반환한다", () => {
    expect(validateField("   ", VALIDATION.email)).toBeNull();
  });
});

describe("validateField - pattern 검증 (phone)", () => {
  it("010-1234-5678 형식은 null을 반환한다", () => {
    expect(validateField("010-1234-5678", VALIDATION.phone)).toBeNull();
  });

  it("하이픈 없는 010-12345678 형식도 null을 반환한다", () => {
    expect(validateField("01012345678", VALIDATION.phone)).toBeNull();
  });

  it("02 지역번호도 null을 반환한다", () => {
    expect(validateField("02-123-4567", VALIDATION.phone)).toBeNull();
  });

  it("숫자가 아닌 문자 포함 시 에러 메시지를 반환한다", () => {
    expect(validateField("010-ABCD-5678", VALIDATION.phone)).toBe(VALIDATION.phone.message);
  });

  it("너무 짧은 번호는 에러 메시지를 반환한다", () => {
    expect(validateField("010-123", VALIDATION.phone)).toBe(VALIDATION.phone.message);
  });

  it("빈 값은 pattern 검증을 건너뛰고 null을 반환한다", () => {
    expect(validateField("", VALIDATION.phone)).toBeNull();
  });
});

// ============================================================
// validateField - VALIDATION 상수 통합 테스트
// ============================================================

describe("validateField - VALIDATION.name 실제 사용", () => {
  it("2자 이상 50자 이하 이름은 null을 반환한다", () => {
    expect(validateField("홍길동", VALIDATION.name)).toBeNull();
    expect(validateField("댄스크루그룹", VALIDATION.name)).toBeNull();
  });

  it("1자 이름은 에러 메시지를 반환한다", () => {
    expect(validateField("홍", VALIDATION.name)).toBe(VALIDATION.name.message);
  });

  it("51자 이름은 에러 메시지를 반환한다", () => {
    expect(validateField("가".repeat(51), VALIDATION.name)).toBe(VALIDATION.name.message);
  });
});

describe("validateField - VALIDATION.reason 실제 사용", () => {
  it("5자 이상 500자 이하 사유는 null을 반환한다", () => {
    expect(validateField("개인 사정으로 결석합니다", VALIDATION.reason)).toBeNull();
  });

  it("4자 사유는 에러 메시지를 반환한다", () => {
    expect(validateField("사정상", VALIDATION.reason)).toBe(VALIDATION.reason.message);
  });

  it("501자 사유는 에러 메시지를 반환한다", () => {
    expect(validateField("가".repeat(501), VALIDATION.reason)).toBe(VALIDATION.reason.message);
  });
});

// ============================================================
// validateField - trim 동작
// ============================================================

describe("validateField - trim 처리", () => {
  it("앞뒤 공백을 trim한 후 길이를 측정한다", () => {
    // "  홍  " → trim → "홍" (1자) → min=2 위반
    expect(validateField("  홍  ", VALIDATION.name)).toBe(VALIDATION.name.message);
  });

  it("trim 후 유효하면 null을 반환한다", () => {
    // "  홍길동  " → trim → "홍길동" (3자) → 유효
    expect(validateField("  홍길동  ", VALIDATION.name)).toBeNull();
  });
});

// ============================================================
// validateField - min만 있는 경우, max만 있는 경우
// ============================================================

describe("validateField - min만 있는 규칙", () => {
  const minOnlyRule: ValidationRule = { min: 3, message: "3자 이상 입력해주세요" };

  it("3자 이상이면 null을 반환한다", () => {
    expect(validateField("안녕하세요", minOnlyRule)).toBeNull();
  });

  it("2자이면 에러 메시지를 반환한다", () => {
    expect(validateField("안녕", minOnlyRule)).toBe("3자 이상 입력해주세요");
  });

  it("매우 긴 문자열도 null을 반환한다 (max 없음)", () => {
    expect(validateField("가".repeat(10000), minOnlyRule)).toBeNull();
  });
});

describe("validateField - max만 있는 규칙", () => {
  const maxOnlyRule: ValidationRule = { max: 5, message: "5자 이하로 입력해주세요" };

  it("빈 문자열은 null을 반환한다 (min 없음)", () => {
    expect(validateField("", maxOnlyRule)).toBeNull();
  });

  it("5자 이하이면 null을 반환한다", () => {
    expect(validateField("안녕", maxOnlyRule)).toBeNull();
  });

  it("6자이면 에러 메시지를 반환한다", () => {
    expect(validateField("안녕하세요반", maxOnlyRule)).toBe("5자 이하로 입력해주세요");
  });
});

// ============================================================
// validateFields - 여러 필드 일괄 검증
// ============================================================

describe("validateFields - 기본 동작", () => {
  it("모든 필드가 유효하면 빈 객체를 반환한다", () => {
    const errors = validateFields([
      { key: "title", value: "오늘의 연습", rule: VALIDATION.title },
      { key: "description", value: "열심히 하겠습니다", rule: VALIDATION.description },
    ]);
    expect(errors).toEqual({});
  });

  it("유효하지 않은 필드의 key와 에러 메시지가 반환된다", () => {
    const errors = validateFields([
      { key: "name", value: "홍", rule: VALIDATION.name }, // 1자 → 오류
    ]);
    expect(errors).toHaveProperty("name");
    expect(errors.name).toBe(VALIDATION.name.message);
  });

  it("여러 필드 중 일부만 오류인 경우 오류 필드만 포함한다", () => {
    const errors = validateFields([
      { key: "title", value: "올바른 제목", rule: VALIDATION.title }, // 유효
      { key: "name", value: "홍", rule: VALIDATION.name },          // 오류
    ]);
    expect(errors).not.toHaveProperty("title");
    expect(errors).toHaveProperty("name");
  });

  it("여러 필드 모두 오류인 경우 모든 key가 포함된다", () => {
    const errors = validateFields([
      { key: "title", value: "", rule: VALIDATION.title },            // 빈 값 오류
      { key: "name", value: "홍", rule: VALIDATION.name },            // 짧은 값 오류
      { key: "reason", value: "짧", rule: VALIDATION.reason },        // 짧은 값 오류
    ]);
    expect(Object.keys(errors)).toHaveLength(3);
    expect(errors).toHaveProperty("title");
    expect(errors).toHaveProperty("name");
    expect(errors).toHaveProperty("reason");
  });

  it("빈 배열을 전달하면 빈 객체를 반환한다", () => {
    const errors = validateFields([]);
    expect(errors).toEqual({});
  });
});

describe("validateFields - 에러 메시지 내용", () => {
  it("반환된 에러 메시지는 해당 rule.message와 일치한다", () => {
    const customRule: ValidationRule = { min: 5, max: 100, message: "커스텀 에러 메시지" };
    const errors = validateFields([
      { key: "field1", value: "짧", rule: customRule },
    ]);
    expect(errors.field1).toBe("커스텀 에러 메시지");
  });

  it("각 필드의 에러 메시지가 해당 규칙의 message와 일치한다", () => {
    const errors = validateFields([
      { key: "name", value: "홍", rule: VALIDATION.name },
      { key: "title", value: "", rule: VALIDATION.title },
    ]);
    expect(errors.name).toBe(VALIDATION.name.message);
    expect(errors.title).toBe(VALIDATION.title.message);
  });
});

describe("validateFields - 단일 필드", () => {
  it("필드 하나만 전달해도 올바르게 동작한다", () => {
    const valid = validateFields([
      { key: "email", value: "user@example.com", rule: VALIDATION.email },
    ]);
    expect(valid).toEqual({});

    const invalid = validateFields([
      { key: "email", value: "notanemail", rule: VALIDATION.email },
    ]);
    expect(invalid).toHaveProperty("email");
  });
});

describe("validateFields - pattern 포함 규칙", () => {
  it("이메일이 올바르면 에러 없이 반환한다", () => {
    const errors = validateFields([
      { key: "email", value: "valid@example.com", rule: VALIDATION.email },
    ]);
    expect(errors).toEqual({});
  });

  it("이메일이 잘못되면 에러 메시지를 반환한다", () => {
    const errors = validateFields([
      { key: "email", value: "invalid-email", rule: VALIDATION.email },
    ]);
    expect(errors).toHaveProperty("email");
    expect(errors.email).toBe(VALIDATION.email.message);
  });

  it("전화번호가 올바르면 에러 없이 반환한다", () => {
    const errors = validateFields([
      { key: "phone", value: "010-1234-5678", rule: VALIDATION.phone },
    ]);
    expect(errors).toEqual({});
  });

  it("전화번호가 잘못되면 에러 메시지를 반환한다", () => {
    const errors = validateFields([
      { key: "phone", value: "01234", rule: VALIDATION.phone },
    ]);
    expect(errors).toHaveProperty("phone");
  });
});

describe("validateFields - 실전 시나리오", () => {
  it("그룹 생성 폼 전체 검증 (모두 유효)", () => {
    const errors = validateFields([
      { key: "name", value: "서울댄스크루", rule: VALIDATION.name },
      { key: "description", value: "서울에서 활동하는 댄스 크루입니다", rule: VALIDATION.description },
    ]);
    expect(errors).toEqual({});
  });

  it("그룹 생성 폼 전체 검증 (이름 오류)", () => {
    const errors = validateFields([
      { key: "name", value: "S", rule: VALIDATION.name },
      { key: "description", value: "설명입니다", rule: VALIDATION.description },
    ]);
    expect(errors).toHaveProperty("name");
    expect(errors).not.toHaveProperty("description");
  });

  it("피드백 폼 검증 (내용 없음)", () => {
    const errors = validateFields([
      { key: "content", value: "", rule: VALIDATION.feedback },
    ]);
    expect(errors).toHaveProperty("content");
  });

  it("피드백 폼 검증 (정상 내용)", () => {
    const errors = validateFields([
      { key: "content", value: "정말 좋은 연습이었습니다", rule: VALIDATION.feedback },
    ]);
    expect(errors).toEqual({});
  });
});
