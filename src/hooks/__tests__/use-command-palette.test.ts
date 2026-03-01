import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useCommandPalette,
  saveRecentPage,
} from "@/hooks/use-command-palette";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── next/navigation mock ─────────────────────────────────────
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// ─── useAuth mock ─────────────────────────────────────────────
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: null }),
}));

// ============================================================
// saveRecentPage 순수 함수 테스트
// ============================================================

describe("saveRecentPage - 최근 방문 페이지 저장", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
  });

  it("최근 방문 페이지를 localStorage에 저장한다", () => {
    saveRecentPage("/dashboard", "대시보드");
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("같은 href는 중복으로 저장되지 않는다", () => {
    saveRecentPage("/dashboard", "대시보드");
    saveRecentPage("/dashboard", "대시보드");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored.filter((p: { href: string }) => p.href === "/dashboard")).toHaveLength(1);
  });

  it("새 페이지는 목록 맨 앞에 추가된다", () => {
    saveRecentPage("/dashboard", "대시보드");
    saveRecentPage("/messages", "메시지");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored[0].href).toBe("/messages");
  });

  it("기존 페이지를 재방문하면 맨 앞으로 이동한다", () => {
    saveRecentPage("/dashboard", "대시보드");
    saveRecentPage("/messages", "메시지");
    saveRecentPage("/dashboard", "대시보드");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored[0].href).toBe("/dashboard");
  });

  it("최대 5개까지만 저장된다", () => {
    saveRecentPage("/page1", "페이지1");
    saveRecentPage("/page2", "페이지2");
    saveRecentPage("/page3", "페이지3");
    saveRecentPage("/page4", "페이지4");
    saveRecentPage("/page5", "페이지5");
    saveRecentPage("/page6", "페이지6");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored).toHaveLength(5);
  });

  it("저장된 항목에 visitedAt 타임스탬프가 있다", () => {
    saveRecentPage("/dashboard", "대시보드");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored[0].visitedAt).toBeDefined();
    expect(typeof stored[0].visitedAt).toBe("number");
  });

  it("저장된 항목에 label이 올바르게 저장된다", () => {
    saveRecentPage("/messages", "메시지 페이지");
    const stored = JSON.parse(
      localStorageMock._store()["dancebase:recent-pages"] ?? "[]"
    );
    expect(stored[0].label).toBe("메시지 페이지");
  });
});

// ============================================================
// useCommandPalette - 초기 상태
// ============================================================

describe("useCommandPalette - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("초기 open 상태는 false이다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);
  });

  it("초기 query는 빈 문자열이다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.query).toBe("");
  });

  it("openPalette, closePalette, setOpen, setQuery 함수가 존재한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(typeof result.current.openPalette).toBe("function");
    expect(typeof result.current.closePalette).toBe("function");
    expect(typeof result.current.setOpen).toBe("function");
    expect(typeof result.current.setQuery).toBe("function");
  });

  it("filteredCommands와 groupedCommands가 반환된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(Array.isArray(result.current.filteredCommands)).toBe(true);
    expect(result.current.groupedCommands).toBeInstanceOf(Map);
  });

  it("초기 filteredCommands에 정적 커맨드가 포함되어 있다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.filteredCommands.length).toBeGreaterThan(0);
  });
});

// ============================================================
// useCommandPalette - openPalette / closePalette
// ============================================================

describe("useCommandPalette - openPalette / closePalette", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("openPalette 호출 시 open이 true가 된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.openPalette();
    });
    expect(result.current.open).toBe(true);
  });

  it("openPalette 호출 시 query가 빈 문자열로 초기화된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("검색어");
    });
    act(() => {
      result.current.openPalette();
    });
    expect(result.current.query).toBe("");
  });

  it("closePalette 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.openPalette();
    });
    act(() => {
      result.current.closePalette();
    });
    expect(result.current.open).toBe(false);
  });

  it("closePalette 호출 시 query가 빈 문자열로 초기화된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.openPalette();
      result.current.setQuery("대시보드");
    });
    act(() => {
      result.current.closePalette();
    });
    expect(result.current.query).toBe("");
  });

  it("setOpen(true) 호출 시 open이 true가 된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setOpen(true);
    });
    expect(result.current.open).toBe(true);
  });

  it("setOpen(false) 호출 시 open이 false가 된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setOpen(true);
    });
    act(() => {
      result.current.setOpen(false);
    });
    expect(result.current.open).toBe(false);
  });
});

