import { describe, it, expect } from "vitest";
import {
  getScoreColor,
  getScoreTextColor,
  getScoreLabel,
  PAIN_AREA_LABELS,
  INTENSITY_LABELS,
  INTENSITY_COLORS,
  PAIN_AREA_LIST,
  INTENSITY_LIST,
} from "@/hooks/use-dance-condition";

// ============================================================
// use-dance-condition.ts 순수 함수/상수 테스트
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. getScoreColor - 점수별 배경색 반환
// ──────────────────────────────────────────────────────────────

describe("getScoreColor - 점수별 배경색", () => {
  it("점수 10이면 'bg-green-500'이다", () => {
    expect(getScoreColor(10)).toBe("bg-green-500");
  });

  it("점수 8이면 'bg-green-500'이다 (경계값)", () => {
    expect(getScoreColor(8)).toBe("bg-green-500");
  });

  it("점수 7이면 'bg-blue-500'이다", () => {
    expect(getScoreColor(7)).toBe("bg-blue-500");
  });

  it("점수 6이면 'bg-blue-500'이다 (경계값)", () => {
    expect(getScoreColor(6)).toBe("bg-blue-500");
  });

  it("점수 5이면 'bg-yellow-500'이다", () => {
    expect(getScoreColor(5)).toBe("bg-yellow-500");
  });

  it("점수 4이면 'bg-yellow-500'이다 (경계값)", () => {
    expect(getScoreColor(4)).toBe("bg-yellow-500");
  });

  it("점수 3이면 'bg-red-500'이다", () => {
    expect(getScoreColor(3)).toBe("bg-red-500");
  });

  it("점수 1이면 'bg-red-500'이다", () => {
    expect(getScoreColor(1)).toBe("bg-red-500");
  });

  it("점수 0이면 'bg-red-500'이다", () => {
    expect(getScoreColor(0)).toBe("bg-red-500");
  });
});

// ──────────────────────────────────────────────────────────────
// 2. getScoreTextColor - 점수별 텍스트 색상 반환
// ──────────────────────────────────────────────────────────────

describe("getScoreTextColor - 점수별 텍스트 색상", () => {
  it("점수 9이면 'text-green-600'이다", () => {
    expect(getScoreTextColor(9)).toBe("text-green-600");
  });

  it("점수 8이면 'text-green-600'이다 (경계값)", () => {
    expect(getScoreTextColor(8)).toBe("text-green-600");
  });

  it("점수 7이면 'text-blue-600'이다", () => {
    expect(getScoreTextColor(7)).toBe("text-blue-600");
  });

  it("점수 6이면 'text-blue-600'이다 (경계값)", () => {
    expect(getScoreTextColor(6)).toBe("text-blue-600");
  });

  it("점수 5이면 'text-yellow-600'이다", () => {
    expect(getScoreTextColor(5)).toBe("text-yellow-600");
  });

  it("점수 4이면 'text-yellow-600'이다 (경계값)", () => {
    expect(getScoreTextColor(4)).toBe("text-yellow-600");
  });

  it("점수 2이면 'text-red-600'이다", () => {
    expect(getScoreTextColor(2)).toBe("text-red-600");
  });

  it("점수 0이면 'text-red-600'이다", () => {
    expect(getScoreTextColor(0)).toBe("text-red-600");
  });
});

// ──────────────────────────────────────────────────────────────
// 3. getScoreLabel - 점수별 라벨 반환
// ──────────────────────────────────────────────────────────────

describe("getScoreLabel - 점수별 라벨", () => {
  it("점수 10이면 '최상'이다", () => {
    expect(getScoreLabel(10)).toBe("최상");
  });

  it("점수 9이면 '최상'이다 (경계값)", () => {
    expect(getScoreLabel(9)).toBe("최상");
  });

  it("점수 8이면 '좋음'이다", () => {
    expect(getScoreLabel(8)).toBe("좋음");
  });

  it("점수 7이면 '좋음'이다 (경계값)", () => {
    expect(getScoreLabel(7)).toBe("좋음");
  });

  it("점수 6이면 '보통'이다", () => {
    expect(getScoreLabel(6)).toBe("보통");
  });

  it("점수 5이면 '보통'이다 (경계값)", () => {
    expect(getScoreLabel(5)).toBe("보통");
  });

  it("점수 4이면 '나쁨'이다", () => {
    expect(getScoreLabel(4)).toBe("나쁨");
  });

  it("점수 3이면 '나쁨'이다 (경계값)", () => {
    expect(getScoreLabel(3)).toBe("나쁨");
  });

  it("점수 2이면 '매우 나쁨'이다", () => {
    expect(getScoreLabel(2)).toBe("매우 나쁨");
  });

  it("점수 0이면 '매우 나쁨'이다", () => {
    expect(getScoreLabel(0)).toBe("매우 나쁨");
  });
});

