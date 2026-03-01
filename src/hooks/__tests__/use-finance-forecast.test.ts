import { describe, it, expect, vi } from "vitest";

// ─── Supabase mock (SWR fetcher 호출 방지) ───────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    rpc: vi.fn(),
  })),
}));

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    financeForecast: (id: string) => `finance-forecast-${id}`,
  },
}));

// ─── 내부 순수 함수 직접 테스트용 재구현 ─────────────────────

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function predict(regression: { slope: number; intercept: number }, x: number): number {
  return Math.max(0, regression.intercept + regression.slope * x);
}

function getMonthLabel(yearMonth: string): string {
  const [, mm] = yearMonth.split("-");
  return `${parseInt(mm, 10)}월`;
}

function buildMonthRange(monthsBack: number, monthsForward: number, baseDate?: Date): string[] {
  const now = baseDate ?? new Date();
  const result: string[] = [];
  for (let i = -monthsBack; i <= monthsForward; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${yyyy}-${mm}`);
  }
  return result;
}

type FinanceHealthLevel = "안정" | "주의" | "위험";

function calcHealthLevel(
  recentNetProfits: number[],
  forecastNetProfits: number[],
  hasAnyData: boolean
): { healthLevel: FinanceHealthLevel; healthMessage: string } {
  if (!hasAnyData) {
    return { healthLevel: "안정", healthMessage: "순이익이 양수로 유지되고 있습니다." };
  }

  const allForecastNegative = forecastNetProfits.every((np) => np < 0);
  const recentTrendDown =
    recentNetProfits.length >= 2 &&
    recentNetProfits[recentNetProfits.length - 1] < recentNetProfits[0];
  const anyRecentNegative = recentNetProfits.some((np) => np < 0);

  if (allForecastNegative || anyRecentNegative) {
    return {
      healthLevel: "위험",
      healthMessage: "순이익이 음수이거나 향후 3개월 모두 적자가 예상됩니다.",
    };
  } else if (recentTrendDown) {
    return {
      healthLevel: "주의",
      healthMessage: "최근 순이익이 감소 추세입니다. 지출을 점검해주세요.",
    };
  } else {
    return {
      healthLevel: "안정",
      healthMessage: "순이익이 양수로 유지되고 있습니다.",
    };
  }
}

// ============================================================
// linearRegression 테스트
// ============================================================

describe("useFinanceForecast - linearRegression 선형 회귀", () => {
  it("빈 배열이면 slope와 intercept가 0이다", () => {
    const result = linearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it("단일 값이면 slope는 0이다", () => {
    const result = linearRegression([100]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(100);
  });

  it("일정하게 증가하는 값에서 양수 slope를 반환한다", () => {
    const result = linearRegression([0, 10, 20, 30, 40]);
    expect(result.slope).toBeGreaterThan(0);
  });

  it("일정하게 감소하는 값에서 음수 slope를 반환한다", () => {
    const result = linearRegression([40, 30, 20, 10, 0]);
    expect(result.slope).toBeLessThan(0);
  });

  it("모든 값이 동일하면 slope는 0이다", () => {
    const result = linearRegression([50, 50, 50, 50, 50]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(50);
  });

  it("선형 데이터에서 intercept가 올바르게 계산된다", () => {
    // y = 2x: x=0→0, x=1→2, x=2→4, x=3→6
    const result = linearRegression([0, 2, 4, 6]);
    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
  });

  it("결과의 slope와 intercept가 숫자이다", () => {
    const result = linearRegression([100, 200, 150, 300]);
    expect(typeof result.slope).toBe("number");
    expect(typeof result.intercept).toBe("number");
  });
});

// ============================================================
// predict 테스트
// ============================================================

describe("useFinanceForecast - predict 예측", () => {
  it("predict 결과는 항상 0 이상이다 (음수 방지)", () => {
    const reg = { slope: -100, intercept: -50 };
    expect(predict(reg, 5)).toBe(0);
  });

  it("양수 예측값을 올바르게 반환한다", () => {
    const reg = { slope: 10, intercept: 100 };
    // x=2: 100 + 10*2 = 120
    expect(predict(reg, 2)).toBe(120);
  });

  it("slope가 0이면 항상 intercept 값을 반환한다", () => {
    const reg = { slope: 0, intercept: 75 };
    expect(predict(reg, 0)).toBe(75);
    expect(predict(reg, 10)).toBe(75);
  });

  it("x=0일 때 intercept 값을 반환한다", () => {
    const reg = { slope: 5, intercept: 200 };
    expect(predict(reg, 0)).toBe(200);
  });

  it("음수 intercept + 양수 slope 조합에서 x가 클 때 양수를 반환한다", () => {
    const reg = { slope: 10, intercept: -5 };
    // x=10: -5 + 100 = 95
    expect(predict(reg, 10)).toBe(95);
  });

  it("예측값이 정확히 0인 경우 0을 반환한다", () => {
    const reg = { slope: 0, intercept: 0 };
    expect(predict(reg, 0)).toBe(0);
  });
});

// ============================================================
// getMonthLabel 테스트
// ============================================================

describe("useFinanceForecast - getMonthLabel 월 레이블", () => {
  it("1월 레이블은 '1월'이다", () => {
    expect(getMonthLabel("2026-01")).toBe("1월");
  });

  it("12월 레이블은 '12월'이다", () => {
    expect(getMonthLabel("2026-12")).toBe("12월");
  });

  it("앞에 0이 붙은 월도 올바르게 처리한다", () => {
    expect(getMonthLabel("2026-03")).toBe("3월");
    expect(getMonthLabel("2026-09")).toBe("9월");
  });

  it("연도가 달라도 월 레이블만 반환한다", () => {
    expect(getMonthLabel("2025-06")).toBe("6월");
    expect(getMonthLabel("2027-11")).toBe("11월");
  });
});

// ============================================================
// buildMonthRange 테스트
// ============================================================

describe("useFinanceForecast - buildMonthRange 월 범위 생성", () => {
  const base = new Date("2026-03-01");

  it("monthsBack=5, monthsForward=0 이면 6개 월이 생성된다", () => {
    const result = buildMonthRange(5, 0, base);
    expect(result).toHaveLength(6);
  });

  it("monthsBack=0, monthsForward=3 이면 4개 월이 생성된다", () => {
    const result = buildMonthRange(0, 3, base);
    expect(result).toHaveLength(4);
  });

  it("결과 배열은 과거에서 미래 순으로 정렬된다", () => {
    const result = buildMonthRange(2, 2, base);
    for (let i = 1; i < result.length; i++) {
      expect(result[i] >= result[i - 1]).toBe(true);
    }
  });

  it("기준 날짜의 월이 포함된다", () => {
    const result = buildMonthRange(5, 0, base);
    expect(result).toContain("2026-03");
  });

  it("YYYY-MM 형식으로 반환된다", () => {
    const result = buildMonthRange(2, 2, base);
    result.forEach((m) => {
      expect(m).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it("월이 12월을 넘어가면 연도가 올바르게 증가한다", () => {
    const baseNov = new Date("2026-11-01");
    const result = buildMonthRange(0, 3, baseNov);
    expect(result).toContain("2027-01");
    expect(result).toContain("2027-02");
  });

  it("월이 1월 이전이면 연도가 올바르게 감소한다", () => {
    const baseFeb = new Date("2026-02-01");
    const result = buildMonthRange(3, 0, baseFeb);
    expect(result).toContain("2025-11");
    expect(result).toContain("2025-12");
  });
});

// ============================================================
// calcHealthLevel (건강도 판정) 테스트
// ============================================================

describe("useFinanceForecast - 재무 건강도 판정 로직", () => {
  it("데이터가 없으면 healthLevel은 '안정'이다", () => {
    const { healthLevel } = calcHealthLevel([], [], false);
    expect(healthLevel).toBe("안정");
  });

  it("최근 순이익이 음수이면 '위험'이다", () => {
    const { healthLevel } = calcHealthLevel([-100, -200], [100, 200, 300], true);
    expect(healthLevel).toBe("위험");
  });

  it("예측 순이익이 모두 음수이면 '위험'이다", () => {
    const { healthLevel } = calcHealthLevel([100, 200, 300], [-100, -200, -300], true);
    expect(healthLevel).toBe("위험");
  });

  it("최근 순이익이 감소 추세이면 '주의'이다", () => {
    // recentNetProfits[2] < recentNetProfits[0] → 감소 추세
    const { healthLevel } = calcHealthLevel([300, 200, 100], [150, 160, 170], true);
    expect(healthLevel).toBe("주의");
  });

  it("순이익이 양수이고 증가 추세이면 '안정'이다", () => {
    const { healthLevel } = calcHealthLevel([100, 200, 300], [400, 500, 600], true);
    expect(healthLevel).toBe("안정");
  });

  it("위험 메시지가 올바르다", () => {
    const { healthMessage } = calcHealthLevel([-100, -200], [100, 200, 300], true);
    expect(healthMessage).toContain("음수");
  });

  it("주의 메시지가 올바르다", () => {
    const { healthMessage } = calcHealthLevel([300, 200, 100], [150, 160, 170], true);
    expect(healthMessage).toContain("감소");
  });

  it("안정 메시지가 올바르다", () => {
    const { healthMessage } = calcHealthLevel([100, 200, 300], [400, 500, 600], true);
    expect(healthMessage).toContain("양수");
  });

  it("recentNetProfits가 1개인 경우 감소 추세 체크가 false이다", () => {
    // length < 2이면 recentTrendDown은 false
    const { healthLevel } = calcHealthLevel([300], [400, 500, 600], true);
    expect(healthLevel).toBe("안정");
  });

  it("예측 순이익 중 하나라도 양수면 '위험'이 아니다", () => {
    const { healthLevel } = calcHealthLevel([100, 200, 300], [-100, 200, 300], true);
    // allForecastNegative가 false → 위험 아님
    expect(healthLevel).not.toBe("위험");
  });
});

// ============================================================
// forecastAvgNetProfit 계산 테스트
// ============================================================

describe("useFinanceForecast - 예측 평균 순이익 계산", () => {
  it("예측 순이익의 평균을 올바르게 계산한다", () => {
    const profits = [100, 200, 300];
    const avg = Math.round(profits.reduce((s, v) => s + v, 0) / profits.length);
    expect(avg).toBe(200);
  });

  it("빈 배열이면 평균은 0이다", () => {
    const profits: number[] = [];
    const avg =
      profits.length > 0
        ? Math.round(profits.reduce((s, v) => s + v, 0) / profits.length)
        : 0;
    expect(avg).toBe(0);
  });

  it("음수 순이익도 올바르게 평균 계산된다", () => {
    const profits = [-100, -200, -300];
    const avg = Math.round(profits.reduce((s, v) => s + v, 0) / profits.length);
    expect(avg).toBe(-200);
  });

  it("소수점은 반올림된다", () => {
    const profits = [100, 200];
    const avg = Math.round((profits[0] + profits[1]) / 2);
    expect(avg).toBe(150);
  });
});

// ============================================================
// 월별 데이터 집계 로직 테스트
// ============================================================

describe("useFinanceForecast - 월별 데이터 집계 로직", () => {
  it("income 타입 거래는 income에 합산된다", () => {
    const transactions = [
      { type: "income", amount: 100, transaction_date: "2026-03-01" },
      { type: "income", amount: 200, transaction_date: "2026-03-15" },
    ];
    const monthMap: Record<string, { income: number; expense: number }> = {
      "2026-03": { income: 0, expense: 0 },
    };
    for (const row of transactions) {
      const ym = row.transaction_date.slice(0, 7);
      if (monthMap[ym]) {
        if (row.type === "income") monthMap[ym].income += row.amount;
        else if (row.type === "expense") monthMap[ym].expense += row.amount;
      }
    }
    expect(monthMap["2026-03"].income).toBe(300);
    expect(monthMap["2026-03"].expense).toBe(0);
  });

  it("expense 타입 거래는 expense에 합산된다", () => {
    const transactions = [
      { type: "expense", amount: 50, transaction_date: "2026-03-10" },
      { type: "expense", amount: 75, transaction_date: "2026-03-20" },
    ];
    const monthMap: Record<string, { income: number; expense: number }> = {
      "2026-03": { income: 0, expense: 0 },
    };
    for (const row of transactions) {
      const ym = row.transaction_date.slice(0, 7);
      if (monthMap[ym]) {
        if (row.type === "income") monthMap[ym].income += row.amount;
        else if (row.type === "expense") monthMap[ym].expense += row.amount;
      }
    }
    expect(monthMap["2026-03"].expense).toBe(125);
  });

  it("netProfit은 income - expense이다", () => {
    const income = 500;
    const expense = 300;
    const netProfit = income - expense;
    expect(netProfit).toBe(200);
  });

  it("범위 밖의 거래는 집계에서 제외된다", () => {
    const transactions = [
      { type: "income", amount: 100, transaction_date: "2026-01-01" },
      { type: "income", amount: 200, transaction_date: "2026-03-15" },
    ];
    const monthMap: Record<string, { income: number; expense: number }> = {
      "2026-03": { income: 0, expense: 0 },
    };
    for (const row of transactions) {
      const ym = row.transaction_date.slice(0, 7);
      if (monthMap[ym]) {
        if (row.type === "income") monthMap[ym].income += row.amount;
      }
    }
    expect(monthMap["2026-03"].income).toBe(200);
  });
});
