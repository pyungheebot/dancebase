import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSeatReservation } from "@/hooks/use-seat-reservation";
import type { SeatReservationLayout } from "@/types";

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
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── SWR mock (useState 기반 - mutate 시 React 상태도 갱신) ─
vi.mock("swr", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      // 초기값은 빈 배열 (fetcher가 async이므로 Promise를 피함)
      const [data, setData] = React.useState<unknown>([]);

      const mutate = async (newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          setData(newData);
        } else if (fetcher) {
          const result = fetcher();
          if (result instanceof Promise) {
            result.then(setData);
          } else {
            setData(result);
          }
        }
      };

      if (!key || !fetcher) return { data: [], isLoading: false, mutate };
      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ───────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    seatReservation: (groupId: string, projectId: string) =>
      `seat-reservation-${groupId}-${projectId}`,
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1", projectId = "project-1") {
  return renderHook(() => useSeatReservation(groupId, projectId));
}

// ============================================================
// 초기 상태
// ============================================================

describe("useSeatReservation - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("초기 layouts는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.layouts).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createLayout).toBe("function");
    expect(typeof result.current.deleteLayout).toBe("function");
    expect(typeof result.current.reserveSeat).toBe("function");
    expect(typeof result.current.cancelReservation).toBe("function");
    expect(typeof result.current.blockSeat).toBe("function");
    expect(typeof result.current.unblockSeat).toBe("function");
    expect(typeof result.current.getStats).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// createLayout
// ============================================================

describe("useSeatReservation - createLayout", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("배치 생성 후 layouts 길이가 1이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 3, 5);
    });
    expect(result.current.layouts).toHaveLength(1);
  });

  it("생성된 배치의 layoutName이 올바르다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("VIP 구역", 2, 4);
    });
    expect(result.current.layouts[0].layoutName).toBe("VIP 구역");
  });

  it("생성된 배치의 rows가 올바르다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 4, 6);
    });
    expect(result.current.layouts[0].rows).toBe(4);
  });

  it("생성된 배치의 seatsPerRow가 올바르다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 4, 6);
    });
    expect(result.current.layouts[0].seatsPerRow).toBe(6);
  });

  it("생성된 배치의 seats 수가 rows * seatsPerRow이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 3, 5);
    });
    expect(result.current.layouts[0].seats).toHaveLength(15);
  });

  it("생성된 좌석의 초기 status는 available이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 2, 3);
    });
    result.current.layouts[0].seats.forEach((seat) => {
      expect(seat.status).toBe("available");
    });
  });

  it("좌석 레이블이 올바르게 생성된다 (A1, A2, B1 등)", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 2, 3);
    });
    const labels = result.current.layouts[0].seats.map((s) => s.seatLabel);
    expect(labels).toContain("A1");
    expect(labels).toContain("A2");
    expect(labels).toContain("A3");
    expect(labels).toContain("B1");
  });

  it("배치 생성 후 localStorage에 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("메인 홀", 2, 3);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("여러 배치를 생성할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀A", 2, 3);
    });
    await act(async () => {
      await result.current.createLayout("홀B", 4, 5);
    });
    expect(result.current.layouts).toHaveLength(2);
  });

  it("생성된 배치의 projectId가 올바르다", async () => {
    const { result } = makeHook("group-1", "proj-X");
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    expect(result.current.layouts[0].projectId).toBe("proj-X");
  });

  it("배치에 id가 부여된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    expect(result.current.layouts[0].id).toBeDefined();
    expect(result.current.layouts[0].id).not.toBe("");
  });

  it("배치에 createdAt이 설정된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    expect(result.current.layouts[0].createdAt).toBeDefined();
  });
});

// ============================================================
// deleteLayout
// ============================================================

describe("useSeatReservation - deleteLayout", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("배치 삭제 후 layouts 길이가 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀A", 2, 3);
    });
    const layoutId = result.current.layouts[0].id;
    await act(async () => {
      await result.current.deleteLayout(layoutId);
    });
    expect(result.current.layouts).toHaveLength(0);
  });

  it("특정 배치만 삭제된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀A", 2, 3);
    });
    await act(async () => {
      await result.current.createLayout("홀B", 2, 3);
    });
    const layoutAId = result.current.layouts[0].id;
    const layoutBId = result.current.layouts[1].id;
    await act(async () => {
      await result.current.deleteLayout(layoutAId);
    });
    expect(result.current.layouts).toHaveLength(1);
    expect(result.current.layouts[0].id).toBe(layoutBId);
  });

  it("배치 삭제 후 localStorage에 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀A", 2, 3);
    });
    const layoutId = result.current.layouts[0].id;
    localStorageMock.setItem.mockClear();
    await act(async () => {
      await result.current.deleteLayout(layoutId);
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// reserveSeat
// ============================================================

describe("useSeatReservation - reserveSeat", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("좌석 예약 후 status가 reserved가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.status).toBe("reserved");
  });

  it("좌석 예약 후 reservedBy가 설정된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.reservedBy).toBe("홍길동");
  });

  it("좌석 예약 후 reservedFor가 설정된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.reservedFor).toBe("고객A");
  });

  it("좌석 예약 후 reservedAt이 설정된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.reservedAt).toBeDefined();
  });

  it("phone과 notes를 포함하여 예약할 수 있다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A", "010-1234-5678", "메모");
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.phone).toBe("010-1234-5678");
    expect(updatedSeat?.notes).toBe("메모");
  });

  it("다른 좌석들은 영향받지 않는다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    const otherSeatId = layout.seats[1].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const otherSeat = result.current.layouts[0].seats.find((s) => s.id === otherSeatId);
    expect(otherSeat?.status).toBe("available");
  });
});

