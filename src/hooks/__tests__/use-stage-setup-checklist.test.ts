/**
 * use-stage-setup-checklist 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - localStorage 키 형식
 * - 항목 추가 (addItem) - content 트림, assignee/notes 처리
 * - 항목 수정 (updateItem)
 * - 완료 토글 (toggleItem) - completedAt 설정/해제
 * - 항목 삭제 (deleteItem)
 * - 전체 초기화 (resetAll) - completed false로 리셋
 * - 통계 계산 (stats) - totalCount, completedCount, pendingCount, progressRate, categoryStats
 * - 카테고리별 통계
 * - 그룹+프로젝트별 격리
 */

import { describe, it, expect } from "vitest";
import type {
  StageSetupChecklistData,
  StageSetupChecklistItem,
  StageSetupCategory,
} from "@/types";

// ============================================================
// 훅 내부 순수 함수 재현
// ============================================================

/** localStorage 키 형식 */
function lsKey(groupId: string, projectId: string): string {
  return `dancebase:stage-setup-checklist:${groupId}:${projectId}`;
}

/** 빈 체크리스트 데이터 생성 */
function createEmptyData(
  groupId: string,
  projectId: string
): StageSetupChecklistData {
  return {
    groupId,
    projectId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

/** 항목 빌더 */
function makeItem(
  overrides: Partial<StageSetupChecklistItem> = {}
): StageSetupChecklistItem {
  return {
    id: "item-1",
    category: "sound",
    content: "마이크 체크",
    completed: false,
    assignee: undefined,
    completedAt: undefined,
    notes: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** addItem */
function addItem(
  data: StageSetupChecklistData,
  params: {
    category: StageSetupCategory;
    content: string;
    assignee?: string;
    notes?: string;
  }
): { data: StageSetupChecklistData; item: StageSetupChecklistItem } {
  const now = new Date().toISOString();
  const newItem: StageSetupChecklistItem = {
    id: crypto.randomUUID(),
    category: params.category,
    content: params.content.trim(),
    completed: false,
    assignee: params.assignee?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const updated: StageSetupChecklistData = {
    ...data,
    items: [...data.items, newItem],
    updatedAt: now,
  };
  return { data: updated, item: newItem };
}

/** updateItem */
function updateItem(
  data: StageSetupChecklistData,
  itemId: string,
  params: Partial<{
    category: StageSetupCategory;
    content: string;
    assignee: string;
    notes: string;
  }>
): { data: StageSetupChecklistData; success: boolean } {
  const idx = data.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return { data, success: false };

  const existing = data.items[idx]!;
  const updatedItem: StageSetupChecklistItem = {
    ...existing,
    ...params,
    content: params.content?.trim() ?? existing.content,
    assignee:
      params.assignee !== undefined
        ? params.assignee.trim() || undefined
        : existing.assignee,
    notes:
      params.notes !== undefined
        ? params.notes.trim() || undefined
        : existing.notes,
    updatedAt: new Date().toISOString(),
  };

  const updated: StageSetupChecklistData = {
    ...data,
    items: data.items.map((i) => (i.id === itemId ? updatedItem : i)),
    updatedAt: new Date().toISOString(),
  };
  return { data: updated, success: true };
}

/** toggleItem */
function toggleItem(
  data: StageSetupChecklistData,
  itemId: string
): { data: StageSetupChecklistData; success: boolean } {
  const idx = data.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return { data, success: false };

  const existing = data.items[idx]!;
  const now = new Date().toISOString();
  const nextCompleted = !existing.completed;
  const updatedItem: StageSetupChecklistItem = {
    ...existing,
    completed: nextCompleted,
    completedAt: nextCompleted ? now : undefined,
    updatedAt: now,
  };

  const updated: StageSetupChecklistData = {
    ...data,
    items: data.items.map((i) => (i.id === itemId ? updatedItem : i)),
    updatedAt: now,
  };
  return { data: updated, success: true };
}

/** deleteItem */
function deleteItem(
  data: StageSetupChecklistData,
  itemId: string
): { data: StageSetupChecklistData; success: boolean } {
  const exists = data.items.some((i) => i.id === itemId);
  if (!exists) return { data, success: false };

  const updated: StageSetupChecklistData = {
    ...data,
    items: data.items.filter((i) => i.id !== itemId),
    updatedAt: new Date().toISOString(),
  };
  return { data: updated, success: true };
}

/** resetAll */
function resetAll(data: StageSetupChecklistData): StageSetupChecklistData {
  const now = new Date().toISOString();
  return {
    ...data,
    items: data.items.map((i) => ({
      ...i,
      completed: false,
      completedAt: undefined,
      updatedAt: now,
    })),
    updatedAt: now,
  };
}

/** 통계 계산 */
function calcStats(items: StageSetupChecklistItem[]) {
  const CATEGORIES: StageSetupCategory[] = [
    "sound",
    "lighting",
    "floor",
    "props",
    "costume",
    "tech",
  ];

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categoryStats = CATEGORIES.reduce<
    Record<
      StageSetupCategory,
      { total: number; completed: number; rate: number }
    >
  >(
    (acc, cat) => {
      const catItems = items.filter((i) => i.category === cat);
      const catCompleted = catItems.filter((i) => i.completed).length;
      acc[cat] = {
        total: catItems.length,
        completed: catCompleted,
        rate:
          catItems.length > 0
            ? Math.round((catCompleted / catItems.length) * 100)
            : 0,
      };
      return acc;
    },
    {} as Record<
      StageSetupCategory,
      { total: number; completed: number; rate: number }
    >
  );

  return { totalCount, completedCount, pendingCount, progressRate, categoryStats };
}

// ============================================================
// 1. localStorage 키 형식
// ============================================================

describe("localStorage 키 형식", () => {
  it("키는 'dancebase:stage-setup-checklist:{groupId}:{projectId}' 형식이다", () => {
    expect(lsKey("g1", "p1")).toBe(
      "dancebase:stage-setup-checklist:g1:p1"
    );
  });

  it("그룹 ID 또는 프로젝트 ID가 달라지면 키가 달라진다", () => {
    expect(lsKey("g1", "p1")).not.toBe(lsKey("g2", "p1"));
    expect(lsKey("g1", "p1")).not.toBe(lsKey("g1", "p2"));
  });

  it("그룹+프로젝트 조합이 같아야 동일 키이다", () => {
    expect(lsKey("g1", "p1")).toBe(lsKey("g1", "p1"));
  });
});

// ============================================================
// 2. 빈 체크리스트 초기 상태
// ============================================================

describe("빈 체크리스트 초기 상태", () => {
  it("items는 빈 배열이다", () => {
    expect(createEmptyData("g1", "p1").items).toEqual([]);
  });

  it("groupId가 올바르게 설정된다", () => {
    expect(createEmptyData("g1", "p1").groupId).toBe("g1");
  });

  it("projectId가 올바르게 설정된다", () => {
    expect(createEmptyData("g1", "p1").projectId).toBe("p1");
  });
});

// ============================================================
// 3. addItem
// ============================================================

describe("addItem", () => {
  it("항목이 추가되면 items 길이가 1 증가한다", () => {
    const data = createEmptyData("g1", "p1");
    const { data: updated } = addItem(data, {
      category: "sound",
      content: "마이크 체크",
    });
    expect(updated.items).toHaveLength(1);
  });

  it("content가 트림된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, {
      category: "sound",
      content: "  마이크 체크  ",
    });
    expect(item.content).toBe("마이크 체크");
  });

  it("completed는 초기에 false이다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "lighting", content: "조명 확인" });
    expect(item.completed).toBe(false);
  });

  it("completedAt는 초기에 undefined이다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "floor", content: "바닥 확인" });
    expect(item.completedAt).toBeUndefined();
  });

  it("assignee가 트림된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, {
      category: "sound",
      content: "마이크 체크",
      assignee: "  음향팀  ",
    });
    expect(item.assignee).toBe("음향팀");
  });

  it("assignee가 빈 문자열이면 undefined가 된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, {
      category: "sound",
      content: "마이크 체크",
      assignee: "",
    });
    expect(item.assignee).toBeUndefined();
  });

  it("notes가 트림된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, {
      category: "sound",
      content: "마이크 체크",
      notes: "  확인 필요  ",
    });
    expect(item.notes).toBe("확인 필요");
  });

  it("notes가 빈 문자열이면 undefined가 된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, {
      category: "sound",
      content: "마이크 체크",
      notes: "",
    });
    expect(item.notes).toBeUndefined();
  });

  it("category가 올바르게 설정된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "costume", content: "의상 확인" });
    expect(item.category).toBe("costume");
  });

  it("여러 항목을 순서대로 추가할 수 있다", () => {
    let data = createEmptyData("g1", "p1");
    data = addItem(data, { category: "sound", content: "마이크 체크" }).data;
    data = addItem(data, { category: "lighting", content: "조명 확인" }).data;
    expect(data.items).toHaveLength(2);
  });
});

