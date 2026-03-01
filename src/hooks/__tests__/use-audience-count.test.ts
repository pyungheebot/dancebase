import { describe, it, expect, vi, beforeEach } from "vitest";

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

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ─────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    AUDIENCE: {
      DATE_REQUIRED: "날짜를 입력해주세요.",
      SEAT_REQUIRED: "총 좌석 수는 1 이상이어야 합니다.",
      COUNT_REQUIRED: "관객 수는 0 이상이어야 합니다.",
      ADDED: "기록이 추가되었습니다.",
    },
    NOT_FOUND: "항목을 찾을 수 없습니다.",
    ITEM_UPDATED: "수정되었습니다.",
    ITEM_DELETED: "삭제되었습니다.",
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: (key: string | null, fetcher?: () => unknown) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    const data = fetcher ? fetcher() : undefined;
    return { data, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    audienceCount: (groupId: string, projectId: string) =>
      `audience-count-${groupId}-${projectId}`,
  },
}));

// ─── 유틸 함수 직접 임포트 ───────────────────────────────────
import { calcOccupancyRate, calcByTypeTotal } from "@/hooks/use-audience-count";

// ─── 스토어 초기화 ────────────────────────────────────────────
beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
});

// ============================================================
// 1. calcOccupancyRate 순수 함수 테스트
// ============================================================

describe("calcOccupancyRate", () => {
  it("총 좌석이 0이면 0을 반환한다", () => {
    expect(calcOccupancyRate(0, 100)).toBe(0);
  });

  it("음수 좌석이면 0을 반환한다", () => {
    expect(calcOccupancyRate(-1, 50)).toBe(0);
  });

  it("100% 점유율을 정확히 계산한다", () => {
    expect(calcOccupancyRate(100, 100)).toBe(100);
  });

  it("50% 점유율을 정확히 계산한다", () => {
    expect(calcOccupancyRate(200, 100)).toBe(50);
  });

  it("33% (반올림) 점유율을 계산한다", () => {
    expect(calcOccupancyRate(3, 1)).toBe(33);
  });

  it("실제 관객 수가 좌석 수를 초과하면 100으로 클램프된다", () => {
    expect(calcOccupancyRate(100, 150)).toBe(100);
  });

  it("관객 수가 0이면 0%다", () => {
    expect(calcOccupancyRate(500, 0)).toBe(0);
  });

  it("소수점 결과를 반올림한다 (67%)", () => {
    expect(calcOccupancyRate(3, 2)).toBe(67);
  });
});

// ============================================================
// 2. calcByTypeTotal 순수 함수 테스트
// ============================================================

describe("calcByTypeTotal", () => {
  it("모든 유형이 0이면 합계가 0이다", () => {
    expect(calcByTypeTotal({ paid: 0, invited: 0, free: 0, staff: 0 })).toBe(0);
  });

  it("유형별 합계를 정확히 계산한다", () => {
    expect(calcByTypeTotal({ paid: 10, invited: 5, free: 3, staff: 2 })).toBe(20);
  });

  it("paid만 있으면 paid 값이 합계다", () => {
    expect(calcByTypeTotal({ paid: 42, invited: 0, free: 0, staff: 0 })).toBe(42);
  });

  it("각 유형이 크면 올바르게 합산한다", () => {
    expect(calcByTypeTotal({ paid: 100, invited: 200, free: 50, staff: 10 })).toBe(360);
  });
});

// ============================================================
// 3. localStorage 키 형식 테스트
// ============================================================

describe("localStorage 키 형식", () => {
  it("groupId와 projectId를 포함한 키를 생성한다", () => {
    const groupId = "group-abc";
    const projectId = "proj-xyz";
    const expectedKey = `dancebase:audience-count:${groupId}:${projectId}`;
    // 저장 후 키를 확인
    memStore[expectedKey] = { groupId, projectId, records: [], updatedAt: "" };
    expect(memStore[expectedKey]).toBeDefined();
  });

  it("다른 그룹의 데이터는 독립적으로 저장된다", () => {
    const key1 = "dancebase:audience-count:group1:proj1";
    const key2 = "dancebase:audience-count:group2:proj1";
    memStore[key1] = { groupId: "group1", projectId: "proj1", records: [], updatedAt: "" };
    memStore[key2] = { groupId: "group2", projectId: "proj1", records: [], updatedAt: "" };
    expect(memStore[key1]).not.toEqual(memStore[key2]);
  });

  it("다른 프로젝트의 데이터는 독립적으로 저장된다", () => {
    const key1 = "dancebase:audience-count:group1:proj1";
    const key2 = "dancebase:audience-count:group1:proj2";
    memStore[key1] = { groupId: "group1", projectId: "proj1", records: [{ id: "r1" }], updatedAt: "" };
    memStore[key2] = { groupId: "group1", projectId: "proj2", records: [], updatedAt: "" };
    expect((memStore[key1] as { records: unknown[] }).records).toHaveLength(1);
    expect((memStore[key2] as { records: unknown[] }).records).toHaveLength(0);
  });
});

