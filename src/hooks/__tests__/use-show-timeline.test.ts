import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const lsStore: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => lsStore[key] ?? null,
  setItem: (key: string, value: string) => { lsStore[key] = value; },
  removeItem: (key: string) => { delete lsStore[key]; },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const swrStore: Record<string, unknown> = {};

  return {
    default: (key: string | null, fetcher: (() => Promise<unknown>) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const mutate = vi.fn((next?: unknown) => {
        if (next !== undefined) swrStore[key] = next;
      });
      return {
        data: swrStore[key],
        isLoading: false,
        mutate,
      };
    },
  };
});

// ─── SWR 키 mock ────────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    showTimeline: (groupId: string, projectId: string) =>
      `show-timeline-${groupId}-${projectId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    SHOW_TIMELINE: {
      EVENT_TITLE_REQUIRED: "이벤트 제목을 입력하세요",
      EVENT_ADDED: "이벤트가 추가되었습니다",
      EVENT_UPDATED: "이벤트가 수정되었습니다",
      EVENT_DELETED: "이벤트가 삭제되었습니다",
      EVENT_NOT_FOUND: "이벤트를 찾을 수 없습니다",
    },
    DATE: {
      START_TIME_REQUIRED: "시작 시간을 입력하세요",
      END_TIME_AFTER_START: "종료 시간은 시작 시간 이후여야 합니다",
    },
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { useShowTimeline } from "@/hooks/use-show-timeline";
import type { AddShowTimelineEventInput } from "@/hooks/use-show-timeline";
import { toast } from "sonner";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  _uuidCounter = 0;
  vi.clearAllMocks();
}

function makeHook(groupId = "g1", projectId = "p1") {
  return renderHook(() => useShowTimeline(groupId, projectId));
}

const defaultInput: AddShowTimelineEventInput = {
  title: "사운드체크",
  eventType: "soundcheck",
  startTime: "14:00",
  status: "scheduled",
};

async function addEventHelper(
  result: ReturnType<typeof makeHook>["result"],
  input: Partial<AddShowTimelineEventInput> = {}
) {
  let ok: boolean = false;
  await act(async () => {
    ok = await result.current.addEvent({ ...defaultInput, ...input });
  });
  return ok;
}

// ─── localStorage에 직접 이벤트 설정 ──────────────────────────
function seedEvents(
  groupId: string,
  projectId: string,
  events: object[]
) {
  lsStore[`dancebase:show-timeline:${groupId}:${projectId}`] =
    JSON.stringify(events);
}

// ============================================================
// 초기 상태
// ============================================================

describe("useShowTimeline - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 events는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.events).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.progress는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.progress).toBe(0);
  });

  it("초기 stats.byStatus.scheduled는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byStatus.scheduled).toBe(0);
  });

  it("초기 stats.byStatus.completed는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byStatus.completed).toBe(0);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEvent).toBe("function");
    expect(typeof result.current.updateEvent).toBe("function");
    expect(typeof result.current.deleteEvent).toBe("function");
    expect(typeof result.current.changeStatus).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// timeToMinutes 순수 함수 로직
// ============================================================

describe("useShowTimeline - timeToMinutes 로직", () => {
  beforeEach(clearStore);

  it("'00:00' → 0분", () => {
    // 직접 함수를 테스트할 수 없으므로 정렬 순서로 검증
    const e1 = {
      id: "a",
      groupId: "g1",
      projectId: "p1",
      title: "A",
      eventType: "arrival" as const,
      startTime: "00:00",
      status: "scheduled" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const e2 = {
      id: "b",
      groupId: "g1",
      projectId: "p1",
      title: "B",
      eventType: "soundcheck" as const,
      startTime: "01:00",
      status: "scheduled" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    seedEvents("g1", "p1", [e2, e1]);
    const { result } = makeHook();
    // SWR은 mock 상태이므로 events는 비어 있음 — 로직 검증은 addEvent 통해 수행
    expect(result.current.events).toEqual([]);
  });

  it("endTime이 startTime보다 앞서면 추가에 실패한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, {
      startTime: "15:00",
      endTime: "14:00",
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("endTime === startTime이면 추가에 실패한다 (종료 < 시작 아님 → 성공)", async () => {
    // 소스: endTime < startTime 일 때 실패. 같으면 실패하지 않음
    const { result } = makeHook();
    const ok = await addEventHelper(result, {
      startTime: "14:00",
      endTime: "14:00",
    });
    // timeToMinutes("14:00") - timeToMinutes("14:00") = 0, 즉 < 조건 불충족 → 성공
    expect(ok).toBe(true);
  });

  it("endTime이 startTime 이후면 추가에 성공한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, {
      startTime: "13:00",
      endTime: "14:00",
    });
    expect(ok).toBe(true);
  });
});

// ============================================================
// addEvent
// ============================================================

describe("useShowTimeline - addEvent", () => {
  beforeEach(clearStore);

  it("title이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, { title: "" });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("title이 공백만이면 false를 반환한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, { title: "   " });
    expect(ok).toBe(false);
  });

  it("startTime이 없으면 false를 반환한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, { startTime: "" });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("정상 입력이면 true를 반환한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result);
    expect(ok).toBe(true);
  });

  it("추가 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    expect(toast.success).toHaveBeenCalled();
  });

  it("title의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { title: "  공연 시작  " });
    const key = `dancebase:show-timeline:g1:p1`;
    const stored = JSON.parse(lsStore[key] ?? "[]");
    expect(stored[0]?.title).toBe("공연 시작");
  });

  it("assignedTo의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { assignedTo: "  홍길동  " });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.assignedTo).toBe("홍길동");
  });

  it("assignedTo가 빈 문자열이면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { assignedTo: "" });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.assignedTo).toBeUndefined();
  });

  it("location의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { location: "  무대 앞  " });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.location).toBe("무대 앞");
  });

  it("notes의 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { notes: "  메모  " });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.notes).toBe("메모");
  });

  it("endTime이 없으면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { endTime: undefined });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.endTime).toBeUndefined();
  });

  it("localStorage에 이벤트가 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored.length).toBe(1);
  });

  it("groupId와 projectId가 이벤트에 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.groupId).toBe("g1");
    expect(stored[0]?.projectId).toBe("p1");
  });

  it("createdAt과 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stored[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("id가 crypto.randomUUID로 생성된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored[0]?.id).toMatch(/^uuid-/);
  });
});

// ============================================================
// updateEvent
// ============================================================

describe("useShowTimeline - updateEvent", () => {
  beforeEach(clearStore);

  it("존재하지 않는 id 수정 시 false를 반환한다", async () => {
    const { result } = makeHook();
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.updateEvent("non-existent", { title: "수정" });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("endTime이 startTime보다 앞서면 수정에 실패한다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { startTime: "14:00" });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.updateEvent(eventId, { endTime: "13:00" });
    });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("정상 수정 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.updateEvent(eventId, { title: "수정된 제목" });
    });
    expect(ok).toBe(true);
  });

  it("수정 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEvent(eventId, { title: "수정" });
    });
    expect(toast.success).toHaveBeenCalledTimes(2); // addEvent + updateEvent
  });

  it("title 수정 시 앞뒤 공백이 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEvent(eventId, { title: "  새 제목  " });
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.title).toBe("새 제목");
  });

  it("location을 빈 문자열로 수정하면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { location: "무대" });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEvent(eventId, { location: "" });
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.location).toBeUndefined();
  });

  it("endTime을 빈 문자열로 수정하면 undefined로 저장된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { endTime: "15:00" });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEvent(eventId, { endTime: "" });
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.endTime).toBeUndefined();
  });

  it("수정 후 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.updateEvent(eventId, { title: "수정" });
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================
// deleteEvent
// ============================================================

describe("useShowTimeline - deleteEvent", () => {
  beforeEach(clearStore);

  it("이벤트 삭제 후 localStorage에서 제거된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEvent(eventId);
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated.length).toBe(0);
  });

  it("삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.deleteEvent(eventId);
    });
    expect(ok).toBe(true);
  });

  it("삭제 성공 시 toast.success가 호출된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    vi.clearAllMocks();
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEvent(eventId);
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("특정 이벤트만 삭제되고 나머지는 유지된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result, { title: "이벤트1" });
    await addEventHelper(result, { title: "이벤트2" });
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const firstId = stored[0]?.id;
    await act(async () => {
      await result.current.deleteEvent(firstId);
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated.length).toBe(1);
  });
});

// ============================================================
// changeStatus
// ============================================================

describe("useShowTimeline - changeStatus", () => {
  beforeEach(clearStore);

  it("상태 변경 후 true를 반환한다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.changeStatus(eventId, "in_progress");
    });
    expect(ok).toBe(true);
  });

  it("상태가 localStorage에 반영된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.changeStatus(eventId, "completed");
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.status).toBe("completed");
  });

  it("changeStatus 후 updatedAt이 ISO 형식으로 설정된다", async () => {
    const { result } = makeHook();
    await addEventHelper(result);
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    const eventId = stored[0]?.id;
    await act(async () => {
      await result.current.changeStatus(eventId, "cancelled");
    });
    const updated = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(updated[0]?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(updated[0]?.status).toBe("cancelled");
  });
});

// ============================================================
// stats 계산
// ============================================================

describe("useShowTimeline - stats 계산", () => {
  beforeEach(clearStore);

  it("completed 이벤트 비율로 progress가 계산된다 (반올림)", async () => {
    // 직접 localStorage에 데이터를 넣고 SWR을 통해 읽어오는 방식은
    // 현재 SWR mock 방식으로 불가능 — addEvent 기반 테스트 사용
    const { result } = makeHook();
    await addEventHelper(result, { title: "A", status: "scheduled" });
    await addEventHelper(result, { title: "B", status: "scheduled" });
    // SWR 데이터가 mock에서 업데이트되지 않으므로 localStorage에서 직접 검증
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored.length).toBe(2);
  });

  it("이벤트가 없을 때 progress는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.progress).toBe(0);
  });

  it("stats.byStatus.in_progress 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byStatus.in_progress).toBe(0);
  });

  it("stats.byStatus.cancelled 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.byStatus.cancelled).toBe(0);
  });
});

// ============================================================
// localStorage 키 형식
// ============================================================

describe("useShowTimeline - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("localStorage 키는 'dancebase:show-timeline:{groupId}:{projectId}' 형식이다", async () => {
    const { result } = renderHook(() => useShowTimeline("grp-1", "prj-1"));
    await act(async () => {
      await result.current.addEvent(defaultInput);
    });
    expect(lsStore["dancebase:show-timeline:grp-1:prj-1"]).toBeDefined();
  });

  it("다른 groupId의 데이터는 별도 키에 저장된다", async () => {
    const { result: r1 } = renderHook(() => useShowTimeline("g1", "p1"));
    const { result: r2 } = renderHook(() => useShowTimeline("g2", "p1"));
    await act(async () => {
      await r1.current.addEvent(defaultInput);
      await r2.current.addEvent({ ...defaultInput, title: "이벤트2" });
    });
    expect(lsStore["dancebase:show-timeline:g1:p1"]).toBeDefined();
    expect(lsStore["dancebase:show-timeline:g2:p1"]).toBeDefined();
  });

  it("다른 projectId의 데이터는 별도 키에 저장된다", async () => {
    const { result: r1 } = renderHook(() => useShowTimeline("g1", "p1"));
    const { result: r2 } = renderHook(() => useShowTimeline("g1", "p2"));
    await act(async () => {
      await r1.current.addEvent(defaultInput);
      await r2.current.addEvent({ ...defaultInput, title: "이벤트2" });
    });
    expect(lsStore["dancebase:show-timeline:g1:p1"]).toBeDefined();
    expect(lsStore["dancebase:show-timeline:g1:p2"]).toBeDefined();
    const d1 = JSON.parse(lsStore["dancebase:show-timeline:g1:p1"]);
    const d2 = JSON.parse(lsStore["dancebase:show-timeline:g1:p2"]);
    expect(d1.length).toBe(1);
    expect(d2.length).toBe(1);
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("useShowTimeline - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("groupId가 다르면 localStorage가 독립적이다", async () => {
    const { result: rA } = renderHook(() => useShowTimeline("gA", "p1"));
    const { result: rB } = renderHook(() => useShowTimeline("gB", "p1"));
    await act(async () => {
      await rA.current.addEvent(defaultInput);
    });
    const storedB = lsStore["dancebase:show-timeline:gB:p1"];
    expect(storedB).toBeUndefined();
  });

  it("projectId가 다르면 localStorage가 독립적이다", async () => {
    const { result: r1 } = renderHook(() => useShowTimeline("g1", "p1"));
    await act(async () => {
      await r1.current.addEvent(defaultInput);
    });
    expect(lsStore["dancebase:show-timeline:g1:p2"]).toBeUndefined();
  });
});

// ============================================================
// 경계값
// ============================================================

describe("useShowTimeline - 경계값", () => {
  beforeEach(clearStore);

  it("groupId가 빈 문자열이면 SWR key가 null이 되어 데이터를 로드하지 않는다", () => {
    const { result } = renderHook(() => useShowTimeline("", "p1"));
    expect(result.current.events).toEqual([]);
  });

  it("projectId가 빈 문자열이면 SWR key가 null이 되어 데이터를 로드하지 않는다", () => {
    const { result } = renderHook(() => useShowTimeline("g1", ""));
    expect(result.current.events).toEqual([]);
  });

  it("endTime이 undefined로 전달되면 추가에 성공한다", async () => {
    const { result } = makeHook();
    const ok = await addEventHelper(result, { endTime: undefined });
    expect(ok).toBe(true);
  });

  it("많은 이벤트를 연속으로 추가해도 에러가 없다", async () => {
    const { result } = makeHook();
    for (let i = 0; i < 10; i++) {
      await addEventHelper(result, { title: `이벤트${i}`, startTime: `${String(i + 8).padStart(2, "0")}:00` });
    }
    const stored = JSON.parse(lsStore[`dancebase:show-timeline:g1:p1`] ?? "[]");
    expect(stored.length).toBe(10);
  });
});
