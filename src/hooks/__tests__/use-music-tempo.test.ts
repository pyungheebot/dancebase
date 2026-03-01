import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useMusicTempo,
  classifyTempo,
  calcBpmFromTaps,
  BPM_MIN,
  BPM_MAX,
  MAX_ENTRIES,
  TEMPO_CATEGORY_LABELS,
  TEMPO_CATEGORY_BPM_RANGE,
} from "@/hooks/use-music-tempo";
import type { TempoSection } from "@/types";

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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── AudioContext mock ────────────────────────────────────────
class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 0 },
    type: "sine",
    start: vi.fn(),
    stop: vi.fn(),
  }));
  createGain = vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
  }));
  resume = vi.fn();
  close = vi.fn();
}

vi.stubGlobal("AudioContext", MockAudioContext);

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-tempo-1";
const PROJECT_ID = "project-tempo-1";

function makeHook(groupId = GROUP_ID, projectId = PROJECT_ID) {
  return renderHook(() => useMusicTempo(groupId, projectId));
}

function makeEntryPayload(overrides: Partial<{
  songTitle: string;
  artist: string;
  bpm: number;
  sections: TempoSection[];
  note: string;
}> = {}) {
  return {
    songTitle: "테스트 곡",
    artist: "아티스트",
    bpm: 120,
    sections: [],
    note: "",
    ...overrides,
  };
}

// ============================================================
// classifyTempo 순수 함수 테스트
// ============================================================

describe("classifyTempo - BPM 기반 카테고리 분류", () => {
  it("BPM 40은 very_slow이다", () => {
    expect(classifyTempo(40)).toBe("very_slow");
  });

  it("BPM 70은 very_slow이다 (경계값)", () => {
    expect(classifyTempo(70)).toBe("very_slow");
  });

  it("BPM 71은 slow이다 (경계값)", () => {
    expect(classifyTempo(71)).toBe("slow");
  });

  it("BPM 100은 slow이다 (경계값)", () => {
    expect(classifyTempo(100)).toBe("slow");
  });

  it("BPM 101은 moderate이다 (경계값)", () => {
    expect(classifyTempo(101)).toBe("moderate");
  });

  it("BPM 130은 moderate이다 (경계값)", () => {
    expect(classifyTempo(130)).toBe("moderate");
  });

  it("BPM 131은 fast이다 (경계값)", () => {
    expect(classifyTempo(131)).toBe("fast");
  });

  it("BPM 170은 fast이다 (경계값)", () => {
    expect(classifyTempo(170)).toBe("fast");
  });

  it("BPM 171은 very_fast이다 (경계값)", () => {
    expect(classifyTempo(171)).toBe("very_fast");
  });

  it("BPM 240은 very_fast이다", () => {
    expect(classifyTempo(240)).toBe("very_fast");
  });

  it("BPM 120은 moderate이다", () => {
    expect(classifyTempo(120)).toBe("moderate");
  });

  it("BPM 85은 slow이다", () => {
    expect(classifyTempo(85)).toBe("slow");
  });
});

// ============================================================
// calcBpmFromTaps 순수 함수 테스트
// ============================================================

describe("calcBpmFromTaps - 탭 BPM 계산", () => {
  it("탭이 1개 이하이면 null을 반환한다", () => {
    expect(calcBpmFromTaps([])).toBeNull();
    expect(calcBpmFromTaps([Date.now()])).toBeNull();
  });

  it("2개의 탭으로 BPM을 계산한다", () => {
    // 500ms 간격 = 120 BPM
    const bpm = calcBpmFromTaps([0, 500]);
    expect(bpm).toBe(120);
  });

  it("3개의 탭으로 평균 BPM을 계산한다", () => {
    // 500ms 간격 2회 = 평균 120 BPM
    const bpm = calcBpmFromTaps([0, 500, 1000]);
    expect(bpm).toBe(120);
  });

  it("BPM은 BPM_MIN(40) 이하로 내려가지 않는다", () => {
    // 2000ms 간격 = 30 BPM이지만 최솟값 40으로 클램핑
    const bpm = calcBpmFromTaps([0, 2000]);
    expect(bpm).toBeGreaterThanOrEqual(BPM_MIN);
  });

  it("BPM은 BPM_MAX(240) 이상으로 올라가지 않는다", () => {
    // 100ms 간격 = 600 BPM이지만 최댓값 240으로 클램핑
    const bpm = calcBpmFromTaps([0, 100]);
    expect(bpm).toBeLessThanOrEqual(BPM_MAX);
  });

  it("반환값은 정수이다", () => {
    const bpm = calcBpmFromTaps([0, 501]);
    expect(Number.isInteger(bpm)).toBe(true);
  });
});

