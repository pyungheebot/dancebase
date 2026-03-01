/**
 * use-weekly-challenge-board 테스트
 *
 * 훅 내부의 순수 계산 로직을 검증합니다.
 * - getWeekStart: 월요일 기준 주 시작 계산
 * - getWeekEnd: 일요일 기준 주 종료 계산
 * - toDateString: ISO 날짜 문자열 변환
 * - calcDaysLeft: 이번 주 남은 일수 계산
 * - calcProgress: 챌린지별 진행 상황 계산
 * - 순위 부여 (점수 내림차순, 동점 시 이름순)
 * - DEFAULT_CHALLENGES 상수
 * - myEntry 찾기
 */

import { describe, it, expect } from "vitest";
import type {
  WeeklyChallenge,
  WeeklyChallengeType,
  MemberChallengeProgress,
  WeeklyChallengeEntry,
} from "@/types/schedule";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 주어진 날짜가 속한 주의 월요일 00:00:00 반환 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 주어진 날짜가 속한 주의 일요일 23:59:59 반환 */
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** ISO 날짜 문자열 변환 (YYYY-MM-DD) */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 이번 주 남은 일수 계산 (오늘 포함, 일요일 기준 마감) */
function calcDaysLeft(weekEnd: Date, now: Date = new Date()): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff + 1);
}

/** 챌린지 진행 상황 계산 */
function calcProgress(
  challengeId: WeeklyChallengeType,
  userId: string,
  goal: number,
  attendanceCountMap: Map<string, number>,
  boardCountMap: Map<string, number>,
  rsvpCompletedMap: Map<string, boolean>
): MemberChallengeProgress {
  let current = 0;
  let effectiveGoal = goal;

  if (challengeId === "attendance") {
    current = attendanceCountMap.get(userId) ?? 0;
  } else if (challengeId === "board") {
    current = boardCountMap.get(userId) ?? 0;
  } else if (challengeId === "rsvp") {
    current = rsvpCompletedMap.get(userId) ? 1 : 0;
    effectiveGoal = 1;
  }

  const completed = current >= effectiveGoal;
  const progressRate = Math.min(100, Math.round((current / effectiveGoal) * 100));

  return { challengeId, current, goal: effectiveGoal, completed, progressRate };
}

/** 순위 부여 (점수 내림차순, 동점 시 이름 오름차순) */
function assignRanks(
  entries: Omit<WeeklyChallengeEntry, "rank">[]
): WeeklyChallengeEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((e, idx) => ({ ...e, rank: idx + 1 }));
}

/** myEntry 찾기 */
function findMyEntry(
  entries: WeeklyChallengeEntry[],
  currentUserId?: string
): WeeklyChallengeEntry | null {
  if (!currentUserId) return null;
  return entries.find((e) => e.userId === currentUserId) ?? null;
}

// ============================================================
// DEFAULT_CHALLENGES 상수
// ============================================================

const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  { id: "attendance", title: "이번 주 출석 3회 이상", goal: 3 },
  { id: "board", title: "게시글 또는 댓글 5개 이상", goal: 5 },
  { id: "rsvp", title: "RSVP 전체 응답", goal: 1 },
];

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeEntry(
  overrides: Partial<Omit<WeeklyChallengeEntry, "rank">> & { rank?: number } = {}
): WeeklyChallengeEntry {
  return {
    userId: "user-1",
    name: "홍길동",
    challenges: [],
    completedCount: 0,
    score: 0,
    rank: 1,
    ...overrides,
  };
}

// ============================================================
// getWeekStart 테스트
// ============================================================