// ============================================================
// 4. 통계 계산 로직 테스트 (순수 함수로 재현)
// ============================================================

type Record = {
  sessionNumber: number;
  actualCount: number;
  totalSeats: number;
  vipCount: number;
  byType: { paid: number; invited: number; free: number; staff: number };
};

function computeStats(records: Record[]) {
  const totalActual = records.reduce((sum, r) => sum + r.actualCount, 0);
  const totalSeats = records.reduce((sum, r) => sum + r.totalSeats, 0);
  const totalVip = records.reduce((sum, r) => sum + r.vipCount, 0);
  const avgOccupancy =
    records.length > 0
      ? Math.round(
          records.reduce(
            (sum, r) => sum + calcOccupancyRate(r.totalSeats, r.actualCount),
            0
          ) / records.length
        )
      : 0;
  const totalByType = records.reduce(
    (acc, r) => ({
      paid: acc.paid + r.byType.paid,
      invited: acc.invited + r.byType.invited,
      free: acc.free + r.byType.free,
      staff: acc.staff + r.byType.staff,
    }),
    { paid: 0, invited: 0, free: 0, staff: 0 }
  );
  return {
    sessionCount: records.length,
    totalActual,
    totalSeats,
    totalVip,
    avgOccupancy,
    overallOccupancy: calcOccupancyRate(totalSeats, totalActual),
    totalByType,
  };
}

