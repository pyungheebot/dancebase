import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── in-memory store ─────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

// ─── local-storage mock ───────────────────────────────────────
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

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const initialData = fetcher();
      const [data, setData] = reactUseState<unknown>(() => initialData);
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

// ─── 의존성 mock ──────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceGlossaryEntries: (id: string) => `dance-glossary-entries-${id}`,
    danceGlossary: (id: string) => `dance-glossary-${id}`,
  },
}));

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

import {
  useDanceGlossary,
  getInitial,
} from "@/hooks/use-dance-glossary";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-glossary-1";

function makeHook(groupId = GROUP_ID) {
  return renderHook(() => useDanceGlossary(groupId));
}

function makeTermParams(overrides: Partial<{
  term: string;
  definition: string;
  category: string;
  relatedTerms: string[];
  example: string;
  addedBy: string;
}> = {}) {
  return {
    term: "팝핀",
    definition: "근육을 빠르게 수축/이완하여 표현하는 댄스 장르",
    category: "hiphop" as const,
    relatedTerms: [],
    addedBy: "관리자",
    ...overrides,
  };
}

function clearStore() {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
}

// ============================================================
// getInitial 순수 함수 테스트
// ============================================================

describe("getInitial - 첫 글자 초성/알파벳 추출", () => {
  it("한글 '가'의 초성은 ㄱ이다", () => {
    expect(getInitial("가나다")).toBe("ㄱ");
  });

  it("한글 '나'의 초성은 ㄴ이다", () => {
    expect(getInitial("나무")).toBe("ㄴ");
  });

  it("한글 '다'의 초성은 ㄷ이다", () => {
    expect(getInitial("다나카")).toBe("ㄷ");
  });

  it("알파벳 소문자는 대문자로 변환된다", () => {
    expect(getInitial("apple")).toBe("A");
    expect(getInitial("break")).toBe("B");
  });

  it("알파벳 대문자는 그대로 반환된다", () => {
    expect(getInitial("Apple")).toBe("A");
    expect(getInitial("Break")).toBe("B");
  });

  it("빈 문자열은 '#'을 반환한다", () => {
    expect(getInitial("")).toBe("#");
  });

  it("숫자로 시작하면 '#'을 반환한다", () => {
    expect(getInitial("1박자")).toBe("#");
  });

  it("특수문자로 시작하면 '#'을 반환한다", () => {
    expect(getInitial("!팝핀")).toBe("#");
  });

  it("한글 '팝핀'의 초성은 ㅍ이다", () => {
    expect(getInitial("팝핀")).toBe("ㅍ");
  });

  it("한글 '힙합'의 초성은 ㅎ이다", () => {
    expect(getInitial("힙합")).toBe("ㅎ");
  });

  it("한글 자모 단독(ㄱ)은 그대로 반환된다", () => {
    expect(getInitial("ㄱ나")).toBe("ㄱ");
  });

  it("공백으로 시작하는 문자열은 trim 후 첫 글자 초성을 반환한다", () => {
    // "  팝핀" → trim → "팝핀" → 초성 ㅍ
    const result = getInitial("  팝핀");
    expect(result).toBe("ㅍ");
  });
});

// ============================================================
// useDanceGlossary - 초기 상태
// ============================================================

describe("useDanceGlossary - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 totalTerms는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalTerms).toBe(0);
  });

  it("초기 categoryDistribution은 빈 객체다", () => {
    const { result } = makeHook();
    expect(Object.keys(result.current.categoryDistribution)).toHaveLength(0);
  });

  it("초기 indexGroups은 빈 Map이다", () => {
    const { result } = makeHook();
    expect(result.current.indexGroups.size).toBe(0);
  });

  it("초기 indexKeys는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.indexKeys).toEqual([]);
  });

  it("addTerm, updateTerm, deleteTerm 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addTerm).toBe("function");
    expect(typeof result.current.updateTerm).toBe("function");
    expect(typeof result.current.deleteTerm).toBe("function");
  });

  it("searchTerms, getByCategory 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.searchTerms).toBe("function");
    expect(typeof result.current.getByCategory).toBe("function");
  });
});

// ============================================================
// useDanceGlossary - addTerm 용어 추가
// ============================================================

describe("useDanceGlossary - addTerm 용어 추가", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("용어 추가 시 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("addTerm은 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addTerm(makeTermParams());
    });
    expect(ok).toBe(true);
  });

  it("추가된 용어의 term이 trim된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "  팝핀  " }));
    });
    expect(result.current.entries[0].term).toBe("팝핀");
  });

  it("추가된 용어의 definition이 500자로 제한된다", () => {
    const { result } = makeHook();
    const longDef = "a".repeat(600);
    act(() => {
      result.current.addTerm(makeTermParams({ definition: longDef }));
    });
    expect(result.current.entries[0].definition.length).toBe(500);
  });

  it("addedBy가 빈 문자열이면 '익명'으로 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ addedBy: "" }));
    });
    expect(result.current.entries[0].addedBy).toBe("익명");
  });

  it("addedBy가 공백만이면 '익명'으로 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ addedBy: "   " }));
    });
    expect(result.current.entries[0].addedBy).toBe("익명");
  });

  it("createdAt이 ISO 형식이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    expect(result.current.entries[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it("여러 용어가 가나다 순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "힙합" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "가나다" }));
    });
    expect(result.current.entries[0].term).toBe("가나다");
    expect(result.current.entries[1].term).toBe("힙합");
  });

  it("용어 추가 시 totalTerms가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "용어1" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "용어2" }));
    });
    expect(result.current.totalTerms).toBe(2);
  });

  it("용어 추가 시 memStore에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    const key = `dancebase:dance-glossary:${GROUP_ID}`;
    expect(memStore[key]).toBeDefined();
  });
});

