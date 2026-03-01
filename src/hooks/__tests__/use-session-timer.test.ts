import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSessionTimer,
  MAX_PRESETS,
  MAX_SEGMENTS,
  SEGMENT_COLORS,
} from "@/hooks/use-session-timer";

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

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useSessionTimer(groupId));
}

// ============================================================
// 상수 테스트
// ============================================================

describe("상수 - MAX_PRESETS, MAX_SEGMENTS, SEGMENT_COLORS", () => {
  it("MAX_PRESETS는 5이다", () => {
    expect(MAX_PRESETS).toBe(5);
  });

  it("MAX_SEGMENTS는 10이다", () => {
    expect(MAX_SEGMENTS).toBe(10);
  });

  it("SEGMENT_COLORS는 10개의 색상을 가진다", () => {
    expect(SEGMENT_COLORS).toHaveLength(10);
  });

  it("SEGMENT_COLORS의 각 항목은 hex 색상이다", () => {
    SEGMENT_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useSessionTimer - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("초기 status는 idle이다", () => {
    const { result } = makeHook();
    expect(result.current.status).toBe("idle");
  });

  it("초기 currentSegmentIndex는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.currentSegmentIndex).toBe(0);
  });

  it("초기 remainingSeconds는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("초기 elapsedTotal은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.elapsedTotal).toBe(0);
  });

  it("초기 totalSeconds는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSeconds).toBe(0);
  });

  it("초기 isFlashing은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.isFlashing).toBe(false);
  });

  it("기본 프리셋이 1개 이상 존재한다", () => {
    const { result } = makeHook();
    expect(result.current.presets.length).toBeGreaterThanOrEqual(1);
  });

  it("선택된 프리셋이 null이 아니다", () => {
    const { result } = makeHook();
    expect(result.current.selectedPreset).toBeDefined();
    expect(result.current.selectedPreset).not.toBeNull();
  });

  it("기본 프리셋 제목은 '기본 2시간 연습'이다", () => {
    const { result } = makeHook();
    expect(result.current.selectedPreset?.title).toBe("기본 2시간 연습");
  });

  it("기본 프리셋은 4개의 세그먼트를 가진다", () => {
    const { result } = makeHook();
    expect(result.current.selectedPreset?.segments).toHaveLength(4);
  });

  it("기본 프리셋 totalMinutes는 120이다", () => {
    const { result } = makeHook();
    expect(result.current.selectedPreset?.totalMinutes).toBe(120);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.startTimer).toBe("function");
    expect(typeof result.current.pauseTimer).toBe("function");
    expect(typeof result.current.resumeTimer).toBe("function");
    expect(typeof result.current.skipSegment).toBe("function");
    expect(typeof result.current.resetTimer).toBe("function");
    expect(typeof result.current.addPreset).toBe("function");
    expect(typeof result.current.deletePreset).toBe("function");
    expect(typeof result.current.addSegment).toBe("function");
    expect(typeof result.current.removeSegment).toBe("function");
    expect(typeof result.current.setSelectedPresetId).toBe("function");
  });
});

// ============================================================
// startTimer
// ============================================================

describe("useSessionTimer - startTimer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("startTimer 호출 시 status가 running이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.status).toBe("running");
  });

  it("startTimer 호출 시 currentSegmentIndex가 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.currentSegmentIndex).toBe(0);
  });

  it("startTimer 호출 시 elapsedTotal이 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.elapsedTotal).toBe(0);
  });

  it("startTimer 호출 시 totalSeconds가 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    // 기본 프리셋 120분 = 7200초
    expect(result.current.totalSeconds).toBe(7200);
  });

  it("startTimer 호출 시 remainingSeconds가 첫 세그먼트 시간(초)으로 설정된다", () => {
    const { result } = makeHook();
    const firstSeg = result.current.selectedPreset!.segments[0];
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.remainingSeconds).toBe(firstSeg.durationMinutes * 60);
  });

  it("running 중 1초 경과 시 elapsedTotal이 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedTotal).toBeGreaterThan(0);
  });

  it("running 중 1초 경과 시 remainingSeconds가 감소한다", () => {
    const { result } = makeHook();
    const firstSeg = result.current.selectedPreset!.segments[0];
    const initialRemaining = firstSeg.durationMinutes * 60;
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBeLessThan(initialRemaining);
  });
});

// ============================================================
// pauseTimer
// ============================================================

describe("useSessionTimer - pauseTimer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("running 상태에서 pauseTimer 호출 시 status가 paused가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.pauseTimer();
    });
    expect(result.current.status).toBe("paused");
  });

  it("idle 상태에서 pauseTimer 호출 시 status가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.pauseTimer();
    });
    expect(result.current.status).toBe("idle");
  });

  it("pause 후 타이머가 멈춰 elapsedTotal이 증가하지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const elapsedAtPause = result.current.elapsedTotal;
    act(() => {
      result.current.pauseTimer();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.elapsedTotal).toBe(elapsedAtPause);
  });
});

