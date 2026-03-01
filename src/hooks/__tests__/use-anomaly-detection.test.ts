/**
 * use-anomaly-detection 테스트
 *
 * 훅 내부의 순수 계산 로직을 인라인으로 재현하여 검증합니다.
 * - 하락률 계산 (calcDropPercent)
 * - 상승률 계산 (calcRisePercent)
 * - 이상 레벨 결정 (getAnomalyLevel)
 * - 출석률 계산 (calcAttendanceRate)
 * - 금액 합산 (sumAmount)
 * - 건강 점수 계산 로직
 * - 기간 빌더 로직 (buildPeriods)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

const DEVIATION_WARNING = 30;
const DEVIATION_CRITICAL = 50;
const HEALTH_PENALTY_WARNING = 15;
const HEALTH_PENALTY_CRITICAL = 30;

/** 하락률(%) 계산. 이전 값이 0이면 null */
function calcDropPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((previous - current) / previous) * 100);
}

/** 상승률(%) 계산. 이전 값이 0이면 null */
function calcRisePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

type AnomalyLevel = "info" | "warning" | "critical";

/** 편차 수치를 기반으로 이상 레벨 결정 */
function getAnomalyLevel(deviationPercent: number): AnomalyLevel {
  if (deviationPercent >= DEVIATION_CRITICAL) return "critical";
  if (deviationPercent >= DEVIATION_WARNING) return "warning";
  return "info";
}

/** 출석률(%) 계산 */
function calcAttendanceRate(rows: { status: string }[]): number {
  if (!rows || rows.length === 0) return 0;
  const attended = rows.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  return Math.round((attended / rows.length) * 100);
}

/** 금액 합산 */
function sumAmount(rows: { amount: number }[]): number {
  return (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);
}

/** 건강 점수 계산 */
type AnomalyForScore = { level: AnomalyLevel };
function calcHealthScore(anomalies: AnomalyForScore[]): number {
  let healthScore = 100;
  for (const anomaly of anomalies) {
    if (anomaly.level === "critical") {
      healthScore -= HEALTH_PENALTY_CRITICAL;
    } else if (anomaly.level === "warning") {
      healthScore -= HEALTH_PENALTY_WARNING;
    } else {
      healthScore -= 5;
    }
  }
  return Math.max(0, healthScore);
}

/** 이상 탐지 여부 결정 (임계값 이상인지) */
function shouldDetectAnomaly(deviation: number | null): boolean {
  return deviation !== null && deviation >= DEVIATION_WARNING;
}

/** 기간 빌더 - 현재 기간과 이전 기간 날짜 범위 반환 */
function buildPeriods(now: Date): {
  current: { from: Date; to: Date };
  previous: { from: Date; to: Date };
} {
  const currentTo = new Date(now);
  currentTo.setHours(23, 59, 59, 999);

  const currentFrom = new Date(now);
  currentFrom.setDate(now.getDate() - 29);
  currentFrom.setHours(0, 0, 0, 0);

  const previousTo = new Date(currentFrom);
  previousTo.setDate(currentFrom.getDate() - 1);
  previousTo.setHours(23, 59, 59, 999);

  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousTo.getDate() - 29);
  previousFrom.setHours(0, 0, 0, 0);

  return { current: { from: currentFrom, to: currentTo }, previous: { from: previousFrom, to: previousTo } };
}

// ============================================================
// calcDropPercent 테스트
// ============================================================

describe("하락률 계산 (calcDropPercent)", () => {
  it("이전 값이 0이면 null을 반환한다", () => {
    expect(calcDropPercent(10, 0)).toBeNull();
    expect(calcDropPercent(0, 0)).toBeNull();
  });

  it("현재와 이전이 같으면 0%를 반환한다", () => {
    expect(calcDropPercent(100, 100)).toBe(0);
  });

  it("100에서 50으로 감소하면 50% 하락이다", () => {
    expect(calcDropPercent(50, 100)).toBe(50);
  });

  it("100에서 70으로 감소하면 30% 하락이다", () => {
    expect(calcDropPercent(70, 100)).toBe(30);
  });

  it("100에서 0으로 감소하면 100% 하락이다", () => {
    expect(calcDropPercent(0, 100)).toBe(100);
  });

  it("현재가 이전보다 크면 음수(상승)를 반환한다", () => {
    expect(calcDropPercent(150, 100)).toBe(-50);
  });

  it("소수점은 반올림된다", () => {
    // (10 - 7) / 10 * 100 = 30 정확히
    expect(calcDropPercent(7, 10)).toBe(30);
  });

  it("3에서 2로 감소하면 33% 하락이다 (1/3 ≈ 0.333 → 33)", () => {
    expect(calcDropPercent(2, 3)).toBe(33);
  });

  it("이전 값 양수, 현재 값 0이면 100%를 반환한다", () => {
    expect(calcDropPercent(0, 50)).toBe(100);
  });
});