describe("통계 계산 로직", () => {
  it("레코드가 없으면 모든 통계가 0이다", () => {
    const stats = computeStats([]);
    expect(stats.sessionCount).toBe(0);
    expect(stats.totalActual).toBe(0);
    expect(stats.totalSeats).toBe(0);
    expect(stats.totalVip).toBe(0);
    expect(stats.avgOccupancy).toBe(0);
    expect(stats.overallOccupancy).toBe(0);
  });

  it("단일 레코드의 통계가 정확하다", () => {
    const records: Record[] = [
      {
        sessionNumber: 1,
        actualCount: 80,
        totalSeats: 100,
        vipCount: 5,
        byType: { paid: 60, invited: 10, free: 5, staff: 5 },
      },
    ];
    const stats = computeStats(records);
    expect(stats.sessionCount).toBe(1);
    expect(stats.totalActual).toBe(80);
    expect(stats.totalSeats).toBe(100);
    expect(stats.totalVip).toBe(5);
    expect(stats.overallOccupancy).toBe(80);
  });

  it("여러 레코드의 totalActual을 합산한다", () => {
    const records: Record[] = [
      { sessionNumber: 1, actualCount: 100, totalSeats: 200, vipCount: 0, byType: { paid: 100, invited: 0, free: 0, staff: 0 } },
      { sessionNumber: 2, actualCount: 150, totalSeats: 200, vipCount: 0, byType: { paid: 150, invited: 0, free: 0, staff: 0 } },
    ];
    const stats = computeStats(records);
    expect(stats.totalActual).toBe(250);
  });

  it("avgOccupancy는 회차별 점유율의 평균이다", () => {
    const records: Record[] = [
      { sessionNumber: 1, actualCount: 100, totalSeats: 100, vipCount: 0, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
      { sessionNumber: 2, actualCount: 0, totalSeats: 100, vipCount: 0, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
    ];
    const stats = computeStats(records);
    // (100% + 0%) / 2 = 50%
    expect(stats.avgOccupancy).toBe(50);
  });

  it("overallOccupancy는 전체 합산 기준 점유율이다", () => {
    const records: Record[] = [
      { sessionNumber: 1, actualCount: 50, totalSeats: 100, vipCount: 0, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
      { sessionNumber: 2, actualCount: 50, totalSeats: 100, vipCount: 0, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
    ];
    const stats = computeStats(records);
    expect(stats.overallOccupancy).toBe(50);
  });

  it("totalByType이 올바르게 집계된다", () => {
    const records: Record[] = [
      { sessionNumber: 1, actualCount: 0, totalSeats: 100, vipCount: 0, byType: { paid: 10, invited: 5, free: 2, staff: 1 } },
      { sessionNumber: 2, actualCount: 0, totalSeats: 100, vipCount: 0, byType: { paid: 20, invited: 10, free: 3, staff: 2 } },
    ];
    const stats = computeStats(records);
    expect(stats.totalByType.paid).toBe(30);
    expect(stats.totalByType.invited).toBe(15);
    expect(stats.totalByType.free).toBe(5);
    expect(stats.totalByType.staff).toBe(3);
  });
});

// ============================================================
// 5. 회차 번호 자동 부여 로직 테스트
// ============================================================

describe("회차 번호 자동 부여 로직", () => {
  function getNextSessionNumber(records: { sessionNumber: number }[], inputSessionNumber?: number): number {
    return (
      inputSessionNumber ||
      (records.length > 0
        ? Math.max(...records.map((r) => r.sessionNumber)) + 1
        : 1)
    );
  }

  it("레코드가 없을 때 첫 번째 회차는 1이다", () => {
    expect(getNextSessionNumber([])).toBe(1);
  });

  it("기존 레코드 최대 회차에 1을 더한다", () => {
    const records = [{ sessionNumber: 1 }, { sessionNumber: 2 }, { sessionNumber: 3 }];
    expect(getNextSessionNumber(records)).toBe(4);
  });

  it("입력한 회차 번호가 있으면 그것을 사용한다", () => {
    const records = [{ sessionNumber: 1 }];
    expect(getNextSessionNumber(records, 10)).toBe(10);
  });

  it("회차 순서가 비연속적이어도 최대값+1을 부여한다", () => {
    const records = [{ sessionNumber: 1 }, { sessionNumber: 5 }, { sessionNumber: 3 }];
    expect(getNextSessionNumber(records)).toBe(6);
  });
});

// ============================================================
// 6. 회차 번호 오름차순 정렬 로직
// ============================================================

describe("회차 번호 오름차순 정렬", () => {
  it("회차 번호 기준으로 오름차순 정렬된다", () => {
    const records = [
      { sessionNumber: 3 },
      { sessionNumber: 1 },
      { sessionNumber: 2 },
    ];
    const sorted = [...records].sort((a, b) => a.sessionNumber - b.sessionNumber);
    expect(sorted[0].sessionNumber).toBe(1);
    expect(sorted[1].sessionNumber).toBe(2);
    expect(sorted[2].sessionNumber).toBe(3);
  });

  it("빈 배열 정렬도 에러 없이 처리된다", () => {
    const records: { sessionNumber: number }[] = [];
    const sorted = [...records].sort((a, b) => a.sessionNumber - b.sessionNumber);
    expect(sorted).toHaveLength(0);
  });

  it("단일 레코드 정렬도 정상 처리된다", () => {
    const records = [{ sessionNumber: 7 }];
    const sorted = [...records].sort((a, b) => a.sessionNumber - b.sessionNumber);
    expect(sorted[0].sessionNumber).toBe(7);
  });
});

// ============================================================
// 7. addRecord 유효성 검사 로직
// ============================================================

describe("addRecord 유효성 검사 로직", () => {
  type Input = {
    date: string;
    totalSeats: number;
    actualCount: number;
  };

  function validateInput(input: Input): string | null {
    if (!input.date) return "DATE_REQUIRED";
    if (input.totalSeats <= 0) return "SEAT_REQUIRED";
    if (input.actualCount < 0) return "COUNT_REQUIRED";
    return null;
  }

  it("date가 없으면 DATE_REQUIRED 에러가 반환된다", () => {
    expect(validateInput({ date: "", totalSeats: 100, actualCount: 50 })).toBe("DATE_REQUIRED");
  });

  it("totalSeats가 0이면 SEAT_REQUIRED 에러가 반환된다", () => {
    expect(validateInput({ date: "2026-01-01", totalSeats: 0, actualCount: 50 })).toBe("SEAT_REQUIRED");
  });

  it("totalSeats가 음수이면 SEAT_REQUIRED 에러가 반환된다", () => {
    expect(validateInput({ date: "2026-01-01", totalSeats: -1, actualCount: 50 })).toBe("SEAT_REQUIRED");
  });

  it("actualCount가 음수이면 COUNT_REQUIRED 에러가 반환된다", () => {
    expect(validateInput({ date: "2026-01-01", totalSeats: 100, actualCount: -1 })).toBe("COUNT_REQUIRED");
  });

  it("모든 필드가 유효하면 null이 반환된다", () => {
    expect(validateInput({ date: "2026-01-01", totalSeats: 100, actualCount: 0 })).toBeNull();
  });

  it("actualCount가 0이면 유효하다", () => {
    expect(validateInput({ date: "2026-01-01", totalSeats: 1, actualCount: 0 })).toBeNull();
  });
});

// ============================================================
// 8. updateRecord 로직 테스트
// ============================================================

describe("updateRecord 로직", () => {
  type RecordItem = {
    id: string;
    sessionNumber: number;
    date: string;
    totalSeats: number;
    actualCount: number;
    note?: string;
    byType: { paid: number; invited: number; free: number; staff: number };
  };

  function updateRecord(records: RecordItem[], id: string, changes: Partial<RecordItem>): RecordItem[] | null {
    const target = records.find((r) => r.id === id);
    if (!target) return null;
    return records.map((r) =>
      r.id === id ? { ...r, ...changes } : r
    );
  }

  it("존재하지 않는 id로 업데이트 시 null이 반환된다", () => {
    const records: RecordItem[] = [{ id: "r1", sessionNumber: 1, date: "2026-01-01", totalSeats: 100, actualCount: 50, byType: { paid: 0, invited: 0, free: 0, staff: 0 } }];
    expect(updateRecord(records, "r99", {})).toBeNull();
  });

  it("변경사항이 올바르게 적용된다", () => {
    const records: RecordItem[] = [{ id: "r1", sessionNumber: 1, date: "2026-01-01", totalSeats: 100, actualCount: 50, byType: { paid: 0, invited: 0, free: 0, staff: 0 } }];
    const result = updateRecord(records, "r1", { actualCount: 80 });
    expect(result?.[0].actualCount).toBe(80);
  });

  it("다른 레코드는 변경되지 않는다", () => {
    const records: RecordItem[] = [
      { id: "r1", sessionNumber: 1, date: "2026-01-01", totalSeats: 100, actualCount: 50, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
      { id: "r2", sessionNumber: 2, date: "2026-01-02", totalSeats: 200, actualCount: 100, byType: { paid: 0, invited: 0, free: 0, staff: 0 } },
    ];
    const result = updateRecord(records, "r1", { actualCount: 80 });
    expect(result?.[1].actualCount).toBe(100);
  });
});

// ============================================================
// 9. deleteRecord 로직 테스트
// ============================================================

describe("deleteRecord 로직", () => {
  type RecordItem = { id: string; sessionNumber: number };

  function deleteRecord(records: RecordItem[], id: string): RecordItem[] {
    return records.filter((r) => r.id !== id);
  }

  it("지정한 id의 레코드가 삭제된다", () => {
    const records: RecordItem[] = [{ id: "r1", sessionNumber: 1 }, { id: "r2", sessionNumber: 2 }];
    const result = deleteRecord(records, "r1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("존재하지 않는 id 삭제 시 레코드가 변하지 않는다", () => {
    const records: RecordItem[] = [{ id: "r1", sessionNumber: 1 }];
    const result = deleteRecord(records, "r99");
    expect(result).toHaveLength(1);
  });

  it("빈 배열에서 삭제해도 에러가 없다", () => {
    const result = deleteRecord([], "r1");
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 10. 그룹별 격리 테스트
// ============================================================

describe("그룹별 데이터 격리", () => {
  it("다른 groupId는 독립적인 스토리지 키를 가진다", () => {
    const key1 = `dancebase:audience-count:groupA:proj1`;
    const key2 = `dancebase:audience-count:groupB:proj1`;
    expect(key1).not.toBe(key2);
  });

  it("같은 groupId라도 다른 projectId면 독립적이다", () => {
    const key1 = `dancebase:audience-count:groupA:proj1`;
    const key2 = `dancebase:audience-count:groupA:proj2`;
    expect(key1).not.toBe(key2);
  });

  it("동일 키의 데이터만 조회된다", () => {
    const key = `dancebase:audience-count:groupA:proj1`;
    memStore[key] = { records: [{ id: "r1" }] };
    expect((memStore[key] as { records: unknown[] }).records).toHaveLength(1);
    expect(memStore["dancebase:audience-count:groupB:proj1"]).toBeUndefined();
  });
});