// ============================================================
// cancelReservation
// ============================================================

describe("useSeatReservation - cancelReservation", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("예약 취소 후 status가 available로 변경된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    await act(async () => {
      await result.current.cancelReservation(layout.id, seatId);
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.status).toBe("available");
  });

  it("예약 취소 후 reservedBy가 undefined가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    await act(async () => {
      await result.current.cancelReservation(layout.id, seatId);
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.reservedBy).toBeUndefined();
  });

  it("예약 취소 후 reservedFor가 undefined가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    await act(async () => {
      await result.current.cancelReservation(layout.id, seatId);
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.reservedFor).toBeUndefined();
  });
});

// ============================================================
// blockSeat / unblockSeat
// ============================================================

describe("useSeatReservation - blockSeat / unblockSeat", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("좌석 차단 후 status가 blocked가 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.blockSeat(layout.id, seatId);
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.status).toBe("blocked");
  });

  it("차단 해제 후 status가 available로 변경된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.blockSeat(layout.id, seatId);
    });
    await act(async () => {
      await result.current.unblockSeat(layout.id, seatId);
    });
    const updatedSeat = result.current.layouts[0].seats.find((s) => s.id === seatId);
    expect(updatedSeat?.status).toBe("available");
  });

  it("차단 후 다른 좌석은 영향받지 않는다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    const otherSeatId = layout.seats[1].id;
    await act(async () => {
      await result.current.blockSeat(layout.id, seatId);
    });
    const otherSeat = result.current.layouts[0].seats.find((s) => s.id === otherSeatId);
    expect(otherSeat?.status).toBe("available");
  });
});

// ============================================================
// getStats
// ============================================================

describe("useSeatReservation - getStats", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("전체 좌석 수가 totalSeats로 반환된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 3, 4);
    });
    const layout = result.current.layouts[0];
    const stats = result.current.getStats(layout);
    expect(stats.totalSeats).toBe(12);
  });

  it("예약 없을 때 availableSeats는 totalSeats와 같다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const stats = result.current.getStats(layout);
    expect(stats.availableSeats).toBe(6);
    expect(stats.reservedSeats).toBe(0);
  });

  it("예약 후 reservedSeats 수가 반영된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seatId, "홍길동", "고객A");
    });
    const updatedLayout = result.current.layouts[0];
    const stats = result.current.getStats(updatedLayout);
    expect(stats.reservedSeats).toBe(1);
  });

  it("차단된 좌석은 blockedSeats에 반영된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const seatId = layout.seats[0].id;
    await act(async () => {
      await result.current.blockSeat(layout.id, seatId);
    });
    const updatedLayout = result.current.layouts[0];
    const stats = result.current.getStats(updatedLayout);
    expect(stats.blockedSeats).toBe(1);
  });

  it("occupancyRate가 0에서 100 사이 값이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const stats = result.current.getStats(layout);
    expect(stats.occupancyRate).toBeGreaterThanOrEqual(0);
    expect(stats.occupancyRate).toBeLessThanOrEqual(100);
  });

  it("좌석이 없는 배치에서 occupancyRate는 0이다", () => {
    const { result } = makeHook();
    const emptyLayout: SeatReservationLayout = {
      id: "test-layout",
      projectId: "proj-1",
      layoutName: "빈 홀",
      rows: 0,
      seatsPerRow: 0,
      seats: [],
      createdAt: new Date().toISOString(),
    };
    const stats = result.current.getStats(emptyLayout);
    expect(stats.occupancyRate).toBe(0);
  });

  it("getStats는 totalSeats, reservedSeats, availableSeats, blockedSeats, occupancyRate 필드를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 2, 3);
    });
    const layout = result.current.layouts[0];
    const stats = result.current.getStats(layout);
    expect(Object.prototype.hasOwnProperty.call(stats, "totalSeats")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(stats, "reservedSeats")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(stats, "availableSeats")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(stats, "blockedSeats")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(stats, "occupancyRate")).toBe(true);
  });

  it("모든 좌석이 예약된 경우 occupancyRate는 100이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.createLayout("홀", 1, 2);
    });
    const layout = result.current.layouts[0];
    const seat1Id = layout.seats[0].id;
    const seat2Id = layout.seats[1].id;
    await act(async () => {
      await result.current.reserveSeat(layout.id, seat1Id, "홍길동", "고객A");
    });
    await act(async () => {
      await result.current.reserveSeat(layout.id, seat2Id, "홍길동", "고객B");
    });
    const updatedLayout = result.current.layouts[0];
    const stats = result.current.getStats(updatedLayout);
    expect(stats.occupancyRate).toBe(100);
  });
});

// ============================================================
// refetch
// ============================================================

describe("useSeatReservation - refetch", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    uuidCounter = 0;
  });

  it("refetch를 호출해도 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => act(() => { result.current.refetch(); })).not.toThrow();
  });
});
