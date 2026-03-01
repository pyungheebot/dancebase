import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQueryParams } from "@/hooks/use-query-params";

// Next.js router mock
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/test",
}));

beforeEach(() => {
  mockReplace.mockClear();
  // URLSearchParams 초기화
  mockSearchParams.forEach((_, key) => mockSearchParams.delete(key));
});

describe("useQueryParams - 기본값 반환", () => {
  it("URL에 파라미터가 없을 때 기본값을 반환한다", () => {
    const defaults = { tab: "all", status: "active", search: "" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [params] = result.current;
    expect(params.tab).toBe("all");
    expect(params.status).toBe("active");
    expect(params.search).toBe("");
  });

  it("여러 기본값을 모두 올바르게 반환한다", () => {
    const defaults = { sort: "date", order: "desc", page: "1" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [params] = result.current;
    expect(params).toEqual({ sort: "date", order: "desc", page: "1" });
  });
});

describe("useQueryParams - URL 파라미터 오버라이드", () => {
  it("URL에 파라미터가 있으면 기본값을 오버라이드한다", () => {
    mockSearchParams.set("tab", "members");

    const defaults = { tab: "all", status: "active" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [params] = result.current;
    expect(params.tab).toBe("members");
    // URL에 없는 파라미터는 기본값 유지
    expect(params.status).toBe("active");
  });

  it("여러 URL 파라미터가 모두 반영된다", () => {
    mockSearchParams.set("sort", "name");
    mockSearchParams.set("order", "asc");

    const defaults = { sort: "date", order: "desc", page: "1" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [params] = result.current;
    expect(params.sort).toBe("name");
    expect(params.order).toBe("asc");
    expect(params.page).toBe("1"); // URL에 없으므로 기본값
  });
});

describe("useQueryParams - setParams", () => {
  it("setParams 호출 시 router.replace가 호출된다", () => {
    const defaults = { tab: "all" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ tab: "members" });
    });

    expect(mockReplace).toHaveBeenCalledOnce();
  });

  it("기본값과 다른 값으로 setParams 호출 시 URL에 파라미터가 추가된다", () => {
    const defaults = { tab: "all", status: "active" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ tab: "members" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain("tab=members");
  });

  it("기본값과 같은 값으로 setParams 호출 시 URL에서 파라미터가 제거된다", () => {
    // 현재 URL에 tab=members 설정
    mockSearchParams.set("tab", "members");

    const defaults = { tab: "all" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      // 기본값인 "all"로 되돌림 → URL에서 제거되어야 함
      setParams({ tab: "all" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    // tab 파라미터가 URL에 없어야 함
    expect(calledUrl).not.toContain("tab=");
  });

  it("빈 문자열로 setParams 호출 시 URL에서 파라미터가 제거된다", () => {
    mockSearchParams.set("search", "댄스");

    const defaults = { search: "" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ search: "" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("search=");
  });

  it("setParams 호출 시 scroll: false 옵션이 전달된다", () => {
    const defaults = { tab: "all" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ tab: "members" });
    });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.any(String),
      { scroll: false }
    );
  });

  it("파라미터가 없을 때 setParams 호출 시 pathname만 URL로 사용된다", () => {
    const defaults = { tab: "all" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      // 기본값과 동일 → URL에 파라미터 없음
      setParams({ tab: "all" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    // 쿼리스트링 없이 pathname만
    expect(calledUrl).toBe("/test");
  });

  it("여러 파라미터를 한 번에 업데이트할 수 있다", () => {
    const defaults = { tab: "all", sort: "date", order: "desc" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ tab: "members", sort: "name" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain("tab=members");
    expect(calledUrl).toContain("sort=name");
    // order는 기본값이므로 URL에 없어야 함
    expect(calledUrl).not.toContain("order=");
  });

  it("기존 URL 파라미터를 유지하면서 새 파라미터를 추가한다", () => {
    // 기존에 status 파라미터가 있는 상태
    mockSearchParams.set("status", "active");

    const defaults = { tab: "all", status: "all" };

    const { result } = renderHook(() => useQueryParams(defaults));

    const [, setParams] = result.current;

    act(() => {
      setParams({ tab: "members" });
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain("tab=members");
    expect(calledUrl).toContain("status=active");
  });
});