// ============================================================
// calcRisePercent 테스트
// ============================================================

describe("상승률 계산 (calcRisePercent)", () => {
  it("이전 값이 0이면 null을 반환한다", () => {
    expect(calcRisePercent(10, 0)).toBeNull();
    expect(calcRisePercent(0, 0)).toBeNull();
  });

  it("현재와 이전이 같으면 0%를 반환한다", () => {
    expect(calcRisePercent(100, 100)).toBe(0);
  });

  it("100에서 150으로 증가하면 50% 상승이다", () => {
    expect(calcRisePercent(150, 100)).toBe(50);
  });

  it("100에서 200으로 증가하면 100% 상승이다", () => {
    expect(calcRisePercent(200, 100)).toBe(100);
  });

  it("현재가 이전보다 작으면 음수(하락)를 반환한다", () => {
    expect(calcRisePercent(50, 100)).toBe(-50);
  });

  it("2에서 3으로 증가하면 50% 상승이다", () => {
    expect(calcRisePercent(3, 2)).toBe(50);
  });

  it("소수점은 반올림된다", () => {
    // (4 - 3) / 3 * 100 = 33.33 → 33
    expect(calcRisePercent(4, 3)).toBe(33);
  });

  it("이전 1에서 현재 2로 증가하면 100% 상승이다", () => {
    expect(calcRisePercent(2, 1)).toBe(100);
  });
});

// ============================================================
// getAnomalyLevel 테스트
// ============================================================

describe("이상 레벨 결정 (getAnomalyLevel)", () => {
  it("50% 이상 편차는 'critical'이다", () => {
    expect(getAnomalyLevel(50)).toBe("critical");
    expect(getAnomalyLevel(51)).toBe("critical");
    expect(getAnomalyLevel(100)).toBe("critical");
  });

  it("30% 이상 50% 미만 편차는 'warning'이다", () => {
    expect(getAnomalyLevel(30)).toBe("warning");
    expect(getAnomalyLevel(40)).toBe("warning");
    expect(getAnomalyLevel(49)).toBe("warning");
  });

  it("30% 미만 편차는 'info'이다", () => {
    expect(getAnomalyLevel(29)).toBe("info");
    expect(getAnomalyLevel(0)).toBe("info");
    expect(getAnomalyLevel(10)).toBe("info");
  });

  it("정확히 DEVIATION_WARNING(30) 경계에서 'warning'이다", () => {
    expect(getAnomalyLevel(DEVIATION_WARNING)).toBe("warning");
  });

  it("정확히 DEVIATION_CRITICAL(50) 경계에서 'critical'이다", () => {
    expect(getAnomalyLevel(DEVIATION_CRITICAL)).toBe("critical");
  });

  it("편차 1은 'info'이다", () => {
    expect(getAnomalyLevel(1)).toBe("info");
  });
});

// ============================================================
// calcAttendanceRate 테스트
// ============================================================

describe("출석률 계산 (calcAttendanceRate)", () => {
  it("빈 배열이면 0%를 반환한다", () => {
    expect(calcAttendanceRate([])).toBe(0);
  });

  it("전원 present이면 100%를 반환한다", () => {
    const rows = [
      { status: "present" },
      { status: "present" },
      { status: "present" },
    ];
    expect(calcAttendanceRate(rows)).toBe(100);
  });

  it("전원 absent이면 0%를 반환한다", () => {
    const rows = [
      { status: "absent" },
      { status: "absent" },
    ];
    expect(calcAttendanceRate(rows)).toBe(0);
  });

  it("late도 출석으로 계산한다", () => {
    const rows = [
      { status: "present" },
      { status: "late" },
      { status: "absent" },
      { status: "absent" },
    ];
    // 2/4 = 50%
    expect(calcAttendanceRate(rows)).toBe(50);
  });

  it("50% 출석률을 정확히 계산한다", () => {
    const rows = [
      { status: "present" },
      { status: "absent" },
    ];
    expect(calcAttendanceRate(rows)).toBe(50);
  });

  it("반올림 처리를 한다 (2/3 ≈ 67%)", () => {
    const rows = [
      { status: "present" },
      { status: "present" },
      { status: "absent" },
    ];
    expect(calcAttendanceRate(rows)).toBe(67);
  });

  it("알 수 없는 상태는 결석으로 처리한다", () => {
    const rows = [
      { status: "present" },
      { status: "unknown" },
    ];
    // 1/2 = 50%
    expect(calcAttendanceRate(rows)).toBe(50);
  });
});

