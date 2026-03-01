import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  unwrapResult,
  unwrapArrayResult,
  queryOne,
  queryMany,
} from "@/lib/supabase/query-helpers";

// logger mock (콘솔 출력 억제)
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

// Supabase 클라이언트 mock
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import logger from "@/lib/logger";

const mockedLoggerError = vi.mocked(logger.error);

beforeEach(() => {
  mockedLoggerError.mockClear();
  mockFrom.mockClear();
});

// ============================================================
// unwrapResult
// ============================================================

describe("unwrapResult - 성공 케이스", () => {
  it("data가 있고 error가 없으면 data를 반환한다", () => {
    const result = unwrapResult({ data: { id: "1", name: "홍길동" }, error: null });
    expect(result).toEqual({ id: "1", name: "홍길동" });
  });

  it("data가 문자열이어도 그대로 반환한다", () => {
    const result = unwrapResult({ data: "텍스트", error: null });
    expect(result).toBe("텍스트");
  });

  it("data가 숫자여도 그대로 반환한다", () => {
    const result = unwrapResult({ data: 42, error: null });
    expect(result).toBe(42);
  });

  it("data가 배열이어도 그대로 반환한다", () => {
    const arr = [{ id: "1" }, { id: "2" }];
    const result = unwrapResult({ data: arr, error: null });
    expect(result).toEqual(arr);
  });

  it("data가 null이고 error도 없으면 null을 반환한다", () => {
    const result = unwrapResult({ data: null, error: null });
    expect(result).toBeNull();
  });

  it("성공 시 logger.error가 호출되지 않는다", () => {
    unwrapResult({ data: { id: "1" }, error: null });
    expect(mockedLoggerError).not.toHaveBeenCalled();
  });
});

describe("unwrapResult - 에러 케이스", () => {
  it("error가 있으면 null을 반환한다", () => {
    const result = unwrapResult({
      data: { id: "1" },
      error: { message: "DB 오류", code: "42P01" },
    });
    expect(result).toBeNull();
  });

  it("error가 있으면 logger.error를 호출한다", () => {
    const error = { message: "테이블 없음", code: "42P01" };
    unwrapResult({ data: null, error });
    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });

  it("error가 Error 객체여도 null을 반환한다", () => {
    const result = unwrapResult({
      data: null,
      error: new Error("네트워크 오류"),
    });
    expect(result).toBeNull();
  });

  it("error가 문자열이어도 null을 반환한다", () => {
    const result = unwrapResult({ data: null, error: "오류 발생" });
    expect(result).toBeNull();
  });
});

// ============================================================
// unwrapArrayResult
// ============================================================

describe("unwrapArrayResult - 성공 케이스", () => {
  it("data 배열이 있고 error가 없으면 배열을 반환한다", () => {
    const arr = [{ id: "1" }, { id: "2" }];
    const result = unwrapArrayResult({ data: arr, error: null });
    expect(result).toEqual(arr);
  });

  it("data가 빈 배열이어도 그대로 반환한다", () => {
    const result = unwrapArrayResult({ data: [], error: null });
    expect(result).toEqual([]);
  });

  it("data가 null이고 error도 없으면 빈 배열을 반환한다", () => {
    const result = unwrapArrayResult({ data: null, error: null });
    expect(result).toEqual([]);
  });

  it("성공 시 logger.error가 호출되지 않는다", () => {
    unwrapArrayResult({ data: [{ id: "1" }], error: null });
    expect(mockedLoggerError).not.toHaveBeenCalled();
  });

  it("단일 요소 배열도 올바르게 반환한다", () => {
    const arr = [{ id: "abc", name: "멤버1" }];
    const result = unwrapArrayResult({ data: arr, error: null });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: "abc", name: "멤버1" });
  });
});

describe("unwrapArrayResult - 에러 케이스", () => {
  it("error가 있으면 빈 배열을 반환한다", () => {
    const result = unwrapArrayResult({
      data: [{ id: "1" }],
      error: { message: "접근 거부", code: "42501" },
    });
    expect(result).toEqual([]);
  });

  it("error가 있으면 logger.error를 호출한다", () => {
    unwrapArrayResult({ data: null, error: new Error("쿼리 오류") });
    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });

  it("error가 문자열이어도 빈 배열을 반환한다", () => {
    const result = unwrapArrayResult({ data: null, error: "오류 문자열" });
    expect(result).toEqual([]);
  });
});

// ============================================================
// queryOne
// ============================================================

describe("queryOne - 성공 케이스", () => {
  it("쿼리 성공 시 데이터를 반환한다", async () => {
    const profile = { id: "user-1", name: "홍길동" };
    const mockQuery = vi.fn().mockResolvedValue({ data: profile, error: null });
    mockFrom.mockReturnValue({});

    const result = await queryOne<typeof profile>("profiles", mockQuery);

    expect(result).toEqual(profile);
  });

  it("쿼리 성공 시 logger.error가 호출되지 않는다", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: { id: "1" }, error: null });
    mockFrom.mockReturnValue({});

    await queryOne("profiles", mockQuery);

    expect(mockedLoggerError).not.toHaveBeenCalled();
  });

  it("쿼리 함수에 supabase.from(table) 반환값이 전달된다", async () => {
    const mockBuilder = { select: vi.fn() };
    mockFrom.mockReturnValue(mockBuilder);
    const mockQuery = vi.fn().mockResolvedValue({ data: null, error: null });

    await queryOne("profiles", mockQuery);

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockQuery).toHaveBeenCalledWith(mockBuilder);
  });
});

