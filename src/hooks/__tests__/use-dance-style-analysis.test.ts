import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

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

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceStyleAnalysis: (memberId: string) =>
      `dancebase:dance-style-analysis:${memberId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useDanceStyleAnalysis,
  TRAIT_LABELS,
  TRAIT_COLORS,
  TRAIT_TEXT_COLORS,
  ALL_TRAITS,
  DEFAULT_TRAIT_SCORES,
  GENRE_SUGGESTIONS,
  STRENGTH_TAGS,
  WEAKNESS_TAGS,
  toDateStr,
  getScoreBarColor,
  getScoreTextStyle,
} from "@/hooks/use-dance-style-analysis";
import type { DanceStyleTrait } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────

function makeHook(memberId = "member-1") {
  return renderHook(() => useDanceStyleAnalysis(memberId));
}

function addSnapshot(
  hook: ReturnType<typeof makeHook>["result"],
  date = "2026-03-02",
  scores: Partial<Record<DanceStyleTrait, number>> = {}
) {
  act(() => {
    hook.current.addSnapshot({
      date,
      traitScores: {
        power: scores.power ?? 7,
        flexibility: scores.flexibility ?? 6,
        rhythm: scores.rhythm ?? 8,
        expression: scores.expression ?? 5,
        technique: scores.technique ?? 7,
        musicality: scores.musicality ?? 6,
      },
    });
  });
}

// ============================================================
// 상수 검증
// ============================================================

describe("TRAIT_LABELS 상수", () => {
  it("6가지 특성 레이블을 포함한다", () => {
    const traits: DanceStyleTrait[] = [
      "power",
      "flexibility",
      "rhythm",
      "expression",
      "technique",
      "musicality",
    ];
    traits.forEach((t) => {
      expect(TRAIT_LABELS[t]).toBeDefined();
    });
  });

  it("power 레이블은 '파워'이다", () => {
    expect(TRAIT_LABELS.power).toBe("파워");
  });

  it("rhythm 레이블은 '리듬감'이다", () => {
    expect(TRAIT_LABELS.rhythm).toBe("리듬감");
  });

  it("musicality 레이블은 '음악성'이다", () => {
    expect(TRAIT_LABELS.musicality).toBe("음악성");
  });
});

describe("TRAIT_COLORS 상수", () => {
  it("모든 특성에 색상이 정의되어 있다", () => {
    ALL_TRAITS.forEach((t) => {
      expect(TRAIT_COLORS[t]).toBeDefined();
    });
  });

  it("power는 red 계열 색상이다", () => {
    expect(TRAIT_COLORS.power).toContain("red");
  });
});

describe("TRAIT_TEXT_COLORS 상수", () => {
  it("모든 특성에 텍스트 색상이 정의되어 있다", () => {
    ALL_TRAITS.forEach((t) => {
      expect(TRAIT_TEXT_COLORS[t]).toBeDefined();
    });
  });
});

describe("ALL_TRAITS 상수", () => {
  it("6가지 특성을 포함한다", () => {
    expect(ALL_TRAITS).toHaveLength(6);
  });

  it("power를 포함한다", () => {
    expect(ALL_TRAITS).toContain("power");
  });
});

describe("DEFAULT_TRAIT_SCORES 상수", () => {
  it("모든 특성의 기본 점수는 5이다", () => {
    ALL_TRAITS.forEach((t) => {
      expect(DEFAULT_TRAIT_SCORES[t]).toBe(5);
    });
  });
});

describe("GENRE_SUGGESTIONS 상수", () => {
  it("1개 이상의 장르를 포함한다", () => {
    expect(GENRE_SUGGESTIONS.length).toBeGreaterThan(0);
  });

  it("힙합을 포함한다", () => {
    expect(GENRE_SUGGESTIONS).toContain("힙합");
  });
});

describe("STRENGTH_TAGS 상수", () => {
  it("1개 이상의 태그를 포함한다", () => {
    expect(STRENGTH_TAGS.length).toBeGreaterThan(0);
  });
});

describe("WEAKNESS_TAGS 상수", () => {
  it("1개 이상의 태그를 포함한다", () => {
    expect(WEAKNESS_TAGS.length).toBeGreaterThan(0);
  });
});

// ============================================================
// toDateStr 유틸
// ============================================================

describe("toDateStr 유틸 함수", () => {
  it("Date 객체를 YYYY-MM-DD 형식으로 변환한다", () => {
    const date = new Date("2026-03-02T00:00:00Z");
    expect(toDateStr(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("월이 한 자리일 때 0을 패딩한다", () => {
    const date = new Date(2026, 0, 5); // 2026-01-05 로컬
    const result = toDateStr(date);
    const [, month] = result.split("-");
    expect(month).toHaveLength(2);
  });

  it("일이 한 자리일 때 0을 패딩한다", () => {
    const date = new Date(2026, 0, 5);
    const result = toDateStr(date);
    const [, , day] = result.split("-");
    expect(day).toHaveLength(2);
  });
});

// ============================================================
// getScoreBarColor 유틸
// ============================================================

describe("getScoreBarColor 유틸 함수", () => {
  it("점수 8 이상이면 green을 반환한다", () => {
    expect(getScoreBarColor(8)).toContain("green");
    expect(getScoreBarColor(10)).toContain("green");
  });

  it("점수 6~7이면 blue를 반환한다", () => {
    expect(getScoreBarColor(6)).toContain("blue");
    expect(getScoreBarColor(7)).toContain("blue");
  });

  it("점수 4~5이면 yellow를 반환한다", () => {
    expect(getScoreBarColor(4)).toContain("yellow");
    expect(getScoreBarColor(5)).toContain("yellow");
  });

  it("점수 3 이하이면 red를 반환한다", () => {
    expect(getScoreBarColor(3)).toContain("red");
    expect(getScoreBarColor(1)).toContain("red");
  });
});

// ============================================================
// getScoreTextStyle 유틸
// ============================================================

describe("getScoreTextStyle 유틸 함수", () => {
  it("점수 8 이상이면 green 텍스트 스타일을 반환한다", () => {
    expect(getScoreTextStyle(8)).toContain("green");
  });

  it("점수 6~7이면 blue 텍스트 스타일을 반환한다", () => {
    expect(getScoreTextStyle(6)).toContain("blue");
  });

  it("점수 4~5이면 yellow 텍스트 스타일을 반환한다", () => {
    expect(getScoreTextStyle(4)).toContain("yellow");
  });

  it("점수 3 이하이면 red 텍스트 스타일을 반환한다", () => {
    expect(getScoreTextStyle(3)).toContain("red");
  });

  it("반환값에 font-semibold가 포함된다", () => {
    expect(getScoreTextStyle(8)).toContain("font-semibold");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useDanceStyleAnalysis - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 snapshots는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.snapshots).toEqual([]);
  });

  it("초기 latestSnapshot은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.latestSnapshot).toBeNull();
  });

  it("초기 stats.totalSnapshots는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalSnapshots).toBe(0);
  });

  it("초기 stats.overallAverage는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.overallAverage).toBe(0);
  });

  it("초기 stats.topTrait은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.topTrait).toBeNull();
  });

  it("초기 stats.bottomTrait은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.bottomTrait).toBeNull();
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSnapshot).toBe("function");
    expect(typeof result.current.updateSnapshot).toBe("function");
    expect(typeof result.current.deleteSnapshot).toBe("function");
    expect(typeof result.current.getStats).toBe("function");
    expect(typeof result.current.getTraitHistory).toBe("function");
    expect(typeof result.current.getRecentSnapshots).toBe("function");
  });
});

// ============================================================
// addSnapshot
// ============================================================

describe("useDanceStyleAnalysis - addSnapshot", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("스냅샷 추가 후 snapshots 길이가 1이 된다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    expect(result.current.snapshots).toHaveLength(1);
  });

  it("추가된 스냅샷에 id가 부여된다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    expect(result.current.snapshots[0].id).toBeDefined();
  });

  it("추가된 스냅샷에 createdAt이 설정된다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    expect(result.current.snapshots[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T/
    );
  });

  it("추가된 스냅샷의 date가 올바르다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-15");
    expect(result.current.snapshots[0].date).toBe("2026-01-15");
  });

  it("여러 스냅샷을 추가하면 날짜 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    addSnapshot(result, "2026-03-01");
    addSnapshot(result, "2026-02-01");
    expect(result.current.snapshots[0].date).toBe("2026-03-01");
  });

  it("latestSnapshot이 가장 최신 스냅샷을 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    addSnapshot(result, "2026-03-01");
    expect(result.current.latestSnapshot?.date).toBe("2026-03-01");
  });

  it("추가된 스냅샷의 traitScores가 올바르다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-02", { power: 9, flexibility: 4 });
    expect(result.current.snapshots[0].traitScores.power).toBe(9);
    expect(result.current.snapshots[0].traitScores.flexibility).toBe(4);
  });
});

// ============================================================
// updateSnapshot
// ============================================================

describe("useDanceStyleAnalysis - updateSnapshot", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("스냅샷 날짜를 수정할 수 있다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    const snapId = result.current.snapshots[0].id;
    act(() => {
      result.current.updateSnapshot(snapId, { date: "2026-02-01" });
    });
    expect(result.current.snapshots[0].date).toBe("2026-02-01");
  });

  it("스냅샷 점수를 수정할 수 있다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01", { power: 5 });
    const snapId = result.current.snapshots[0].id;
    act(() => {
      result.current.updateSnapshot(snapId, {
        traitScores: {
          power: 9,
          flexibility: 6,
          rhythm: 8,
          expression: 5,
          technique: 7,
          musicality: 6,
        },
      });
    });
    expect(result.current.snapshots[0].traitScores.power).toBe(9);
  });

  it("존재하지 않는 id 수정은 snapshots에 영향을 미치지 않는다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    const initialCount = result.current.snapshots.length;
    act(() => {
      result.current.updateSnapshot("non-existent", { date: "2026-12-31" });
    });
    expect(result.current.snapshots).toHaveLength(initialCount);
  });
});

// ============================================================
// deleteSnapshot
// ============================================================

describe("useDanceStyleAnalysis - deleteSnapshot", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("스냅샷 삭제 후 snapshots 길이가 감소한다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    const snapId = result.current.snapshots[0].id;
    act(() => {
      result.current.deleteSnapshot(snapId);
    });
    expect(result.current.snapshots).toHaveLength(0);
  });

  it("특정 스냅샷만 삭제된다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    addSnapshot(result, "2026-03-01");
    const snapId = result.current.snapshots.find(
      (s) => s.date === "2026-01-01"
    )?.id;
    act(() => {
      result.current.deleteSnapshot(snapId!);
    });
    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.snapshots[0].date).toBe("2026-03-01");
  });

  it("존재하지 않는 id 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.deleteSnapshot("non-existent");
      });
    }).not.toThrow();
  });

  it("마지막 스냅샷 삭제 시 latestSnapshot은 null이 된다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    const snapId = result.current.snapshots[0].id;
    act(() => {
      result.current.deleteSnapshot(snapId);
    });
    expect(result.current.latestSnapshot).toBeNull();
  });
});

// ============================================================
// getStats
// ============================================================

describe("useDanceStyleAnalysis - getStats", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("스냅샷이 없으면 overallAverage는 0이다", () => {
    const { result } = makeHook();
    const stats = result.current.getStats();
    expect(stats.overallAverage).toBe(0);
  });

  it("스냅샷 추가 후 totalSnapshots가 증가한다", () => {
    const { result } = makeHook();
    addSnapshot(result);
    addSnapshot(result, "2026-02-01");
    const stats = result.current.getStats();
    expect(stats.totalSnapshots).toBe(2);
  });

  it("overallAverage가 소수점 1자리로 계산된다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-02", {
      power: 7,
      flexibility: 6,
      rhythm: 8,
      expression: 5,
      technique: 7,
      musicality: 6,
    });
    const stats = result.current.getStats();
    expect(Number.isFinite(stats.overallAverage)).toBe(true);
  });

  it("topTrait이 최고 점수 특성을 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-02", {
      power: 10,
      flexibility: 3,
      rhythm: 5,
      expression: 5,
      technique: 5,
      musicality: 5,
    });
    const stats = result.current.getStats();
    expect(stats.topTrait).toBe("power");
  });

  it("bottomTrait이 최저 점수 특성을 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-02", {
      power: 10,
      flexibility: 2,
      rhythm: 7,
      expression: 7,
      technique: 7,
      musicality: 7,
    });
    const stats = result.current.getStats();
    expect(stats.bottomTrait).toBe("flexibility");
  });
});

// ============================================================
// getTraitHistory
// ============================================================

describe("useDanceStyleAnalysis - getTraitHistory", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("특정 특성의 시간 흐름 점수를 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01", { power: 6 });
    addSnapshot(result, "2026-03-01", { power: 8 });
    const history = result.current.getTraitHistory("power");
    expect(history).toHaveLength(2);
  });

  it("날짜 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-01", { power: 8 });
    addSnapshot(result, "2026-01-01", { power: 6 });
    const history = result.current.getTraitHistory("power");
    expect(history[0].date).toBe("2026-01-01");
    expect(history[1].date).toBe("2026-03-01");
  });

  it("반환 객체에 date와 score가 포함된다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-03-02", { rhythm: 9 });
    const history = result.current.getTraitHistory("rhythm");
    expect(history[0].date).toBe("2026-03-02");
    expect(history[0].score).toBe(9);
  });

  it("스냅샷이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getTraitHistory("power")).toEqual([]);
  });
});

// ============================================================
// getRecentSnapshots
// ============================================================

describe("useDanceStyleAnalysis - getRecentSnapshots", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("기본 limit 5개를 반환한다", () => {
    const { result } = makeHook();
    for (let i = 1; i <= 7; i++) {
      addSnapshot(result, `2026-0${i < 10 ? "0" + i : i}-01`);
    }
    expect(result.current.getRecentSnapshots()).toHaveLength(5);
  });

  it("지정한 limit 수만큼 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    addSnapshot(result, "2026-02-01");
    addSnapshot(result, "2026-03-01");
    expect(result.current.getRecentSnapshots(2)).toHaveLength(2);
  });

  it("스냅샷이 limit보다 적으면 모두 반환한다", () => {
    const { result } = makeHook();
    addSnapshot(result, "2026-01-01");
    addSnapshot(result, "2026-02-01");
    expect(result.current.getRecentSnapshots(10)).toHaveLength(2);
  });

  it("스냅샷이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    expect(result.current.getRecentSnapshots()).toEqual([]);
  });
});