// ============================================================
// sumAmount 테스트
// ============================================================

describe("금액 합산 (sumAmount)", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(sumAmount([])).toBe(0);
  });

  it("단일 항목의 금액을 반환한다", () => {
    expect(sumAmount([{ amount: 10000 }])).toBe(10000);
  });

  it("여러 항목의 금액을 합산한다", () => {
    expect(sumAmount([
      { amount: 10000 },
      { amount: 20000 },
      { amount: 30000 },
    ])).toBe(60000);
  });

  it("0원 항목이 포함되어도 올바르게 합산한다", () => {
    expect(sumAmount([
      { amount: 5000 },
      { amount: 0 },
      { amount: 3000 },
    ])).toBe(8000);
  });

  it("금액이 모두 0이면 0을 반환한다", () => {
    expect(sumAmount([
      { amount: 0 },
      { amount: 0 },
    ])).toBe(0);
  });
});

// ============================================================
// 건강 점수 계산 테스트
// ============================================================

describe("건강 점수 계산 (calcHealthScore)", () => {
  it("이상 징후가 없으면 100점이다", () => {
    expect(calcHealthScore([])).toBe(100);
  });

  it("critical 1개이면 70점이다 (100 - 30)", () => {
    expect(calcHealthScore([{ level: "critical" }])).toBe(70);
  });

  it("warning 1개이면 85점이다 (100 - 15)", () => {
    expect(calcHealthScore([{ level: "warning" }])).toBe(85);
  });

  it("info 1개이면 95점이다 (100 - 5)", () => {
    expect(calcHealthScore([{ level: "info" }])).toBe(95);
  });

  it("critical 2개이면 40점이다 (100 - 30 - 30)", () => {
    expect(calcHealthScore([
      { level: "critical" },
      { level: "critical" },
    ])).toBe(40);
  });

  it("warning 2개 + critical 1개이면 40점이다 (100 - 15 - 15 - 30)", () => {
    expect(calcHealthScore([
      { level: "warning" },
      { level: "warning" },
      { level: "critical" },
    ])).toBe(40);
  });

  it("점수는 0 미만으로 내려가지 않는다", () => {
    const manyAnomalies: AnomalyForScore[] = Array(10).fill({ level: "critical" });
    expect(calcHealthScore(manyAnomalies)).toBe(0);
  });

  it("critical + warning + info 혼합 시 올바르게 계산한다", () => {
    // 100 - 30 - 15 - 5 = 50
    expect(calcHealthScore([
      { level: "critical" },
      { level: "warning" },
      { level: "info" },
    ])).toBe(50);
  });

  it("warning 6개이면 10점이다 (100 - 90)", () => {
    const warnings: AnomalyForScore[] = Array(6).fill({ level: "warning" });
    expect(calcHealthScore(warnings)).toBe(10);
  });
});

// ============================================================
// 이상 탐지 여부 결정 테스트
// ============================================================

describe("이상 탐지 여부 결정 (shouldDetectAnomaly)", () => {
  it("null이면 탐지하지 않는다", () => {
    expect(shouldDetectAnomaly(null)).toBe(false);
  });

  it("DEVIATION_WARNING(30) 이상이면 탐지한다", () => {
    expect(shouldDetectAnomaly(30)).toBe(true);
    expect(shouldDetectAnomaly(50)).toBe(true);
    expect(shouldDetectAnomaly(100)).toBe(true);
  });

  it("29 이하이면 탐지하지 않는다", () => {
    expect(shouldDetectAnomaly(29)).toBe(false);
    expect(shouldDetectAnomaly(0)).toBe(false);
    expect(shouldDetectAnomaly(10)).toBe(false);
  });

  it("정확히 30이면 탐지한다", () => {
    expect(shouldDetectAnomaly(30)).toBe(true);
  });
});

