import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      let initialData: unknown = undefined;
      const fetchResult = fetcher();
      if (fetchResult instanceof Promise) {
        fetchResult.then((v) => { initialData = v; });
      } else {
        // 빈 객체(스토리지 미존재)는 undefined로 처리 → 훅 내부의 ?? 기본값 동작
        const isEmptyObj =
          typeof fetchResult === "object" &&
          fetchResult !== null &&
          !Array.isArray(fetchResult) &&
          Object.keys(fetchResult as object).length === 0;
        initialData = isEmptyObj ? undefined : fetchResult;
      }
      const [data, setData] = reactUseState<unknown>(() => initialData);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          const r = fetcher!();
          if (r instanceof Promise) {
            r.then((v) => setDataRef.current(v));
          } else {
            setDataRef.current(r as unknown);
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    attendanceBook: (groupId: string) => `attendance-book-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import { useAttendanceBook } from "@/hooks/use-attendance-book";
import type { AttendanceSheet, BookAttendanceStatus } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────

/** storage에 groupId별 기본 AttendanceBookData를 초기화 */
function initStorage(groupId: string) {
  memStore[`attendance-book-${groupId}`] = {
    groupId,
    sheets: [],
    updatedAt: new Date().toISOString(),
  };
}

function makeHook(groupId = "group-1") {
  return renderHook(() => useAttendanceBook(groupId));
}

function createSheet(
  hook: ReturnType<typeof makeHook>["result"],
  overrides: {
    date?: string;
    title?: string;
    memberNames?: string[];
  } = {}
) {
  act(() => {
    hook.current.createSheet({
      date: overrides.date ?? "2026-03-01",
      title: overrides.title ?? "정기 연습",
      memberNames: overrides.memberNames ?? ["홍길동", "김철수"],
    });
  });
}

// ============================================================
// useAttendanceBook - 초기 상태
// ============================================================

describe("useAttendanceBook - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("초기 sheets는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.book.sheets).toEqual([]);
  });

  it("초기 totalSheets는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSheets).toBe(0);
  });

  it("초기 overallAttendanceRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.overallAttendanceRate).toBe(0);
  });

  it("초기 memberAttendanceStats는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.memberAttendanceStats).toEqual([]);
  });

  it("초기 recentSheets는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.recentSheets).toEqual([]);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createSheet).toBe("function");
    expect(typeof result.current.deleteSheet).toBe("function");
    expect(typeof result.current.updateRecord).toBe("function");
    expect(typeof result.current.bulkSetPresent).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useAttendanceBook - createSheet
// ============================================================

describe("useAttendanceBook - createSheet", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("시트 생성 후 sheets 길이가 1이 된다", () => {
    const { result } = makeHook();
    createSheet(result);
    expect(result.current.book.sheets).toHaveLength(1);
  });

  it("생성된 시트에 id가 부여된다", () => {
    const { result } = makeHook();
    createSheet(result);
    expect(result.current.book.sheets[0].id).toBeDefined();
  });

  it("생성된 시트의 date가 올바르다", () => {
    const { result } = makeHook();
    createSheet(result, { date: "2026-03-15" });
    expect(result.current.book.sheets[0].date).toBe("2026-03-15");
  });

  it("생성된 시트의 title이 올바르다", () => {
    const { result } = makeHook();
    createSheet(result, { title: "특별 연습" });
    expect(result.current.book.sheets[0].title).toBe("특별 연습");
  });

  it("멤버 수만큼 records가 생성된다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B", "C"] });
    expect(result.current.book.sheets[0].records).toHaveLength(3);
  });

  it("초기 모든 records의 status는 present이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    result.current.book.sheets[0].records.forEach((rec) => {
      expect(rec.status).toBe("present");
    });
  });

  it("초기 모든 records의 note는 null이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    expect(result.current.book.sheets[0].records[0].note).toBeNull();
  });

  it("새 시트가 맨 앞에 추가된다 (최신 먼저)", () => {
    const { result } = makeHook();
    createSheet(result, { title: "첫 번째" });
    createSheet(result, { title: "두 번째" });
    expect(result.current.book.sheets[0].title).toBe("두 번째");
  });

  it("totalSheets가 생성된 시트 수와 일치한다", () => {
    const { result } = makeHook();
    createSheet(result);
    createSheet(result);
    createSheet(result);
    expect(result.current.totalSheets).toBe(3);
  });

  it("memberNames가 빈 배열이면 records도 빈 배열이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: [] });
    expect(result.current.book.sheets[0].records).toHaveLength(0);
  });
});

// ============================================================
// useAttendanceBook - deleteSheet
// ============================================================

describe("useAttendanceBook - deleteSheet", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("시트 삭제 후 sheets 길이가 감소한다", () => {
    const { result } = makeHook();
    createSheet(result);
    const id = result.current.book.sheets[0].id;
    act(() => { result.current.deleteSheet(id); });
    expect(result.current.book.sheets).toHaveLength(0);
  });

  it("특정 시트만 삭제된다", () => {
    const { result } = makeHook();
    createSheet(result, { title: "시트1" });
    createSheet(result, { title: "시트2" });
    const id = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트1"
    )!.id;
    act(() => { result.current.deleteSheet(id); });
    expect(result.current.book.sheets).toHaveLength(1);
    expect(result.current.book.sheets[0].title).toBe("시트2");
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => { result.current.deleteSheet("non-existent"); });
    }).not.toThrow();
  });
});

// ============================================================
// useAttendanceBook - updateRecord
// ============================================================

describe("useAttendanceBook - updateRecord", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("특정 멤버의 상태를 absent로 변경할 수 있다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["홍길동"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "absent");
    });
    const rec = result.current.book.sheets[0].records.find(
      (r) => r.memberName === "홍길동"
    );
    expect(rec?.status).toBe("absent");
  });

  it("특정 멤버의 상태를 late로 변경할 수 있다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["홍길동"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "late");
    });
    const rec = result.current.book.sheets[0].records.find(
      (r) => r.memberName === "홍길동"
    );
    expect(rec?.status).toBe("late");
  });

  it("note를 함께 변경할 수 있다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["홍길동"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "excused", "개인 사정");
    });
    const rec = result.current.book.sheets[0].records.find(
      (r) => r.memberName === "홍길동"
    );
    expect(rec?.note).toBe("개인 사정");
  });

  it("note를 undefined로 넘기면 기존 note가 유지된다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["홍길동"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "excused", "초기 메모");
    });
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "present", undefined);
    });
    const rec = result.current.book.sheets[0].records.find(
      (r) => r.memberName === "홍길동"
    );
    expect(rec?.note).toBe("초기 메모");
  });

  it("다른 시트의 records는 변경되지 않는다", () => {
    const { result } = makeHook();
    createSheet(result, { title: "시트1", memberNames: ["홍길동"] });
    createSheet(result, { title: "시트2", memberNames: ["홍길동"] });
    const sheetId1 = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트1"
    )!.id;
    act(() => {
      result.current.updateRecord(sheetId1, "홍길동", "absent");
    });
    const sheet2 = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트2"
    );
    const rec2 = sheet2?.records.find((r) => r.memberName === "홍길동");
    expect(rec2?.status).toBe("present");
  });

  it("다른 멤버의 records는 변경되지 않는다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["홍길동", "김철수"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => {
      result.current.updateRecord(sheetId, "홍길동", "absent");
    });
    const kimRec = result.current.book.sheets[0].records.find(
      (r) => r.memberName === "김철수"
    );
    expect(kimRec?.status).toBe("present");
  });
});

// ============================================================
// useAttendanceBook - bulkSetPresent
// ============================================================

describe("useAttendanceBook - bulkSetPresent", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("모든 멤버의 status를 present로 변경한다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B", "C"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "absent"); });
    act(() => { result.current.updateRecord(sheetId, "B", "late"); });
    act(() => { result.current.bulkSetPresent(sheetId); });
    result.current.book.sheets[0].records.forEach((rec) => {
      expect(rec.status).toBe("present");
    });
  });

  it("다른 시트에는 영향을 미치지 않는다", () => {
    const { result } = makeHook();
    createSheet(result, { title: "시트1", memberNames: ["A"] });
    createSheet(result, { title: "시트2", memberNames: ["A"] });
    const sheetId1 = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트1"
    )!.id;
    const sheetId2 = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트2"
    )!.id;
    act(() => { result.current.updateRecord(sheetId2, "A", "absent"); });
    act(() => { result.current.bulkSetPresent(sheetId1); });
    const sheet2 = result.current.book.sheets.find(
      (s: AttendanceSheet) => s.title === "시트2"
    );
    expect(sheet2?.records[0].status).toBe("absent");
  });
});

// ============================================================
// useAttendanceBook - 통계 계산
// ============================================================

describe("useAttendanceBook - 통계: overallAttendanceRate", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("모두 present이면 출석률이 100이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    expect(result.current.overallAttendanceRate).toBe(100);
  });

  it("모두 absent이면 출석률이 0이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "absent"); });
    act(() => { result.current.updateRecord(sheetId, "B", "absent"); });
    expect(result.current.overallAttendanceRate).toBe(0);
  });

  it("late는 출석으로 간주한다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "late"); });
    expect(result.current.overallAttendanceRate).toBe(100);
  });

  it("시트가 없으면 출석률이 0이다", () => {
    const { result } = makeHook();
    expect(result.current.overallAttendanceRate).toBe(0);
  });

  it("절반 출석 시 출석률이 50이다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "absent"); });
    expect(result.current.overallAttendanceRate).toBe(50);
  });
});

describe("useAttendanceBook - 통계: memberAttendanceStats", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("멤버별 출석 통계가 생성된다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    expect(result.current.memberAttendanceStats).toHaveLength(2);
  });

  it("present 카운트가 올바르다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    const stat = result.current.memberAttendanceStats.find(
      (s) => s.memberName === "A"
    );
    expect(stat?.present).toBe(1);
  });

  it("absent 카운트가 올바르다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "absent"); });
    const stat = result.current.memberAttendanceStats.find(
      (s) => s.memberName === "A"
    );
    expect(stat?.absent).toBe(1);
  });

  it("late 카운트가 올바르다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    const sheetId = result.current.book.sheets[0].id;
    act(() => { result.current.updateRecord(sheetId, "A", "late"); });
    const stat = result.current.memberAttendanceStats.find(
      (s) => s.memberName === "A"
    );
    expect(stat?.late).toBe(1);
  });

  it("멤버별 rate는 출석률이 높은 순으로 정렬된다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A", "B"] });
    const sheetId = result.current.book.sheets[0].id;
    // A는 absent (출석률 0%), B는 present 유지 (100%)
    act(() => { result.current.updateRecord(sheetId, "A", "absent"); });
    const stats = result.current.memberAttendanceStats;
    expect(stats[0].memberName).toBe("B");
    expect(stats[1].memberName).toBe("A");
  });

  it("멤버별 total이 참여한 시트 수와 일치한다", () => {
    const { result } = makeHook();
    createSheet(result, { memberNames: ["A"] });
    createSheet(result, { memberNames: ["A"] });
    const stat = result.current.memberAttendanceStats.find(
      (s) => s.memberName === "A"
    );
    expect(stat?.total).toBe(2);
  });
});

describe("useAttendanceBook - recentSheets", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("5개 이하 시트이면 recentSheets가 전체 시트와 같다", () => {
    const { result } = makeHook();
    createSheet(result);
    createSheet(result);
    createSheet(result);
    expect(result.current.recentSheets).toHaveLength(3);
  });

  it("6개 이상 시트이면 recentSheets는 처음 5개이다", () => {
    const { result } = makeHook();
    for (let i = 0; i < 7; i++) {
      createSheet(result, { title: `시트${i + 1}` });
    }
    expect(result.current.recentSheets).toHaveLength(5);
  });
});

// ============================================================
// useAttendanceBook - 그룹 격리
// ============================================================

describe("useAttendanceBook - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
    initStorage("group-1");
    initStorage("group-A");
    initStorage("group-B");
  });

  it("다른 groupId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("group-A");
    const { result: r2 } = makeHook("group-B");
    createSheet(r1, { title: "A 그룹 시트" });
    expect(r2.current.book.sheets).toHaveLength(0);
  });
});
