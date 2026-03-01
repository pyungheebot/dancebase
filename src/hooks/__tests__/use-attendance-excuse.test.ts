import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useAttendanceExcuse,
  EXCUSE_TYPE_LABELS,
  EXCUSE_TYPE_COLORS,
  EXCUSE_REASON_LABELS,
  EXCUSE_STATUS_LABELS,
  EXCUSE_STATUS_COLORS,
  ALL_EXCUSE_TYPES,
  ALL_EXCUSE_REASONS,
  ALL_EXCUSE_STATUSES,
} from "@/hooks/use-attendance-excuse";

// ─── localStorage mock ──────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ─────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// ─── beforeEach: 초기화 ───────────────────────────────────────
beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  uuidCounter = 0;
});

// ─────────────────────────────────────────────────────────────
// 1. 상수 검증
// ─────────────────────────────────────────────────────────────

describe("EXCUSE_TYPE_LABELS - 타입 레이블 상수", () => {
  it("absent 레이블이 '불참'이다", () => {
    expect(EXCUSE_TYPE_LABELS.absent).toBe("불참");
  });

  it("late 레이블이 '지각'이다", () => {
    expect(EXCUSE_TYPE_LABELS.late).toBe("지각");
  });

  it("early_leave 레이블이 '조퇴'이다", () => {
    expect(EXCUSE_TYPE_LABELS.early_leave).toBe("조퇴");
  });
});

describe("EXCUSE_STATUS_LABELS - 상태 레이블 상수", () => {
  it("pending 레이블이 '검토중'이다", () => {
    expect(EXCUSE_STATUS_LABELS.pending).toBe("검토중");
  });

  it("approved 레이블이 '승인'이다", () => {
    expect(EXCUSE_STATUS_LABELS.approved).toBe("승인");
  });

  it("rejected 레이블이 '반려'이다", () => {
    expect(EXCUSE_STATUS_LABELS.rejected).toBe("반려");
  });
});

describe("EXCUSE_REASON_LABELS - 사유 레이블 상수", () => {
  it("health 레이블이 '건강'이다", () => {
    expect(EXCUSE_REASON_LABELS.health).toBe("건강");
  });

  it("study 레이블이 '학업'이다", () => {
    expect(EXCUSE_REASON_LABELS.study).toBe("학업");
  });

  it("work 레이블이 '직장'이다", () => {
    expect(EXCUSE_REASON_LABELS.work).toBe("직장");
  });

  it("family 레이블이 '가정'이다", () => {
    expect(EXCUSE_REASON_LABELS.family).toBe("가정");
  });

  it("other 레이블이 '기타'이다", () => {
    expect(EXCUSE_REASON_LABELS.other).toBe("기타");
  });
});

describe("EXCUSE_TYPE_COLORS - 타입 색상 상수", () => {
  it("absent 색상이 red 계열이다", () => {
    expect(EXCUSE_TYPE_COLORS.absent).toContain("red");
  });

  it("late 색상이 orange 계열이다", () => {
    expect(EXCUSE_TYPE_COLORS.late).toContain("orange");
  });

  it("early_leave 색상이 yellow 계열이다", () => {
    expect(EXCUSE_TYPE_COLORS.early_leave).toContain("yellow");
  });
});

describe("EXCUSE_STATUS_COLORS - 상태 색상 상수", () => {
  it("pending 색상이 blue 계열이다", () => {
    expect(EXCUSE_STATUS_COLORS.pending).toContain("blue");
  });

  it("approved 색상이 green 계열이다", () => {
    expect(EXCUSE_STATUS_COLORS.approved).toContain("green");
  });

  it("rejected 색상이 gray 계열이다", () => {
    expect(EXCUSE_STATUS_COLORS.rejected).toContain("gray");
  });
});