// ──────────────────────────────────────────────────────────────
// 4. PAIN_AREA_LABELS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("PAIN_AREA_LABELS 상수", () => {
  it("'neck'의 레이블은 '목'이다", () => {
    expect(PAIN_AREA_LABELS.neck).toBe("목");
  });

  it("'shoulder'의 레이블은 '어깨'이다", () => {
    expect(PAIN_AREA_LABELS.shoulder).toBe("어깨");
  });

  it("'back'의 레이블은 '등'이다", () => {
    expect(PAIN_AREA_LABELS.back).toBe("등");
  });

  it("'waist'의 레이블은 '허리'이다", () => {
    expect(PAIN_AREA_LABELS.waist).toBe("허리");
  });

  it("'hip'의 레이블은 '고관절'이다", () => {
    expect(PAIN_AREA_LABELS.hip).toBe("고관절");
  });

  it("'knee'의 레이블은 '무릎'이다", () => {
    expect(PAIN_AREA_LABELS.knee).toBe("무릎");
  });

  it("'ankle'의 레이블은 '발목'이다", () => {
    expect(PAIN_AREA_LABELS.ankle).toBe("발목");
  });

  it("'wrist'의 레이블은 '손목'이다", () => {
    expect(PAIN_AREA_LABELS.wrist).toBe("손목");
  });

  it("'elbow'의 레이블은 '팔꿈치'이다", () => {
    expect(PAIN_AREA_LABELS.elbow).toBe("팔꿈치");
  });

  it("'calf'의 레이블은 '종아리'이다", () => {
    expect(PAIN_AREA_LABELS.calf).toBe("종아리");
  });

  it("'thigh'의 레이블은 '허벅지'이다", () => {
    expect(PAIN_AREA_LABELS.thigh).toBe("허벅지");
  });

  it("'foot'의 레이블은 '발'이다", () => {
    expect(PAIN_AREA_LABELS.foot).toBe("발");
  });

  it("'none'의 레이블은 '통증 없음'이다", () => {
    expect(PAIN_AREA_LABELS.none).toBe("통증 없음");
  });
});

// ──────────────────────────────────────────────────────────────
// 5. INTENSITY_LABELS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("INTENSITY_LABELS 상수", () => {
  it("'rest'의 레이블은 '휴식'이다", () => {
    expect(INTENSITY_LABELS.rest).toBe("휴식");
  });

  it("'light'의 레이블은 '가벼운'이다", () => {
    expect(INTENSITY_LABELS.light).toBe("가벼운");
  });

  it("'moderate'의 레이블은 '보통'이다", () => {
    expect(INTENSITY_LABELS.moderate).toBe("보통");
  });

  it("'hard'의 레이블은 '힘든'이다", () => {
    expect(INTENSITY_LABELS.hard).toBe("힘든");
  });

  it("'extreme'의 레이블은 '극강'이다", () => {
    expect(INTENSITY_LABELS.extreme).toBe("극강");
  });
});

// ──────────────────────────────────────────────────────────────
// 6. INTENSITY_COLORS 상수 검증
// ──────────────────────────────────────────────────────────────

