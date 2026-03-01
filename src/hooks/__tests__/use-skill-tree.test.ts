import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSkillTree,
  SKILL_TREE_GENRES,
} from "@/hooks/use-skill-tree";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _store: () => store,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "grp-1", userId = "user-1") {
  return renderHook(() => useSkillTree(groupId, userId));
}

// ============================================================
// SKILL_TREE_GENRES 상수 테스트
// ============================================================

describe("SKILL_TREE_GENRES - 장르 목록", () => {
  it("장르 목록이 배열이다", () => {
    expect(Array.isArray(SKILL_TREE_GENRES)).toBe(true);
  });

  it("장르 목록이 비어있지 않다", () => {
    expect(SKILL_TREE_GENRES.length).toBeGreaterThan(0);
  });

  it("힙합 장르가 포함된다", () => {
    expect(SKILL_TREE_GENRES).toContain("힙합");
  });

  it("팝핀 장르가 포함된다", () => {
    expect(SKILL_TREE_GENRES).toContain("팝핀");
  });

  it("왁킹 장르가 포함된다", () => {
    expect(SKILL_TREE_GENRES).toContain("왁킹");
  });

  it("락킹 장르가 포함된다", () => {
    expect(SKILL_TREE_GENRES).toContain("락킹");
  });

  it("브레이킹 장르가 포함된다", () => {
    expect(SKILL_TREE_GENRES).toContain("브레이킹");
  });

  it("최소 5개 이상의 장르가 있다", () => {
    expect(SKILL_TREE_GENRES.length).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================
// useSkillTree - 초기 상태
// ============================================================

describe("useSkillTree - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("초기 data는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.data).toBeNull();
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.learned는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.learned).toBe(0);
  });

  it("초기 stats.available은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.available).toBe(0);
  });

  it("초기 stats.ratio는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.ratio).toBe(0);
  });

  it("초기 nodesByTier는 빈 객체이다", () => {
    const { result } = makeHook();
    expect(result.current.nodesByTier).toEqual({});
  });

  it("genres가 SKILL_TREE_GENRES와 동일하다", () => {
    const { result } = makeHook();
    expect(result.current.genres).toEqual(SKILL_TREE_GENRES);
  });

  it("initTree, learnSkill, resetTree, refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.initTree).toBe("function");
    expect(typeof result.current.learnSkill).toBe("function");
    expect(typeof result.current.resetTree).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useSkillTree - initTree
// ============================================================

describe("useSkillTree - initTree", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("힙합으로 초기화 시 data.genre가 '힙합'이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(result.current.data?.genre).toBe("힙합");
  });

  it("초기화 후 nodes가 비어있지 않다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(result.current.data!.nodes.length).toBeGreaterThan(0);
  });

  it("초기화 후 totalLearned는 0이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(result.current.data!.totalLearned).toBe(0);
  });

  it("초기화 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("전제 조건 없는 Tier 1 노드는 available 상태이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    const tier1Nodes = result.current.data!.nodes.filter((n) => n.tier === 1);
    tier1Nodes.forEach((node) => {
      expect(node.status).toBe("available");
    });
  });

  it("전제 조건이 있는 Tier 2 이상 노드는 초기에 locked 상태이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    const lockedNodes = result.current.data!.nodes.filter((n) => n.tier >= 2);
    expect(lockedNodes.length).toBeGreaterThan(0);
    lockedNodes.forEach((node) => {
      expect(node.status).toBe("locked");
    });
  });

  it("팝핀으로 초기화 시 data.genre가 '팝핀'이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("팝핀"); });
    expect(result.current.data?.genre).toBe("팝핀");
  });

  it("초기화 후 stats.total이 nodes.length와 일치한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(result.current.stats.total).toBe(result.current.data!.nodes.length);
  });

  it("초기화 후 nodesByTier에 tier 1 노드가 존재한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(result.current.nodesByTier[1]).toBeDefined();
    expect(result.current.nodesByTier[1].length).toBeGreaterThan(0);
  });

  it("nodesByTier는 5개 tier를 가진다 (힙합 기준)", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    expect(Object.keys(result.current.nodesByTier).length).toBe(5);
  });
});

// ============================================================
// useSkillTree - learnSkill
// ============================================================