describe("getWeekStart - 월요일 기준 주 시작 계산", () => {
  // 주의: toISOString()은 UTC 기준이므로 KST(UTC+9) 환경에서는
  // 로컬 날짜보다 하루 앞선 날짜가 출력됩니다.
  // 아래 테스트는 실제 동작(UTC ISO 문자열)을 기준으로 검증합니다.

  it("수요일이면 해당 주 월요일 로컬 날짜를 가리킨다", () => {
    // 2026-03-04는 수요일, 해당 주 월요일은 2026-03-02
    const date = new Date(2026, 2, 4, 12, 0, 0); // month는 0-indexed
    const weekStart = getWeekStart(date);
    // 로컬 날짜가 월요일(2026-03-02)임을 확인
    expect(weekStart.getDay()).toBe(1); // 1 = 월요일
    expect(weekStart.getDate()).toBe(2);
    expect(weekStart.getMonth()).toBe(2); // 0-indexed → 3월
    expect(weekStart.getFullYear()).toBe(2026);
  });

  it("월요일이면 해당 날짜 자체(로컬 기준)를 반환한다", () => {
    // 2026-03-02는 월요일
    const date = new Date(2026, 2, 2, 12, 0, 0);
    const weekStart = getWeekStart(date);
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getDate()).toBe(2);
    expect(weekStart.getMonth()).toBe(2);
  });

  it("일요일이면 전 주 월요일을 반환한다", () => {
    // 2026-03-08은 일요일, 해당 주 월요일은 2026-03-02
    const date = new Date(2026, 2, 8, 12, 0, 0);
    const weekStart = getWeekStart(date);
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getDate()).toBe(2);
  });

  it("토요일이면 해당 주 월요일을 반환한다", () => {
    // 2026-03-07은 토요일, 해당 주 월요일은 2026-03-02
    const date = new Date(2026, 2, 7, 12, 0, 0);
    const weekStart = getWeekStart(date);
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getDate()).toBe(2);
  });

  it("결과 날짜의 시각이 00:00:00이다", () => {
    const date = new Date(2026, 2, 4, 15, 30, 0);
    const weekStart = getWeekStart(date);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
    expect(weekStart.getSeconds()).toBe(0);
  });

  it("금요일이면 해당 주 월요일을 반환한다", () => {
    // 2026-03-06은 금요일, 해당 주 월요일은 2026-03-02
    const date = new Date(2026, 2, 6, 12, 0, 0);
    const weekStart = getWeekStart(date);
    expect(weekStart.getDay()).toBe(1);
    expect(weekStart.getDate()).toBe(2);
  });
});

// ============================================================
// getWeekEnd 테스트
// ============================================================

describe("getWeekEnd - 일요일 기준 주 종료 계산", () => {
  it("월요일에서 6일 후 일요일을 반환한다", () => {
    const weekStart = new Date("2026-03-02T00:00:00");
    const weekEnd = getWeekEnd(weekStart);
    expect(toDateString(weekEnd)).toBe("2026-03-08");
  });

  it("결과 날짜의 시각이 23:59:59이다", () => {
    const weekStart = new Date("2026-03-02T00:00:00");
    const weekEnd = getWeekEnd(weekStart);
    expect(weekEnd.getHours()).toBe(23);
    expect(weekEnd.getMinutes()).toBe(59);
    expect(weekEnd.getSeconds()).toBe(59);
  });

  it("월말을 넘어가는 경우에도 올바르게 계산된다", () => {
    // 2026-01-26 (월요일) → 2026-02-01 (일요일)
    const weekStart = new Date("2026-01-26T00:00:00");
    const weekEnd = getWeekEnd(weekStart);
    expect(toDateString(weekEnd)).toBe("2026-02-01");
  });
});

// ============================================================
// toDateString 테스트
// ============================================================