// ============================================================
// resumeTimer
// ============================================================

describe("useSessionTimer - resumeTimer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("paused 상태에서 resumeTimer 호출 시 status가 running이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
      result.current.pauseTimer();
    });
    act(() => {
      result.current.resumeTimer();
    });
    expect(result.current.status).toBe("running");
  });

  it("idle 상태에서 resumeTimer 호출 시 status가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.resumeTimer();
    });
    expect(result.current.status).toBe("idle");
  });

  it("resume 후 타이머가 재개되어 elapsedTotal이 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      result.current.pauseTimer();
    });
    const elapsedAtPause = result.current.elapsedTotal;
    act(() => {
      result.current.resumeTimer();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.elapsedTotal).toBeGreaterThan(elapsedAtPause);
  });
});

// ============================================================
// resetTimer
// ============================================================

describe("useSessionTimer - resetTimer", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resetTimer 호출 시 status가 idle이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.status).toBe("idle");
  });

  it("resetTimer 호출 시 currentSegmentIndex가 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.skipSegment();
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.currentSegmentIndex).toBe(0);
  });

  it("resetTimer 호출 시 elapsedTotal이 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.elapsedTotal).toBe(0);
  });

  it("resetTimer 호출 시 totalSeconds가 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.totalSeconds).toBe(0);
  });

  it("resetTimer 호출 시 remainingSeconds가 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("resetTimer 호출 시 isFlashing이 false가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.isFlashing).toBe(false);
  });

  it("reset 후 startTimer를 다시 호출할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.resetTimer();
    });
    act(() => {
      result.current.startTimer();
    });
    expect(result.current.status).toBe("running");
  });
});

// ============================================================
// skipSegment
// ============================================================

describe("useSessionTimer - skipSegment", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("running 중 skipSegment 호출 시 다음 세그먼트로 이동한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    act(() => {
      result.current.skipSegment();
    });
    expect(result.current.currentSegmentIndex).toBe(1);
  });

  it("idle 상태에서 skipSegment 호출 시 index가 변경되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.skipSegment();
    });
    expect(result.current.currentSegmentIndex).toBe(0);
  });

  it("마지막 세그먼트에서 skipSegment 호출 시 status가 finished가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    const segCount = result.current.selectedPreset!.segments.length;
    // 모든 세그먼트 스킵
    for (let i = 0; i < segCount - 1; i++) {
      act(() => {
        result.current.skipSegment();
      });
    }
    act(() => {
      result.current.skipSegment();
    });
    expect(result.current.status).toBe("finished");
  });
});

// ============================================================
// addPreset
// ============================================================

describe("useSessionTimer - addPreset 프리셋 추가", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("addPreset 호출 시 presets 길이가 증가한다", () => {
    const { result } = makeHook();
    const initialCount = result.current.presets.length;
    act(() => {
      result.current.addPreset("새 프리셋", [
        { id: "s1", label: "구간1", durationMinutes: 30, color: "#f97316" },
      ]);
    });
    expect(result.current.presets.length).toBe(initialCount + 1);
  });

  it("추가된 프리셋의 title이 올바르다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addPreset("맞춤 프리셋", [
        { id: "s1", label: "구간", durationMinutes: 20, color: "#3b82f6" },
      ]);
    });
    const added = result.current.presets.find((p) => p.title === "맞춤 프리셋");
    expect(added).toBeDefined();
  });

  it("추가된 프리셋이 자동으로 선택된다", () => {
    const { result } = makeHook();
    let success = false;
    act(() => {
      success = result.current.addPreset("신규 프리셋", [
        { id: "s1", label: "구간", durationMinutes: 20, color: "#3b82f6" },
      ]);
    });
    expect(success).toBe(true);
    expect(result.current.selectedPreset?.title).toBe("신규 프리셋");
  });

  it("MAX_PRESETS(5) 초과 시 addPreset이 false를 반환한다", () => {
    const { result } = makeHook();
    // 기본 1개 + 4개 더 추가하면 MAX_PRESETS에 도달
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.addPreset(`프리셋${i}`, [
          { id: `s${i}`, label: "구간", durationMinutes: 10, color: "#f97316" },
        ]);
      });
    }
    let result2 = false;
    act(() => {
      result2 = result.current.addPreset("초과 프리셋", [
        { id: "sx", label: "구간", durationMinutes: 10, color: "#f97316" },
      ]);
    });
    expect(result2).toBe(false);
  });

  it("totalMinutes가 segments의 합산으로 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addPreset("합산 테스트", [
        { id: "s1", label: "A", durationMinutes: 20, color: "#f97316" },
        { id: "s2", label: "B", durationMinutes: 30, color: "#3b82f6" },
      ]);
    });
    const added = result.current.presets.find((p) => p.title === "합산 테스트");
    expect(added?.totalMinutes).toBe(50);
  });
});

