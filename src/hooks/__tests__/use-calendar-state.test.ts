import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── sonner mock ──────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    SCHEDULE: {
      DELETED: "일정이 삭제되었습니다",
      DELETE_ERROR: "일정 삭제에 실패했습니다",
    },
  },
}));

// ─── use-confirm-dialog mock ──────────────────────────────────
vi.mock("@/hooks/use-confirm-dialog", () => ({
  useConfirmDialog: () => ({
    requestConfirm: vi.fn(),
    confirm: vi.fn(() => null),
    isOpen: false,
    pendingLabel: null,
    cancel: vi.fn(),
  }),
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useCalendarState } from "@/hooks/use-calendar-state";
import type { Schedule } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: "schedule-1",
    group_id: "group-1",
    title: "테스트 일정",
    starts_at: "2026-03-10T10:00:00.000Z",
    ends_at: "2026-03-10T12:00:00.000Z",
    location: null,
    type: "practice",
    recurrence_id: null,
    recurrence_rule: null,
    attendance_method: "manual",
    description: null,
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    created_by: "user-1",
    ...overrides,
  };
}

function makeHook(onScheduleUpdated?: () => void) {
  return renderHook(() => useCalendarState({ onScheduleUpdated }));
}

// ============================================================
// 초기 상태
// ============================================================

describe("useCalendarState - 초기 상태", () => {
  it("초기 currentMonth는 현재 달이다", () => {
    const { result } = makeHook();
    const now = new Date();
    expect(result.current.state.currentMonth.getFullYear()).toBe(now.getFullYear());
    expect(result.current.state.currentMonth.getMonth()).toBe(now.getMonth());
  });

  it("초기 editSchedule은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.editSchedule).toBeNull();
  });

  it("초기 editScope은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.editScope).toBeNull();
  });

  it("초기 detailSchedule은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.detailSchedule).toBeNull();
  });

  it("초기 overflowDay는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.overflowDay).toBeNull();
  });

  it("초기 recurrenceEditDialogOpen은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.state.recurrenceEditDialogOpen).toBe(false);
  });

  it("초기 recurrenceDeleteDialogOpen은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.state.recurrenceDeleteDialogOpen).toBe(false);
  });

  it("초기 deleteLoading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.state.deleteLoading).toBe(false);
  });

  it("초기 pendingEditSchedule은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.pendingEditSchedule).toBeNull();
  });

  it("초기 pendingDeleteSchedule은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.state.pendingDeleteSchedule).toBeNull();
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.dispatch).toBe("function");
    expect(typeof result.current.handleEditClick).toBe("function");
    expect(typeof result.current.handleRecurrenceEditSelect).toBe("function");
    expect(typeof result.current.handleDeleteClick).toBe("function");
    expect(typeof result.current.handleDeleteConfirm).toBe("function");
    expect(typeof result.current.handleSingleDeleteConfirm).toBe("function");
    expect(typeof result.current.handleDetailEditClick).toBe("function");
    expect(typeof result.current.handleDetailDeleteClick).toBe("function");
    expect(typeof result.current.handleEditCreated).toBe("function");
  });
});

// ============================================================
// 월 이동 액션
// ============================================================

describe("useCalendarState - 월 이동", () => {
  it("PREV_MONTH 액션으로 이전 달로 이동한다", () => {
    const { result } = makeHook();
    const before = result.current.state.currentMonth.getMonth();
    act(() => {
      result.current.dispatch({ type: "PREV_MONTH" });
    });
    const after = result.current.state.currentMonth.getMonth();
    const expectedMonth = before === 0 ? 11 : before - 1;
    expect(after).toBe(expectedMonth);
  });

  it("NEXT_MONTH 액션으로 다음 달로 이동한다", () => {
    const { result } = makeHook();
    const before = result.current.state.currentMonth.getMonth();
    act(() => {
      result.current.dispatch({ type: "NEXT_MONTH" });
    });
    const after = result.current.state.currentMonth.getMonth();
    const expectedMonth = before === 11 ? 0 : before + 1;
    expect(after).toBe(expectedMonth);
  });

  it("TODAY 액션으로 오늘 달로 돌아온다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.dispatch({ type: "NEXT_MONTH" });
    });
    act(() => {
      result.current.dispatch({ type: "TODAY" });
    });
    const now = new Date();
    expect(result.current.state.currentMonth.getMonth()).toBe(now.getMonth());
    expect(result.current.state.currentMonth.getFullYear()).toBe(now.getFullYear());
  });

  it("SET_MONTH 액션으로 특정 달로 이동한다", () => {
    const { result } = makeHook();
    const targetDate = new Date(2026, 5, 1);
    act(() => {
      result.current.dispatch({ type: "SET_MONTH", month: targetDate });
    });
    expect(result.current.state.currentMonth.getMonth()).toBe(5);
    expect(result.current.state.currentMonth.getFullYear()).toBe(2026);
  });

  it("PREV_MONTH를 여러 번 연속 호출할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.dispatch({ type: "PREV_MONTH" });
    });
    act(() => {
      result.current.dispatch({ type: "PREV_MONTH" });
    });
    const now = new Date();
    const expectedYear = now.getMonth() < 2
      ? now.getFullYear() - (now.getMonth() === 0 ? 1 : 0) - (now.getMonth() === 1 ? 1 : 0)
      : now.getFullYear();
    expect(result.current.state.currentMonth.getFullYear()).toBeGreaterThanOrEqual(expectedYear - 1);
  });
});