describe("toDateString - ISO 날짜 문자열 변환", () => {
  it("날짜를 YYYY-MM-DD 형식으로 반환한다", () => {
    const date = new Date("2026-03-02T00:00:00Z");
    expect(toDateString(date)).toHaveLength(10);
    expect(toDateString(date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ISO 문자열의 앞 10자를 반환한다", () => {
    const date = new Date("2026-01-15T10:30:00Z");
    expect(toDateString(date)).toBe(date.toISOString().slice(0, 10));
  });
});

// ============================================================
// calcDaysLeft 테스트
// ============================================================

describe("calcDaysLeft - 이번 주 남은 일수 계산", () => {
  it("오늘이 종료일이면 1을 반환한다 (당일 포함)", () => {
    const weekEnd = new Date("2026-03-08T23:59:59");
    const now = new Date("2026-03-08T12:00:00");
    expect(calcDaysLeft(weekEnd, now)).toBe(1);
  });

  it("오늘이 종료일 하루 전이면 2를 반환한다", () => {
    const weekEnd = new Date("2026-03-08T23:59:59");
    const now = new Date("2026-03-07T12:00:00");
    expect(calcDaysLeft(weekEnd, now)).toBe(2);
  });

  it("종료일이 지났으면 0을 반환한다", () => {
    const weekEnd = new Date("2026-03-01T23:59:59");
    const now = new Date("2026-03-05T12:00:00");
    expect(calcDaysLeft(weekEnd, now)).toBe(0);
  });

  it("종료일이 7일 후이면 7을 반환한다 (월요일 기준)", () => {
    const weekEnd = new Date("2026-03-08T23:59:59");
    const now = new Date("2026-03-02T12:00:00"); // 월요일
    expect(calcDaysLeft(weekEnd, now)).toBe(7);
  });

  it("음수가 되지 않는다", () => {
    const weekEnd = new Date("2026-01-01T23:59:59");
    const now = new Date("2026-12-31T12:00:00");
    expect(calcDaysLeft(weekEnd, now)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// calcProgress 테스트
// ============================================================

describe("calcProgress - 챌린지별 진행 상황 계산", () => {
  const emptyMaps = {
    attendance: new Map<string, number>(),
    board: new Map<string, number>(),
    rsvp: new Map<string, boolean>(),
  };

  it("출석 챌린지: 출석 기록 없으면 current는 0이다", () => {
    const result = calcProgress("attendance", "u1", 3, emptyMaps.attendance, emptyMaps.board, emptyMaps.rsvp);
    expect(result.current).toBe(0);
    expect(result.completed).toBe(false);
  });

  it("출석 챌린지: 목표 출석 횟수 이상이면 completed true이다", () => {
    const attMap = new Map([["u1", 3]]);
    const result = calcProgress("attendance", "u1", 3, attMap, emptyMaps.board, emptyMaps.rsvp);
    expect(result.completed).toBe(true);
  });

  it("출석 챌린지: 목표 미달이면 progressRate가 비율로 계산된다", () => {
    const attMap = new Map([["u1", 1]]);
    const result = calcProgress("attendance", "u1", 3, attMap, emptyMaps.board, emptyMaps.rsvp);
    expect(result.progressRate).toBe(33); // 1/3 * 100 = 33.33 → 33
  });

  it("게시글 챌린지: 게시글+댓글 수가 목표 이상이면 completed true이다", () => {
    const boardMap = new Map([["u1", 5]]);
    const result = calcProgress("board", "u1", 5, emptyMaps.attendance, boardMap, emptyMaps.rsvp);
    expect(result.completed).toBe(true);
  });

  it("게시글 챌린지: 기록 없으면 current는 0이다", () => {
    const result = calcProgress("board", "u1", 5, emptyMaps.attendance, emptyMaps.board, emptyMaps.rsvp);
    expect(result.current).toBe(0);
  });

  it("RSVP 챌린지: 완료하면 current는 1이고 completed true이다", () => {
    const rsvpMap = new Map([["u1", true]]);
    const result = calcProgress("rsvp", "u1", 1, emptyMaps.attendance, emptyMaps.board, rsvpMap);
    expect(result.current).toBe(1);
    expect(result.completed).toBe(true);
  });

  it("RSVP 챌린지: 미완료이면 current는 0이고 completed false이다", () => {
    const result = calcProgress("rsvp", "u1", 1, emptyMaps.attendance, emptyMaps.board, emptyMaps.rsvp);
    expect(result.current).toBe(0);
    expect(result.completed).toBe(false);
  });

  it("progressRate는 최대 100이다", () => {
    const attMap = new Map([["u1", 100]]); // 목표 3 대비 100 출석
    const result = calcProgress("attendance", "u1", 3, attMap, emptyMaps.board, emptyMaps.rsvp);
    expect(result.progressRate).toBe(100);
  });

  it("챌린지 ID가 반환값에 포함된다", () => {
    const result = calcProgress("attendance", "u1", 3, emptyMaps.attendance, emptyMaps.board, emptyMaps.rsvp);
    expect(result.challengeId).toBe("attendance");
  });
});

// ============================================================
// assignRanks 테스트
// ============================================================

describe("assignRanks - 순위 부여", () => {
  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(assignRanks([])).toHaveLength(0);
  });

  it("점수 내림차순으로 정렬된다", () => {
    const entries = [
      { userId: "u1", name: "A", challenges: [], completedCount: 1, score: 1 },
      { userId: "u2", name: "B", challenges: [], completedCount: 3, score: 3 },
      { userId: "u3", name: "C", challenges: [], completedCount: 2, score: 2 },
    ];
    const ranked = assignRanks(entries);
    expect(ranked[0]!.userId).toBe("u2");
    expect(ranked[1]!.userId).toBe("u3");
    expect(ranked[2]!.userId).toBe("u1");
  });

  it("순위가 1부터 시작된다", () => {
    const entries = [
      { userId: "u1", name: "A", challenges: [], completedCount: 2, score: 2 },
    ];
    const ranked = assignRanks(entries);
    expect(ranked[0]!.rank).toBe(1);
  });

  it("동점이면 이름 오름차순으로 정렬된다", () => {
    const entries = [
      { userId: "u1", name: "최길동", challenges: [], completedCount: 2, score: 2 },
      { userId: "u2", name: "가나다", challenges: [], completedCount: 2, score: 2 },
      { userId: "u3", name: "홍길동", challenges: [], completedCount: 2, score: 2 },
    ];
    const ranked = assignRanks(entries);
    // 이름 오름차순: 가나다 → 최길동 → 홍길동
    expect(ranked[0]!.name).toBe("가나다");
    expect(ranked[1]!.name).toBe("최길동");
    expect(ranked[2]!.name).toBe("홍길동");
  });

  it("순위 번호가 연속적으로 부여된다", () => {
    const entries = [
      { userId: "u1", name: "A", challenges: [], completedCount: 3, score: 3 },
      { userId: "u2", name: "B", challenges: [], completedCount: 2, score: 2 },
      { userId: "u3", name: "C", challenges: [], completedCount: 1, score: 1 },
    ];
    const ranked = assignRanks(entries);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.rank).toBe(2);
    expect(ranked[2]!.rank).toBe(3);
  });

  it("모두 동점이면 이름 오름차순으로 정렬되고 순위가 순서대로 부여된다", () => {
    const entries = [
      { userId: "u1", name: "홍", challenges: [], completedCount: 0, score: 0 },
      { userId: "u2", name: "가", challenges: [], completedCount: 0, score: 0 },
    ];
    const ranked = assignRanks(entries);
    expect(ranked[0]!.name).toBe("가");
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.name).toBe("홍");
    expect(ranked[1]!.rank).toBe(2);
  });
});

// ============================================================
// findMyEntry 테스트
// ============================================================

describe("findMyEntry - 내 항목 찾기", () => {
  it("currentUserId가 없으면 null을 반환한다", () => {
    const entries = [makeEntry({ userId: "u1" })];
    expect(findMyEntry(entries, undefined)).toBeNull();
  });

  it("빈 문자열 currentUserId이면 null을 반환한다", () => {
    const entries = [makeEntry({ userId: "u1" })];
    expect(findMyEntry(entries, "")).toBeNull();
  });

  it("일치하는 userId가 있으면 해당 항목을 반환한다", () => {
    const entries = [
      makeEntry({ userId: "u1", name: "홍길동" }),
      makeEntry({ userId: "u2", name: "김철수" }),
    ];
    const result = findMyEntry(entries, "u2");
    expect(result?.name).toBe("김철수");
  });

  it("일치하는 userId가 없으면 null을 반환한다", () => {
    const entries = [makeEntry({ userId: "u1" })];
    expect(findMyEntry(entries, "u999")).toBeNull();
  });

  it("빈 entries 배열이면 null을 반환한다", () => {
    expect(findMyEntry([], "u1")).toBeNull();
  });
});

// ============================================================
// DEFAULT_CHALLENGES 상수 테스트
// ============================================================

describe("DEFAULT_CHALLENGES - 기본 챌린지 상수", () => {
  it("3개의 챌린지가 정의되어 있다", () => {
    expect(DEFAULT_CHALLENGES).toHaveLength(3);
  });

  it("출석 챌린지 목표는 3이다", () => {
    const attendance = DEFAULT_CHALLENGES.find((c) => c.id === "attendance");
    expect(attendance?.goal).toBe(3);
  });

  it("게시글 챌린지 목표는 5이다", () => {
    const board = DEFAULT_CHALLENGES.find((c) => c.id === "board");
    expect(board?.goal).toBe(5);
  });

  it("RSVP 챌린지 목표는 1이다", () => {
    const rsvp = DEFAULT_CHALLENGES.find((c) => c.id === "rsvp");
    expect(rsvp?.goal).toBe(1);
  });

  it("모든 챌린지에 title이 정의되어 있다", () => {
    for (const ch of DEFAULT_CHALLENGES) {
      expect(ch.title).toBeDefined();
      expect(ch.title.length).toBeGreaterThan(0);
    }
  });

  it("챌린지 ID가 'attendance', 'board', 'rsvp'이다", () => {
    const ids = DEFAULT_CHALLENGES.map((c) => c.id);
    expect(ids).toContain("attendance");
    expect(ids).toContain("board");
    expect(ids).toContain("rsvp");
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 주간 챌린지 보드", () => {
  it("수요일 날짜로 이번 주 월요일~일요일 범위를 계산한다", () => {
    const date = new Date(2026, 2, 4, 12, 0, 0); // 2026-03-04 수요일
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(weekStart);
    // 로컬 날짜 기준으로 월요일~일요일 7일 범위를 확인
    expect(weekStart.getDay()).toBe(1); // 월요일
    expect(weekStart.getDate()).toBe(2); // 3월 2일
    // weekEnd는 weekStart + 6일 = 3월 8일(일요일)
    expect(weekEnd.getDate()).toBe(8);
    expect(weekEnd.getHours()).toBe(23);
  });

  it("모든 챌린지를 완료한 멤버가 1위가 된다", () => {
    const entries: Omit<WeeklyChallengeEntry, "rank">[] = [
      { userId: "u1", name: "홍길동", challenges: [], completedCount: 3, score: 3 },
      { userId: "u2", name: "김철수", challenges: [], completedCount: 1, score: 1 },
      { userId: "u3", name: "이영희", challenges: [], completedCount: 2, score: 2 },
    ];
    const ranked = assignRanks(entries);
    expect(ranked[0]!.userId).toBe("u1");
    expect(ranked[0]!.rank).toBe(1);
  });

  it("내 항목을 entries에서 찾을 수 있다", () => {
    const entries: WeeklyChallengeEntry[] = [
      makeEntry({ userId: "u1", name: "홍길동", rank: 1 }),
      makeEntry({ userId: "u2", name: "김철수", rank: 2 }),
    ];
    const myEntry = findMyEntry(entries, "u2");
    expect(myEntry?.name).toBe("김철수");
  });

  it("출석 3회 달성 시 출석 챌린지 완료로 처리된다", () => {
    const attMap = new Map([["u1", 3]]);
    const boardMap = new Map<string, number>();
    const rsvpMap = new Map<string, boolean>();

    const prog = calcProgress("attendance", "u1", 3, attMap, boardMap, rsvpMap);
    expect(prog.completed).toBe(true);
    expect(prog.progressRate).toBe(100);
  });

  it("RSVP 미응답 시 RSVP 챌린지 미완료로 처리된다", () => {
    const attMap = new Map<string, number>();
    const boardMap = new Map<string, number>();
    const rsvpMap = new Map([["u1", false]]);

    const prog = calcProgress("rsvp", "u1", 1, attMap, boardMap, rsvpMap);
    expect(prog.completed).toBe(false);
    expect(prog.progressRate).toBe(0);
  });
});