// ============================================================
// deletePreset
// ============================================================

describe("useSessionTimer - deletePreset 프리셋 삭제", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("마지막 프리셋은 삭제되지 않는다", () => {
    const { result } = makeHook();
    // 프리셋이 1개뿐일 때 삭제 시도
    expect(result.current.presets).toHaveLength(1);
    const onlyPresetId = result.current.presets[0].id;
    act(() => {
      result.current.deletePreset(onlyPresetId);
    });
    expect(result.current.presets).toHaveLength(1);
  });

  it("프리셋이 2개 이상일 때 삭제가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addPreset("두 번째", [
        { id: "s1", label: "구간", durationMinutes: 10, color: "#f97316" },
      ]);
    });
    expect(result.current.presets.length).toBeGreaterThanOrEqual(2);
    const firstId = result.current.presets[0].id;
    act(() => {
      result.current.deletePreset(firstId);
    });
    expect(result.current.presets.find((p) => p.id === firstId)).toBeUndefined();
  });
});

// ============================================================
// addSegment / removeSegment
// ============================================================

describe("useSessionTimer - addSegment / removeSegment 세그먼트 관리", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("addSegment 호출 시 해당 프리셋의 segments 길이가 증가한다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    const initialCount = result.current.selectedPreset!.segments.length;
    act(() => {
      result.current.addSegment(presetId, {
        label: "새 구간",
        durationMinutes: 10,
        color: "#f97316",
      });
    });
    const preset = result.current.presets.find((p) => p.id === presetId);
    expect(preset!.segments.length).toBe(initialCount + 1);
  });

  it("추가된 세그먼트의 label이 올바르다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    act(() => {
      result.current.addSegment(presetId, {
        label: "쿨다운 추가",
        durationMinutes: 15,
        color: "#22c55e",
      });
    });
    const preset = result.current.presets.find((p) => p.id === presetId);
    const added = preset?.segments.find((s) => s.label === "쿨다운 추가");
    expect(added).toBeDefined();
  });

  it("addSegment 후 totalMinutes가 재계산된다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    const beforeTotal = result.current.selectedPreset!.totalMinutes;
    act(() => {
      result.current.addSegment(presetId, {
        label: "추가 구간",
        durationMinutes: 10,
        color: "#f97316",
      });
    });
    const preset = result.current.presets.find((p) => p.id === presetId);
    expect(preset!.totalMinutes).toBe(beforeTotal + 10);
  });

  it("MAX_SEGMENTS(10) 초과 시 세그먼트가 추가되지 않는다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    // 기본 4개이므로 6개 더 추가
    for (let i = 0; i < 6; i++) {
      act(() => {
        result.current.addSegment(presetId, {
          label: `추가${i}`,
          durationMinutes: 5,
          color: "#f97316",
        });
      });
    }
    const before = result.current.presets.find((p) => p.id === presetId)!.segments.length;
    act(() => {
      result.current.addSegment(presetId, {
        label: "초과",
        durationMinutes: 5,
        color: "#f97316",
      });
    });
    const after = result.current.presets.find((p) => p.id === presetId)!.segments.length;
    expect(after).toBe(before);
  });

  it("removeSegment 호출 시 해당 세그먼트가 제거된다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    const firstSeg = result.current.selectedPreset!.segments[0];
    act(() => {
      result.current.removeSegment(presetId, firstSeg.id);
    });
    const preset = result.current.presets.find((p) => p.id === presetId);
    expect(preset!.segments.find((s) => s.id === firstSeg.id)).toBeUndefined();
  });

  it("removeSegment 후 totalMinutes가 재계산된다", () => {
    const { result } = makeHook();
    const presetId = result.current.selectedPreset!.id;
    const firstSeg = result.current.selectedPreset!.segments[0];
    const beforeTotal = result.current.selectedPreset!.totalMinutes;
    act(() => {
      result.current.removeSegment(presetId, firstSeg.id);
    });
    const preset = result.current.presets.find((p) => p.id === presetId);
    expect(preset!.totalMinutes).toBe(beforeTotal - firstSeg.durationMinutes);
  });
});

// ============================================================
// 언마운트 정리
// ============================================================

describe("useSessionTimer - 언마운트 정리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("언마운트 시 타이머가 정리되어 에러가 발생하지 않는다", () => {
    const { result, unmount } = makeHook();
    act(() => {
      result.current.startTimer();
    });
    expect(() => {
      unmount();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