describe("queryOne - null 반환 케이스", () => {
  it("쿼리 결과 data가 null이면 null을 반환한다", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({});

    const result = await queryOne("profiles", mockQuery);

    expect(result).toBeNull();
  });

  it("쿼리에서 error가 반환되면 null을 반환한다", async () => {
    const mockQuery = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Row not found" } });
    mockFrom.mockReturnValue({});

    const result = await queryOne("profiles", mockQuery);

    expect(result).toBeNull();
  });

  it("쿼리 에러 시 logger.error가 호출된다", async () => {
    const mockQuery = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "오류" } });
    mockFrom.mockReturnValue({});

    await queryOne("profiles", mockQuery);

    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });
});

describe("queryOne - 예외 처리", () => {
  it("쿼리 함수가 예외를 throw하면 null을 반환한다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("네트워크 오류"));
    mockFrom.mockReturnValue({});

    const result = await queryOne("profiles", mockQuery);

    expect(result).toBeNull();
  });

  it("예외 발생 시 logger.error가 호출된다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("연결 오류"));
    mockFrom.mockReturnValue({});

    await queryOne("profiles", mockQuery);

    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });

  it("예외 발생 시 테이블명이 에러 로그에 포함된다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("오류"));
    mockFrom.mockReturnValue({});

    await queryOne("my_special_table", mockQuery);

    const logMessage = mockedLoggerError.mock.calls[0][0] as string;
    expect(logMessage).toContain("my_special_table");
  });
});

// ============================================================
// queryMany
// ============================================================

describe("queryMany - 성공 케이스", () => {
  it("쿼리 성공 시 데이터 배열을 반환한다", async () => {
    const members = [
      { id: "m1", name: "김철수" },
      { id: "m2", name: "이영희" },
    ];
    const mockQuery = vi.fn().mockResolvedValue({ data: members, error: null });
    mockFrom.mockReturnValue({});

    const result = await queryMany<(typeof members)[0]>(
      "group_members",
      mockQuery
    );

    expect(result).toEqual(members);
    expect(result).toHaveLength(2);
  });

  it("쿼리 성공 시 logger.error가 호출되지 않는다", async () => {
    const mockQuery = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "1" }], error: null });
    mockFrom.mockReturnValue({});

    await queryMany("group_members", mockQuery);

    expect(mockedLoggerError).not.toHaveBeenCalled();
  });

  it("data가 null이고 error도 없으면 빈 배열을 반환한다", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({});

    const result = await queryMany("group_members", mockQuery);

    expect(result).toEqual([]);
  });

  it("data가 빈 배열이면 빈 배열을 반환한다", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({});

    const result = await queryMany("group_members", mockQuery);

    expect(result).toEqual([]);
  });

  it("쿼리 함수에 supabase.from(table) 반환값이 전달된다", async () => {
    const mockBuilder = { select: vi.fn() };
    mockFrom.mockReturnValue(mockBuilder);
    const mockQuery = vi.fn().mockResolvedValue({ data: [], error: null });

    await queryMany("group_members", mockQuery);

    expect(mockFrom).toHaveBeenCalledWith("group_members");
    expect(mockQuery).toHaveBeenCalledWith(mockBuilder);
  });
});

describe("queryMany - 에러 케이스", () => {
  it("쿼리에서 error가 반환되면 빈 배열을 반환한다", async () => {
    const mockQuery = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "RLS 오류" } });
    mockFrom.mockReturnValue({});

    const result = await queryMany("group_members", mockQuery);

    expect(result).toEqual([]);
  });

  it("쿼리 에러 시 logger.error가 호출된다", async () => {
    const mockQuery = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "오류" } });
    mockFrom.mockReturnValue({});

    await queryMany("group_members", mockQuery);

    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });
});

describe("queryMany - 예외 처리", () => {
  it("쿼리 함수가 예외를 throw하면 빈 배열을 반환한다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("타임아웃"));
    mockFrom.mockReturnValue({});

    const result = await queryMany("group_members", mockQuery);

    expect(result).toEqual([]);
  });

  it("예외 발생 시 logger.error가 호출된다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("예외"));
    mockFrom.mockReturnValue({});

    await queryMany("group_members", mockQuery);

    expect(mockedLoggerError).toHaveBeenCalledOnce();
  });

  it("예외 발생 시 테이블명이 에러 로그에 포함된다", async () => {
    const mockQuery = vi.fn().mockRejectedValue(new Error("오류"));
    mockFrom.mockReturnValue({});

    await queryMany("special_table_name", mockQuery);

    const logMessage = mockedLoggerError.mock.calls[0][0] as string;
    expect(logMessage).toContain("special_table_name");
  });

  it("비-Error 예외도 빈 배열을 반환한다", async () => {
    const mockQuery = vi.fn().mockRejectedValue("문자열 예외");
    mockFrom.mockReturnValue({});

    const result = await queryMany("group_members", mockQuery);

    expect(result).toEqual([]);
  });
});