// ============================================================
// 상세 다이얼로그
// ============================================================

describe("useCalendarState - 상세 다이얼로그", () => {
  it("OPEN_DETAIL 액션으로 detailSchedule이 설정된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    expect(result.current.state.detailSchedule).toEqual(schedule);
  });

  it("CLOSE_DETAIL 액션으로 detailSchedule이 null이 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    act(() => {
      result.current.dispatch({ type: "CLOSE_DETAIL" });
    });
    expect(result.current.state.detailSchedule).toBeNull();
  });
});

// ============================================================
// 수정 다이얼로그
// ============================================================

describe("useCalendarState - 수정 다이얼로그", () => {
  it("OPEN_EDIT 액션으로 editSchedule이 설정된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_EDIT", schedule, scope: "this" });
    });
    expect(result.current.state.editSchedule).toEqual(schedule);
  });

  it("OPEN_EDIT 액션으로 editScope이 설정된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_EDIT", schedule, scope: "all" });
    });
    expect(result.current.state.editScope).toBe("all");
  });

  it("CLOSE_EDIT 액션으로 editSchedule이 null이 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_EDIT", schedule, scope: "this" });
    });
    act(() => {
      result.current.dispatch({ type: "CLOSE_EDIT" });
    });
    expect(result.current.state.editSchedule).toBeNull();
    expect(result.current.state.editScope).toBeNull();
  });

  it("SET_EDIT_SCOPE 액션으로 editScope이 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.dispatch({ type: "SET_EDIT_SCOPE", scope: "this_and_future" });
    });
    expect(result.current.state.editScope).toBe("this_and_future");
  });
});

// ============================================================
// 오버플로우 다이얼로그
// ============================================================

describe("useCalendarState - 오버플로우 다이얼로그", () => {
  it("OPEN_OVERFLOW 액션으로 overflowDay가 설정된다", () => {
    const { result } = makeHook();
    const day = new Date(2026, 2, 15);
    act(() => {
      result.current.dispatch({ type: "OPEN_OVERFLOW", day });
    });
    expect(result.current.state.overflowDay).toEqual(day);
  });

  it("CLOSE_OVERFLOW 액션으로 overflowDay가 null이 된다", () => {
    const { result } = makeHook();
    const day = new Date(2026, 2, 15);
    act(() => {
      result.current.dispatch({ type: "OPEN_OVERFLOW", day });
    });
    act(() => {
      result.current.dispatch({ type: "CLOSE_OVERFLOW" });
    });
    expect(result.current.state.overflowDay).toBeNull();
  });
});

// ============================================================
// 반복 일정 수정/삭제 다이얼로그
// ============================================================

describe("useCalendarState - 반복 일정 다이얼로그", () => {
  it("OPEN_RECURRENCE_EDIT 액션으로 recurrenceEditDialogOpen이 true가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-1" });
    act(() => {
      result.current.dispatch({ type: "OPEN_RECURRENCE_EDIT", schedule });
    });
    expect(result.current.state.recurrenceEditDialogOpen).toBe(true);
    expect(result.current.state.pendingEditSchedule).toEqual(schedule);
  });

  it("CLOSE_RECURRENCE_EDIT 액션으로 recurrenceEditDialogOpen이 false가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-1" });
    act(() => {
      result.current.dispatch({ type: "OPEN_RECURRENCE_EDIT", schedule });
    });
    act(() => {
      result.current.dispatch({ type: "CLOSE_RECURRENCE_EDIT" });
    });
    expect(result.current.state.recurrenceEditDialogOpen).toBe(false);
    expect(result.current.state.pendingEditSchedule).toBeNull();
  });

  it("OPEN_RECURRENCE_DELETE 액션으로 recurrenceDeleteDialogOpen이 true가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-1" });
    act(() => {
      result.current.dispatch({ type: "OPEN_RECURRENCE_DELETE", schedule });
    });
    expect(result.current.state.recurrenceDeleteDialogOpen).toBe(true);
    expect(result.current.state.pendingDeleteSchedule).toEqual(schedule);
  });

  it("CLOSE_RECURRENCE_DELETE 액션으로 recurrenceDeleteDialogOpen이 false가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-1" });
    act(() => {
      result.current.dispatch({ type: "OPEN_RECURRENCE_DELETE", schedule });
    });
    act(() => {
      result.current.dispatch({ type: "CLOSE_RECURRENCE_DELETE" });
    });
    expect(result.current.state.recurrenceDeleteDialogOpen).toBe(false);
    expect(result.current.state.pendingDeleteSchedule).toBeNull();
  });

  it("DELETE_DONE 액션으로 삭제 관련 상태가 초기화된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    act(() => {
      result.current.dispatch({ type: "SET_DELETE_LOADING", loading: true });
    });
    act(() => {
      result.current.dispatch({ type: "DELETE_DONE" });
    });
    expect(result.current.state.detailSchedule).toBeNull();
    expect(result.current.state.pendingDeleteSchedule).toBeNull();
    expect(result.current.state.recurrenceDeleteDialogOpen).toBe(false);
    expect(result.current.state.deleteLoading).toBe(false);
  });

  it("SET_DELETE_LOADING 액션으로 deleteLoading이 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.dispatch({ type: "SET_DELETE_LOADING", loading: true });
    });
    expect(result.current.state.deleteLoading).toBe(true);
  });
});

