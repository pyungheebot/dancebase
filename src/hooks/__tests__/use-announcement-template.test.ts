import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useAnnouncementTemplate,
  interpolateTemplate,
  extractVariableKeys,
} from "@/hooks/use-announcement-template";
import type {
  AnnouncementTemplateEntry,
  AnnouncementTemplateCategory,
} from "@/types";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── local-storage mock (vi.hoisted로 참조 가능한 store 생성) ──
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    return (memStore[key] as T) ?? defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
// async fetcher를 동기적으로 처리: Promise를 즉시 resolve하여 초기 data를 설정
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }

      // async fetcher는 Promise를 반환하므로 초기값 결정을 위해 동기 추출
      let initialData: unknown = undefined;
      const fetchResult = fetcher();
      if (fetchResult instanceof Promise) {
        fetchResult.then((v) => { initialData = v; });
      } else {
        initialData = fetchResult;
      }

      const [data, setData] = reactUseState<unknown>(() => initialData);

      // setDataRef로 stale closure 방지
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          const r = fetcher!();
          if (r instanceof Promise) {
            r.then((v) => setDataRef.current(v));
          } else {
            setDataRef.current(r as unknown);
          }
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    announcementTemplate: (groupId: string) => `announcement-template-${groupId}`,
  },
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ──────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    TEMPLATE: {
      NAME_REQUIRED: "이름을 입력해주세요",
      TITLE_REQUIRED: "제목 템플릿을 입력해주세요",
      BODY_REQUIRED: "본문 템플릿을 입력해주세요",
      NOT_FOUND: "템플릿을 찾을 수 없습니다",
      ADDED: "템플릿이 추가되었습니다",
      UPDATED: "템플릿이 수정되었습니다",
      DELETED: "템플릿이 삭제되었습니다",
    },
  },
}));

// ─── window.localStorage는 사용하지 않지만 JSDOM 호환을 위해 유지 ──

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useAnnouncementTemplate(groupId));
}

function makeInput(overrides: Partial<{
  name: string;
  category: AnnouncementTemplateCategory;
  titleTemplate: string;
  bodyTemplate: string;
}> = {}) {
  return {
    name: "기본 템플릿",
    category: "practice" as AnnouncementTemplateCategory,
    titleTemplate: "{{날짜}} 연습 공지",
    bodyTemplate: "{{내용}}을 공지합니다.",
    ...overrides,
  };
}

// ============================================================
// interpolateTemplate - 순수 함수 테스트
// ============================================================

describe("interpolateTemplate - 변수 치환 함수", () => {
  it("{{변수}} 패턴을 값으로 치환한다", () => {
    const result = interpolateTemplate("안녕 {{이름}}!", { 이름: "홍길동" });
    expect(result).toBe("안녕 홍길동!");
  });

  it("여러 변수를 동시에 치환한다", () => {
    const result = interpolateTemplate("{{날짜}} {{장소}} 연습", {
      날짜: "3월 1일",
      장소: "연습실",
    });
    expect(result).toBe("3월 1일 연습실 연습");
  });

  it("값이 없는 변수는 빈 문자열로 대체한다", () => {
    const result = interpolateTemplate("{{날짜}} 연습", {});
    expect(result).toBe(" 연습");
  });

  it("변수가 없는 템플릿은 그대로 반환한다", () => {
    const result = interpolateTemplate("변수 없는 텍스트", { 키: "값" });
    expect(result).toBe("변수 없는 텍스트");
  });

  it("빈 문자열에 대해 빈 문자열을 반환한다", () => {
    const result = interpolateTemplate("", { 키: "값" });
    expect(result).toBe("");
  });

  it("동일 변수가 여러 번 등장해도 모두 치환한다", () => {
    const result = interpolateTemplate("{{이름}} 안녕, {{이름}}!", { 이름: "동호" });
    expect(result).toBe("동호 안녕, 동호!");
  });

  it("변수 키에 공백이 있어도 trim 후 치환한다", () => {
    const result = interpolateTemplate("{{ 이름 }}", { 이름: "짱" });
    expect(result).toBe("짱");
  });

  it("중첩 중괄호 패턴은 치환하지 않는다", () => {
    const result = interpolateTemplate("{이름}", { 이름: "값" });
    expect(result).toBe("{이름}");
  });

  it("undefined 값은 빈 문자열로 대체한다", () => {
    const values: Record<string, string> = {};
    const result = interpolateTemplate("{{없는키}}", values);
    expect(result).toBe("");
  });
});

