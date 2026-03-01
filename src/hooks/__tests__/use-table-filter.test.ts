import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableFilter } from "@/hooks/use-table-filter";

// Next.js router mock (useQueryParams 의존)
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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTableFilter - 초기 상태", () => {
  it("기본 필터값을 반환한다", () => {
    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.filters.status).toBe("all");
    expect(result.current.filters.q).toBe("");
  });

  it("searchInput 초기값이 기본값의 검색 필드와 일치한다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.searchInput).toBe("");
  });

  it("debouncedSearch 초기값이 빈 문자열이다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.debouncedSearch).toBe("");
  });

  it("setFilter, resetFilters, setSearchInput 함수가 존재한다", () => {
    const { result } = renderHook(() => useTableFilter({ q: "" }));

    expect(typeof result.current.setFilter).toBe("function");
    expect(typeof result.current.resetFilters).toBe("function");
    expect(typeof result.current.setSearchInput).toBe("function");
  });

  it("hasActiveFilters 초기값은 false다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("URL에 초기 검색어가 있으면 searchInput에 반영된다", () => {
    mockSearchParams.set("q", "댄스");
    const defaults = { q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.searchInput).toBe("댄스");
  });
});

describe("useTableFilter - setFilter (검색 외 필드)", () => {
  it("검색 외 필드는 setFilter 호출 시 즉시 URL에 반영된다", () => {
    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setFilter("status", "active");
    });

    expect(mockReplace).toHaveBeenCalledOnce();
    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=active");
  });

  it("기본값과 같은 값으로 setFilter 호출 시 URL에서 파라미터가 제거된다", () => {
    mockSearchParams.set("status", "active");

    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setFilter("status", "all");
    });

    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain("status=");
  });

  it("여러 비검색 필터를 순서대로 변경할 수 있다", () => {
    const defaults = { status: "all", type: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setFilter("status", "active");
    });
    act(() => {
      result.current.setFilter("type", "event");
    });

    expect(mockReplace).toHaveBeenCalledTimes(2);
  });
});

describe("useTableFilter - setFilter (검색 필드 = searchKey)", () => {
  it("검색 필드 setFilter는 searchInput을 업데이트한다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setFilter("q", "댄스");
    });

    expect(result.current.searchInput).toBe("댄스");
  });

  it("검색 필드 setFilter 시 즉시 URL 반영되지 않는다 (디바운싱)", () => {
    const defaults = { q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setFilter("q", "검색어");
    });

    // 디바운스 딜레이 전에는 URL 업데이트 없음
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("커스텀 searchKey 필드도 디바운싱된다", () => {
    const defaults = { keyword: "", status: "all" };
    const { result } = renderHook(() =>
      useTableFilter(defaults, { searchKey: "keyword" })
    );

    act(() => {
      result.current.setFilter("keyword", "테스트");
    });

    expect(result.current.searchInput).toBe("테스트");
    // 디바운스 전 URL 업데이트 없음
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("useTableFilter - setSearchInput + 디바운싱", () => {
  it("setSearchInput으로 검색어를 즉시 업데이트한다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("검색어");
    });

    expect(result.current.searchInput).toBe("검색어");
  });

  it("debouncedSearch는 기본 300ms 후 업데이트된다", () => {
    const defaults = { q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("디바운스");
    });

    // 300ms 전에는 이전 값 유지
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedSearch).toBe("");

    // 300ms 후 업데이트
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedSearch).toBe("디바운스");
  });

  it("커스텀 debounceMs 옵션이 적용된다", () => {
    const defaults = { q: "" };
    const { result } = renderHook(() =>
      useTableFilter(defaults, { debounceMs: 500 })
    );

    act(() => {
      result.current.setSearchInput("검색");
    });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.debouncedSearch).toBe("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedSearch).toBe("검색");
  });

  it("빠른 연속 입력 시 마지막 값만 debouncedSearch에 반영된다", () => {
    const defaults = { q: "" };
    const { result } = renderHook(() =>
      useTableFilter(defaults, { debounceMs: 300 })
    );

    act(() => {
      result.current.setSearchInput("첫");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setSearchInput("두");
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setSearchInput("최종");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedSearch).toBe("최종");
  });

  it("debouncedSearch 업데이트 후 URL에 검색어가 반영된다", () => {
    const defaults = { q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("댄스공연");
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0][0] as string;
    expect(calledUrl).toContain("q=%EB%8C%84%EC%8A%A4%EA%B3%B5%EC%97%B0");
  });
});

describe("useTableFilter - resetFilters", () => {
  it("resetFilters 호출 시 검색 외 필터가 기본값으로 초기화된다", () => {
    mockSearchParams.set("status", "active");

    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.resetFilters();
    });

    expect(mockReplace).toHaveBeenCalled();
    const calledUrl = mockReplace.mock.calls[0][0] as string;
    // 기본값이므로 URL에서 제거됨
    expect(calledUrl).not.toContain("status=");
  });

  it("resetFilters 호출 시 searchInput이 기본값으로 초기화된다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("검색어");
    });
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.searchInput).toBe("");
  });

  it("커스텀 searchKey 기본값으로 검색 초기화된다", () => {
    const defaults = { keyword: "", status: "all" };
    const { result } = renderHook(() =>
      useTableFilter(defaults, { searchKey: "keyword" })
    );

    act(() => {
      result.current.setSearchInput("검색어");
    });
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.searchInput).toBe("");
  });
});

describe("useTableFilter - hasActiveFilters", () => {
  it("모든 필터가 기본값이면 hasActiveFilters는 false다", () => {
    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("검색 외 필터가 기본값과 다르면 hasActiveFilters는 true다", () => {
    mockSearchParams.set("status", "active");

    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("debouncedSearch가 기본값과 다르면 hasActiveFilters는 true다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("검색");
    });

    // 디바운스 전에는 아직 false
    expect(result.current.hasActiveFilters).toBe(false);

    // 디바운스 후 true
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("resetFilters 후 searchInput은 기본값이 되어 debouncedSearch가 false 조건이 된다", () => {
    // mockSearchParams는 실제 변경되지 않아(모킹 한계) URL 파라미터 기반 hasActiveFilters는
    // 여전히 true일 수 있으나, searchInput/debouncedSearch는 초기화됨을 검증
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    // 검색어 입력 후 디바운스 완료
    act(() => {
      result.current.setSearchInput("검색어");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.hasActiveFilters).toBe(true);

    // resetFilters로 검색 초기화
    act(() => {
      result.current.resetFilters();
    });

    // searchInput이 기본값으로 초기화됨
    expect(result.current.searchInput).toBe("");

    // 디바운스 완료 후 debouncedSearch도 기본값으로 초기화
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearch).toBe("");
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe("useTableFilter - filters 반환값", () => {
  it("filters는 URL 파라미터와 debouncedSearch를 합친 값이다", () => {
    mockSearchParams.set("status", "active");

    const defaults = { status: "all", q: "" };
    const { result } = renderHook(() => useTableFilter(defaults));

    // 초기 (검색어 없음)
    expect(result.current.filters.status).toBe("active");
    expect(result.current.filters.q).toBe("");
  });

  it("debouncedSearch 업데이트 후 filters.q가 업데이트된다", () => {
    const defaults = { q: "", status: "all" };
    const { result } = renderHook(() => useTableFilter(defaults));

    act(() => {
      result.current.setSearchInput("새검색어");
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.filters.q).toBe("새검색어");
  });
});
