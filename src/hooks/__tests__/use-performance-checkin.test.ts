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

// ─── SWR mock ─────────────────────────────────────────────────
const swrDataStore: Record<string, unknown> = {};

vi.mock("swr", () => ({
  default: (key: string | null, fetcher: (() => unknown) | null, _opts?: unknown) => {
    if (!key || !fetcher) {
      return { data: undefined, mutate: vi.fn() };
    }
    const mutate = vi.fn((next?: unknown) => {
      if (next !== undefined) swrDataStore[key] = next;
    });
    return {
      data: swrDataStore[key],
      mutate,
    };
  },
}));

// ─── SWR 키 mock ────────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    performanceCheckin: (groupId: string, projectId: string) =>
      `performance-checkin-${groupId}-${projectId}`,
  },
}));

// ─── 훅 import ────────────────────────────────────────────────
import { usePerformanceCheckin } from "@/hooks/use-performance-checkin";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function clearStore() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  Object.keys(swrDataStore).forEach((k) => delete swrDataStore[k]);
  vi.clearAllMocks();
}

function makeHook(groupId = "g1", projectId = "p1") {
  return renderHook(() => usePerformanceCheckin(groupId, projectId));
}

const LS_KEY = (g: string, p: string) => `dancebase:checkin:${g}:${p}`;

function getStored(g = "g1", p = "p1") {
  return JSON.parse(lsStore[LS_KEY(g, p)] ?? "[]");
}

function createEventHelper(
  result: ReturnType<typeof makeHook>["result"],
  eventName = "봄 공연",
  eventDate = "2026-05-01",
  callTime = "18:00"
) {
  let ok: boolean = false;
  act(() => {
    ok = result.current.createEvent(eventName, eventDate, callTime);
  });
  return ok;
}

function addMemberHelper(
  result: ReturnType<typeof makeHook>["result"],
  eventId: string,
  memberName = "홍길동"
) {
  let ok: boolean = false;
  act(() => {
    ok = result.current.addMember(eventId, memberName);
  });
  return ok;
}

// ============================================================
// 초기 상태
// ============================================================

describe("usePerformanceCheckin - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 events는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.events).toEqual([]);
  });

  it("loading은 data가 undefined일 때 true이다", () => {
    const { result } = makeHook();
    // SWR mock에서 data가 undefined이므로 loading = data === undefined = true
    expect(result.current.loading).toBe(true);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createEvent).toBe("function");
    expect(typeof result.current.deleteEvent).toBe("function");
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.updateStatus).toBe("function");
    expect(typeof result.current.toggleReady).toBe("function");
    expect(typeof result.current.getStats).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("STATUS_ORDER가 올바른 순서로 정의되어 있다", () => {
    const { result } = makeHook();
    expect(result.current.STATUS_ORDER).toEqual([
      "pending",
      "arrived",
      "costume_ready",
      "stage_ready",
    ]);
  });

  it("nextStatus 함수가 노출된다", () => {
    const { result } = makeHook();
    expect(typeof result.current.nextStatus).toBe("function");
  });
});

// ============================================================
// nextStatus 순수 함수 로직
// ============================================================

describe("usePerformanceCheckin - nextStatus 로직", () => {
  beforeEach(clearStore);

  it("pending → arrived", () => {
    const { result } = makeHook();
    expect(result.current.nextStatus("pending")).toBe("arrived");
  });

  it("arrived → costume_ready", () => {
    const { result } = makeHook();
    expect(result.current.nextStatus("arrived")).toBe("costume_ready");
  });

  it("costume_ready → stage_ready", () => {
    const { result } = makeHook();
    expect(result.current.nextStatus("costume_ready")).toBe("stage_ready");
  });

  it("stage_ready는 더 이상 진행하지 않는다 (stage_ready 유지)", () => {
    const { result } = makeHook();
    expect(result.current.nextStatus("stage_ready")).toBe("stage_ready");
  });

  it("알 수 없는 상태는 그대로 반환된다", () => {
    const { result } = makeHook();
    // idx === -1 조건 → 현재 상태 반환
    expect(result.current.nextStatus("unknown" as "pending")).toBe("unknown");
  });
});

// ============================================================
// createEvent
// ============================================================