// ============================================================
// 기간 빌더 테스트 (buildPeriods)
// ============================================================

describe("기간 빌더 (buildPeriods)", () => {
  it("현재 기간의 to는 당일 23:59:59이다", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { current } = buildPeriods(now);
    expect(current.to.getHours()).toBe(23);
    expect(current.to.getMinutes()).toBe(59);
    expect(current.to.getSeconds()).toBe(59);
  });

  it("현재 기간의 from은 29일 전 00:00:00이다", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { current } = buildPeriods(now);
    expect(current.from.getHours()).toBe(0);
    expect(current.from.getMinutes()).toBe(0);
    expect(current.from.getSeconds()).toBe(0);
  });

  it("현재 기간은 30일 범위이다 (from이 29일 전)", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { current } = buildPeriods(now);
    const diffMs = current.to.getTime() - current.from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThan(31);
  });

  it("이전 기간은 현재 기간보다 이전이다", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { current, previous } = buildPeriods(now);
    expect(previous.to.getTime()).toBeLessThan(current.from.getTime());
  });

  it("이전 기간도 30일 범위이다", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { previous } = buildPeriods(now);
    const diffMs = previous.to.getTime() - previous.from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThan(31);
  });

  it("이전 기간 to는 현재 기간 from 하루 전이다", () => {
    const now = new Date("2026-03-01T12:00:00.000Z");
    const { current, previous } = buildPeriods(now);
    // previous.to는 current.from 하루 전 23:59:59
    const dayDiffMs = current.from.getTime() - previous.to.getTime();
    const dayDiff = dayDiffMs / (1000 * 60 * 60);
    // 대략 0 ~ 24시간 차이 (날짜 경계)
    expect(dayDiff).toBeGreaterThanOrEqual(0);
    expect(dayDiff).toBeLessThan(24);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 이상 탐지 흐름", () => {
  it("출석률 급감 탐지: 80% → 40% (50% 하락) → critical", () => {
    const prevRate = 80;
    const curRate = 40;
    const drop = calcDropPercent(curRate, prevRate);
    expect(drop).toBe(50);
    expect(shouldDetectAnomaly(drop)).toBe(true);
    expect(getAnomalyLevel(drop!)).toBe("critical");
  });

  it("출석률 소폭 감소: 80% → 60% (25% 하락) → 탐지하지 않음", () => {
    const drop = calcDropPercent(60, 80);
    expect(drop).toBe(25);
    expect(shouldDetectAnomaly(drop)).toBe(false);
  });

  it("게시글 급감 탐지: 10건 → 3건 (70% 하락) → critical", () => {
    const drop = calcDropPercent(3, 10);
    expect(drop).toBe(70);
    expect(shouldDetectAnomaly(drop)).toBe(true);
    expect(getAnomalyLevel(drop!)).toBe("critical");
  });

  it("지출 급증 탐지: 100만 → 150만 (50% 증가) → critical", () => {
    const rise = calcRisePercent(1500000, 1000000);
    expect(rise).toBe(50);
    expect(shouldDetectAnomaly(rise)).toBe(true);
    expect(getAnomalyLevel(rise!)).toBe("critical");
  });

  it("지출 소폭 증가: 100만 → 120만 (20% 증가) → 탐지 안 함", () => {
    const rise = calcRisePercent(1200000, 1000000);
    expect(rise).toBe(20);
    expect(shouldDetectAnomaly(rise)).toBe(false);
  });

  it("critical 2개 이상이면 건강 점수가 40점 이하이다", () => {
    const score = calcHealthScore([
      { level: "critical" },
      { level: "critical" },
    ]);
    expect(score).toBeLessThanOrEqual(40);
  });

  it("이상 없으면 건강 점수 100, 이상 1개(warning)면 85이다", () => {
    expect(calcHealthScore([])).toBe(100);
    expect(calcHealthScore([{ level: "warning" }])).toBe(85);
  });

  it("이전 값 0인 경우 하락률이 null이므로 탐지하지 않는다", () => {
    const drop = calcDropPercent(5, 0);
    expect(drop).toBeNull();
    expect(shouldDetectAnomaly(drop)).toBe(false);
  });
});
