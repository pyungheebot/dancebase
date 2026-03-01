import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

// ─── 훅 import ────────────────────────────────────────────────
import { useProjectMilestones } from "@/hooks/use-project-milestones";
import type { ProjectMilestone } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(projectId = "project-1") {
  return renderHook(() => useProjectMilestones(projectId));
}

// ============================================================
// useProjectMilestones - 초기 상태 (기본 마일스톤 생성)
// ============================================================

describe("useProjectMilestones - 초기 상태 (기본 템플릿)", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("처음 사용 시 기본 마일스톤 5개가 생성된다", () => {
    const { result } = makeHook();
    expect(result.current.milestones).toHaveLength(5);
  });

  it("기본 마일스톤에 '안무 완성'이 포함된다", () => {
    const { result } = makeHook();
    const titles = result.current.milestones.map((m) => m.title);
    expect(titles).toContain("안무 완성");
  });

  it("기본 마일스톤에 '음악 선정'이 포함된다", () => {
    const { result } = makeHook();
    const titles = result.current.milestones.map((m) => m.title);
    expect(titles).toContain("음악 선정");
  });

  it("기본 마일스톤에 '공연/발표'가 포함된다", () => {
    const { result } = makeHook();
    const titles = result.current.milestones.map((m) => m.title);
    expect(titles).toContain("공연/발표");
  });

  it("기본 마일스톤은 completedAt이 null이다", () => {
    const { result } = makeHook();
    result.current.milestones.forEach((m) => {
      expect(m.completedAt).toBeNull();
    });
  });

  it("기본 마일스톤은 sortOrder 기준 오름차순 정렬된다", () => {
    const { result } = makeHook();
    const orders = result.current.milestones.map((m) => m.sortOrder);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    }
  });

  it("localStorage에 저장된 데이터가 있으면 기본 마일스톤을 생성하지 않는다", () => {
    // 먼저 기본 데이터를 생성
    const { result: r1 } = makeHook("project-saved");
    // 마일스톤 추가
    act(() => {
      r1.current.addMilestone("추가된 마일스톤", "2026-06-01");
    });
    // 새 훅 인스턴스로 로드
    const { result: r2 } = makeHook("project-saved");
    // 기본 5개 + 추가 1개 = 6개여야 함
    expect(r2.current.milestones).toHaveLength(6);
  });

  it("completionRate 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completionRate).toBe(0);
  });

  it("nextMilestone은 미완료 중 가장 빠른 targetDate를 가진 마일스톤이다", () => {
    const { result } = makeHook();
    const next = result.current.nextMilestone;
    expect(next).not.toBeNull();
    // 모두 미완료이므로 sortOrder가 0인 것(targetDate가 가장 이른 것)이 next
    expect(next!.sortOrder).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addMilestone).toBe("function");
    expect(typeof result.current.updateMilestone).toBe("function");
    expect(typeof result.current.deleteMilestone).toBe("function");
    expect(typeof result.current.toggleComplete).toBe("function");
  });
});

// ============================================================
// useProjectMilestones - addMilestone
// ============================================================