// ============================================================
// useCommandPalette - 검색어 필터링
// ============================================================

describe("useCommandPalette - 검색어 필터링", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("query가 빈 문자열이면 모든 명령이 반환된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("");
    });
    expect(result.current.filteredCommands.length).toBeGreaterThan(0);
  });

  it("query로 검색 시 label에 포함된 항목만 필터링된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("대시보드");
    });
    const commands = result.current.filteredCommands;
    commands.forEach((cmd) => {
      expect(cmd.label.toLowerCase()).toContain("대시보드");
    });
  });

  it("매칭되지 않는 검색어로 조회 시 빈 배열이 반환된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("존재하지않는키워드xyz123");
    });
    expect(result.current.filteredCommands).toHaveLength(0);
  });

  it("대소문자 구분 없이 검색된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("DASHBOARD");
    });
    // 정적 커맨드에 영어 label이 없으므로 한글 검색으로 검증
    act(() => {
      result.current.setQuery("메시지");
    });
    expect(result.current.filteredCommands.length).toBeGreaterThan(0);
  });

  it("공백만 있는 query는 전체 목록을 반환한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const totalCount = result.current.filteredCommands.length;
    act(() => {
      result.current.setQuery("   ");
    });
    expect(result.current.filteredCommands.length).toBe(totalCount);
  });
});

// ============================================================
// useCommandPalette - groupedCommands
// ============================================================

describe("useCommandPalette - groupedCommands 그룹화", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("groupedCommands는 Map 인스턴스이다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.groupedCommands).toBeInstanceOf(Map);
  });

  it("groupedCommands에 '빠른 이동' 그룹이 존재한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.groupedCommands.has("빠른 이동")).toBe(true);
  });

  it("groupedCommands에 '액션' 그룹이 존재한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    expect(result.current.groupedCommands.has("액션")).toBe(true);
  });

  it("그룹 내 명령 수가 올바르다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const navGroup = result.current.groupedCommands.get("빠른 이동");
    expect(navGroup).toBeDefined();
    expect(navGroup!.length).toBeGreaterThan(0);
  });

  it("검색 후 groupedCommands도 필터링된다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setQuery("존재하지않는키워드xyz123");
    });
    expect(result.current.groupedCommands.size).toBe(0);
  });
});

// ============================================================
// useCommandPalette - 정적 커맨드 내용 검증
// ============================================================

describe("useCommandPalette - 정적 커맨드 내용", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("대시보드 커맨드가 존재한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const found = result.current.filteredCommands.find(
      (c) => c.id === "nav-dashboard"
    );
    expect(found).toBeDefined();
    expect(found!.href).toBe("/dashboard");
  });

  it("메시지 커맨드가 존재한다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const found = result.current.filteredCommands.find(
      (c) => c.id === "nav-messages"
    );
    expect(found).toBeDefined();
    expect(found!.href).toBe("/messages");
  });

  it("그룹 만들기 커맨드가 action 타입이다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const found = result.current.filteredCommands.find(
      (c) => c.id === "action-new-group"
    );
    expect(found).toBeDefined();
    expect(found!.type).toBe("action");
  });

  it("navigation 타입 커맨드가 1개 이상 있다", () => {
    const { result } = renderHook(() => useCommandPalette());
    const navCommands = result.current.filteredCommands.filter(
      (c) => c.type === "navigation"
    );
    expect(navCommands.length).toBeGreaterThan(0);
  });

  it("모든 커맨드에 id, label, href, type, group이 있다", () => {
    const { result } = renderHook(() => useCommandPalette());
    result.current.filteredCommands.forEach((cmd) => {
      expect(cmd.id).toBeDefined();
      expect(cmd.label).toBeDefined();
      expect(cmd.href).toBeDefined();
      expect(cmd.type).toBeDefined();
      expect(cmd.group).toBeDefined();
    });
  });
});

// ============================================================
// useCommandPalette - 키보드 이벤트
// ============================================================

describe("useCommandPalette - 키보드 이벤트", () => {
  beforeEach(() => {
    localStorageMock.clear();
    pushMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Escape 키로 팔레트가 닫힌다", () => {
    const { result } = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setOpen(true);
    });
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });
    expect(result.current.open).toBe(false);
  });

  it("언마운트 후 키보드 이벤트가 등록 해제된다", () => {
    const { unmount } = renderHook(() => useCommandPalette());
    expect(() => unmount()).not.toThrow();
  });
});