describe("usePerformanceCheckin - createEvent", () => {
  beforeEach(clearStore);

  it("정상 입력이면 true를 반환한다", () => {
    const { result } = makeHook();
    const ok = createEventHelper(result);
    expect(ok).toBe(true);
  });

  it("eventName이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => {
      ok = result.current.createEvent("", "2026-05-01", "18:00");
    });
    expect(ok).toBe(false);
  });

  it("eventName이 공백만이면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => {
      ok = result.current.createEvent("   ", "2026-05-01", "18:00");
    });
    expect(ok).toBe(false);
  });

  it("eventDate가 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => {
      ok = result.current.createEvent("공연", "", "18:00");
    });
    expect(ok).toBe(false);
  });

  it("callTime이 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => {
      ok = result.current.createEvent("공연", "2026-05-01", "");
    });
    expect(ok).toBe(false);
  });

  it("이벤트 생성 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    expect(stored.length).toBe(1);
  });

  it("생성된 이벤트의 eventName이 올바르다 (trim 처리됨)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createEvent("  봄 공연  ", "2026-05-01", "18:00");
    });
    const stored = getStored();
    expect(stored[0]?.eventName).toBe("봄 공연");
  });

  it("생성된 이벤트의 eventDate가 올바르다", () => {
    const { result } = makeHook();
    createEventHelper(result, "공연", "2026-06-15");
    const stored = getStored();
    expect(stored[0]?.eventDate).toBe("2026-06-15");
  });

  it("생성된 이벤트의 callTime이 올바르다", () => {
    const { result } = makeHook();
    createEventHelper(result, "공연", "2026-06-15", "17:30");
    const stored = getStored();
    expect(stored[0]?.callTime).toBe("17:30");
  });

  it("생성된 이벤트의 초기 members는 빈 배열이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    expect(stored[0]?.members).toEqual([]);
  });

  it("생성된 이벤트에 고유 id가 부여된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    expect(stored[0]?.id).toBeTruthy();
    expect(stored[0]?.id).toMatch(/^checkin-/);
  });

  it("생성된 이벤트에 createdAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    expect(stored[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ============================================================
// deleteEvent
// ============================================================

describe("usePerformanceCheckin - deleteEvent", () => {
  beforeEach(clearStore);

  it("이벤트 삭제 후 localStorage에서 제거된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    act(() => {
      result.current.deleteEvent(eventId);
    });
    const updated = getStored();
    expect(updated.length).toBe(0);
  });

  it("특정 이벤트만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    createEventHelper(result, "공연A");
    createEventHelper(result, "공연B");
    const stored = getStored();
    const firstId = stored[0]?.id;
    act(() => {
      result.current.deleteEvent(firstId);
    });
    const updated = getStored();
    expect(updated.length).toBe(1);
    expect(updated[0]?.eventName).toBe("공연B");
  });

  it("존재하지 않는 id 삭제 시 다른 이벤트에 영향이 없다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    act(() => {
      result.current.deleteEvent("non-existent");
    });
    const stored = getStored();
    expect(stored.length).toBe(1);
  });
});

// ============================================================
// addMember
// ============================================================

describe("usePerformanceCheckin - addMember", () => {
  beforeEach(clearStore);

  it("정상 입력이면 true를 반환한다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    const ok = addMemberHelper(result, eventId);
    expect(ok).toBe(true);
  });

  it("memberName이 빈 문자열이면 false를 반환한다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    let ok: boolean = false;
    act(() => {
      ok = result.current.addMember(eventId, "");
    });
    expect(ok).toBe(false);
  });

  it("존재하지 않는 eventId면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => {
      ok = result.current.addMember("non-existent", "홍길동");
    });
    expect(ok).toBe(false);
  });

  it("멤버 추가 후 해당 이벤트의 members 길이가 증가한다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "홍길동");
    addMemberHelper(result, eventId, "김영희");
    const updated = getStored();
    expect(updated[0]?.members.length).toBe(2);
  });

  it("추가된 멤버의 memberName이 trim 처리된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    act(() => {
      result.current.addMember(eventId, "  김철수  ");
    });
    const updated = getStored();
    expect(updated[0]?.members[0]?.memberName).toBe("김철수");
  });

  it("추가된 멤버의 초기 status는 'pending'이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    expect(updated[0]?.members[0]?.status).toBe("pending");
  });

  it("추가된 멤버의 초기 isReady는 false이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    expect(updated[0]?.members[0]?.isReady).toBe(false);
  });

  it("추가된 멤버의 초기 costumeNote는 빈 문자열이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    expect(updated[0]?.members[0]?.costumeNote).toBe("");
  });

  it("동명이인 허용: 같은 이름을 가진 멤버를 추가할 수 있다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "홍길동");
    addMemberHelper(result, eventId, "홍길동");
    const updated = getStored();
    expect(updated[0]?.members.length).toBe(2);
  });
});