// ============================================================
// 4. updateItem
// ============================================================

describe("updateItem", () => {
  it("존재하는 항목 수정은 success가 true이다", () => {
    const item = makeItem({ id: "i1" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { success } = updateItem(data, "i1", { content: "새 내용" });
    expect(success).toBe(true);
  });

  it("존재하지 않는 항목 수정은 success가 false이다", () => {
    const data = createEmptyData("g1", "p1");
    const { success } = updateItem(data, "nonexistent", { content: "새 내용" });
    expect(success).toBe(false);
  });

  it("content가 트림되어 수정된다", () => {
    const item = makeItem({ id: "i1", content: "기존" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = updateItem(data, "i1", { content: "  새 내용  " });
    expect(updated.items[0]!.content).toBe("새 내용");
  });

  it("category를 수정할 수 있다", () => {
    const item = makeItem({ id: "i1", category: "sound" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = updateItem(data, "i1", { category: "lighting" });
    expect(updated.items[0]!.category).toBe("lighting");
  });

  it("assignee를 빈 문자열로 수정하면 undefined가 된다", () => {
    const item = makeItem({ id: "i1", assignee: "음향팀" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = updateItem(data, "i1", { assignee: "" });
    expect(updated.items[0]!.assignee).toBeUndefined();
  });

  it("notes를 빈 문자열로 수정하면 undefined가 된다", () => {
    const item = makeItem({ id: "i1", notes: "메모" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = updateItem(data, "i1", { notes: "" });
    expect(updated.items[0]!.notes).toBeUndefined();
  });
});

// ============================================================
// 5. toggleItem
// ============================================================

describe("toggleItem", () => {
  it("completed가 false이면 true로 전환된다", () => {
    const item = makeItem({ id: "i1", completed: false });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(updated.items[0]!.completed).toBe(true);
  });

  it("completed가 true이면 false로 전환된다", () => {
    const item = makeItem({ id: "i1", completed: true, completedAt: "2026-01-01T00:00:00.000Z" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(updated.items[0]!.completed).toBe(false);
  });

  it("완료로 전환 시 completedAt이 설정된다", () => {
    const item = makeItem({ id: "i1", completed: false, completedAt: undefined });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(updated.items[0]!.completedAt).toBeDefined();
  });

  it("미완료로 전환 시 completedAt이 undefined가 된다", () => {
    const item = makeItem({ id: "i1", completed: true, completedAt: "2026-01-01T00:00:00.000Z" });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(updated.items[0]!.completedAt).toBeUndefined();
  });

  it("존재하지 않는 항목 토글은 success가 false이다", () => {
    const data = createEmptyData("g1", "p1");
    const { success } = toggleItem(data, "nonexistent");
    expect(success).toBe(false);
  });

  it("다른 항목의 completed는 영향 받지 않는다", () => {
    const items = [
      makeItem({ id: "i1", completed: false }),
      makeItem({ id: "i2", completed: true }),
    ];
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items,
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(updated.items.find((i) => i.id === "i2")!.completed).toBe(true);
  });
});

// ============================================================
// 6. deleteItem
// ============================================================

describe("deleteItem", () => {
  it("존재하는 항목 삭제는 success가 true이다", () => {
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [makeItem({ id: "i1" })],
    };
    const { success } = deleteItem(data, "i1");
    expect(success).toBe(true);
  });

  it("삭제 후 항목이 목록에서 제거된다", () => {
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [makeItem({ id: "i1" }), makeItem({ id: "i2", content: "다른 항목" })],
    };
    const { data: updated } = deleteItem(data, "i1");
    expect(updated.items.some((i) => i.id === "i1")).toBe(false);
    expect(updated.items).toHaveLength(1);
  });

  it("존재하지 않는 항목 삭제는 success가 false이다", () => {
    const data = createEmptyData("g1", "p1");
    const { success } = deleteItem(data, "nonexistent");
    expect(success).toBe(false);
  });
});

// ============================================================
// 7. resetAll
// ============================================================

describe("resetAll", () => {
  it("모든 항목의 completed가 false로 초기화된다", () => {
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [
        makeItem({ id: "i1", completed: true, completedAt: "2026-01-01T00:00:00.000Z" }),
        makeItem({ id: "i2", completed: true, completedAt: "2026-01-01T00:00:00.000Z" }),
      ],
    };
    const updated = resetAll(data);
    updated.items.forEach((i) => {
      expect(i.completed).toBe(false);
    });
  });

  it("모든 항목의 completedAt이 undefined로 초기화된다", () => {
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [
        makeItem({ id: "i1", completed: true, completedAt: "2026-01-01T00:00:00.000Z" }),
      ],
    };
    const updated = resetAll(data);
    expect(updated.items[0]!.completedAt).toBeUndefined();
  });

  it("빈 항목 목록에서 resetAll은 오류가 없다", () => {
    const data = createEmptyData("g1", "p1");
    const updated = resetAll(data);
    expect(updated.items).toHaveLength(0);
  });

  it("content, category 등 다른 필드는 초기화되지 않는다", () => {
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [
        makeItem({ id: "i1", content: "마이크 체크", category: "sound", completed: true }),
      ],
    };
    const updated = resetAll(data);
    expect(updated.items[0]!.content).toBe("마이크 체크");
    expect(updated.items[0]!.category).toBe("sound");
  });
});

// ============================================================
// 8. 통계 계산 (calcStats)
// ============================================================

describe("통계 계산 (calcStats)", () => {
  it("항목이 없으면 모든 수치가 0이다", () => {
    const stats = calcStats([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.completedCount).toBe(0);
    expect(stats.pendingCount).toBe(0);
    expect(stats.progressRate).toBe(0);
  });

  it("totalCount는 전체 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1" }),
      makeItem({ id: "i2", content: "B" }),
    ];
    expect(calcStats(items).totalCount).toBe(2);
  });

  it("completedCount는 completed가 true인 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: false }),
    ];
    expect(calcStats(items).completedCount).toBe(1);
  });

  it("pendingCount는 completed가 false인 항목 수이다", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: false }),
      makeItem({ id: "i3", completed: false }),
    ];
    expect(calcStats(items).pendingCount).toBe(2);
  });

  it("completedCount + pendingCount === totalCount이다", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: false }),
    ];
    const stats = calcStats(items);
    expect(stats.completedCount + stats.pendingCount).toBe(stats.totalCount);
  });

  it("progressRate는 completedCount / totalCount * 100 (반올림)이다", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: false }),
    ];
    expect(calcStats(items).progressRate).toBe(50);
  });

  it("모두 완료이면 progressRate는 100이다", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: true }),
    ];
    expect(calcStats(items).progressRate).toBe(100);
  });

  it("progressRate가 반올림된다 (1/3 → 33)", () => {
    const items = [
      makeItem({ id: "i1", completed: true }),
      makeItem({ id: "i2", completed: false }),
      makeItem({ id: "i3", completed: false }),
    ];
    expect(calcStats(items).progressRate).toBe(33);
  });
});

