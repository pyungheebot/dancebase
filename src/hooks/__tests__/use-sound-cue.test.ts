import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

import {
  useSoundCue,
  parseTimeToSeconds,
} from "@/hooks/use-sound-cue";
import type { SoundCueEntry } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const GROUP_ID = "group-sound-1";
const PROJECT_ID = "project-1";

function makeHook(groupId = GROUP_ID, projectId = PROJECT_ID) {
  return renderHook(() => useSoundCue(groupId, projectId));
}

function makeCuePartial(overrides: Partial<Omit<SoundCueEntry, "id" | "isActive" | "isChecked">> = {}) {
  return {
    cueNumber: 1,
    label: "오프닝 BGM",
    type: "bgm" as const,
    startTime: "00:00",
    endTime: "01:30",
    ...overrides,
  };
}

function clearStore() {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
}

// ============================================================
// parseTimeToSeconds 순수 함수 테스트
// ============================================================

describe("parseTimeToSeconds - 시간 문자열 파싱", () => {
  it("'00:00'은 0초이다", () => {
    expect(parseTimeToSeconds("00:00")).toBe(0);
  });

  it("'01:00'은 60초이다", () => {
    expect(parseTimeToSeconds("01:00")).toBe(60);
  });

  it("'01:30'은 90초이다", () => {
    expect(parseTimeToSeconds("01:30")).toBe(90);
  });

  it("'10:00'은 600초이다", () => {
    expect(parseTimeToSeconds("10:00")).toBe(600);
  });

  it("'02:30'은 150초이다", () => {
    expect(parseTimeToSeconds("02:30")).toBe(150);
  });

  it("빈 문자열은 0을 반환한다", () => {
    expect(parseTimeToSeconds("")).toBe(0);
  });

  it("유효하지 않은 형식은 0을 반환한다", () => {
    expect(parseTimeToSeconds("abc")).toBe(0);
  });

  it("'00:30'은 30초이다", () => {
    expect(parseTimeToSeconds("00:30")).toBe(30);
  });

  it("'59:59'는 3599초이다", () => {
    expect(parseTimeToSeconds("59:59")).toBe(3599);
  });
});

// ============================================================
// useSoundCue - 초기 상태
// ============================================================

describe("useSoundCue - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("초기 sheets는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.sheets).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("초기 stats.totalSheets는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalSheets).toBe(0);
  });

  it("초기 stats.totalCues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalCues).toBe(0);
  });

  it("초기 stats.activeCues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.activeCues).toBe(0);
  });

  it("초기 stats.checkedCues는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.checkedCues).toBe(0);
  });

  it("초기 stats.totalRuntimeLabel은 '-'이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.totalRuntimeLabel).toBe("-");
  });

  it("addSheet, updateSheet, deleteSheet 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSheet).toBe("function");
    expect(typeof result.current.updateSheet).toBe("function");
    expect(typeof result.current.deleteSheet).toBe("function");
  });

  it("addCue, updateCue, deleteCue 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addCue).toBe("function");
    expect(typeof result.current.updateCue).toBe("function");
    expect(typeof result.current.deleteCue).toBe("function");
  });
});

// ============================================================
// useSoundCue - 시트(Sheet) CRUD
// ============================================================

describe("useSoundCue - addSheet / updateSheet / deleteSheet", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("시트 추가 시 sheets 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("1부");
    });
    expect(result.current.sheets).toHaveLength(1);
  });

  it("추가된 시트의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("오프닝");
    });
    expect(result.current.sheets[0].title).toBe("오프닝");
  });

  it("addSheet는 새 시트 객체를 반환한다", () => {
    const { result } = makeHook();
    let sheet: ReturnType<typeof result.current.addSheet>;
    act(() => {
      sheet = result.current.addSheet("1부");
    });
    expect(sheet!.id).toBeDefined();
    expect(sheet!.cues).toEqual([]);
  });

  it("시트 타이틀을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("원래 제목");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.updateSheet(sheetId, "새 제목");
    });
    expect(result.current.sheets[0].title).toBe("새 제목");
  });

  it("updateSheet는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateSheet(sheetId, "새 이름");
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 sheetId로 updateSheet 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateSheet("non-existent", "변경");
    });
    expect(ok).toBe(false);
  });

  it("시트 삭제 시 sheets 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("삭제될 시트");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.deleteSheet(sheetId);
    });
    expect(result.current.sheets).toHaveLength(0);
  });

  it("deleteSheet는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트");
    });
    const sheetId = result.current.sheets[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteSheet(sheetId);
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 sheetId로 deleteSheet 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteSheet("non-existent");
    });
    expect(ok).toBe(false);
  });

  it("stats.totalSheets가 시트 수와 일치한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    act(() => {
      result.current.addSheet("시트2");
    });
    expect(result.current.stats.totalSheets).toBe(2);
  });
});