// ============================================================
// handleEditClick 핸들러
// ============================================================

describe("useCalendarState - handleEditClick", () => {
  it("단일 일정 클릭 시 editSchedule이 설정된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: null });
    act(() => {
      result.current.handleEditClick(schedule);
    });
    expect(result.current.state.editSchedule).toEqual(schedule);
    expect(result.current.state.editScope).toBe("this");
  });

  it("반복 일정 클릭 시 recurrenceEditDialogOpen이 true가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-abc" });
    act(() => {
      result.current.handleEditClick(schedule);
    });
    expect(result.current.state.recurrenceEditDialogOpen).toBe(true);
    expect(result.current.state.editSchedule).toBeNull();
  });
});

// ============================================================
// handleDeleteClick 핸들러
// ============================================================

describe("useCalendarState - handleDeleteClick", () => {
  it("반복 일정 삭제 클릭 시 recurrenceDeleteDialogOpen이 true가 된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "recurrence-abc" });
    act(() => {
      result.current.handleDeleteClick(schedule);
    });
    expect(result.current.state.recurrenceDeleteDialogOpen).toBe(true);
    expect(result.current.state.pendingDeleteSchedule).toEqual(schedule);
  });
});

// ============================================================
// handleDetailEditClick & handleDetailDeleteClick
// ============================================================

describe("useCalendarState - handleDetailEditClick / handleDetailDeleteClick", () => {
  it("handleDetailEditClick 호출 시 detailSchedule이 닫힌다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    act(() => {
      result.current.handleDetailEditClick(schedule);
    });
    expect(result.current.state.detailSchedule).toBeNull();
  });

  it("handleDetailEditClick 후 단일 일정이면 editSchedule이 열린다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: null });
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    act(() => {
      result.current.handleDetailEditClick(schedule);
    });
    expect(result.current.state.editSchedule).toEqual(schedule);
  });

  it("handleDetailDeleteClick 호출 시 detailSchedule이 닫힌다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_DETAIL", schedule });
    });
    act(() => {
      result.current.handleDetailDeleteClick(schedule);
    });
    expect(result.current.state.detailSchedule).toBeNull();
  });
});

// ============================================================
// handleRecurrenceEditSelect
// ============================================================

describe("useCalendarState - handleRecurrenceEditSelect", () => {
  it("scope 선택 후 editSchedule이 pendingEditSchedule로 설정된다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule({ recurrence_id: "rec-1" });
    act(() => {
      result.current.dispatch({ type: "OPEN_RECURRENCE_EDIT", schedule });
    });
    act(() => {
      result.current.handleRecurrenceEditSelect("this_and_future");
    });
    expect(result.current.state.editSchedule).toEqual(schedule);
    expect(result.current.state.editScope).toBe("this_and_future");
    expect(result.current.state.recurrenceEditDialogOpen).toBe(false);
  });

  it("pendingEditSchedule이 없으면 editSchedule은 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.handleRecurrenceEditSelect("this");
    });
    expect(result.current.state.editSchedule).toBeNull();
  });
});

// ============================================================
// handleEditCreated
// ============================================================

describe("useCalendarState - handleEditCreated", () => {
  it("handleEditCreated 호출 시 editSchedule이 닫힌다", () => {
    const { result } = makeHook();
    const schedule = makeSchedule();
    act(() => {
      result.current.dispatch({ type: "OPEN_EDIT", schedule, scope: "this" });
    });
    act(() => {
      result.current.handleEditCreated();
    });
    expect(result.current.state.editSchedule).toBeNull();
  });

  it("handleEditCreated 호출 시 onScheduleUpdated 콜백이 호출된다", () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useCalendarState({ onScheduleUpdated: onUpdate }));
    act(() => {
      result.current.handleEditCreated();
    });
    expect(onUpdate).toHaveBeenCalledOnce();
  });
});