// ============================================================
// 9. 카테고리별 통계 (categoryStats)
// ============================================================

describe("카테고리별 통계 (categoryStats)", () => {
  it("6개의 카테고리 키가 모두 존재한다", () => {
    const stats = calcStats([]);
    const categories: StageSetupCategory[] = [
      "sound", "lighting", "floor", "props", "costume", "tech",
    ];
    categories.forEach((cat) => {
      expect(stats.categoryStats).toHaveProperty(cat);
    });
  });

  it("항목이 없는 카테고리의 total은 0이다", () => {
    const stats = calcStats([]);
    expect(stats.categoryStats.sound.total).toBe(0);
  });

  it("항목이 없는 카테고리의 rate는 0이다", () => {
    const stats = calcStats([]);
    expect(stats.categoryStats.lighting.rate).toBe(0);
  });

  it("sound 카테고리의 total이 올바르게 계산된다", () => {
    const items = [
      makeItem({ id: "i1", category: "sound" }),
      makeItem({ id: "i2", category: "sound" }),
      makeItem({ id: "i3", category: "lighting" }),
    ];
    expect(calcStats(items).categoryStats.sound.total).toBe(2);
  });

  it("sound 카테고리의 completed가 올바르게 계산된다", () => {
    const items = [
      makeItem({ id: "i1", category: "sound", completed: true }),
      makeItem({ id: "i2", category: "sound", completed: false }),
    ];
    expect(calcStats(items).categoryStats.sound.completed).toBe(1);
  });

  it("sound 카테고리의 rate가 올바르게 계산된다 (1/2 = 50%)", () => {
    const items = [
      makeItem({ id: "i1", category: "sound", completed: true }),
      makeItem({ id: "i2", category: "sound", completed: false }),
    ];
    expect(calcStats(items).categoryStats.sound.rate).toBe(50);
  });

  it("모든 카테고리 항목이 완료이면 rate는 100이다", () => {
    const items = [
      makeItem({ id: "i1", category: "props", completed: true }),
      makeItem({ id: "i2", category: "props", completed: true }),
    ];
    expect(calcStats(items).categoryStats.props.rate).toBe(100);
  });
});

