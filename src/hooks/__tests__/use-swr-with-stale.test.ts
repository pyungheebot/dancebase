import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwrWithStale } from "@/hooks/use-swr-with-stale";

// ---------------------------------------------------------------------------
// SWR mock
// ---------------------------------------------------------------------------

// useSWR 반환값을 테스트마다 제어하기 위해 모킹
const mockMutate = vi.fn();

let mockSwrReturn: {
  data: unknown;
  error: unknown;
  isValidating: boolean;
  mutate: typeof mockMutate;
} = {
  data: undefined,
  error: undefined,
  isValidating: false,
  mutate: mockMutate,
};

vi.mock("swr", () => ({
  default: vi.fn(() => mockSwrReturn),
}));

import useSWR from "swr";
const mockedUseSWR = vi.mocked(useSWR);

beforeEach(() => {
  vi.clearAllMocks();
  mockMutate.mockReset();
  // 기본 상태: 아무것도 없음 (최초 로딩 중)
  mockSwrReturn = {
    data: undefined,
    error: undefined,
    isValidating: true,
    mutate: mockMutate,
  };
  mockedUseSWR.mockImplementation(() => mockSwrReturn as ReturnType<typeof useSWR>);
});

// ---------------------------------------------------------------------------
// isLoading 상태 테스트
// ---------------------------------------------------------------------------

describe("useSwrWithStale - isLoading 상태", () => {
  it("data와 error가 모두 없으면 isLoading이 true다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: true, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("data가 있으면 isLoading이 false다", () => {
    mockSwrReturn = { data: [1, 2, 3], error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isLoading).toBe(false);
  });

  it("error만 있고 data가 없으면 isLoading이 false다", () => {
    mockSwrReturn = { data: undefined, error: new Error("오류"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isLoading).toBe(false);
  });

  it("data와 error가 모두 있으면 isLoading이 false다", () => {
    mockSwrReturn = { data: ["stale"], error: new Error("갱신 실패"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isStale 상태 테스트
// ---------------------------------------------------------------------------

describe("useSwrWithStale - isStale 상태", () => {
  it("data와 error가 모두 있으면 isStale이 true다", () => {
    mockSwrReturn = { data: ["stale-data"], error: new Error("갱신 실패"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isStale).toBe(true);
  });

  it("data가 있고 error가 없으면 isStale이 false다", () => {
    mockSwrReturn = { data: ["fresh-data"], error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isStale).toBe(false);
  });

  it("data가 없고 error가 있으면 isStale이 false다", () => {
    mockSwrReturn = { data: undefined, error: new Error("오류"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isStale).toBe(false);
  });

  it("data와 error가 모두 없으면 isStale이 false다 (최초 로딩 중)", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: true, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isStale).toBe(false);
  });

  it("data가 빈 배열이어도 truthy 값이므로 error와 함께 있으면 isStale이 true다", () => {
    // 빈 배열은 truthy가 아님 → isStale false 확인
    mockSwrReturn = { data: [], error: new Error("오류"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale<unknown[]>("/test-key", vi.fn())
    );

    // 빈 배열은 falsy가 아니므로 isStale은 true
    expect(result.current.isStale).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isLoading / isStale 상호 배타성
// ---------------------------------------------------------------------------

describe("useSwrWithStale - isLoading과 isStale 상호 배타성", () => {
  it("isLoading이 true이면 isStale은 false다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: true, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useSwrWithStale("/test-key", vi.fn()));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isStale).toBe(false);
  });

  it("isStale이 true이면 isLoading은 false다", () => {
    mockSwrReturn = { data: { name: "old" }, error: new Error("fail"), isValidating: true, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useSwrWithStale("/test-key", vi.fn()));

    expect(result.current.isStale).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("정상 상태(data 있고 error 없음)에서 isLoading과 isStale이 모두 false다", () => {
    mockSwrReturn = { data: { name: "fresh" }, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() => useSwrWithStale("/test-key", vi.fn()));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStale).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 반환값 전달
// ---------------------------------------------------------------------------

describe("useSwrWithStale - 반환값 전달", () => {
  it("data를 SWR에서 받은 값 그대로 반환한다", () => {
    const testData = [{ id: "1", name: "멤버" }];
    mockSwrReturn = { data: testData, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale<typeof testData>("/test-key", vi.fn())
    );

    expect(result.current.data).toBe(testData);
  });

  it("error를 SWR에서 받은 값 그대로 반환한다", () => {
    const testError = new Error("데이터 로드 실패");
    mockSwrReturn = { data: undefined, error: testError, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.error).toBe(testError);
  });

  it("isValidating을 SWR에서 받은 값 그대로 반환한다", () => {
    mockSwrReturn = { data: ["data"], error: undefined, isValidating: true, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.isValidating).toBe(true);
  });

  it("mutate 함수를 SWR에서 받은 값 그대로 반환한다", () => {
    const testMutate = vi.fn();
    mockSwrReturn = { data: undefined, error: undefined, isValidating: false, mutate: testMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(result.current.mutate).toBe(testMutate);
  });
});

// ---------------------------------------------------------------------------
// retry 함수
// ---------------------------------------------------------------------------

describe("useSwrWithStale - retry 함수", () => {
  it("retry 함수가 존재한다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    expect(typeof result.current.retry).toBe("function");
  });

  it("retry() 호출 시 mutate()가 호출된다", () => {
    mockSwrReturn = { data: undefined, error: new Error("실패"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    act(() => {
      result.current.retry();
    });

    expect(mockMutate).toHaveBeenCalledOnce();
  });

  it("retry()는 인자 없이 mutate를 호출한다", () => {
    mockSwrReturn = { data: undefined, error: new Error("실패"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    act(() => {
      result.current.retry();
    });

    expect(mockMutate).toHaveBeenCalledWith();
  });

  it("retry()를 여러 번 호출하면 mutate가 여러 번 호출된다", () => {
    mockSwrReturn = { data: undefined, error: new Error("실패"), isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const { result } = renderHook(() =>
      useSwrWithStale("/test-key", vi.fn())
    );

    act(() => {
      result.current.retry();
      result.current.retry();
      result.current.retry();
    });

    expect(mockMutate).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// SWR 키 전달
// ---------------------------------------------------------------------------

describe("useSwrWithStale - SWR 키 전달", () => {
  it("주어진 key가 useSWR의 첫 번째 인자로 전달된다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    renderHook(() => useSwrWithStale("/groups/abc/members", vi.fn()));

    expect(mockedUseSWR).toHaveBeenCalledWith(
      "/groups/abc/members",
      expect.anything(),
      undefined
    );
  });

  it("key가 null이면 useSWR에 null이 전달된다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    renderHook(() => useSwrWithStale(null, vi.fn()));

    expect(mockedUseSWR).toHaveBeenCalledWith(
      null,
      expect.anything(),
      undefined
    );
  });

  it("config 옵션이 useSWR의 세 번째 인자로 전달된다", () => {
    mockSwrReturn = { data: undefined, error: undefined, isValidating: false, mutate: mockMutate };
    mockedUseSWR.mockReturnValue(mockSwrReturn as ReturnType<typeof useSWR>);

    const config = { revalidateOnFocus: false };
    renderHook(() => useSwrWithStale("/test", vi.fn(), config));

    expect(mockedUseSWR).toHaveBeenCalledWith(
      "/test",
      expect.anything(),
      config
    );
  });
});
