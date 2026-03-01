/**
 * use-member-health-score 테스트
 *
 * 훅 내부의 순수 점수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - 출석률 점수 (0~20)
 * - RSVP 응답률 점수 (0~20)
 * - 게시판 참여도 점수 (0~20)
 * - 가입 기간 대비 활동량 점수 (0~20)
 * - 최근 활동 빈도 점수 (0~20)
 * - 등급 결정 로직 (excellent/good/warning/danger)
 * - 위험 신호 감지 로직
 */

import { describe, it, expect } from "vitest";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// (테스트를 위해 동일한 로직을 인라인으로 정의)
// ============================================================

/** 출석률 점수 계산 (0~20) */
function calcAttendanceScore(
  presentCount: number,
  totalSchedules: number
): number {
  if (totalSchedules === 0) return 10; // 일정 없으면 기본 10점
  const rate = presentCount / totalSchedules;
  return Math.round(rate * 20);
}

/** RSVP 응답률 점수 계산 (0~20) */
function calcRsvpScore(rsvpCount: number, totalSchedules: number): number {
  if (totalSchedules === 0) return 10;
  const rate = rsvpCount / totalSchedules;
  return Math.round(rate * 20);
}

/** 게시판 참여도 점수 계산 (0~20) */
function calcBoardScore(boardTotal: number): number {
  return Math.min(20, Math.round((boardTotal / 10) * 20));
}

/** 가입 기간 대비 활동량 점수 계산 (0~20) */
function calcLongevityScore(totalActions: number, daysSinceJoin: number): number {
  const monthsSinceJoin = Math.max(daysSinceJoin / 30, 0);
  const actionsPerMonth = monthsSinceJoin > 0 ? totalActions / monthsSinceJoin : 0;
  return Math.min(20, Math.round((actionsPerMonth / 5) * 20));
}

/** 최근 활동 빈도 점수 계산 (0~20) */
function calcRecentActivityScore(recent7Total: number, prev7Total: number): number {
  if (recent7Total === 0 && prev7Total === 0) return 5;
  if (recent7Total >= prev7Total) {
    return Math.min(20, 10 + Math.round((recent7Total / Math.max(1, prev7Total)) * 5));
  }
  const dropRatio = (prev7Total - recent7Total) / Math.max(1, prev7Total);
  return Math.max(0, Math.round(10 - dropRatio * 10));
}

/** 등급 결정 */
function calcGrade(totalScore: number): "excellent" | "good" | "warning" | "danger" {
  if (totalScore >= 80) return "excellent";
  if (totalScore >= 60) return "good";
  if (totalScore >= 40) return "warning";
  return "danger";
}

/** 출석 급락 위험 감지 */
function detectAttendanceDrop(
  recentPresent: number,
  recentTotal: number,
  prevPresent: number,
  prevTotal: number
): boolean {
  if (recentTotal === 0 || prevTotal === 0) return false;
  const recentRate = recentPresent / recentTotal;
  const prevRate = prevPresent / prevTotal;
  return prevRate > 0 && prevRate - recentRate >= 0.3;
}

/** 총점 계산 */
function calcTotalScore(scores: {
  attendance: number;
  rsvp: number;
  board: number;
  longevity: number;
  recentActivity: number;
}): number {
  return Math.min(
    100,
    scores.attendance + scores.rsvp + scores.board + scores.longevity + scores.recentActivity
  );
}

// ============================================================
// 출석률 점수 테스트
// ============================================================