// ============================================================
// 10. 경계값 테스트
// ============================================================

describe("경계값 테스트", () => {
  it("항목 1개에서 완료 토글 후 progressRate는 100이다", () => {
    const item = makeItem({ id: "i1", completed: false });
    const data: StageSetupChecklistData = {
      ...createEmptyData("g1", "p1"),
      items: [item],
    };
    const { data: updated } = toggleItem(data, "i1");
    expect(calcStats(updated.items).progressRate).toBe(100);
  });

  it("공백만 있는 content를 추가하면 트림되어 빈 문자열이 된다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "sound", content: "   " });
    expect(item.content).toBe("");
  });

  it("assignee가 없으면 undefined이다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "sound", content: "체크" });
    expect(item.assignee).toBeUndefined();
  });

  it("notes가 없으면 undefined이다", () => {
    const data = createEmptyData("g1", "p1");
    const { item } = addItem(data, { category: "sound", content: "체크" });
    expect(item.notes).toBeUndefined();
  });

  it("빈 목록에서 삭제는 success가 false이다", () => {
    const data = createEmptyData("g1", "p1");
    const { success } = deleteItem(data, "nonexistent");
    expect(success).toBe(false);
  });
});

// ============================================================
// 11. 그룹+프로젝트별 격리 시나리오
// ============================================================

describe("그룹+프로젝트별 격리 시나리오", () => {
  it("두 (그룹, 프로젝트) 쌍의 데이터는 독립적이다", () => {
    let data1 = createEmptyData("g1", "p1");
    const data2 = createEmptyData("g2", "p1");
    data1 = addItem(data1, { category: "sound", content: "마이크 체크" }).data;
    expect(data1.items).toHaveLength(1);
    expect(data2.items).toHaveLength(0);
  });

  it("같은 그룹 다른 프로젝트의 데이터는 독립적이다", () => {
    let data1 = createEmptyData("g1", "p1");
    const data2 = createEmptyData("g1", "p2");
    data1 = addItem(data1, { category: "lighting", content: "조명 확인" }).data;
    expect(data1.items).toHaveLength(1);
    expect(data2.items).toHaveLength(0);
  });
});