describe("INTENSITY_COLORS 상수", () => {
  it("'rest' 색상에는 'slate' 클래스가 포함된다", () => {
    expect(INTENSITY_COLORS.rest).toContain("slate");
  });

  it("'light' 색상에는 'green' 클래스가 포함된다", () => {
    expect(INTENSITY_COLORS.light).toContain("green");
  });

  it("'moderate' 색상에는 'blue' 클래스가 포함된다", () => {
    expect(INTENSITY_COLORS.moderate).toContain("blue");
  });

  it("'hard' 색상에는 'orange' 클래스가 포함된다", () => {
    expect(INTENSITY_COLORS.hard).toContain("orange");
  });

  it("'extreme' 색상에는 'red' 클래스가 포함된다", () => {
    expect(INTENSITY_COLORS.extreme).toContain("red");
  });
});

// ──────────────────────────────────────────────────────────────
// 7. PAIN_AREA_LIST / INTENSITY_LIST 상수 검증
// ──────────────────────────────────────────────────────────────

describe("PAIN_AREA_LIST 상수", () => {
  it("'none'이 포함된다", () => {
    expect(PAIN_AREA_LIST).toContain("none");
  });

  it("'neck'이 포함된다", () => {
    expect(PAIN_AREA_LIST).toContain("neck");
  });

  it("'foot'이 포함된다", () => {
    expect(PAIN_AREA_LIST).toContain("foot");
  });

  it("13개의 부위가 존재한다", () => {
    expect(PAIN_AREA_LIST).toHaveLength(13);
  });
});

describe("INTENSITY_LIST 상수", () => {
  it("5개의 강도가 존재한다", () => {
    expect(INTENSITY_LIST).toHaveLength(5);
  });

  it("'rest'가 첫 번째 항목이다", () => {
    expect(INTENSITY_LIST[0]).toBe("rest");
  });

  it("'extreme'이 마지막 항목이다", () => {
    expect(INTENSITY_LIST[INTENSITY_LIST.length - 1]).toBe("extreme");
  });
});

// ──────────────────────────────────────────────────────────────
// 8. getTopPainAreas 로직 (인라인 복제)
// ──────────────────────────────────────────────────────────────

type DanceConditionPainArea = "none" | "neck" | "shoulder" | "back" | "waist" | "hip" | "knee" | "ankle" | "wrist" | "elbow" | "calf" | "thigh" | "foot";

type LogForTest = { painAreas: DanceConditionPainArea[] };