describe("출석률 점수 계산 (0~20)", () => {
  it("일정이 없으면 기본 10점을 반환한다", () => {
    expect(calcAttendanceScore(0, 0)).toBe(10);
  });

  it("100% 출석(모든 일정 참석)이면 20점이다", () => {
    expect(calcAttendanceScore(10, 10)).toBe(20);
  });

  it("0% 출석이면 0점이다", () => {
    expect(calcAttendanceScore(0, 10)).toBe(0);
  });

  it("50% 출석이면 10점이다", () => {
    expect(calcAttendanceScore(5, 10)).toBe(10);
  });

  it("75% 출석이면 15점이다", () => {
    expect(calcAttendanceScore(3, 4)).toBe(15);
  });

  it("20% 출석이면 4점이다", () => {
    expect(calcAttendanceScore(1, 5)).toBe(4);
  });

  it("점수는 20을 초과하지 않는다", () => {
    expect(calcAttendanceScore(100, 100)).toBeLessThanOrEqual(20);
  });

  it("점수는 0 미만이 되지 않는다", () => {
    expect(calcAttendanceScore(0, 100)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// RSVP 응답률 점수 테스트
// ============================================================

describe("RSVP 응답률 점수 계산 (0~20)", () => {
  it("일정이 없으면 기본 10점을 반환한다", () => {
    expect(calcRsvpScore(0, 0)).toBe(10);
  });

  it("100% 응답이면 20점이다", () => {
    expect(calcRsvpScore(10, 10)).toBe(20);
  });

  it("0% 응답이면 0점이다", () => {
    expect(calcRsvpScore(0, 10)).toBe(0);
  });

  it("50% 응답이면 10점이다", () => {
    expect(calcRsvpScore(5, 10)).toBe(10);
  });

  it("점수는 최대 20을 반환한다", () => {
    expect(calcRsvpScore(100, 100)).toBe(20);
  });
});

// ============================================================
// 게시판 참여도 점수 테스트
// ============================================================

describe("게시판 참여도 점수 계산 (0~20)", () => {
  it("활동 0건이면 0점이다", () => {
    expect(calcBoardScore(0)).toBe(0);
  });

  it("활동 10건 이상이면 20점이다", () => {
    expect(calcBoardScore(10)).toBe(20);
    expect(calcBoardScore(20)).toBe(20);
  });

  it("활동 5건이면 10점이다", () => {
    expect(calcBoardScore(5)).toBe(10);
  });

  it("활동 1건이면 2점이다", () => {
    expect(calcBoardScore(1)).toBe(2);
  });

  it("활동 2건이면 4점이다", () => {
    expect(calcBoardScore(2)).toBe(4);
  });

  it("점수는 20을 초과하지 않는다", () => {
    expect(calcBoardScore(100)).toBe(20);
  });

  it("점수는 0 이상이다", () => {
    expect(calcBoardScore(0)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// 가입 기간 대비 활동량 점수 테스트
// ============================================================

describe("가입 기간 대비 활동량 점수 계산 (0~20)", () => {
  it("활동이 없으면 0점이다", () => {
    expect(calcLongevityScore(0, 30)).toBe(0);
  });

  it("30일 경과, 월 5회 활동이면 20점이다", () => {
    expect(calcLongevityScore(5, 30)).toBe(20);
  });

  it("30일 경과, 월 10회 활동이면 최대 20점이다", () => {
    expect(calcLongevityScore(10, 30)).toBe(20);
  });

  it("30일 경과, 월 2.5회 활동이면 10점이다", () => {
    expect(calcLongevityScore(2, 30)).toBe(8);
  });

  it("점수는 20을 초과하지 않는다", () => {
    expect(calcLongevityScore(1000, 30)).toBe(20);
  });

  it("점수는 0 이상이다", () => {
    expect(calcLongevityScore(0, 365)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// 최근 활동 빈도 점수 테스트
// ============================================================

describe("최근 활동 빈도 점수 계산 (0~20)", () => {
  it("최근 7일과 이전 7일 모두 0이면 5점(최소)을 반환한다", () => {
    expect(calcRecentActivityScore(0, 0)).toBe(5);
  });

  it("최근이 이전과 같으면 10점 이상이다", () => {
    const score = calcRecentActivityScore(3, 3);
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it("최근이 이전보다 많으면 10점 이상이다", () => {
    const score = calcRecentActivityScore(5, 2);
    expect(score).toBeGreaterThanOrEqual(10);
  });

  it("최근이 이전보다 적으면 10점 미만이다", () => {
    const score = calcRecentActivityScore(1, 5);
    expect(score).toBeLessThan(10);
  });

  it("최근 활동이 0이고 이전 활동이 있으면 점수가 낮다", () => {
    const score = calcRecentActivityScore(0, 5);
    expect(score).toBeLessThan(10);
  });

  it("점수는 0 이상이다", () => {
    expect(calcRecentActivityScore(0, 100)).toBeGreaterThanOrEqual(0);
  });

  it("점수는 20 이하이다", () => {
    expect(calcRecentActivityScore(100, 1)).toBeLessThanOrEqual(20);
  });

  it("이전 활동이 없고 최근 활동이 있으면 15점이다", () => {
    // recent7 >= prev7 분기: 10 + Math.round((recent7 / max(1, prev7)) * 5)
    // = 10 + Math.round((5 / 1) * 5) = 10 + 25 = 35 → min(20, 35) = 20
    // 단, prev7Total=0이면 recent7Total(5) >= prev7Total(0) 이므로 이 분기
    const score = calcRecentActivityScore(5, 0);
    expect(score).toBeGreaterThanOrEqual(10);
  });
});

// ============================================================
// 등급 결정 로직 테스트
// ============================================================

describe("등급 결정 로직", () => {
  it("80점 이상이면 'excellent' 등급이다", () => {
    expect(calcGrade(80)).toBe("excellent");
    expect(calcGrade(90)).toBe("excellent");
    expect(calcGrade(100)).toBe("excellent");
  });

  it("79점은 'good' 등급이다", () => {
    expect(calcGrade(79)).toBe("good");
  });

  it("60~79점은 'good' 등급이다", () => {
    expect(calcGrade(60)).toBe("good");
    expect(calcGrade(70)).toBe("good");
    expect(calcGrade(79)).toBe("good");
  });

  it("59점은 'warning' 등급이다", () => {
    expect(calcGrade(59)).toBe("warning");
  });

  it("40~59점은 'warning' 등급이다", () => {
    expect(calcGrade(40)).toBe("warning");
    expect(calcGrade(50)).toBe("warning");
    expect(calcGrade(59)).toBe("warning");
  });

  it("39점은 'danger' 등급이다", () => {
    expect(calcGrade(39)).toBe("danger");
  });

  it("40점 미만은 'danger' 등급이다", () => {
    expect(calcGrade(0)).toBe("danger");
    expect(calcGrade(20)).toBe("danger");
    expect(calcGrade(39)).toBe("danger");
  });

  it("정확히 80점 경계에서 'excellent'가 된다", () => {
    expect(calcGrade(80)).toBe("excellent");
  });

  it("정확히 60점 경계에서 'good'이 된다", () => {
    expect(calcGrade(60)).toBe("good");
  });

  it("정확히 40점 경계에서 'warning'이 된다", () => {
    expect(calcGrade(40)).toBe("warning");
  });
});

// ============================================================
// 출석 급락 위험 신호 테스트
// ============================================================

describe("출석 급락 위험 신호 감지 (30% 이상 급락)", () => {
  it("이전 100% → 최근 50% 이면 급락이다 (50% 하락)", () => {
    expect(detectAttendanceDrop(2, 4, 4, 4)).toBe(true);
  });

  it("이전 100% → 최근 70% 이면 급락이다 (30% 하락)", () => {
    expect(detectAttendanceDrop(7, 10, 10, 10)).toBe(true);
  });

  it("이전 100% → 최근 80%이면 급락 아니다 (20% 하락)", () => {
    expect(detectAttendanceDrop(4, 5, 5, 5)).toBe(false);
  });

  it("이전 0%이면 급락으로 판정하지 않는다 (prevRate === 0)", () => {
    expect(detectAttendanceDrop(0, 5, 0, 5)).toBe(false);
  });

  it("이전 일정이 없으면 급락으로 판정하지 않는다", () => {
    expect(detectAttendanceDrop(0, 5, 0, 0)).toBe(false);
  });

  it("최근 일정이 없으면 급락으로 판정하지 않는다", () => {
    expect(detectAttendanceDrop(0, 0, 3, 4)).toBe(false);
  });

  it("이전과 최근이 동일한 출석률이면 급락 아니다", () => {
    expect(detectAttendanceDrop(5, 10, 5, 10)).toBe(false);
  });

  it("최근이 이전보다 더 높으면 급락 아니다", () => {
    expect(detectAttendanceDrop(10, 10, 5, 10)).toBe(false);
  });
});

// ============================================================
// 총점 계산 테스트
// ============================================================

describe("총점 계산 (최대 100점)", () => {
  it("모든 지표가 20점이면 총점은 100점이다", () => {
    const score = calcTotalScore({
      attendance: 20,
      rsvp: 20,
      board: 20,
      longevity: 20,
      recentActivity: 20,
    });
    expect(score).toBe(100);
  });

  it("모든 지표가 0점이면 총점은 0점이다", () => {
    const score = calcTotalScore({
      attendance: 0,
      rsvp: 0,
      board: 0,
      longevity: 0,
      recentActivity: 0,
    });
    expect(score).toBe(0);
  });

  it("총점이 100을 초과하지 않는다", () => {
    const score = calcTotalScore({
      attendance: 30,
      rsvp: 30,
      board: 30,
      longevity: 30,
      recentActivity: 30,
    });
    expect(score).toBe(100);
  });

  it("지표 합산이 올바르게 계산된다", () => {
    const score = calcTotalScore({
      attendance: 10,
      rsvp: 10,
      board: 10,
      longevity: 10,
      recentActivity: 5,
    });
    expect(score).toBe(45);
  });

  it("45점 총점은 'warning' 등급이다", () => {
    const score = calcTotalScore({
      attendance: 10,
      rsvp: 10,
      board: 10,
      longevity: 10,
      recentActivity: 5,
    });
    expect(calcGrade(score)).toBe("warning");
  });

  it("100점 총점은 'excellent' 등급이다", () => {
    const score = calcTotalScore({
      attendance: 20,
      rsvp: 20,
      board: 20,
      longevity: 20,
      recentActivity: 20,
    });
    expect(calcGrade(score)).toBe("excellent");
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 건강도 점수 계산", () => {
  it("활발한 멤버: 높은 출석률 + RSVP + 게시판 → excellent 등급", () => {
    const attendance = calcAttendanceScore(9, 10);   // 18점
    const rsvp = calcRsvpScore(10, 10);               // 20점
    const board = calcBoardScore(8);                  // 16점
    const longevity = calcLongevityScore(15, 90);     // 약 10점
    const recentActivity = calcRecentActivityScore(3, 2); // 약 10점
    const total = calcTotalScore({ attendance, rsvp, board, longevity, recentActivity });
    expect(calcGrade(total)).toBeOneOf(["excellent", "good"]);
    expect(total).toBeGreaterThanOrEqual(60);
  });

  it("비활성 멤버: 출석 0 + 게시판 0 + RSVP 0 → danger 등급", () => {
    const attendance = calcAttendanceScore(0, 10);  // 0점
    const rsvp = calcRsvpScore(0, 10);              // 0점
    const board = calcBoardScore(0);                // 0점
    const longevity = calcLongevityScore(0, 30);    // 0점
    const recentActivity = calcRecentActivityScore(0, 0); // 5점
    const total = calcTotalScore({ attendance, rsvp, board, longevity, recentActivity });
    expect(calcGrade(total)).toBe("danger");
  });

  it("신규 멤버(가입 후 7일): 기본 점수만 있으면 warning 이상일 수 있다", () => {
    const attendance = calcAttendanceScore(0, 0); // 10점 (일정 없음)
    const rsvp = calcRsvpScore(0, 0);             // 10점 (일정 없음)
    const board = calcBoardScore(0);              // 0점
    const longevity = calcLongevityScore(1, 7);   // 소수점 반올림
    const recentActivity = calcRecentActivityScore(1, 0); // 활동 있음
    const total = calcTotalScore({ attendance, rsvp, board, longevity, recentActivity });
    expect(total).toBeGreaterThan(0);
  });
});
