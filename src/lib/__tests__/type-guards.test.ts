import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isNonNull,
  isString,
  isNumber,
  isRecord,
  isArray,
  hasId,
  isSupabaseError,
  filterNonNull,
  castRows,
  castRow,
  extractProfile,
} from "@/lib/type-guards";

// ---------------------------------------------------------------------------
// logger mock (castRows/castRow가 개발 환경에서 warn 호출)
// ---------------------------------------------------------------------------

vi.mock("@/lib/logger", () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import logger from "@/lib/logger";
const mockedLoggerWarn = vi.mocked(logger.warn);

beforeEach(() => {
  mockedLoggerWarn.mockClear();
});

// ---------------------------------------------------------------------------
// isNonNull
// ---------------------------------------------------------------------------

describe("isNonNull - null/undefined 필터", () => {
  it("일반 문자열은 true를 반환한다", () => {
    expect(isNonNull("hello")).toBe(true);
  });

  it("숫자 0은 true를 반환한다", () => {
    expect(isNonNull(0)).toBe(true);
  });

  it("false는 true를 반환한다 (null/undefined가 아님)", () => {
    expect(isNonNull(false)).toBe(true);
  });

  it("빈 문자열은 true를 반환한다", () => {
    expect(isNonNull("")).toBe(true);
  });

  it("빈 배열은 true를 반환한다", () => {
    expect(isNonNull([])).toBe(true);
  });

  it("빈 객체는 true를 반환한다", () => {
    expect(isNonNull({})).toBe(true);
  });

  it("null은 false를 반환한다", () => {
    expect(isNonNull(null)).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(isNonNull(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isString
// ---------------------------------------------------------------------------

describe("isString - 문자열 타입 가드", () => {
  it("문자열은 true를 반환한다", () => {
    expect(isString("텍스트")).toBe(true);
  });

  it("빈 문자열은 true를 반환한다", () => {
    expect(isString("")).toBe(true);
  });

  it("숫자는 false를 반환한다", () => {
    expect(isString(42)).toBe(false);
  });

  it("null은 false를 반환한다", () => {
    expect(isString(null)).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(isString(undefined)).toBe(false);
  });

  it("배열은 false를 반환한다", () => {
    expect(isString(["문자열"])).toBe(false);
  });

  it("객체는 false를 반환한다", () => {
    expect(isString({ value: "텍스트" })).toBe(false);
  });

  it("boolean은 false를 반환한다", () => {
    expect(isString(true)).toBe(false);
  });

  it("숫자 문자열은 true를 반환한다", () => {
    expect(isString("123")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isNumber
// ---------------------------------------------------------------------------

describe("isNumber - 숫자 타입 가드", () => {
  it("정수는 true를 반환한다", () => {
    expect(isNumber(42)).toBe(true);
  });

  it("소수는 true를 반환한다", () => {
    expect(isNumber(3.14)).toBe(true);
  });

  it("0은 true를 반환한다", () => {
    expect(isNumber(0)).toBe(true);
  });

  it("음수는 true를 반환한다", () => {
    expect(isNumber(-5)).toBe(true);
  });

  it("NaN은 false를 반환한다", () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it("Infinity는 true를 반환한다 (typeof === 'number')", () => {
    expect(isNumber(Infinity)).toBe(true);
  });

  it("문자열은 false를 반환한다", () => {
    expect(isNumber("42")).toBe(false);
  });

  it("null은 false를 반환한다", () => {
    expect(isNumber(null)).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(isNumber(undefined)).toBe(false);
  });

  it("boolean은 false를 반환한다", () => {
    expect(isNumber(true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isRecord
// ---------------------------------------------------------------------------

describe("isRecord - 레코드 타입 가드", () => {
  it("일반 객체는 true를 반환한다", () => {
    expect(isRecord({ key: "value" })).toBe(true);
  });

  it("빈 객체는 true를 반환한다", () => {
    expect(isRecord({})).toBe(true);
  });

  it("중첩 객체는 true를 반환한다", () => {
    expect(isRecord({ nested: { deep: true } })).toBe(true);
  });

  it("null은 false를 반환한다", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("배열은 false를 반환한다", () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("빈 배열은 false를 반환한다", () => {
    expect(isRecord([])).toBe(false);
  });

  it("문자열은 false를 반환한다", () => {
    expect(isRecord("객체")).toBe(false);
  });

  it("숫자는 false를 반환한다", () => {
    expect(isRecord(42)).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(isRecord(undefined)).toBe(false);
  });

  it("boolean은 false를 반환한다", () => {
    expect(isRecord(false)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isArray
// ---------------------------------------------------------------------------

describe("isArray - 배열 타입 가드", () => {
  it("배열은 true를 반환한다", () => {
    expect(isArray([1, 2, 3])).toBe(true);
  });

  it("빈 배열은 true를 반환한다", () => {
    expect(isArray([])).toBe(true);
  });

  it("문자열 배열은 true를 반환한다", () => {
    expect(isArray(["a", "b"])).toBe(true);
  });

  it("중첩 배열은 true를 반환한다", () => {
    expect(isArray([[1], [2]])).toBe(true);
  });

  it("객체는 false를 반환한다", () => {
    expect(isArray({ length: 3 })).toBe(false);
  });

  it("문자열은 false를 반환한다", () => {
    expect(isArray("배열")).toBe(false);
  });

  it("null은 false를 반환한다", () => {
    expect(isArray(null)).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(isArray(undefined)).toBe(false);
  });

  it("숫자는 false를 반환한다", () => {
    expect(isArray(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasId
// ---------------------------------------------------------------------------

describe("hasId - id 필드 존재 확인", () => {
  it("id 필드가 문자열인 객체는 true를 반환한다", () => {
    expect(hasId({ id: "abc-123" })).toBe(true);
  });

  it("id 필드가 빈 문자열이어도 true를 반환한다", () => {
    expect(hasId({ id: "" })).toBe(true);
  });

  it("id 외 다른 필드가 있어도 true를 반환한다", () => {
    expect(hasId({ id: "123", name: "홍길동", age: 30 })).toBe(true);
  });

  it("id 필드가 숫자면 false를 반환한다", () => {
    expect(hasId({ id: 123 })).toBe(false);
  });

  it("id 필드가 없으면 false를 반환한다", () => {
    expect(hasId({ name: "홍길동" })).toBe(false);
  });

  it("null은 false를 반환한다", () => {
    expect(hasId(null)).toBe(false);
  });

  it("배열은 false를 반환한다", () => {
    expect(hasId([{ id: "abc" }])).toBe(false);
  });

  it("문자열은 false를 반환한다", () => {
    expect(hasId("abc")).toBe(false);
  });

  it("undefined는 false를 반환한다", () => {
    expect(hasId(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSupabaseError
// ---------------------------------------------------------------------------

describe("isSupabaseError - Supabase 에러 형태 확인", () => {
  it("code와 message가 문자열인 객체는 true를 반환한다", () => {
    expect(isSupabaseError({ code: "23505", message: "중복 키 오류" })).toBe(true);
  });

  it("details 없이 code와 message만 있어도 true를 반환한다", () => {
    expect(isSupabaseError({ code: "PGRST116", message: "행 없음" })).toBe(true);
  });

  it("code가 없으면 false를 반환한다", () => {
    expect(isSupabaseError({ message: "오류 메시지" })).toBe(false);
  });

  it("message가 없으면 false를 반환한다", () => {
    expect(isSupabaseError({ code: "23505" })).toBe(false);
  });

  it("code가 문자열이 아니면 false를 반환한다", () => {
    expect(isSupabaseError({ code: 23505, message: "오류" })).toBe(false);
  });

  it("message가 문자열이 아니면 false를 반환한다", () => {
    expect(isSupabaseError({ code: "23505", message: 123 })).toBe(false);
  });

  it("null은 false를 반환한다", () => {
    expect(isSupabaseError(null)).toBe(false);
  });

  it("배열은 false를 반환한다", () => {
    expect(isSupabaseError([])).toBe(false);
  });

  it("문자열은 false를 반환한다", () => {
    expect(isSupabaseError("에러")).toBe(false);
  });

  it("Error 인스턴스는 false를 반환한다 (code 필드 없음)", () => {
    expect(isSupabaseError(new Error("오류"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterNonNull
// ---------------------------------------------------------------------------

describe("filterNonNull - null/undefined 배열 필터", () => {
  it("null을 제거하고 나머지 값을 반환한다", () => {
    expect(filterNonNull([1, null, 2, null, 3])).toEqual([1, 2, 3]);
  });

  it("undefined를 제거하고 나머지 값을 반환한다", () => {
    expect(filterNonNull([1, undefined, 2, undefined, 3])).toEqual([1, 2, 3]);
  });

  it("null과 undefined를 모두 제거한다", () => {
    expect(filterNonNull([null, undefined, "값", null, "다른값"])).toEqual(["값", "다른값"]);
  });

  it("null/undefined가 없으면 원본과 같은 내용을 반환한다", () => {
    expect(filterNonNull([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("빈 배열을 반환한다 (모두 null)", () => {
    expect(filterNonNull([null, null, null])).toEqual([]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(filterNonNull([])).toEqual([]);
  });

  it("false, 0, 빈 문자열 같은 falsy 값은 제거하지 않는다", () => {
    expect(filterNonNull([false, 0, "", null, undefined])).toEqual([false, 0, ""]);
  });

  it("객체 배열에서 null을 제거한다", () => {
    const items = [{ id: "1" }, null, { id: "2" }, undefined, { id: "3" }];
    expect(filterNonNull(items)).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
  });
});

// ---------------------------------------------------------------------------
// castRows
// ---------------------------------------------------------------------------

describe("castRows - 배열 행 데이터 캐스팅", () => {
  it("null 입력 시 빈 배열을 반환한다", () => {
    expect(castRows(null, [])).toEqual([]);
  });

  it("undefined 입력 시 빈 배열을 반환한다", () => {
    expect(castRows(undefined, [])).toEqual([]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(castRows([], [])).toEqual([]);
  });

  it("데이터 배열을 그대로 반환한다", () => {
    const data = [{ id: "1", name: "홍길동" }, { id: "2", name: "김철수" }];
    const result = castRows<{ id: string; name: string }>(data, ["id", "name"]);
    expect(result).toEqual(data);
  });

  it("반환된 배열은 동일한 참조를 유지한다", () => {
    const data = [{ id: "1" }];
    const result = castRows(data, []);
    expect(result).toBe(data);
  });

  it("필수 필드가 모두 있으면 개발 환경에서 warn을 호출하지 않는다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = [{ id: "1", name: "홍길동" }];
    castRows<{ id: string; name: string }>(data, ["id", "name"]);

    expect(mockedLoggerWarn).not.toHaveBeenCalled();

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });

  it("필수 필드가 누락되면 개발 환경에서 warn을 호출한다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = [{ id: "1" }]; // name 필드 누락
    castRows<{ id: string; name: string }>(data, ["id", "name"]);

    expect(mockedLoggerWarn).toHaveBeenCalled();

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });

  it("requiredFields가 빈 배열이면 경고 없이 데이터를 반환한다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = [{ id: "1" }];
    const result = castRows(data, []);
    expect(result).toEqual(data);
    expect(mockedLoggerWarn).not.toHaveBeenCalled();

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });
});

// ---------------------------------------------------------------------------
// castRow
// ---------------------------------------------------------------------------

describe("castRow - 단일 행 데이터 캐스팅", () => {
  it("null 입력 시 null을 반환한다", () => {
    expect(castRow(null, [])).toBeNull();
  });

  it("undefined 입력 시 null을 반환한다", () => {
    expect(castRow(undefined, [])).toBeNull();
  });

  it("유효한 객체를 그대로 반환한다", () => {
    const data = { id: "1", name: "홍길동" };
    const result = castRow<{ id: string; name: string }>(data, ["id", "name"]);
    expect(result).toEqual(data);
  });

  it("반환된 값은 동일한 참조를 유지한다", () => {
    const data = { id: "1", name: "홍길동" };
    const result = castRow(data, []);
    expect(result).toBe(data);
  });

  it("필수 필드가 모두 있으면 개발 환경에서 warn을 호출하지 않는다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = { id: "1", name: "홍길동" };
    castRow<{ id: string; name: string }>(data, ["id", "name"]);

    expect(mockedLoggerWarn).not.toHaveBeenCalled();

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });

  it("필수 필드가 누락되면 개발 환경에서 warn을 호출한다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = { id: "1" }; // name 누락
    castRow<{ id: string; name: string }>(data, ["id", "name"]);

    expect(mockedLoggerWarn).toHaveBeenCalled();

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });

  it("context 문자열이 warn 호출에 포함된다", () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error NODE_ENV 설정
    process.env.NODE_ENV = "development";

    const data = { id: "1" }; // name 누락
    castRow<{ id: string; name: string }>(data, ["id", "name"], "use-test-hook");

    expect(mockedLoggerWarn).toHaveBeenCalledWith(
      expect.any(String),
      "use-test-hook",
      expect.anything()
    );

    // @ts-expect-error NODE_ENV 복원
    process.env.NODE_ENV = originalEnv;
  });
});

// ---------------------------------------------------------------------------
// extractProfile
// ---------------------------------------------------------------------------

describe("extractProfile - 조인 프로필 추출", () => {
  it("null 입력 시 null을 반환한다", () => {
    expect(extractProfile(null)).toBeNull();
  });

  it("undefined 입력 시 null을 반환한다", () => {
    expect(extractProfile(undefined)).toBeNull();
  });

  it("배열에서 첫 번째 요소를 반환한다", () => {
    const profiles = [{ id: "1", name: "홍길동" }, { id: "2", name: "김철수" }];
    const result = extractProfile<{ id: string; name: string }>(profiles);
    expect(result).toEqual({ id: "1", name: "홍길동" });
  });

  it("빈 배열이면 null을 반환한다", () => {
    expect(extractProfile([])).toBeNull();
  });

  it("단일 요소 배열에서 해당 요소를 반환한다", () => {
    const profile = { id: "1", name: "홍길동" };
    const result = extractProfile<{ id: string; name: string }>([profile]);
    expect(result).toEqual(profile);
  });

  it("객체를 직접 받으면 그대로 반환한다", () => {
    const profile = { id: "1", name: "홍길동" };
    const result = extractProfile<{ id: string; name: string }>(profile);
    expect(result).toEqual(profile);
  });

  it("숫자는 null을 반환한다", () => {
    expect(extractProfile(42)).toBeNull();
  });

  it("문자열은 null을 반환한다", () => {
    expect(extractProfile("profile")).toBeNull();
  });

  it("빈 객체도 레코드로 인정하여 반환한다", () => {
    const result = extractProfile({});
    expect(result).toEqual({});
  });

  it("중첩 프로필 객체도 정상적으로 반환한다", () => {
    const profile = { id: "1", user: { email: "test@example.com" } };
    const result = extractProfile(profile);
    expect(result).toEqual(profile);
  });
});