// ============================================================
// extractVariableKeys - 순수 함수 테스트
// ============================================================

describe("extractVariableKeys - 변수 키 추출 함수", () => {
  it("단일 변수 키를 추출한다", () => {
    const keys = extractVariableKeys("{{날짜}} 연습");
    expect(keys).toContain("날짜");
  });

  it("여러 변수 키를 추출한다", () => {
    const keys = extractVariableKeys("{{날짜}} {{장소}} {{내용}}");
    expect(keys).toHaveLength(3);
    expect(keys).toContain("날짜");
    expect(keys).toContain("장소");
    expect(keys).toContain("내용");
  });

  it("중복 변수 키는 한 번만 포함한다", () => {
    const keys = extractVariableKeys("{{이름}} 안녕, {{이름}}!");
    expect(keys).toHaveLength(1);
    expect(keys).toContain("이름");
  });

  it("변수가 없는 문자열은 빈 배열을 반환한다", () => {
    const keys = extractVariableKeys("변수 없음");
    expect(keys).toHaveLength(0);
  });

  it("빈 문자열은 빈 배열을 반환한다", () => {
    const keys = extractVariableKeys("");
    expect(keys).toHaveLength(0);
  });

  it("공백 포함 변수 키를 trim 후 추출한다", () => {
    const keys = extractVariableKeys("{{ 이름 }}");
    expect(keys).toContain("이름");
  });
});

// ============================================================
// useAnnouncementTemplate - 초기 상태
// ============================================================

describe("useAnnouncementTemplate - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("초기 stats.totalUseCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalUseCount).toBe(0);
  });

  it("초기 stats.mostUsed는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.mostUsed).toBeNull();
  });

  it("초기 stats.byCategory는 모두 0이다", () => {
    const { result } = makeHook();
    const { byCategory } = result.current.stats;
    expect(byCategory.practice).toBe(0);
    expect(byCategory.performance).toBe(0);
    expect(byCategory.meeting).toBe(0);
    expect(byCategory.gathering).toBe(0);
    expect(byCategory.etc).toBe(0);
  });

  it("필요한 함수가 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addTemplate).toBe("function");
    expect(typeof result.current.updateTemplate).toBe("function");
    expect(typeof result.current.deleteTemplate).toBe("function");
    expect(typeof result.current.incrementUseCount).toBe("function");
    expect(typeof result.current.previewTemplate).toBe("function");
    expect(typeof result.current.filterByCategory).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useAnnouncementTemplate - addTemplate
// ============================================================

describe("useAnnouncementTemplate - addTemplate", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("템플릿 추가 후 entries 길이가 1이 된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("추가된 템플릿에 id가 부여된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    expect(result.current.entries[0].id).toBeDefined();
    expect(result.current.entries[0].id).not.toBe("");
  });

  it("추가된 템플릿에 groupId가 올바르게 설정된다", async () => {
    const { result } = makeHook("group-abc");
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    expect(result.current.entries[0].groupId).toBe("group-abc");
  });

  it("name이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.addTemplate(makeInput({ name: "" }));
    });
    expect(ret!).toBe(false);
  });

  it("titleTemplate이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.addTemplate(makeInput({ titleTemplate: "" }));
    });
    expect(ret!).toBe(false);
  });

  it("bodyTemplate이 빈 문자열이면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.addTemplate(makeInput({ bodyTemplate: "" }));
    });
    expect(ret!).toBe(false);
  });

  it("name이 공백만 있으면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.addTemplate(makeInput({ name: "   " }));
    });
    expect(ret!).toBe(false);
  });

  it("정상 추가 시 true를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.addTemplate(makeInput());
    });
    expect(ret!).toBe(true);
  });

  it("추가된 템플릿의 useCount는 0이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    expect(result.current.entries[0].useCount).toBe(0);
  });

  it("템플릿 변수가 자동으로 추출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({
        titleTemplate: "{{날짜}} 공지",
        bodyTemplate: "{{내용}} 안내",
      }));
    });
    const vars = result.current.entries[0].variables;
    const keys = vars.map((v) => v.key);
    expect(keys).toContain("날짜");
    expect(keys).toContain("내용");
  });

  it("제목과 본문에서 변수를 통합하여 중복 없이 추출한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({
        titleTemplate: "{{날짜}} 연습",
        bodyTemplate: "{{날짜}} {{장소}} 안내",
      }));
    });
    const vars = result.current.entries[0].variables;
    const keys = vars.map((v) => v.key);
    const uniqueKeys = Array.from(new Set(keys));
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it("추가 후 memStore에 저장된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    // saveToStorage mock이 memStore에 값을 저장했는지 확인
    const keys = Object.keys(memStore);
    expect(keys.length).toBeGreaterThan(0);
  });

  it("추가된 템플릿의 createdAt이 ISO 형식이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const { createdAt } = result.current.entries[0];
    expect(new Date(createdAt).toString()).not.toBe("Invalid Date");
  });
});