// ============================================================
// 상수 테스트
// ============================================================

describe("useMusicTempo - 상수 값", () => {
  it("BPM_MIN은 40이다", () => {
    expect(BPM_MIN).toBe(40);
  });

  it("BPM_MAX는 240이다", () => {
    expect(BPM_MAX).toBe(240);
  });

  it("MAX_ENTRIES는 30이다", () => {
    expect(MAX_ENTRIES).toBe(30);
  });

  it("TEMPO_CATEGORY_LABELS에 모든 카테고리가 존재한다", () => {
    const categories = ["very_slow", "slow", "moderate", "fast", "very_fast"] as const;
    for (const cat of categories) {
      expect(TEMPO_CATEGORY_LABELS[cat]).toBeDefined();
      expect(typeof TEMPO_CATEGORY_LABELS[cat]).toBe("string");
    }
  });

  it("TEMPO_CATEGORY_BPM_RANGE에 모든 카테고리가 존재한다", () => {
    const categories = ["very_slow", "slow", "moderate", "fast", "very_fast"] as const;
    for (const cat of categories) {
      expect(TEMPO_CATEGORY_BPM_RANGE[cat]).toBeDefined();
    }
  });
});

// ============================================================
// useMusicTempo - 초기 상태
// ============================================================

describe("useMusicTempo - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 canAdd는 true이다", () => {
    const { result } = makeHook();
    expect(result.current.canAdd).toBe(true);
  });

  it("초기 metronomeActive는 false이다", () => {
    const { result } = makeHook();
    expect(result.current.metronomeActive).toBe(false);
  });

  it("초기 metronomeBpm은 120이다", () => {
    const { result } = makeHook();
    expect(result.current.metronomeBpm).toBe(120);
  });

  it("초기 soundEnabled는 true이다", () => {
    const { result } = makeHook();
    expect(result.current.soundEnabled).toBe(true);
  });

  it("초기 speedMultiplier는 1.0이다", () => {
    const { result } = makeHook();
    expect(result.current.speedMultiplier).toBe(1.0);
  });

  it("초기 tappedBpm은 null이다", () => {
    const { result } = makeHook();
    expect(result.current.tappedBpm).toBeNull();
  });

  it("초기 tapCount는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.tapCount).toBe(0);
  });
});

// ============================================================
// useMusicTempo - addEntry 곡 추가
// ============================================================

describe("useMusicTempo - addEntry 곡 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("곡 추가 시 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("addEntry는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addEntry(makeEntryPayload());
    });
    expect(ok).toBe(true);
  });

  it("추가된 곡의 songTitle이 trim된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "  테스트 곡  " }));
    });
    expect(result.current.entries[0].songTitle).toBe("테스트 곡");
  });

  it("추가된 곡의 tempoCategory가 BPM에 따라 자동 분류된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ bpm: 120 }));
    });
    expect(result.current.entries[0].tempoCategory).toBe("moderate");
  });

  it("entries는 BPM 오름차순으로 정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "빠른 곡", bpm: 160 }));
    });
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "느린 곡", bpm: 80 }));
    });
    expect(result.current.entries[0].bpm).toBe(80);
    expect(result.current.entries[1].bpm).toBe(160);
  });

  it("MAX_ENTRIES(30) 초과 시 false를 반환한다", () => {
    const { result } = makeHook();
    // 30개 채우기 - 한 번에 하나씩 추가
    for (let i = 0; i < MAX_ENTRIES; i++) {
      const idx = i;
      act(() => {
        result.current.addEntry(makeEntryPayload({ songTitle: `곡${idx}` }));
      });
    }
    expect(result.current.canAdd).toBe(false);
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.addEntry(makeEntryPayload({ songTitle: "초과 곡" }));
    });
    expect(ok).toBe(false);
  });

  it("곡 추가 시 localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload());
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ============================================================
// useMusicTempo - updateEntry 곡 수정
// ============================================================

describe("useMusicTempo - updateEntry 곡 수정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("곡의 songTitle을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "원래 곡" }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(id, { songTitle: "수정된 곡" });
    });
    const entry = result.current.entries.find((e) => e.id === id);
    expect(entry?.songTitle).toBe("수정된 곡");
  });

  it("BPM 수정 시 tempoCategory가 자동으로 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ bpm: 120 }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(id, { bpm: 60 });
    });
    const entry = result.current.entries.find((e) => e.id === id);
    expect(entry?.tempoCategory).toBe("very_slow");
  });

  it("수정 후 entries는 여전히 BPM 정렬 상태이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "곡A", bpm: 100 }));
    });
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "곡B", bpm: 150 }));
    });
    const idA = result.current.entries.find((e) => e.songTitle === "곡A")?.id;
    act(() => {
      result.current.updateEntry(idA!, { bpm: 200 });
    });
    // 200 BPM이 된 곡A는 뒤로 이동해야 함
    expect(result.current.entries[0].bpm).toBe(150);
    expect(result.current.entries[1].bpm).toBe(200);
  });
});

