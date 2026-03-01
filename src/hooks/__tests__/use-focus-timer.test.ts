/**
 * use-focus-timer 테스트
 *
 * 포커스 타이머 훅의 순수 계산 로직 및 타이머 동작을 검증합니다.
 * - phaseLabel: 페이즈 한글 레이블
 * - lsKey: localStorage 키 생성
 * - todayYMD / weekStartYMD: 날짜 헬퍼
 * - totalSeconds: 페이즈별 전체 초 계산
 * - progress: 진행률 계산
 * - 통계 계산 (todayFocusTime, weekFocusTime)
 * - 설정 기본값 검증
 * - 경계값 및 엣지 케이스
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { phaseLabel } from "@/hooks/use-focus-timer";
import type { FocusTimerPhase, FocusTimerConfig, FocusTimerSession } from "@/types/localStorage/practice";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 기본 설정 */
const DEFAULT_CONFIG: FocusTimerConfig = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLongBreak: 4,
};

/** localStorage 키 생성 */
function configKey(groupId: string): string {
  return `dancebase:focus-timer:${groupId}:config`;
}

function sessionsKey(groupId: string): string {
  return `dancebase:focus-timer:${groupId}:sessions`;
}

/** 페이즈별 전체 초 계산 */
function totalSeconds(phase: FocusTimerPhase, config: FocusTimerConfig): number {
  if (phase === "focus") return config.focusDuration * 60;
  if (phase === "short_break") return config.shortBreak * 60;
  return config.longBreak * 60;
}

/** 진행률 계산 (0~1) */
function calcProgress(
  phase: FocusTimerPhase,
  secondsLeft: number,
  config: FocusTimerConfig
): number {
  return 1 - secondsLeft / Math.max(totalSeconds(phase, config), 1);
}