// ============================================================
// useDanceGlossary - updateTerm 용어 수정
// ============================================================

describe("useDanceGlossary - updateTerm 용어 수정", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("용어 definition을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "브레이킹" }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateTerm(id, { definition: "수정된 정의" });
    });
    const entry = result.current.entries.find((e) => e.id === id);
    expect(entry?.definition).toBe("수정된 정의");
  });

  it("updateTerm은 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    const id = result.current.entries[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateTerm(id, { definition: "새 정의" });
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 id로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateTerm("non-existent", { definition: "변경" });
    });
    expect(ok).toBe(false);
  });

  it("수정 시 entries 수는 그대로다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateTerm(id, { definition: "수정" });
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("definition이 500자로 제한된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateTerm(id, { definition: "x".repeat(600) });
    });
    const entry = result.current.entries.find((e) => e.id === id);
    expect(entry?.definition.length).toBe(500);
  });

  it("addedBy가 빈 문자열이면 '익명'으로 수정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ addedBy: "원작자" }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateTerm(id, { addedBy: "" });
    });
    const entry = result.current.entries.find((e) => e.id === id);
    expect(entry?.addedBy).toBe("익명");
  });
});

// ============================================================
// useDanceGlossary - deleteTerm 용어 삭제
// ============================================================

describe("useDanceGlossary - deleteTerm 용어 삭제", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("용어 삭제 시 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteTerm(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 용어만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "가나다" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "힙합" }));
    });
    const id = result.current.entries.find((e) => e.term === "힙합")?.id;
    act(() => {
      result.current.deleteTerm(id!);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].term).toBe("가나다");
  });
});

// ============================================================
// useDanceGlossary - searchTerms 검색
// ============================================================

describe("useDanceGlossary - searchTerms 용어 검색", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("빈 쿼리는 전체 목록을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "락킹" }));
    });
    const results = result.current.searchTerms("");
    expect(results).toHaveLength(2);
  });

  it("term 이름으로 검색할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "락킹" }));
    });
    const results = result.current.searchTerms("팝핀");
    expect(results).toHaveLength(1);
    expect(results[0].term).toBe("팝핀");
  });

  it("definition으로도 검색할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({
        term: "팝핀",
        definition: "근육 수축 댄스 장르",
      }));
    });
    const results = result.current.searchTerms("근육 수축");
    expect(results).toHaveLength(1);
  });

  it("일치하는 결과가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀" }));
    });
    const results = result.current.searchTerms("존재하지않는검색어");
    expect(results).toHaveLength(0);
  });

  it("대소문자를 구분하지 않고 검색한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "Breaking" }));
    });
    const results = result.current.searchTerms("breaking");
    expect(results).toHaveLength(1);
  });

  it("공백만 있는 쿼리는 전체 목록을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀" }));
    });
    const results = result.current.searchTerms("   ");
    expect(results).toHaveLength(1);
  });
});

// ============================================================
// useDanceGlossary - getByCategory 카테고리 필터
// ============================================================

describe("useDanceGlossary - getByCategory 카테고리별 필터", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("해당 카테고리의 용어만 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀", category: "hiphop" as const }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "발레 기초", category: "ballet" as const }));
    });
    const results = result.current.getByCategory("hiphop" as never);
    expect(results).toHaveLength(1);
    expect(results[0].term).toBe("팝핀");
  });

  it("해당 카테고리에 용어가 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const results = result.current.getByCategory("ballet" as never);
    expect(results).toEqual([]);
  });
});

// ============================================================
// useDanceGlossary - categoryDistribution / indexGroups
// ============================================================

describe("useDanceGlossary - categoryDistribution / indexGroups", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("용어 추가 시 categoryDistribution이 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀", category: "hiphop" as const }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "힙합2", category: "hiphop" as const }));
    });
    expect(result.current.categoryDistribution["hiphop" as never]).toBe(2);
  });

  it("용어 추가 시 indexGroups이 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "팝핀" }));
    });
    // '팝핀'의 초성은 ㅍ
    expect(result.current.indexGroups.has("ㅍ")).toBe(true);
  });

  it("indexKeys는 정렬된 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addTerm(makeTermParams({ term: "힙합" }));
    });
    act(() => {
      result.current.addTerm(makeTermParams({ term: "가나다" }));
    });
    const keys = result.current.indexKeys;
    expect(keys.length).toBeGreaterThan(0);
    // 첫 번째 키는 마지막보다 정렬상 앞이거나 같아야 함
    expect(keys[0].localeCompare(keys[keys.length - 1], "ko")).toBeLessThanOrEqual(0);
  });

  it("그룹별로 데이터가 격리된다", () => {
    const { result: r1 } = renderHook(() => useDanceGlossary("group-A"));
    const { result: r2 } = renderHook(() => useDanceGlossary("group-B"));

    act(() => {
      r1.current.addTerm(makeTermParams({ term: "A그룹 용어" }));
    });

    expect(r1.current.totalTerms).toBe(1);
    expect(r2.current.totalTerms).toBe(0);
  });
});