describe("useProjectMilestones - addMilestone 마일스톤 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("마일스톤 추가 후 milestones 길이가 1 증가한다", () => {
    const { result } = makeHook();
    const initialLength = result.current.milestones.length;
    act(() => {
      result.current.addMilestone("의상 준비", "2026-05-01");
    });
    expect(result.current.milestones).toHaveLength(initialLength + 1);
  });

  it("추가된 마일스톤의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone("리허설 완료", "2026-05-15");
    });
    const added = result.current.milestones.find(
      (m) => m.title === "리허설 완료"
    );
    expect(added).toBeDefined();
  });

  it("추가된 마일스톤의 targetDate가 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone("의상 준비", "2026-06-01");
    });
    const added = result.current.milestones.find(
      (m) => m.title === "의상 준비"
    );
    expect(added!.targetDate).toBe("2026-06-01");
  });

  it("추가된 마일스톤의 completedAt은 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone("새 마일스톤", "2026-05-01");
    });
    const added = result.current.milestones.find(
      (m) => m.title === "새 마일스톤"
    );
    expect(added!.completedAt).toBeNull();
  });

  it("추가된 마일스톤에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone("새 마일스톤", "2026-05-01");
    });
    const added = result.current.milestones.find(
      (m) => m.title === "새 마일스톤"
    );
    expect(added!.id).toBeDefined();
    expect(added!.id).not.toBe("");
  });

  it("description을 포함한 마일스톤을 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone(
        "새 마일스톤",
        "2026-05-01",
        "세부 설명"
      );
    });
    const added = result.current.milestones.find(
      (m) => m.title === "새 마일스톤"
    );
    expect(added!.description).toBe("세부 설명");
  });

  it("추가된 마일스톤의 sortOrder는 기존 최대값 + 1이다", () => {
    const { result } = makeHook();
    const maxOrder = Math.max(
      ...result.current.milestones.map((m) => m.sortOrder)
    );
    act(() => {
      result.current.addMilestone("마지막 마일스톤", "2026-12-31");
    });
    const added = result.current.milestones.find(
      (m) => m.title === "마지막 마일스톤"
    );
    expect(added!.sortOrder).toBe(maxOrder + 1);
  });

  it("추가 후 localStorage에 저장된다", () => {
    localStorageMock.clear();
    const { result } = makeHook("project-store-test");
    act(() => {
      result.current.addMilestone("저장 테스트", "2026-05-01");
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useProjectMilestones - updateMilestone
// ============================================================

describe("useProjectMilestones - updateMilestone 마일스톤 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("마일스톤 title을 수정할 수 있다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.updateMilestone(id, { title: "수정된 제목" });
    });
    const updated = result.current.milestones.find((m) => m.id === id);
    expect(updated!.title).toBe("수정된 제목");
  });

  it("targetDate를 수정할 수 있다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.updateMilestone(id, { targetDate: "2026-12-31" });
    });
    const updated = result.current.milestones.find((m) => m.id === id);
    expect(updated!.targetDate).toBe("2026-12-31");
  });

  it("description을 수정할 수 있다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.updateMilestone(id, { description: "상세 설명" });
    });
    const updated = result.current.milestones.find((m) => m.id === id);
    expect(updated!.description).toBe("상세 설명");
  });

  it("다른 마일스톤은 수정되지 않는다", () => {
    const { result } = makeHook();
    const firstId = result.current.milestones[0].id;
    const secondTitle = result.current.milestones[1].title;
    act(() => {
      result.current.updateMilestone(firstId, { title: "수정됨" });
    });
    expect(result.current.milestones[1].title).toBe(secondTitle);
  });

  it("sortOrder를 수정할 수 있다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.updateMilestone(id, { sortOrder: 99 });
    });
    const updated = result.current.milestones.find((m) => m.id === id);
    expect(updated!.sortOrder).toBe(99);
  });
});

// ============================================================
// useProjectMilestones - deleteMilestone
// ============================================================

describe("useProjectMilestones - deleteMilestone 마일스톤 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("마일스톤 삭제 후 milestones 길이가 감소한다", () => {
    const { result } = makeHook();
    const initialLength = result.current.milestones.length;
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.deleteMilestone(id);
    });
    expect(result.current.milestones).toHaveLength(initialLength - 1);
  });

  it("특정 마일스톤만 삭제된다", () => {
    const { result } = makeHook();
    const firstId = result.current.milestones[0].id;
    const secondTitle = result.current.milestones[1].title;
    act(() => {
      result.current.deleteMilestone(firstId);
    });
    const stillExists = result.current.milestones.find(
      (m) => m.title === secondTitle
    );
    expect(stillExists).toBeDefined();
  });

  it("존재하지 않는 id를 삭제해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteMilestone("non-existent-id");
      });
    }).not.toThrow();
  });

  it("삭제 후 나머지 마일스톤이 유지된다", () => {
    const { result } = makeHook();
    const firstId = result.current.milestones[0].id;
    const otherTitles = result.current.milestones
      .slice(1)
      .map((m) => m.title);
    act(() => {
      result.current.deleteMilestone(firstId);
    });
    const remainingTitles = result.current.milestones.map((m) => m.title);
    otherTitles.forEach((title) => {
      expect(remainingTitles).toContain(title);
    });
  });
});

// ============================================================
// useProjectMilestones - toggleComplete
// ============================================================

describe("useProjectMilestones - toggleComplete 완료 토글", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("미완료 마일스톤을 토글하면 completedAt이 설정된다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.toggleComplete(id);
    });
    const milestone = result.current.milestones.find((m) => m.id === id);
    expect(milestone!.completedAt).not.toBeNull();
  });

  it("완료된 마일스톤을 토글하면 completedAt이 null이 된다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.toggleComplete(id); // 완료
    });
    act(() => {
      result.current.toggleComplete(id); // 취소
    });
    const milestone = result.current.milestones.find((m) => m.id === id);
    expect(milestone!.completedAt).toBeNull();
  });

  it("completedAt은 ISO 8601 형식이다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.toggleComplete(id);
    });
    const milestone = result.current.milestones.find((m) => m.id === id);
    expect(milestone!.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("다른 마일스톤은 영향을 받지 않는다", () => {
    const { result } = makeHook();
    const firstId = result.current.milestones[0].id;
    act(() => {
      result.current.toggleComplete(firstId);
    });
    // 다른 마일스톤들은 여전히 미완료
    result.current.milestones
      .filter((m) => m.id !== firstId)
      .forEach((m) => {
        expect(m.completedAt).toBeNull();
      });
  });
});