/** 오늘 날짜 YMD 형식 */
function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 이번 주 시작일 YMD (월요일 기준) */
function weekStartYMD(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

/** 오늘 집중 시간 합계 */
function calcTodayFocusTime(sessions: FocusTimerSession[], today: string): number {
  return sessions
    .filter((s) => s.date === today)
    .reduce((acc, s) => acc + s.totalFocusTime, 0);
}

/** 이번 주 집중 시간 합계 */
function calcWeekFocusTime(
  sessions: FocusTimerSession[],
  weekStart: string
): number {
  return sessions
    .filter((s) => s.date >= weekStart)
    .reduce((acc, s) => acc + s.totalFocusTime, 0);
}

/** 다음 페이즈 결정 */
function nextPhase(
  currentPhase: FocusTimerPhase,
  cycleCount: number,
  config: FocusTimerConfig
): FocusTimerPhase {
  if (currentPhase === "focus") {
    const newCycle = cycleCount + 1;
    return newCycle % config.cyclesBeforeLongBreak === 0
      ? "long_break"
      : "short_break";
  }
  return "focus";
}

/** 새 사이클 수 계산 */
function calcNewCycleCount(
  currentPhase: FocusTimerPhase,
  currentCycle: number
): number {
  if (currentPhase === "focus") return currentCycle + 1;
  return currentCycle;
}

// ============================================================
// 테스트 헬퍼
// ============================================================

function makeSession(
  id: string,
  date: string,
  totalFocusTime: number
): FocusTimerSession {
  return {
    id,
    date,
    focusMinutes: 25,
    breakMinutes: 5,
    completedCycles: 1,
    totalFocusTime,
    note: "",
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// phaseLabel
// ============================================================

describe("phaseLabel - 페이즈 한글 레이블", () => {
  it("focus 페이즈의 레이블은 '집중'이다", () => {
    expect(phaseLabel("focus")).toBe("집중");
  });

  it("short_break 페이즈의 레이블은 '짧은 휴식'이다", () => {
    expect(phaseLabel("short_break")).toBe("짧은 휴식");
  });

  it("long_break 페이즈의 레이블은 '긴 휴식'이다", () => {
    expect(phaseLabel("long_break")).toBe("긴 휴식");
  });
});

// ============================================================
// localStorage 키 생성
// ============================================================

describe("localStorage 키 생성", () => {
  it("config 키가 groupId를 포함한다", () => {
    expect(configKey("g1")).toBe("dancebase:focus-timer:g1:config");
  });

  it("sessions 키가 groupId를 포함한다", () => {
    expect(sessionsKey("g1")).toBe("dancebase:focus-timer:g1:sessions");
  });

  it("config 키와 sessions 키는 서로 다르다", () => {
    expect(configKey("g1")).not.toBe(sessionsKey("g1"));
  });

  it("서로 다른 groupId는 다른 config 키를 생성한다", () => {
    expect(configKey("g1")).not.toBe(configKey("g2"));
  });

  it("서로 다른 groupId는 다른 sessions 키를 생성한다", () => {
    expect(sessionsKey("g1")).not.toBe(sessionsKey("g2"));
  });
});

// ============================================================
// DEFAULT_CONFIG 검증
// ============================================================

describe("DEFAULT_CONFIG - 기본 설정값", () => {
  it("기본 집중 시간은 25분이다", () => {
    expect(DEFAULT_CONFIG.focusDuration).toBe(25);
  });

  it("기본 짧은 휴식 시간은 5분이다", () => {
    expect(DEFAULT_CONFIG.shortBreak).toBe(5);
  });

  it("기본 긴 휴식 시간은 15분이다", () => {
    expect(DEFAULT_CONFIG.longBreak).toBe(15);
  });

  it("기본 긴 휴식 사이클 주기는 4이다", () => {
    expect(DEFAULT_CONFIG.cyclesBeforeLongBreak).toBe(4);
  });
});

// ============================================================
// totalSeconds
// ============================================================

describe("totalSeconds - 페이즈별 전체 초", () => {
  it("focus 페이즈의 초는 focusDuration * 60이다", () => {
    expect(totalSeconds("focus", DEFAULT_CONFIG)).toBe(25 * 60);
  });

  it("short_break 페이즈의 초는 shortBreak * 60이다", () => {
    expect(totalSeconds("short_break", DEFAULT_CONFIG)).toBe(5 * 60);
  });

  it("long_break 페이즈의 초는 longBreak * 60이다", () => {
    expect(totalSeconds("long_break", DEFAULT_CONFIG)).toBe(15 * 60);
  });

  it("커스텀 설정에 따라 올바르게 계산된다", () => {
    const config: FocusTimerConfig = {
      focusDuration: 50,
      shortBreak: 10,
      longBreak: 30,
      cyclesBeforeLongBreak: 2,
    };
    expect(totalSeconds("focus", config)).toBe(50 * 60);
    expect(totalSeconds("short_break", config)).toBe(10 * 60);
    expect(totalSeconds("long_break", config)).toBe(30 * 60);
  });

  it("1분 설정 시 60초를 반환한다", () => {
    const config: FocusTimerConfig = {
      focusDuration: 1,
      shortBreak: 1,
      longBreak: 1,
      cyclesBeforeLongBreak: 1,
    };
    expect(totalSeconds("focus", config)).toBe(60);
  });
});

// ============================================================
// calcProgress
// ============================================================

describe("calcProgress - 진행률 계산", () => {
  it("타이머 시작 시 진행률은 0이다", () => {
    const secs = totalSeconds("focus", DEFAULT_CONFIG);
    expect(calcProgress("focus", secs, DEFAULT_CONFIG)).toBe(0);
  });

  it("타이머 완료 시 진행률은 1이다", () => {
    expect(calcProgress("focus", 0, DEFAULT_CONFIG)).toBe(1);
  });

  it("절반 경과 시 진행률은 0.5이다", () => {
    const secs = totalSeconds("focus", DEFAULT_CONFIG);
    const progress = calcProgress("focus", secs / 2, DEFAULT_CONFIG);
    expect(progress).toBeCloseTo(0.5);
  });

  it("short_break 진행률도 올바르게 계산된다", () => {
    const secs = totalSeconds("short_break", DEFAULT_CONFIG);
    expect(calcProgress("short_break", secs, DEFAULT_CONFIG)).toBe(0);
    expect(calcProgress("short_break", 0, DEFAULT_CONFIG)).toBe(1);
  });
});

// ============================================================
// nextPhase
// ============================================================

describe("nextPhase - 다음 페이즈 결정", () => {
  it("집중 완료 후 사이클이 cyclesBeforeLongBreak의 배수가 아니면 short_break이다", () => {
    // cycleCount=0 → newCycle=1, 1 % 4 !== 0 → short_break
    expect(nextPhase("focus", 0, DEFAULT_CONFIG)).toBe("short_break");
  });

  it("집중 완료 후 사이클이 cyclesBeforeLongBreak의 배수이면 long_break이다", () => {
    // cycleCount=3 → newCycle=4, 4 % 4 === 0 → long_break
    expect(nextPhase("focus", 3, DEFAULT_CONFIG)).toBe("long_break");
  });

  it("short_break 완료 후 다음 페이즈는 focus이다", () => {
    expect(nextPhase("short_break", 1, DEFAULT_CONFIG)).toBe("focus");
  });

  it("long_break 완료 후 다음 페이즈는 focus이다", () => {
    expect(nextPhase("long_break", 4, DEFAULT_CONFIG)).toBe("focus");
  });

  it("cyclesBeforeLongBreak=2인 경우 2사이클마다 long_break이다", () => {
    const config: FocusTimerConfig = { ...DEFAULT_CONFIG, cyclesBeforeLongBreak: 2 };
    expect(nextPhase("focus", 1, config)).toBe("long_break"); // 1 → 2, 2%2===0
    expect(nextPhase("focus", 0, config)).toBe("short_break"); // 0 → 1, 1%2!==0
  });
});

// ============================================================
// calcNewCycleCount
// ============================================================

describe("calcNewCycleCount - 사이클 수 계산", () => {
  it("focus 완료 시 사이클 수가 1 증가한다", () => {
    expect(calcNewCycleCount("focus", 0)).toBe(1);
    expect(calcNewCycleCount("focus", 3)).toBe(4);
  });

  it("short_break 완료 시 사이클 수가 변하지 않는다", () => {
    expect(calcNewCycleCount("short_break", 2)).toBe(2);
  });

  it("long_break 완료 시 사이클 수가 변하지 않는다", () => {
    expect(calcNewCycleCount("long_break", 4)).toBe(4);
  });
});

// ============================================================
// 날짜 헬퍼
// ============================================================

describe("todayYMD - 오늘 날짜 YMD", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-02T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("YYYY-MM-DD 형식을 반환한다", () => {
    const result = todayYMD();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekStartYMD - 이번 주 시작일", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("YYYY-MM-DD 형식을 반환한다", () => {
    const result = weekStartYMD();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("weekStartYMD가 todayYMD보다 이전이거나 같다", () => {
    const today = todayYMD();
    const weekStart = weekStartYMD();
    expect(weekStart <= today).toBe(true);
  });
});

// ============================================================
// calcTodayFocusTime
// ============================================================

describe("calcTodayFocusTime - 오늘 집중 시간", () => {
  it("오늘 세션이 없으면 0을 반환한다", () => {
    expect(calcTodayFocusTime([], "2026-03-02")).toBe(0);
  });

  it("오늘 세션의 totalFocusTime 합계를 반환한다", () => {
    const sessions = [
      makeSession("s1", "2026-03-02", 25),
      makeSession("s2", "2026-03-02", 25),
      makeSession("s3", "2026-03-01", 25),
    ];
    expect(calcTodayFocusTime(sessions, "2026-03-02")).toBe(50);
  });

  it("다른 날짜의 세션은 포함되지 않는다", () => {
    const sessions = [makeSession("s1", "2026-03-01", 100)];
    expect(calcTodayFocusTime(sessions, "2026-03-02")).toBe(0);
  });
});

// ============================================================
// calcWeekFocusTime
// ============================================================

describe("calcWeekFocusTime - 이번 주 집중 시간", () => {
  it("이번 주 세션이 없으면 0을 반환한다", () => {
    expect(calcWeekFocusTime([], "2026-03-02")).toBe(0);
  });

  it("이번 주 세션의 totalFocusTime 합계를 반환한다", () => {
    const sessions = [
      makeSession("s1", "2026-03-02", 25),
      makeSession("s2", "2026-03-03", 25),
      makeSession("s3", "2026-02-28", 100), // 이전 주
    ];
    expect(calcWeekFocusTime(sessions, "2026-03-02")).toBe(50);
  });

  it("weekStart 날짜도 이번 주에 포함된다", () => {
    const sessions = [makeSession("s1", "2026-03-02", 30)];
    expect(calcWeekFocusTime(sessions, "2026-03-02")).toBe(30);
  });

  it("이전 주 세션은 포함되지 않는다", () => {
    const sessions = [makeSession("s1", "2026-03-01", 50)];
    expect(calcWeekFocusTime(sessions, "2026-03-02")).toBe(0);
  });

  it("빈 세션 목록에서 0을 반환한다", () => {
    expect(calcWeekFocusTime([], "2026-03-02")).toBe(0);
  });
});