describe("ALL_EXCUSE_TYPES / ALL_EXCUSE_REASONS / ALL_EXCUSE_STATUSES - 배열 상수", () => {
  it("ALL_EXCUSE_TYPES에 3가지 타입이 있다", () => {
    expect(ALL_EXCUSE_TYPES).toHaveLength(3);
    expect(ALL_EXCUSE_TYPES).toContain("absent");
    expect(ALL_EXCUSE_TYPES).toContain("late");
    expect(ALL_EXCUSE_TYPES).toContain("early_leave");
  });

  it("ALL_EXCUSE_REASONS에 5가지 사유가 있다", () => {
    expect(ALL_EXCUSE_REASONS).toHaveLength(5);
    expect(ALL_EXCUSE_REASONS).toContain("health");
    expect(ALL_EXCUSE_REASONS).toContain("other");
  });

  it("ALL_EXCUSE_STATUSES에 3가지 상태가 있다", () => {
    expect(ALL_EXCUSE_STATUSES).toHaveLength(3);
    expect(ALL_EXCUSE_STATUSES).toContain("pending");
    expect(ALL_EXCUSE_STATUSES).toContain("approved");
    expect(ALL_EXCUSE_STATUSES).toContain("rejected");
  });
});

// ─────────────────────────────────────────────────────────────
// 2. 초기 상태
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - 초기 상태", () => {
  it("초기 items는 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(result.current.items).toEqual([]);
  });

  it("초기 pendingItems는 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(result.current.pendingItems).toEqual([]);
  });

  it("초기 approvedItems는 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(result.current.approvedItems).toEqual([]);
  });

  it("초기 rejectedItems는 빈 배열이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(result.current.rejectedItems).toEqual([]);
  });

  it("entry.groupId가 생성 시 전달된 groupId와 일치한다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-42"));
    expect(result.current.entry.groupId).toBe("group-42");
  });

  it("entry.id가 존재한다 (UUID)", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(result.current.entry.id).toBeTruthy();
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    expect(typeof result.current.submitExcuse).toBe("function");
    expect(typeof result.current.removeExcuse).toBe("function");
    expect(typeof result.current.approveExcuse).toBe("function");
    expect(typeof result.current.rejectExcuse).toBe("function");
    expect(typeof result.current.getByMember).toBe("function");
    expect(typeof result.current.getByStatus).toBe("function");
  });
});

// ─────────────────────────────────────────────────────────────
// 3. submitExcuse
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - submitExcuse", () => {
  it("정상 제출 후 items에 항목이 추가된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "몸이 아파서");
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("제출된 항목의 status는 pending이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "몸이 아파서");
    });
    expect(result.current.items[0].status).toBe("pending");
  });

  it("제출된 항목의 memberName이 trim된 값이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("  홍길동  ", "2026-03-01", "absent", "health", "사유");
    });
    expect(result.current.items[0].memberName).toBe("홍길동");
  });

  it("제출된 항목의 detail이 trim된 값이다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "  사유 내용  ");
    });
    expect(result.current.items[0].detail).toBe("사유 내용");
  });

  it("memberName이 빈 문자열이면 추가되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("", "2026-03-01", "absent", "health", "사유");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("memberName이 공백만이면 추가되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("   ", "2026-03-01", "absent", "health", "사유");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("date가 빈 문자열이면 추가되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "", "absent", "health", "사유");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("detail이 빈 문자열이면 추가되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("detail이 공백만이면 추가되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "   ");
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("새 항목은 items 맨 앞에 추가된다 (최신순)", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("김철수", "2026-03-01", "absent", "health", "사유1");
      result.current.submitExcuse("이영희", "2026-03-02", "late", "study", "사유2");
    });
    expect(result.current.items[0].memberName).toBe("이영희");
    expect(result.current.items[1].memberName).toBe("김철수");
  });

  it("제출 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("제출된 항목은 pendingItems에 포함된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    expect(result.current.pendingItems).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. removeExcuse
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - removeExcuse", () => {
  it("존재하는 항목 삭제 후 items에서 제거된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.removeExcuse(itemId);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it("존재하지 않는 ID 삭제 시 items가 변경되지 않는다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    act(() => {
      result.current.removeExcuse("non-existent-id");
    });
    expect(result.current.items).toHaveLength(1);
  });

  it("삭제 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    localStorageMock.setItem.mockClear();
    act(() => {
      result.current.removeExcuse(itemId);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 항목 중 특정 항목만 삭제된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("김철수", "2026-03-01", "absent", "health", "사유1");
      result.current.submitExcuse("이영희", "2026-03-02", "late", "study", "사유2");
    });
    const firstItemId = result.current.items[0].id; // 이영희 (최신이 앞)
    act(() => {
      result.current.removeExcuse(firstItemId);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].memberName).toBe("김철수");
  });
});