// ============================================================
// useProjectMilestones - completionRate
// ============================================================

describe("useProjectMilestones - completionRate 진행률", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("아무것도 완료하지 않으면 completionRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completionRate).toBe(0);
  });

  it("모두 완료하면 completionRate는 100이다", () => {
    const { result } = makeHook();
    const ids = result.current.milestones.map((m) => m.id);
    act(() => {
      ids.forEach((id) => result.current.toggleComplete(id));
    });
    expect(result.current.completionRate).toBe(100);
  });

  it("절반 완료 시 completionRate는 대략 60이다 (5개 중 3개)", () => {
    const { result } = makeHook();
    // 기본 마일스톤 5개 중 3개 완료
    const ids = result.current.milestones.slice(0, 3).map((m) => m.id);
    act(() => {
      ids.forEach((id) => result.current.toggleComplete(id));
    });
    expect(result.current.completionRate).toBe(60);
  });

  it("completionRate는 정수이다", () => {
    const { result } = makeHook();
    const id = result.current.milestones[0].id;
    act(() => {
      result.current.toggleComplete(id);
    });
    expect(Number.isInteger(result.current.completionRate)).toBe(true);
  });

  it("completionRate는 0~100 사이이다", () => {
    const { result } = makeHook();
    expect(result.current.completionRate).toBeGreaterThanOrEqual(0);
    expect(result.current.completionRate).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// useProjectMilestones - nextMilestone
// ============================================================

describe("useProjectMilestones - nextMilestone 다음 마일스톤", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("미완료 마일스톤 중 가장 빠른 targetDate를 가진 마일스톤을 반환한다", () => {
    const { result } = makeHook();
    // 첫 번째 마일스톤이 가장 빠른 targetDate를 가짐 (sortOrder=0)
    const next = result.current.nextMilestone;
    expect(next).not.toBeNull();
    expect(next!.sortOrder).toBe(0);
  });

  it("모든 마일스톤이 완료되면 nextMilestone은 null이다", () => {
    const { result } = makeHook();
    const ids = result.current.milestones.map((m) => m.id);
    act(() => {
      ids.forEach((id) => result.current.toggleComplete(id));
    });
    expect(result.current.nextMilestone).toBeNull();
  });

  it("첫 번째 마일스톤이 완료되면 두 번째 마일스톤이 nextMilestone이 된다", () => {
    const { result } = makeHook();
    const sortedMilestones = [...result.current.milestones].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    const firstId = sortedMilestones[0].id;
    act(() => {
      result.current.toggleComplete(firstId);
    });
    const next = result.current.nextMilestone;
    // 다음 마일스톤은 sortOrder가 0인 것이 완료됐으므로 1인 것
    expect(next!.id).not.toBe(firstId);
  });
});

// ============================================================
// useProjectMilestones - 프로젝트별 데이터 격리
// ============================================================

describe("useProjectMilestones - 프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("다른 projectId의 데이터는 공유되지 않는다", () => {
    const { result: r1 } = makeHook("project-alpha");
    const { result: r2 } = makeHook("project-beta");

    act(() => {
      r1.current.addMilestone("알파 전용 마일스톤", "2026-06-01");
    });

    const r2Titles = r2.current.milestones.map((m) => m.title);
    expect(r2Titles).not.toContain("알파 전용 마일스톤");
  });

  it("같은 projectId는 같은 데이터를 사용한다", () => {
    const { result: r1 } = makeHook("project-shared");
    act(() => {
      r1.current.addMilestone("공유 마일스톤", "2026-06-01");
    });

    // 같은 projectId로 새 훅 인스턴스
    const { result: r2 } = makeHook("project-shared");
    const r2Titles = r2.current.milestones.map((m) => m.title);
    expect(r2Titles).toContain("공유 마일스톤");
  });
});

// ============================================================
// useProjectMilestones - sortedMilestones 정렬
// ============================================================

describe("useProjectMilestones - milestones 정렬", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("milestones는 sortOrder 기준 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    // sortOrder 역순으로 수정
    const milestones = result.current.milestones;
    act(() => {
      result.current.updateMilestone(milestones[0].id, { sortOrder: 100 });
    });
    const orders = result.current.milestones.map((m) => m.sortOrder);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it("추가된 마일스톤이 sortOrder 기준으로 올바른 위치에 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMilestone("마지막 순서", "2026-12-31");
    });
    const lastMilestone =
      result.current.milestones[result.current.milestones.length - 1];
    expect(lastMilestone.title).toBe("마지막 순서");
  });
});