// ============================================================
// useAnnouncementTemplate - updateTemplate
// ============================================================

describe("useAnnouncementTemplate - updateTemplate", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("존재하지 않는 id로 수정하면 false를 반환한다", async () => {
    const { result } = makeHook();
    let ret: boolean;
    await act(async () => {
      ret = await result.current.updateTemplate("non-existent", { name: "새이름" });
    });
    expect(ret!).toBe(false);
  });

  it("템플릿 name 수정이 반영된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ name: "원래 이름" }));
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.updateTemplate(id, { name: "수정된 이름" });
    });
    expect(result.current.entries[0].name).toBe("수정된 이름");
  });

  it("수정 후 updatedAt이 갱신된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    const originalUpdatedAt = result.current.entries[0].updatedAt;
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 1000));
    await act(async () => {
      await result.current.updateTemplate(id, { name: "새이름" });
    });
    vi.useRealTimers();
    expect(result.current.entries[0].updatedAt).not.toBe(originalUpdatedAt);
  });

  it("정상 수정 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean;
    await act(async () => {
      ret = await result.current.updateTemplate(id, { name: "수정 이름" });
    });
    expect(ret!).toBe(true);
  });

  it("템플릿 수정 시 변수 목록이 재추출된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({
        titleTemplate: "{{날짜}} 공지",
        bodyTemplate: "{{내용}}",
      }));
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.updateTemplate(id, {
        bodyTemplate: "{{내용}} {{장소}}",
      });
    });
    const keys = result.current.entries[0].variables.map((v) => v.key);
    expect(keys).toContain("장소");
  });
});

// ============================================================
// useAnnouncementTemplate - deleteTemplate
// ============================================================

describe("useAnnouncementTemplate - deleteTemplate", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("삭제 후 entries 길이가 감소한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.deleteTemplate(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 템플릿만 삭제된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ name: "템플릿1" }));
    });
    await act(async () => {
      await result.current.addTemplate(makeInput({ name: "템플릿2" }));
    });
    const id1 = result.current.entries.find((e: AnnouncementTemplateEntry) => e.name === "템플릿1")!.id;
    await act(async () => {
      await result.current.deleteTemplate(id1);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].name).toBe("템플릿2");
  });

  it("삭제 시 true를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean;
    await act(async () => {
      ret = await result.current.deleteTemplate(id);
    });
    expect(ret!).toBe(true);
  });
});

// ============================================================
// useAnnouncementTemplate - incrementUseCount
// ============================================================

describe("useAnnouncementTemplate - incrementUseCount", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("useCount가 1 증가한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => {
      await result.current.incrementUseCount(id);
    });
    expect(result.current.entries[0].useCount).toBe(1);
  });

  it("여러 번 호출하면 누적된다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    await act(async () => { await result.current.incrementUseCount(id); });
    await act(async () => { await result.current.incrementUseCount(id); });
    await act(async () => { await result.current.incrementUseCount(id); });
    expect(result.current.entries[0].useCount).toBe(3);
  });
});

// ============================================================
// useAnnouncementTemplate - previewTemplate
// ============================================================