describe("useSkillTree - learnSkill", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("data가 없을 때 learnSkill은 false를 반환한다", () => {
    const { result } = makeHook();
    let returned: boolean;
    act(() => { returned = result.current.learnSkill("some-id"); });
    expect(returned!).toBe(false);
  });

  it("available 상태 노드 해금 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    let returned: boolean;
    act(() => { returned = result.current.learnSkill(availableNode.id); });
    expect(returned!).toBe(true);
  });

  it("locked 상태 노드 해금 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const lockedNode = result.current.data!.nodes.find(
      (n) => n.status === "locked"
    )!;
    let returned: boolean;
    act(() => { returned = result.current.learnSkill(lockedNode.id); });
    expect(returned!).toBe(false);
  });

  it("이미 learned 노드 재해금 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    // 이미 learned 상태
    let returned: boolean;
    act(() => { returned = result.current.learnSkill(availableNode.id); });
    expect(returned!).toBe(false);
  });

  it("해금 후 노드 status가 learned로 바뀐다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    const updated = result.current.data!.nodes.find((n) => n.id === availableNode.id)!;
    expect(updated.status).toBe("learned");
  });

  it("해금 후 learnedAt이 설정된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    const updated = result.current.data!.nodes.find((n) => n.id === availableNode.id)!;
    expect(updated.learnedAt).toBeDefined();
  });

  it("해금 후 totalLearned가 증가한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    expect(result.current.data!.totalLearned).toBe(1);
  });

  it("해금 후 stats.learned가 증가한다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    expect(result.current.stats.learned).toBe(1);
  });

  it("전제 조건 노드 해금 후 dependent 노드가 available로 바뀐다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    // 힙합 Tier 1 전부 해금 → Tier 2 노드 available 전환 확인
    const tier1Nodes = result.current.data!.nodes.filter((n) => n.tier === 1);
    tier1Nodes.forEach((node) => {
      act(() => { result.current.learnSkill(node.id); });
    });

    const tier2Available = result.current.data!.nodes.filter(
      (n) => n.tier === 2 && n.status === "available"
    );
    expect(tier2Available.length).toBeGreaterThan(0);
  });

  it("해금 후 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    localStorageMock.setItem.mockClear();

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("stats.ratio는 0~100 사이이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });

    expect(result.current.stats.ratio).toBeGreaterThanOrEqual(0);
    expect(result.current.stats.ratio).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// useSkillTree - resetTree
// ============================================================

describe("useSkillTree - resetTree", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("data가 없으면 resetTree를 호출해도 에러 없이 처리된다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => { result.current.resetTree(); });
    }).not.toThrow();
  });

  it("리셋 후 totalLearned가 0이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });
    expect(result.current.data!.totalLearned).toBe(1);

    act(() => { result.current.resetTree(); });
    expect(result.current.data!.totalLearned).toBe(0);
  });

  it("리셋 후 모든 learned 노드가 available/locked로 돌아간다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const tier1Nodes = result.current.data!.nodes.filter((n) => n.tier === 1);
    tier1Nodes.forEach((node) => {
      act(() => { result.current.learnSkill(node.id); });
    });

    act(() => { result.current.resetTree(); });

    const learnedNodes = result.current.data!.nodes.filter(
      (n) => n.status === "learned"
    );
    expect(learnedNodes.length).toBe(0);
  });

  it("리셋 후 genre는 유지된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("팝핀"); });
    act(() => { result.current.resetTree(); });
    expect(result.current.data!.genre).toBe("팝핀");
  });

  it("리셋 후 Tier 1 노드는 available 상태이다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const tier1Nodes = result.current.data!.nodes.filter((n) => n.tier === 1);
    tier1Nodes.forEach((node) => {
      act(() => { result.current.learnSkill(node.id); });
    });

    act(() => { result.current.resetTree(); });

    const tier1AfterReset = result.current.data!.nodes.filter((n) => n.tier === 1);
    tier1AfterReset.forEach((node) => {
      expect(node.status).toBe("available");
    });
  });

  it("리셋 후 stats.learned가 0이 된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const availableNode = result.current.data!.nodes.find(
      (n) => n.status === "available"
    )!;
    act(() => { result.current.learnSkill(availableNode.id); });
    act(() => { result.current.resetTree(); });

    expect(result.current.stats.learned).toBe(0);
  });
});

// ============================================================
// useSkillTree - nodesByTier 그룹화
// ============================================================

describe("useSkillTree - nodesByTier 그룹화", () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("각 tier의 노드 id가 nodes에서 찾을 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    for (const [tier, nodes] of Object.entries(result.current.nodesByTier)) {
      nodes.forEach((node) => {
        expect(node.tier).toBe(Number(tier));
      });
    }
  });

  it("nodesByTier의 모든 노드 합산이 전체 nodes 수와 같다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });

    const total = Object.values(result.current.nodesByTier).reduce(
      (sum, nodes) => sum + nodes.length,
      0
    );
    expect(total).toBe(result.current.data!.nodes.length);
  });

  it("장르별로 다른 nodes가 생성된다", () => {
    const { result } = makeHook();
    act(() => { result.current.initTree("힙합"); });
    const hiphopIds = result.current.data!.nodes.map((n) => n.id);

    act(() => { result.current.initTree("팝핀"); });
    const poppingIds = result.current.data!.nodes.map((n) => n.id);

    expect(hiphopIds[0]).not.toBe(poppingIds[0]);
  });
});