// ============================================================
// updateStatus
// ============================================================

describe("usePerformanceCheckin - updateStatus", () => {
  beforeEach(clearStore);

  it("pending → arrived로 상태가 변경된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => {
      result.current.updateStatus(eventId, memberId);
    });
    const final = getStored();
    expect(final[0]?.members[0]?.status).toBe("arrived");
  });

  it("arrived가 될 때 arrivedAt이 기록된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => {
      result.current.updateStatus(eventId, memberId);
    });
    const final = getStored();
    expect(final[0]?.members[0]?.arrivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("costume_ready → stage_ready로 상태가 변경된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    // pending → arrived → costume_ready → stage_ready
    const updated1 = getStored();
    const memberId = updated1[0]?.members[0]?.id;
    act(() => { result.current.updateStatus(eventId, memberId); }); // arrived
    act(() => { result.current.updateStatus(eventId, memberId); }); // costume_ready
    act(() => { result.current.updateStatus(eventId, memberId); }); // stage_ready
    const final = getStored();
    expect(final[0]?.members[0]?.status).toBe("stage_ready");
  });

  it("stage_ready 이후에는 상태가 변경되지 않는다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    // pending → arrived → costume_ready → stage_ready → stage_ready (유지)
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.updateStatus(eventId, memberId); });
    }
    const final = getStored();
    expect(final[0]?.members[0]?.status).toBe("stage_ready");
  });

  it("존재하지 않는 eventId로 updateStatus 시 아무것도 변하지 않는다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    act(() => {
      result.current.updateStatus("non-existent", "member-id");
    });
    const stored = getStored();
    expect(stored.length).toBe(1);
  });

  it("arrived 상태 이후에는 arrivedAt이 변경되지 않는다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => { result.current.updateStatus(eventId, memberId); }); // arrived
    const afterArrived = getStored();
    const arrivedAt = afterArrived[0]?.members[0]?.arrivedAt;
    act(() => { result.current.updateStatus(eventId, memberId); }); // costume_ready
    const afterCostume = getStored();
    expect(afterCostume[0]?.members[0]?.arrivedAt).toBe(arrivedAt);
  });
});

// ============================================================
// toggleReady
// ============================================================

describe("usePerformanceCheckin - toggleReady", () => {
  beforeEach(clearStore);

  it("toggleReady 후 isReady가 true가 된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => {
      result.current.toggleReady(eventId, memberId);
    });
    const final = getStored();
    expect(final[0]?.members[0]?.isReady).toBe(true);
  });

  it("두 번 토글하면 isReady가 false로 돌아온다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => { result.current.toggleReady(eventId, memberId); });
    act(() => { result.current.toggleReady(eventId, memberId); });
    const final = getStored();
    expect(final[0]?.members[0]?.isReady).toBe(false);
  });

  it("존재하지 않는 memberId로 toggleReady 시 아무것도 변하지 않는다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId);
    act(() => {
      result.current.toggleReady(eventId, "non-existent-member");
    });
    const final = getStored();
    expect(final[0]?.members[0]?.isReady).toBe(false);
  });
});

// ============================================================
// getStats
// ============================================================