// ─────────────────────────────────────────────────────────────
// 5. approveExcuse
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - approveExcuse", () => {
  it("승인 후 해당 항목의 status가 approved가 된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "관리자");
    });
    expect(result.current.items[0].status).toBe("approved");
  });

  it("승인 후 approverName이 설정된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "담당자A");
    });
    expect(result.current.items[0].approverName).toBe("담당자A");
  });

  it("approverName이 빈 문자열이면 '관리자'로 설정된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "");
    });
    expect(result.current.items[0].approverName).toBe("관리자");
  });

  it("승인 후 approvedAt이 설정된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "관리자");
    });
    expect(result.current.items[0].approvedAt).toBeTruthy();
  });

  it("승인 후 approvedItems에 포함된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "관리자");
    });
    expect(result.current.approvedItems).toHaveLength(1);
    expect(result.current.pendingItems).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. rejectExcuse
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - rejectExcuse", () => {
  it("반려 후 해당 항목의 status가 rejected가 된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.rejectExcuse(itemId, "관리자");
    });
    expect(result.current.items[0].status).toBe("rejected");
  });

  it("approverName이 빈 문자열이면 반려 시에도 '관리자'로 설정된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.rejectExcuse(itemId, "   ");
    });
    expect(result.current.items[0].approverName).toBe("관리자");
  });

  it("반려 후 rejectedItems에 포함된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.rejectExcuse(itemId, "관리자");
    });
    expect(result.current.rejectedItems).toHaveLength(1);
    expect(result.current.pendingItems).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. getByMember / getByStatus
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - getByMember", () => {
  it("정확한 이름으로 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유1");
      result.current.submitExcuse("김철수", "2026-03-02", "late", "study", "사유2");
    });
    const found = result.current.getByMember("홍길동");
    expect(found).toHaveLength(1);
    expect(found[0].memberName).toBe("홍길동");
  });

  it("대소문자 구분 없이 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("Alice", "2026-03-01", "absent", "health", "사유");
    });
    const found = result.current.getByMember("alice");
    expect(found).toHaveLength(1);
  });

  it("부분 일치로 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const found = result.current.getByMember("길동");
    expect(found).toHaveLength(1);
  });

  it("매칭되는 항목이 없으면 빈 배열을 반환한다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const found = result.current.getByMember("박지성");
    expect(found).toHaveLength(0);
  });
});

describe("useAttendanceExcuse - getByStatus", () => {
  it("pending 상태로 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const found = result.current.getByStatus("pending");
    expect(found).toHaveLength(1);
  });

  it("approved 상태로 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.approveExcuse(itemId, "관리자");
    });
    expect(result.current.getByStatus("approved")).toHaveLength(1);
    expect(result.current.getByStatus("pending")).toHaveLength(0);
  });

  it("rejected 상태로 필터링된다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-1"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const itemId = result.current.items[0].id;
    act(() => {
      result.current.rejectExcuse(itemId, "관리자");
    });
    expect(result.current.getByStatus("rejected")).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. 그룹별 격리
// ─────────────────────────────────────────────────────────────

describe("useAttendanceExcuse - 그룹별 격리", () => {
  it("다른 groupId를 가진 훅은 서로 독립된 상태를 가진다", () => {
    const { result: r1 } = renderHook(() => useAttendanceExcuse("group-A"));
    const { result: r2 } = renderHook(() => useAttendanceExcuse("group-B"));

    act(() => {
      r1.current.submitExcuse("그룹A멤버", "2026-03-01", "absent", "health", "사유");
    });

    expect(r1.current.items).toHaveLength(1);
    expect(r2.current.items).toHaveLength(0);
  });

  it("localStorage 키가 groupId를 포함한다", () => {
    const { result } = renderHook(() => useAttendanceExcuse("group-X"));
    act(() => {
      result.current.submitExcuse("홍길동", "2026-03-01", "absent", "health", "사유");
    });
    const savedKey = localStorageMock.setItem.mock.calls[0][0];
    expect(savedKey).toContain("group-X");
  });
});