// ============================================================
// useSoundCue - 큐(Cue) CRUD
// ============================================================

describe("useSoundCue - addCue / updateCue / deleteCue", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("큐 추가 시 시트의 cues 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    expect(result.current.sheets[0].cues).toHaveLength(1);
  });

  it("addCue는 새 큐 객체를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    let cue: SoundCueEntry | null = null;
    act(() => {
      cue = result.current.addCue(sheetId, makeCuePartial());
    });
    expect(cue).not.toBeNull();
    expect(cue!.id).toBeDefined();
  });

  it("추가된 큐의 isActive는 true이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    expect(result.current.sheets[0].cues[0].isActive).toBe(true);
  });

  it("추가된 큐의 isChecked는 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    expect(result.current.sheets[0].cues[0].isChecked).toBe(false);
  });

  it("존재하지 않는 sheetId로 addCue 시 null을 반환한다", () => {
    const { result } = makeHook();
    let cue: SoundCueEntry | null = undefined as unknown as SoundCueEntry | null;
    act(() => {
      cue = result.current.addCue("non-existent", makeCuePartial());
    });
    expect(cue).toBeNull();
  });

  it("큐 label을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial({ label: "원래 라벨" }));
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.updateCue(sheetId, cueId, { label: "수정된 라벨" });
    });
    expect(result.current.sheets[0].cues[0].label).toBe("수정된 라벨");
  });

  it("updateCue는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateCue(sheetId, cueId, { label: "수정" });
    });
    expect(ok).toBe(true);
  });

  it("큐 삭제 시 cues 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.deleteCue(sheetId, cueId);
    });
    expect(result.current.sheets[0].cues).toHaveLength(0);
  });

  it("deleteCue는 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteCue(sheetId, cueId);
    });
    expect(ok).toBe(true);
  });
});

// ============================================================
// useSoundCue - 큐 순서 이동
// ============================================================

describe("useSoundCue - moveCueUp / moveCueDown / reorderCues", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("moveCueUp으로 큐를 위로 이동할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial({ label: "큐A" }));
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ label: "큐B" }));
    });
    const cueIdB = result.current.sheets[0].cues[1].id;
    act(() => {
      result.current.moveCueUp(result.current.sheets[0].id, cueIdB);
    });
    expect(result.current.sheets[0].cues[0].label).toBe("큐B");
  });

  it("첫 번째 큐를 moveCueUp하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.moveCueUp(sheetId, cueId);
    });
    expect(ok).toBe(false);
  });

  it("moveCueDown으로 큐를 아래로 이동할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial({ label: "큐A" }));
      result.current.addCue(sheetId, makeCuePartial({ label: "큐B" }));
    });
    const cueIdA = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.moveCueDown(sheetId, cueIdA);
    });
    expect(result.current.sheets[0].cues[0].label).toBe("큐B");
  });

  it("마지막 큐를 moveCueDown하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.moveCueDown(sheetId, cueId);
    });
    expect(ok).toBe(false);
  });

  it("이동 후 cueNumber가 재정렬된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ label: "큐A", cueNumber: 1 }));
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ label: "큐B", cueNumber: 2 }));
    });
    const cueIdB = result.current.sheets[0].cues[1].id;
    act(() => {
      result.current.moveCueUp(result.current.sheets[0].id, cueIdB);
    });
    expect(result.current.sheets[0].cues[0].cueNumber).toBe(1);
    expect(result.current.sheets[0].cues[1].cueNumber).toBe(2);
  });

  it("reorderCues로 큐 순서를 재배치할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial({ label: "큐A" }));
      result.current.addCue(sheetId, makeCuePartial({ label: "큐B" }));
      result.current.addCue(sheetId, makeCuePartial({ label: "큐C" }));
    });
    const cues = result.current.sheets[0].cues;
    const [idA, idB, idC] = cues.map((c) => c.id);
    act(() => {
      result.current.reorderCues(sheetId, [idC, idA, idB]);
    });
    expect(result.current.sheets[0].cues[0].label).toBe("큐C");
  });
});