describe("usePerformanceCheckin - getStats", () => {
  beforeEach(clearStore);

  it("멤버가 없을 때 total은 0이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const event = stored[0];
    const stats = result.current.getStats(event);
    expect(stats.total).toBe(0);
  });

  it("멤버가 없을 때 readyRate는 0이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const event = stored[0];
    const stats = result.current.getStats(event);
    expect(stats.readyRate).toBe(0);
  });

  it("pending 멤버만 있으면 arrivedCount는 0이다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "A");
    addMemberHelper(result, eventId, "B");
    const updated = getStored();
    const stats = result.current.getStats(updated[0]);
    expect(stats.arrivedCount).toBe(0);
    expect(stats.pendingCount).toBe(2);
  });

  it("arrived 멤버는 arrivedCount에 포함된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "A");
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => { result.current.updateStatus(eventId, memberId); }); // arrived
    const final = getStored();
    const stats = result.current.getStats(final[0]);
    expect(stats.arrivedCount).toBe(1);
  });

  it("stage_ready 멤버 비율로 readyRate가 계산된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "A");
    addMemberHelper(result, eventId, "B");
    const updated = getStored();
    const memberA = updated[0]?.members[0]?.id;
    // A를 stage_ready까지 진행
    act(() => { result.current.updateStatus(eventId, memberA); }); // arrived
    act(() => { result.current.updateStatus(eventId, memberA); }); // costume_ready
    act(() => { result.current.updateStatus(eventId, memberA); }); // stage_ready
    const final = getStored();
    const stats = result.current.getStats(final[0]);
    // 2명 중 1명 stage_ready → 50%
    expect(stats.readyRate).toBe(50);
  });

  it("isReady가 true인 멤버 수가 readyCount에 반영된다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "A");
    addMemberHelper(result, eventId, "B");
    const updated = getStored();
    const memberA = updated[0]?.members[0]?.id;
    act(() => { result.current.toggleReady(eventId, memberA); });
    const final = getStored();
    const stats = result.current.getStats(final[0]);
    expect(stats.readyCount).toBe(1);
  });

  it("stageReadyCount는 stage_ready 멤버 수를 반환한다", () => {
    const { result } = makeHook();
    createEventHelper(result);
    const stored = getStored();
    const eventId = stored[0]?.id;
    addMemberHelper(result, eventId, "A");
    const updated = getStored();
    const memberId = updated[0]?.members[0]?.id;
    act(() => { result.current.updateStatus(eventId, memberId); }); // arrived
    act(() => { result.current.updateStatus(eventId, memberId); }); // costume_ready
    act(() => { result.current.updateStatus(eventId, memberId); }); // stage_ready
    const final = getStored();
    const stats = result.current.getStats(final[0]);
    expect(stats.stageReadyCount).toBe(1);
  });
});

// ============================================================
// localStorage 키 형식
// ============================================================

describe("usePerformanceCheckin - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("localStorage 키는 'dancebase:checkin:{groupId}:{projectId}' 형식이다", () => {
    const { result } = renderHook(() => usePerformanceCheckin("myG", "myP"));
    act(() => {
      result.current.createEvent("공연", "2026-05-01", "18:00");
    });
    expect(lsStore["dancebase:checkin:myG:myP"]).toBeDefined();
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("usePerformanceCheckin - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("다른 groupId는 독립적인 localStorage를 사용한다", () => {
    const { result: rA } = renderHook(() => usePerformanceCheckin("gA", "p1"));
    const { result: rB } = renderHook(() => usePerformanceCheckin("gB", "p1"));
    act(() => {
      rA.current.createEvent("공연A", "2026-05-01", "18:00");
    });
    expect(lsStore[LS_KEY("gA", "p1")]).toBeDefined();
    expect(lsStore[LS_KEY("gB", "p1")]).toBeUndefined();
  });

  it("다른 projectId는 독립적인 localStorage를 사용한다", () => {
    const { result: r1 } = renderHook(() => usePerformanceCheckin("g1", "p1"));
    const { result: r2 } = renderHook(() => usePerformanceCheckin("g1", "p2"));
    act(() => {
      r1.current.createEvent("공연1", "2026-05-01", "18:00");
      r2.current.createEvent("공연2", "2026-05-01", "18:00");
    });
    const d1 = getStored("g1", "p1");
    const d2 = getStored("g1", "p2");
    expect(d1.length).toBe(1);
    expect(d2.length).toBe(1);
    expect(d1[0].eventName).toBe("공연1");
    expect(d2[0].eventName).toBe("공연2");
  });
});

// ============================================================
// 경계값
// ============================================================

describe("usePerformanceCheckin - 경계값", () => {
  beforeEach(clearStore);

  it("groupId가 빈 문자열이면 SWR key가 null이어서 로딩 상태이다", () => {
    const { result } = renderHook(() => usePerformanceCheckin("", "p1"));
    expect(result.current.loading).toBe(true);
  });

  it("projectId가 빈 문자열이면 SWR key가 null이어서 로딩 상태이다", () => {
    const { result } = renderHook(() => usePerformanceCheckin("g1", ""));
    expect(result.current.loading).toBe(true);
  });

  it("여러 이벤트를 연속 생성해도 에러가 없다", () => {
    const { result } = makeHook();
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.createEvent(`공연${i}`, "2026-05-01", "18:00");
      });
    }
    const stored = getStored();
    expect(stored.length).toBe(5);
  });
});