describe("useAnnouncementTemplate - previewTemplate", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("존재하지 않는 id는 null을 반환한다", () => {
    const { result } = makeHook();
    const preview = result.current.previewTemplate("non-existent", {});
    expect(preview).toBeNull();
  });

  it("변수를 치환한 미리보기를 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({
        titleTemplate: "{{날짜}} 연습",
        bodyTemplate: "{{장소}}에서 만나요",
      }));
    });
    const id = result.current.entries[0].id;
    const preview = result.current.previewTemplate(id, { 날짜: "3/1", 장소: "연습실" });
    expect(preview).not.toBeNull();
    expect(preview!.title).toBe("3/1 연습");
    expect(preview!.body).toBe("연습실에서 만나요");
  });

  it("미리보기는 title과 body 필드를 가진다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput());
    });
    const id = result.current.entries[0].id;
    const preview = result.current.previewTemplate(id, {});
    expect(preview).toHaveProperty("title");
    expect(preview).toHaveProperty("body");
  });
});

// ============================================================
// useAnnouncementTemplate - filterByCategory
// ============================================================

describe("useAnnouncementTemplate - filterByCategory", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("'all' 필터는 모든 항목을 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "practice" }));
    });
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "performance" }));
    });
    const all = result.current.filterByCategory("all");
    expect(all).toHaveLength(2);
  });

  it("특정 카테고리로 필터링한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "practice" }));
    });
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "meeting" }));
    });
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "practice" }));
    });
    const practices = result.current.filterByCategory("practice");
    expect(practices).toHaveLength(2);
    practices.forEach((e: AnnouncementTemplateEntry) => expect(e.category).toBe("practice"));
  });

  it("해당 카테고리가 없으면 빈 배열을 반환한다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ category: "practice" }));
    });
    const performances = result.current.filterByCategory("performance");
    expect(performances).toHaveLength(0);
  });
});

// ============================================================
// useAnnouncementTemplate - stats
// ============================================================

describe("useAnnouncementTemplate - stats", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("stats.total이 entries 수와 일치한다", async () => {
    const { result } = makeHook();
    await act(async () => { await result.current.addTemplate(makeInput()); });
    await act(async () => { await result.current.addTemplate(makeInput()); });
    await act(async () => { await result.current.addTemplate(makeInput()); });
    expect(result.current.stats.total).toBe(3);
  });

  it("stats.totalUseCount가 모든 useCount 합산이다", async () => {
    const { result } = makeHook();
    await act(async () => { await result.current.addTemplate(makeInput()); });
    await act(async () => { await result.current.addTemplate(makeInput()); });
    const id1 = result.current.entries[1].id;
    const id2 = result.current.entries[0].id;
    await act(async () => { await result.current.incrementUseCount(id1); });
    await act(async () => { await result.current.incrementUseCount(id1); });
    await act(async () => { await result.current.incrementUseCount(id2); });
    expect(result.current.stats.totalUseCount).toBe(3);
  });

  it("stats.mostUsed는 useCount가 가장 높은 템플릿이다", async () => {
    const { result } = makeHook();
    await act(async () => {
      await result.current.addTemplate(makeInput({ name: "적게 사용" }));
    });
    await act(async () => {
      await result.current.addTemplate(makeInput({ name: "많이 사용" }));
    });
    const id2 = result.current.entries.find((e: AnnouncementTemplateEntry) => e.name === "많이 사용")!.id;
    await act(async () => { await result.current.incrementUseCount(id2); });
    await act(async () => { await result.current.incrementUseCount(id2); });
    expect(result.current.stats.mostUsed?.name).toBe("많이 사용");
  });

  it("stats.byCategory.practice가 올바르게 카운트된다", async () => {
    const { result } = makeHook();
    await act(async () => { await result.current.addTemplate(makeInput({ category: "practice" })); });
    await act(async () => { await result.current.addTemplate(makeInput({ category: "practice" })); });
    await act(async () => { await result.current.addTemplate(makeInput({ category: "meeting" })); });
    expect(result.current.stats.byCategory.practice).toBe(2);
    expect(result.current.stats.byCategory.meeting).toBe(1);
  });
});
