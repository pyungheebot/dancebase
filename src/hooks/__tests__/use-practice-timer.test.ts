import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePracticeTimer } from "@/hooks/use-practice-timer";

describe("usePracticeTimer - 초기 상태", () => {
  it("초기 상태는 idle이다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(result.current.status).toBe("idle");
  });

  it("초기 currentIndex는 0이다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(result.current.currentIndex).toBe(0);
  });

  it("초기 totalElapsed는 0이다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(result.current.totalElapsed).toBe(0);
  });

  it("기본 세그먼트가 4개 존재한다 (워밍업, 안무 연습, 런스루, 쿨다운)", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(result.current.segments).toHaveLength(4);
  });

  it("각 세그먼트의 초기 elapsed는 0이다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    result.current.segments.forEach((seg) => {
      expect(seg.elapsed).toBe(0);
    });
  });

  it("첫 번째 세그먼트는 워밍업이다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(result.current.segments[0].label).toBe("워밍업");
  });

  it("start, pause, resume, nextSegment, reset, addSegment, removeSegment 함수가 존재한다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    expect(typeof result.current.start).toBe("function");
    expect(typeof result.current.pause).toBe("function");
    expect(typeof result.current.resume).toBe("function");
    expect(typeof result.current.nextSegment).toBe("function");
    expect(typeof result.current.reset).toBe("function");
    expect(typeof result.current.addSegment).toBe("function");
    expect(typeof result.current.removeSegment).toBe("function");
  });
});

describe("usePracticeTimer - start", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("start 호출 시 status가 running이 된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("running");
  });

  it("idle이 아닌 상태에서 start를 호출해도 상태가 변경되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    expect(result.current.status).toBe("running");

    // running 중 다시 start 호출
    act(() => {
      result.current.start();
    });
    expect(result.current.status).toBe("running");
  });

  it("start 후 1초 경과 시 currentIndex 세그먼트의 elapsed가 증가한다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.segments[0].elapsed).toBeGreaterThan(0);
  });

  it("start 후 타이머가 동작하며 totalElapsed가 증가한다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.totalElapsed).toBeGreaterThan(0);
  });
});

describe("usePracticeTimer - pause", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("running 중 pause 호출 시 status가 paused가 된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe("paused");
  });

  it("idle 상태에서 pause 호출 시 상태가 변경되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe("idle");
  });

  it("pause 후 타이머가 멈춰 elapsed가 더 이상 증가하지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const elapsedAtPause = result.current.segments[0].elapsed;

    act(() => {
      result.current.pause();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.segments[0].elapsed).toBe(elapsedAtPause);
  });
});

describe("usePracticeTimer - resume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("paused 상태에서 resume 호출 시 status가 running이 된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
      result.current.pause();
    });
    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe("running");
  });

  it("paused가 아닌 상태에서 resume 호출 시 상태가 변경되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    // idle 상태에서 resume
    act(() => {
      result.current.resume();
    });
    expect(result.current.status).toBe("idle");
  });

  it("resume 후 타이머가 재개되어 elapsed가 증가한다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.pause();
    });

    const elapsedAtPause = result.current.segments[0].elapsed;

    act(() => {
      result.current.resume();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.segments[0].elapsed).toBeGreaterThan(elapsedAtPause);
  });
});

describe("usePracticeTimer - reset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reset 호출 시 status가 idle로 돌아온다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
  });

  it("reset 호출 시 currentIndex가 0으로 돌아온다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.nextSegment();
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it("reset 호출 시 totalElapsed가 0으로 초기화된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.totalElapsed).toBe(0);
  });

  it("reset 호출 시 모든 세그먼트 elapsed가 0으로 초기화된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      result.current.reset();
    });

    result.current.segments.forEach((seg) => {
      expect(seg.elapsed).toBe(0);
    });
  });

  it("reset 후 start를 다시 호출할 수 있다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.reset();
    });
    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe("running");
  });
});

describe("usePracticeTimer - addSegment", () => {
  it("addSegment 호출 시 세그먼트가 추가된다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const initialLength = result.current.segments.length;

    act(() => {
      result.current.addSegment("특별 연습");
    });

    expect(result.current.segments).toHaveLength(initialLength + 1);
  });

  it("추가된 세그먼트의 label이 올바르다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.addSegment("스트레칭");
    });

    const lastSeg = result.current.segments[result.current.segments.length - 1];
    expect(lastSeg.label).toBe("스트레칭");
  });

  it("추가된 세그먼트의 elapsed는 0이다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.addSegment("새 구간");
    });

    const lastSeg = result.current.segments[result.current.segments.length - 1];
    expect(lastSeg.elapsed).toBe(0);
  });

  it("빈 문자열로 addSegment 호출 시 세그먼트가 추가되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const initialLength = result.current.segments.length;

    act(() => {
      result.current.addSegment("");
    });

    expect(result.current.segments).toHaveLength(initialLength);
  });

  it("공백만 있는 문자열로 addSegment 호출 시 세그먼트가 추가되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const initialLength = result.current.segments.length;

    act(() => {
      result.current.addSegment("   ");
    });

    expect(result.current.segments).toHaveLength(initialLength);
  });

  it("앞뒤 공백이 제거된 label로 세그먼트가 추가된다", () => {
    const { result } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.addSegment("  트리밍 테스트  ");
    });

    const lastSeg = result.current.segments[result.current.segments.length - 1];
    expect(lastSeg.label).toBe("트리밍 테스트");
  });
});

describe("usePracticeTimer - removeSegment", () => {
  it("removeSegment 호출 시 해당 세그먼트가 제거된다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const targetId = result.current.segments[3].id; // 마지막 세그먼트 (쿨다운)
    const initialLength = result.current.segments.length;

    act(() => {
      result.current.removeSegment(targetId);
    });

    expect(result.current.segments).toHaveLength(initialLength - 1);
  });

  it("존재하지 않는 id로 removeSegment 호출 시 세그먼트 목록이 변경되지 않는다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const initialLength = result.current.segments.length;

    act(() => {
      result.current.removeSegment("non-existent-id");
    });

    expect(result.current.segments).toHaveLength(initialLength);
  });

  it("idle 상태에서 현재 인덱스 세그먼트 제거 시 세그먼트가 제거된다", () => {
    const { result } = renderHook(() => usePracticeTimer());
    const firstId = result.current.segments[0].id;
    const initialLength = result.current.segments.length;

    // idle 상태에서는 현재 인덱스 세그먼트도 삭제 가능 (running이 아니므로)
    act(() => {
      result.current.removeSegment(firstId);
    });

    // idle 상태이므로 currentIndex === 0 이지만 status !== "running"이라 삭제됨
    expect(result.current.segments).toHaveLength(initialLength - 1);
  });
});

describe("usePracticeTimer - 언마운트 정리", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("언마운트 시 타이머가 정리되어 에러가 발생하지 않는다", () => {
    const { result, unmount } = renderHook(() => usePracticeTimer());

    act(() => {
      result.current.start();
    });

    expect(() => {
      unmount();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