function getTopPainAreas(logs: LogForTest[], topN = 3): { area: DanceConditionPainArea; count: number }[] {
  const counter: Partial<Record<DanceConditionPainArea, number>> = {};
  for (const log of logs) {
    for (const area of log.painAreas) {
      if (area === "none") continue;
      counter[area] = (counter[area] ?? 0) + 1;
    }
  }
  return Object.entries(counter)
    .map(([area, count]) => ({ area: area as DanceConditionPainArea, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

describe("getTopPainAreas - 상위 통증 부위 계산", () => {
  it("로그가 없으면 빈 배열을 반환한다", () => {
    expect(getTopPainAreas([])).toHaveLength(0);
  });

  it("'none'은 집계에서 제외된다", () => {
    const logs: LogForTest[] = [{ painAreas: ["none"] }];
    const result = getTopPainAreas(logs);
    expect(result.find((r) => r.area === "none")).toBeUndefined();
  });

  it("가장 빈도 높은 부위가 첫 번째로 반환된다", () => {
    const logs: LogForTest[] = [
      { painAreas: ["knee", "knee", "shoulder"] },
      { painAreas: ["knee"] },
    ];
    const result = getTopPainAreas(logs);
    expect(result[0].area).toBe("knee");
    expect(result[0].count).toBe(3);
  });

  it("topN을 초과하지 않도록 결과가 제한된다", () => {
    const logs: LogForTest[] = [
      { painAreas: ["knee", "shoulder", "back", "waist"] },
    ];
    const result = getTopPainAreas(logs, 2);
    expect(result).toHaveLength(2);
  });

  it("여러 로그의 통증 부위가 통합 집계된다", () => {
    const logs: LogForTest[] = [
      { painAreas: ["knee"] },
      { painAreas: ["knee"] },
      { painAreas: ["shoulder"] },
    ];
    const result = getTopPainAreas(logs, 3);
    const kneeResult = result.find((r) => r.area === "knee");
    expect(kneeResult?.count).toBe(2);
  });

  it("내림차순으로 정렬된다", () => {
    const logs: LogForTest[] = [
      { painAreas: ["shoulder"] },
      { painAreas: ["knee", "knee", "knee"] },
    ];
    const result = getTopPainAreas(logs, 3);
    expect(result[0].count).toBeGreaterThanOrEqual(result[1]?.count ?? 0);
  });
});

// ──────────────────────────────────────────────────────────────
// 9. getOverallTrend 로직 (인라인 복제)
// ──────────────────────────────────────────────────────────────

type TrendLog = { date: string; overallScore: number };

type DanceConditionTrend = "up" | "down" | "stable" | "nodata";

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getOverallTrend(logs: TrendLog[]): DanceConditionTrend {
  const today = new Date();
  const r1Start = new Date(today);
  r1Start.setDate(today.getDate() - 6);
  const r2Start = new Date(today);
  r2Start.setDate(today.getDate() - 13);
  const r2End = new Date(today);
  r2End.setDate(today.getDate() - 7);

  const recent = logs.filter(
    (l) => l.date >= toDateStr(r1Start) && l.date <= toDateStr(today)
  );
  const prev = logs.filter(
    (l) => l.date >= toDateStr(r2Start) && l.date <= toDateStr(r2End)
  );

  if (recent.length === 0 && prev.length === 0) return "nodata";
  if (recent.length === 0 || prev.length === 0) return "stable";

  const recentAvg = recent.reduce((s, l) => s + l.overallScore, 0) / recent.length;
  const prevAvg = prev.reduce((s, l) => s + l.overallScore, 0) / prev.length;

  const diff = recentAvg - prevAvg;
  if (diff > 0.5) return "up";
  if (diff < -0.5) return "down";
  return "stable";
}

describe("getOverallTrend - 컨디션 트렌드 계산", () => {
  it("로그가 없으면 'nodata'를 반환한다", () => {
    expect(getOverallTrend([])).toBe("nodata");
  });

  it("최근 7일에만 데이터가 있으면 'stable'을 반환한다", () => {
    const today = new Date();
    const dateStr = toDateStr(today);
    const logs: TrendLog[] = [{ date: dateStr, overallScore: 8 }];
    expect(getOverallTrend(logs)).toBe("stable");
  });

  it("이전 7일에만 데이터가 있으면 'stable'을 반환한다", () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const logs: TrendLog[] = [{ date: toDateStr(past), overallScore: 5 }];
    expect(getOverallTrend(logs)).toBe("stable");
  });

  it("최근 7일 평균이 이전보다 0.5 초과로 높으면 'up'을 반환한다", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const prevDay = new Date(today);
    prevDay.setDate(today.getDate() - 8);

    const logs: TrendLog[] = [
      { date: toDateStr(yesterday), overallScore: 9 },
      { date: toDateStr(prevDay), overallScore: 4 },
    ];
    expect(getOverallTrend(logs)).toBe("up");
  });

  it("최근 7일 평균이 이전보다 0.5 초과로 낮으면 'down'을 반환한다", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const prevDay = new Date(today);
    prevDay.setDate(today.getDate() - 8);

    const logs: TrendLog[] = [
      { date: toDateStr(yesterday), overallScore: 3 },
      { date: toDateStr(prevDay), overallScore: 9 },
    ];
    expect(getOverallTrend(logs)).toBe("down");
  });
});

// ──────────────────────────────────────────────────────────────
// 10. 주간 평균 계산 - avg 유틸
// ──────────────────────────────────────────────────────────────

function calcAvg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

describe("주간 평균 계산 유틸", () => {
  it("빈 배열이면 0을 반환한다", () => {
    expect(calcAvg([])).toBe(0);
  });

  it("단일 값이면 그 값을 반환한다", () => {
    expect(calcAvg([7])).toBe(7);
  });

  it("여러 값의 평균을 소수점 1자리로 반환한다", () => {
    expect(calcAvg([4, 5])).toBe(4.5);
  });

  it("소수점 반올림이 올바르게 처리된다", () => {
    // (1 + 2 + 3) / 3 = 2.0
    expect(calcAvg([1, 2, 3])).toBe(2);
  });

  it("정수로 딱 떨어지는 경우 정수로 반환된다", () => {
    expect(calcAvg([3, 5, 7])).toBe(5);
  });
});