// ============================================================
// useSoundCue - toggleActive / toggleChecked
// ============================================================

describe("useSoundCue - toggleActive / toggleChecked", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("toggleActive로 isActive가 false로 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleActive(sheetId, cueId);
    });
    expect(result.current.sheets[0].cues[0].isActive).toBe(false);
  });

  it("toggleActive를 두 번 호출하면 원래대로 돌아온다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleActive(sheetId, cueId);
    });
    act(() => {
      result.current.toggleActive(sheetId, cueId);
    });
    expect(result.current.sheets[0].cues[0].isActive).toBe(true);
  });

  it("toggleChecked로 isChecked가 true로 변경된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleChecked(sheetId, cueId);
    });
    expect(result.current.sheets[0].cues[0].isChecked).toBe(true);
  });

  it("toggleChecked를 두 번 호출하면 원래대로 돌아온다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleChecked(sheetId, cueId);
    });
    act(() => {
      result.current.toggleChecked(sheetId, cueId);
    });
    expect(result.current.sheets[0].cues[0].isChecked).toBe(false);
  });

  it("존재하지 않는 sheetId로 toggleActive 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.toggleActive("non-existent", "any-cue");
    });
    expect(ok).toBe(false);
  });
});

// ============================================================
// useSoundCue - stats 계산
// ============================================================

describe("useSoundCue - stats 통계 계산", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("큐 추가 시 stats.totalCues가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ label: "큐1" }));
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ label: "큐2" }));
    });
    expect(result.current.stats.totalCues).toBe(2);
  });

  it("비활성화된 큐는 activeCues에서 제외된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleActive(sheetId, cueId);
    });
    expect(result.current.stats.activeCues).toBe(0);
  });

  it("체크된 큐는 checkedCues에 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial());
    });
    const cueId = result.current.sheets[0].cues[0].id;
    act(() => {
      result.current.toggleChecked(sheetId, cueId);
    });
    expect(result.current.stats.checkedCues).toBe(1);
  });

  it("startTime/endTime이 있는 큐의 런타임이 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      // 0:00 ~ 1:30 = 90초
      result.current.addCue(sheetId, makeCuePartial({ startTime: "00:00", endTime: "01:30" }));
    });
    expect(result.current.stats.totalRuntimeSec).toBe(90);
  });

  it("totalRuntimeLabel이 올바르게 포맷된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      // 1분 30초
      result.current.addCue(sheetId, makeCuePartial({ startTime: "00:00", endTime: "01:30" }));
    });
    expect(result.current.stats.totalRuntimeLabel).toBe("1분 30초");
  });

  it("startTime >= endTime이면 런타임에 포함되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    const sheetId = result.current.sheets[0].id;
    act(() => {
      result.current.addCue(sheetId, makeCuePartial({ startTime: "02:00", endTime: "01:00" }));
    });
    expect(result.current.stats.totalRuntimeSec).toBe(0);
  });

  it("typeDistribution에 큐 유형이 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSheet("시트1");
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ type: "bgm" as const }));
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ type: "bgm" as const }));
    });
    act(() => {
      result.current.addCue(result.current.sheets[0].id, makeCuePartial({ type: "sfx" as const }));
    });
    const bgmEntry = result.current.stats.typeDistribution.find((d) => d.type === "bgm");
    expect(bgmEntry?.count).toBe(2);
  });
});

// ============================================================
// useSoundCue - 프로젝트별 격리
// ============================================================

describe("useSoundCue - 그룹/프로젝트별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    uuidCounter = 0;
  });

  it("다른 projectId는 독립적인 sheets를 가진다", () => {
    const { result: r1 } = renderHook(() => useSoundCue("group-1", "proj-A"));
    const { result: r2 } = renderHook(() => useSoundCue("group-1", "proj-B"));

    act(() => {
      r1.current.addSheet("프로젝트A 시트");
    });

    expect(r1.current.sheets).toHaveLength(1);
    expect(r2.current.sheets).toHaveLength(0);
  });
});