// ============================================================
// useMusicTempo - deleteEntry 곡 삭제
// ============================================================

describe("useMusicTempo - deleteEntry 곡 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("곡 삭제 시 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("특정 곡만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryPayload({ songTitle: "곡A", bpm: 100 }));
      result.current.addEntry(makeEntryPayload({ songTitle: "곡B", bpm: 150 }));
    });
    const idA = result.current.entries.find((e) => e.songTitle === "곡A")?.id;
    act(() => {
      result.current.deleteEntry(idA!);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].songTitle).toBe("곡B");
  });

  it("삭제 후 canAdd가 true로 돌아온다", () => {
    const { result } = makeHook();
    for (let i = 0; i < MAX_ENTRIES; i++) {
      const idx = i;
      act(() => {
        result.current.addEntry(makeEntryPayload({ songTitle: `곡${idx}` }));
      });
    }
    expect(result.current.canAdd).toBe(false);
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(id);
    });
    expect(result.current.canAdd).toBe(true);
  });
});

// ============================================================
// useMusicTempo - 메트로놈
// ============================================================

describe("useMusicTempo - 메트로놈 제어", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("startMetronome 호출 시 metronomeActive가 true가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startMetronome();
    });
    expect(result.current.metronomeActive).toBe(true);
  });

  it("stopMetronome 호출 시 metronomeActive가 false가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startMetronome();
    });
    act(() => {
      result.current.stopMetronome();
    });
    expect(result.current.metronomeActive).toBe(false);
  });

  it("startMetronome에 BPM을 전달하면 metronomeBpm이 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startMetronome(140);
    });
    expect(result.current.metronomeBpm).toBe(140);
  });

  it("setMetronomeBpm으로 BPM을 변경할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setMetronomeBpm(100);
    });
    expect(result.current.metronomeBpm).toBe(100);
  });

  it("setSoundEnabled로 사운드를 끌 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setSoundEnabled(false);
    });
    expect(result.current.soundEnabled).toBe(false);
  });

  it("setSpeedMultiplier로 배속을 변경할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setSpeedMultiplier(1.5);
    });
    expect(result.current.speedMultiplier).toBe(1.5);
  });

  it("effectiveBpm은 metronomeBpm * speedMultiplier로 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.setMetronomeBpm(120);
      result.current.setSpeedMultiplier(2.0);
    });
    expect(result.current.effectiveBpm).toBe(240);
  });
});

// ============================================================
// useMusicTempo - 탭 BPM
// ============================================================

describe("useMusicTempo - 탭 BPM 측정", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("tapBpm 호출 시 tapCount가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.tapBpm();
    });
    expect(result.current.tapCount).toBe(1);
  });

  it("tapBpm 두 번 호출 후 tappedBpm이 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.tapBpm();
      result.current.tapBpm();
    });
    // 두 번째 탭에서 BPM이 계산됨
    expect(result.current.tappedBpm).not.toBeNull();
  });

  it("resetTap 호출 시 tappedBpm이 null로 초기화된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.tapBpm();
      result.current.tapBpm();
    });
    act(() => {
      result.current.resetTap();
    });
    expect(result.current.tappedBpm).toBeNull();
  });

  it("resetTap 호출 시 tapCount가 0으로 초기화된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.tapBpm();
      result.current.tapBpm();
    });
    act(() => {
      result.current.resetTap();
    });
    expect(result.current.tapCount).toBe(0);
  });
});

// ============================================================
// useMusicTempo - 프로젝트별 격리
// ============================================================

describe("useMusicTempo - 그룹/프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 projectId는 독립적인 entries를 가진다", () => {
    const { result: r1 } = renderHook(() => useMusicTempo("group-1", "proj-A"));
    const { result: r2 } = renderHook(() => useMusicTempo("group-1", "proj-B"));

    act(() => {
      r1.current.addEntry(makeEntryPayload({ songTitle: "프로젝트A 곡" }));
    });

    expect(r1.current.entries).toHaveLength(1);
    expect(r2.current.entries).toHaveLength(0);
  });
});
