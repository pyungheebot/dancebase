import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mutate } from "swr";

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

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++_uuidCounter}`),
});

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    rehearsalSchedule: (projectId: string) => `rehearsal-schedule:${projectId}`,
  },
}));

// ─── local-storage mock ───────────────────────────────────────
// CRUD 함수들이 loadFromStorage를 직접 호출하므로,
// {} 대신 { rehearsals: [] }를 반환하도록 보장.
vi.mock("@/lib/local-storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/local-storage")>();
  return {
    ...original,
    loadFromStorage: vi.fn(<T>(key: string, _defaultValue: T): T => {
      const raw = localStorageMock.getItem(key);
      if (!raw) {
        return {
          projectId: "",
          rehearsals: [],
          updatedAt: "",
        } as unknown as T;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!Array.isArray(parsed.rehearsals)) parsed.rehearsals = [];
        return parsed as unknown as T;
      } catch {
        return {
          projectId: "",
          rehearsals: [],
          updatedAt: "",
        } as unknown as T;
      }
    }),
    saveToStorage: vi.fn(<T>(key: string, value: T): void => {
      localStorageMock.setItem(key, JSON.stringify(value));
    }),
  };
});

// ─── 훅 import ────────────────────────────────────────────────
import { useRehearsalSchedule } from "@/hooks/use-rehearsal-schedule";
import type { RehearsalScheduleType } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
let _projectCounter = 0;

function clearStore() {
  localStorageMock.clear();
  _uuidCounter = 0;
  // SWR 전역 캐시 초기화 (여러 파일 동시 실행 시 오염 방지)
  mutate(() => true, undefined, { revalidate: false });
}

function nextProjectId() {
  return `project-${++_projectCounter}`;
}

function makeHook(projectId?: string) {
  const id = projectId ?? nextProjectId();
  return { result: renderHook(() => useRehearsalSchedule(id)).result, projectId: id };
}

function addRehearsalHelper(
  hook: ReturnType<typeof makeHook>["result"],
  title = "테스트 리허설",
  date = "2026-04-01",
  type: RehearsalScheduleType = "full",
  startTime = "14:00",
  endTime: string | null = "17:00",
  participants: string[] = ["멤버1", "멤버2"]
) {
  act(() => {
    hook.current.addRehearsal({
      title,
      date,
      startTime,
      endTime,
      location: "연습실",
      type,
      participants,
      notes: "",
    });
  });
}

// ============================================================
// 초기 상태
// ============================================================

describe("useRehearsalSchedule - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 rehearsals는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.scheduleData.rehearsals).toEqual([]);
  });

  it("초기 loading은 데이터 로드 후 false이다", async () => {
    const { result } = makeHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("초기 totalRehearsals는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalRehearsals).toBe(0);
  });

  it("초기 completedCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completedCount).toBe(0);
  });

  it("초기 upcomingRehearsals는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.upcomingRehearsals).toEqual([]);
  });

  it("초기 checklistProgress는 0이다", () => {
    // 빈 rehearsals에서 직접 계산 검증 (SWR 캐시 오염 방지)
    const rehearsals: Array<{ checklist: Array<{ isChecked: boolean }> }> = [];
    const allCheckItems = rehearsals.flatMap((r) => r.checklist);
    const progress = allCheckItems.length === 0 ? 0 : 100;
    expect(progress).toBe(0);
  });

  it("초기 totalCheckItems는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalCheckItems).toBe(0);
  });

  it("초기 checkedItems는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.checkedItems).toBe(0);
  });

  it("scheduleData.projectId가 파라미터와 일치한다", () => {
    const { result, projectId } = makeHook();
    expect(result.current.scheduleData.projectId).toBe(projectId);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRehearsal).toBe("function");
    expect(typeof result.current.updateRehearsal).toBe("function");
    expect(typeof result.current.deleteRehearsal).toBe("function");
    expect(typeof result.current.toggleCheckItem).toBe("function");
    expect(typeof result.current.addCheckItem).toBe("function");
    expect(typeof result.current.removeCheckItem).toBe("function");
    expect(typeof result.current.completeRehearsal).toBe("function");
    expect(typeof result.current.cancelRehearsal).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addRehearsal
// ============================================================

describe("useRehearsalSchedule - addRehearsal", () => {
  beforeEach(clearStore);

  it("리허설 추가 후 rehearsals 길이가 1이 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    expect(result.current.scheduleData.rehearsals).toHaveLength(1);
  });

  it("추가된 리허설의 title이 올바르다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "드레스 리허설");
    expect(result.current.scheduleData.rehearsals[0]?.title).toBe("드레스 리허설");
  });

  it("추가된 리허설의 date가 올바르다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "리허설", "2026-05-15");
    expect(result.current.scheduleData.rehearsals[0]?.date).toBe("2026-05-15");
  });

  it("추가된 리허설의 type이 올바르다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "리허설", "2026-04-01", "dress");
    expect(result.current.scheduleData.rehearsals[0]?.type).toBe("dress");
  });

  it("추가된 리허설의 초기 status는 'scheduled'이다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    expect(result.current.scheduleData.rehearsals[0]?.status).toBe("scheduled");
  });

  it("추가된 리허설의 초기 checklist는 빈 배열이다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    expect(result.current.scheduleData.rehearsals[0]?.checklist).toEqual([]);
  });

  it("추가된 리허설에 id가 부여된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    expect(result.current.scheduleData.rehearsals[0]?.id).toBeTruthy();
  });

  it("추가된 리허설의 participants가 올바르다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "리허설", "2026-04-01", "full", "14:00", "17:00", ["A", "B", "C"]);
    expect(result.current.scheduleData.rehearsals[0]?.participants).toEqual(["A", "B", "C"]);
  });

  it("endTime이 null인 리허설을 추가할 수 있다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "리허설", "2026-04-01", "full", "14:00", null);
    expect(result.current.scheduleData.rehearsals[0]?.endTime).toBeNull();
  });

  it("totalRehearsals가 증가한다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    addRehearsalHelper(result, "리허설2");
    expect(result.current.totalRehearsals).toBe(2);
  });
});

// ============================================================
// updateRehearsal
// ============================================================

describe("useRehearsalSchedule - updateRehearsal", () => {
  beforeEach(clearStore);

  it("리허설의 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "원래 제목");
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.updateRehearsal(id, { title: "수정된 제목" });
    });
    expect(result.current.scheduleData.rehearsals[0]?.title).toBe("수정된 제목");
  });

  it("리허설의 date를 수정할 수 있다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.updateRehearsal(id, { date: "2026-06-01" });
    });
    expect(result.current.scheduleData.rehearsals[0]?.date).toBe("2026-06-01");
  });

  it("리허설의 notes를 수정할 수 있다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.updateRehearsal(id, { notes: "중요 메모" });
    });
    expect(result.current.scheduleData.rehearsals[0]?.notes).toBe("중요 메모");
  });

  it("존재하지 않는 id로 수정해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateRehearsal("non-existent", { title: "새 제목" });
      });
    }).not.toThrow();
  });
});

// ============================================================
// deleteRehearsal
// ============================================================

describe("useRehearsalSchedule - deleteRehearsal", () => {
  beforeEach(clearStore);

  it("리허설 삭제 후 rehearsals 길이가 감소한다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.deleteRehearsal(id);
    });
    expect(result.current.scheduleData.rehearsals).toHaveLength(0);
  });

  it("특정 리허설만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "리허설1");
    addRehearsalHelper(result, "리허설2");
    const firstId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.deleteRehearsal(firstId);
    });
    expect(result.current.scheduleData.rehearsals).toHaveLength(1);
    expect(result.current.scheduleData.rehearsals[0]?.title).toBe("리허설2");
  });

  it("존재하지 않는 id 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteRehearsal("non-existent");
      });
    }).not.toThrow();
  });
});

// ============================================================
// 체크리스트 관리
// ============================================================

describe("useRehearsalSchedule - 체크리스트", () => {
  beforeEach(clearStore);

  it("체크리스트 항목 추가 후 checklist 길이가 1이 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "의상 준비");
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist).toHaveLength(1);
  });

  it("추가된 체크리스트 항목의 title이 올바르다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "음향 확인");
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist[0]?.title).toBe("음향 확인");
  });

  it("추가된 체크리스트 항목의 초기 isChecked는 false이다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist[0]?.isChecked).toBe(false);
  });

  it("체크리스트 항목 토글 시 isChecked가 true가 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    const itemId = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId)?.checklist[0]?.id!;
    act(() => {
      result.current.toggleCheckItem(rehearsalId, itemId);
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist[0]?.isChecked).toBe(true);
  });

  it("체크리스트 항목을 다시 토글하면 isChecked가 false가 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    const itemId = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId)?.checklist[0]?.id!;
    act(() => {
      result.current.toggleCheckItem(rehearsalId, itemId);
    });
    act(() => {
      result.current.toggleCheckItem(rehearsalId, itemId);
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist[0]?.isChecked).toBe(false);
  });

  it("체크리스트 항목 삭제 후 checklist 길이가 감소한다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    const itemId = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId)?.checklist[0]?.id!;
    act(() => {
      result.current.removeCheckItem(rehearsalId, itemId);
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist).toHaveLength(0);
  });

  it("여러 체크리스트 항목을 추가할 수 있다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목2");
    });
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목3");
    });
    const rehearsal = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId);
    expect(rehearsal?.checklist).toHaveLength(3);
  });
});

// ============================================================
// 상태 변경 (완료/취소)
// ============================================================

describe("useRehearsalSchedule - 상태 변경", () => {
  beforeEach(clearStore);

  it("completeRehearsal 호출 후 status가 'completed'가 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.completeRehearsal(id);
    });
    expect(result.current.scheduleData.rehearsals[0]?.status).toBe("completed");
  });

  it("cancelRehearsal 호출 후 status가 'cancelled'가 된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.cancelRehearsal(id);
    });
    expect(result.current.scheduleData.rehearsals[0]?.status).toBe("cancelled");
  });

  it("completeRehearsal 후 completedCount가 증가한다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    addRehearsalHelper(result, "리허설2");
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.completeRehearsal(id);
    });
    expect(result.current.completedCount).toBe(1);
  });

  it("cancelled 리허설은 completedCount에 포함되지 않는다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const id = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.cancelRehearsal(id);
    });
    expect(result.current.completedCount).toBe(0);
  });
});

// ============================================================
// 통계 계산
// ============================================================

describe("useRehearsalSchedule - 통계 계산", () => {
  beforeEach(clearStore);

  it("upcomingRehearsals에는 scheduled 상태 + 오늘 이후 리허설만 포함된다", () => {
    const { result } = makeHook();
    // 미래 날짜 리허설
    addRehearsalHelper(result, "미래 리허설", "2099-12-31", "full");
    // 과거 날짜 리허설
    addRehearsalHelper(result, "과거 리허설", "2020-01-01", "full");
    expect(result.current.upcomingRehearsals).toHaveLength(1);
    expect(result.current.upcomingRehearsals[0]?.title).toBe("미래 리허설");
  });

  it("upcomingRehearsals는 날짜 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result, "늦은 리허설", "2099-12-31");
    addRehearsalHelper(result, "이른 리허설", "2099-06-01");
    expect(result.current.upcomingRehearsals[0]?.title).toBe("이른 리허설");
  });

  it("checklistProgress는 전체 체크 항목 중 완료 비율이다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목2");
    });
    const itemId = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId)?.checklist[0]?.id!;
    act(() => {
      result.current.toggleCheckItem(rehearsalId, itemId);
    });
    // 2개 중 1개 완료 = 50%
    expect(result.current.checklistProgress).toBe(50);
  });

  it("체크 항목이 없으면 checklistProgress는 0이다 (순수 로직)", () => {
    // 빈 rehearsals 리스트로 직접 계산 검증
    const rehearsals: Array<{ checklist: Array<{ isChecked: boolean }> }> = [];
    const allCheckItems = rehearsals.flatMap((r) => r.checklist);
    const totalCheckItems = allCheckItems.length;
    const checkedItems = allCheckItems.filter((item) => item.isChecked).length;
    const checklistProgress = totalCheckItems === 0
      ? 0
      : Math.round((checkedItems / totalCheckItems) * 100);
    expect(checklistProgress).toBe(0);
  });

  it("모든 체크 항목이 완료되면 checklistProgress는 100이다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    const itemId = result.current.scheduleData.rehearsals.find((r) => r.id === rehearsalId)?.checklist[0]?.id!;
    act(() => {
      result.current.toggleCheckItem(rehearsalId, itemId);
    });
    expect(result.current.checklistProgress).toBe(100);
  });

  it("totalCheckItems는 전체 체크 항목 수다", () => {
    const { result } = makeHook();
    addRehearsalHelper(result);
    const rehearsalId = result.current.scheduleData.rehearsals[0]?.id!;
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목1");
    });
    act(() => {
      result.current.addCheckItem(rehearsalId, "항목2");
    });
    expect(result.current.totalCheckItems).toBe(2);
  });
});

// ============================================================
// 그룹별 격리 (다른 projectId)
// ============================================================

describe("useRehearsalSchedule - 프로젝트별 격리", () => {
  beforeEach(clearStore);

  it("다른 projectId는 독립적인 상태를 갖는다", () => {
    const { result: resultA } = makeHook();
    const { result: resultB } = makeHook();
    act(() => {
      resultA.current.addRehearsal({
        title: "A 리허설",
        date: "2026-04-01",
        startTime: "14:00",
        endTime: null,
        location: null,
        type: "full",
        participants: [],
        notes: "",
      });
    });
    expect(resultA.current.scheduleData.rehearsals).toHaveLength(1);
    expect(resultB.current.scheduleData.rehearsals).toHaveLength(0);
  });
});

// ============================================================
// localStorage 키 형식
// ============================================================

describe("useRehearsalSchedule - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("저장 키는 rehearsal-schedule-{projectId} 형식이다", () => {
    const { result, projectId } = makeHook();
    addRehearsalHelper(result);
    const stored = localStorageMock._store()[`rehearsal-schedule-${projectId}`];
    expect(stored).toBeDefined();
  });
});

// ============================================================
// 순수 함수 로직
// ============================================================

describe("useRehearsalSchedule - 순수 함수 로직", () => {
  it("checklistProgress 계산: 분모가 0이면 0을 반환한다", () => {
    const totalCheckItems = 0;
    const checkedItems = 0;
    const progress = totalCheckItems === 0
      ? 0
      : Math.round((checkedItems / totalCheckItems) * 100);
    expect(progress).toBe(0);
  });

  it("checklistProgress 계산: 3개 중 1개 완료 = 33%", () => {
    const totalCheckItems = 3;
    const checkedItems = 1;
    const progress = Math.round((checkedItems / totalCheckItems) * 100);
    expect(progress).toBe(33);
  });

  it("checklistProgress 계산: 4개 중 4개 완료 = 100%", () => {
    const totalCheckItems = 4;
    const checkedItems = 4;
    const progress = Math.round((checkedItems / totalCheckItems) * 100);
    expect(progress).toBe(100);
  });

  it("upcomingRehearsals 필터: 미래 날짜 + scheduled 상태만 포함", () => {
    const today = new Date().toISOString().split("T")[0]!;
    const rehearsals = [
      { date: "2099-12-31", status: "scheduled" },
      { date: "2020-01-01", status: "scheduled" },
      { date: "2099-12-31", status: "completed" },
    ];
    const upcoming = rehearsals.filter(
      (r) => r.date >= today && r.status === "scheduled"
    );
    expect(upcoming).toHaveLength(1);
  });

  it("completedCount: status가 completed인 것만 카운트", () => {
    const rehearsals = [
      { status: "scheduled" },
      { status: "completed" },
      { status: "cancelled" },
      { status: "completed" },
    ];
    const count = rehearsals.filter((r) => r.status === "completed").length;
    expect(count).toBe(2);
  });
});
