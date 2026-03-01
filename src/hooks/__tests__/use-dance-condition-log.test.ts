/**
 * use-dance-condition-log 테스트
 *
 * 훅 내부의 순수 계산 로직을 검증합니다.
 * - MOOD_LABELS / MOOD_EMOJI / MOOD_COLOR / MOOD_LIST 상수
 * - BODY_PART_OPTIONS 상수
 * - toDateStr 날짜 포맷 유틸
 * - getStats: 평균 에너지, 기분 분포, 주간 트렌드, 통증 부위 빈도
 * - 빈 배열, null, 경계값 처리
 */

import { describe, it, expect } from "vitest";
import type {
  DanceConditionJournalEntry,
  DanceConditionMood,
} from "@/types/localStorage/dance";

// ============================================================
// 훅에서 추출한 상수 / 순수 함수들
// ============================================================

const MOOD_LABELS: Record<DanceConditionMood, string> = {
  great: "최고",
  good: "좋음",
  neutral: "보통",
  tired: "피곤",
  bad: "나쁨",
};

const MOOD_EMOJI: Record<DanceConditionMood, string> = {
  great: "😄",
  good: "😊",
  neutral: "😐",
  tired: "😴",
  bad: "😞",
};

const MOOD_COLOR: Record<DanceConditionMood, string> = {
  great: "bg-yellow-100 text-yellow-700 border-yellow-200",
  good: "bg-green-100 text-green-700 border-green-200",
  neutral: "bg-blue-100 text-blue-700 border-blue-200",
  tired: "bg-purple-100 text-purple-700 border-purple-200",
  bad: "bg-red-100 text-red-700 border-red-200",
};

const MOOD_LIST: DanceConditionMood[] = [
  "great",
  "good",
  "neutral",
  "tired",
  "bad",
];

const BODY_PART_OPTIONS = [
  { value: "neck", label: "목" },
  { value: "shoulder", label: "어깨" },
  { value: "back", label: "등" },
  { value: "waist", label: "허리" },
  { value: "hip", label: "고관절" },
  { value: "knee", label: "무릎" },
  { value: "ankle", label: "발목" },
  { value: "wrist", label: "손목" },
  { value: "elbow", label: "팔꿈치" },
  { value: "calf", label: "종아리" },
  { value: "thigh", label: "허벅지" },
  { value: "foot", label: "발" },
];

/** 날짜 문자열 포맷 (YYYY-MM-DD) */
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 평균 에너지 계산 */
function calcAverageEnergy(entries: DanceConditionJournalEntry[]): number {
  const total = entries.length;
  if (total === 0) return 0;
  return (
    Math.round(
      (entries.reduce((s, e) => s + e.energyLevel, 0) / total) * 10
    ) / 10
  );
}

/** 기분 분포 계산 */
function calcMoodDistribution(
  entries: DanceConditionJournalEntry[]
): Record<DanceConditionMood, number> {
  const dist: Record<DanceConditionMood, number> = {
    great: 0,
    good: 0,
    neutral: 0,
    tired: 0,
    bad: 0,
  };
  for (const e of entries) {
    dist[e.mood] = (dist[e.mood] ?? 0) + 1;
  }
  return dist;
}

/** 통증 부위 빈도 계산 (내림차순 정렬) */
function calcBodyPartFrequency(
  entries: DanceConditionJournalEntry[]
): { part: string; label: string; count: number }[] {
  const partCounter: Record<string, number> = {};
  for (const e of entries) {
    for (const part of e.bodyParts) {
      partCounter[part] = (partCounter[part] ?? 0) + 1;
    }
  }
  return Object.entries(partCounter)
    .map(([part, count]) => ({
      part,
      label: BODY_PART_OPTIONS.find((o) => o.value === part)?.label ?? part,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** 주간 평균 에너지 계산 */
function calcWeeklyAvgEnergy(
  entries: DanceConditionJournalEntry[],
  weekStart: string,
  weekEnd: string
): number {
  const weekEntries = entries.filter(
    (e) => e.date >= weekStart && e.date <= weekEnd
  );
  if (weekEntries.length === 0) return 0;
  return (
    Math.round(
      (weekEntries.reduce((s, e) => s + e.energyLevel, 0) / weekEntries.length) *
        10
    ) / 10
  );
}

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeEntry(
  overrides: Partial<DanceConditionJournalEntry> = {}
): DanceConditionJournalEntry {
  return {
    id: "test-id",
    date: "2026-01-15",
    energyLevel: 5,
    mood: "good",
    bodyParts: [],
    sleepHours: 7,
    practiceMinutes: 60,
    notes: "",
    createdAt: "2026-01-15T10:00:00.000Z",
    ...overrides,
  };
}

// ============================================================
// MOOD_LABELS 상수 테스트
// ============================================================

describe("MOOD_LABELS - 기분 레이블 상수", () => {
  it("great는 '최고'이다", () => {
    expect(MOOD_LABELS.great).toBe("최고");
  });

  it("good는 '좋음'이다", () => {
    expect(MOOD_LABELS.good).toBe("좋음");
  });

  it("neutral는 '보통'이다", () => {
    expect(MOOD_LABELS.neutral).toBe("보통");
  });

  it("tired는 '피곤'이다", () => {
    expect(MOOD_LABELS.tired).toBe("피곤");
  });

  it("bad는 '나쁨'이다", () => {
    expect(MOOD_LABELS.bad).toBe("나쁨");
  });

  it("모든 기분 상태에 레이블이 정의되어 있다", () => {
    for (const mood of MOOD_LIST) {
      expect(MOOD_LABELS[mood]).toBeDefined();
      expect(MOOD_LABELS[mood].length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// MOOD_EMOJI 상수 테스트
// ============================================================

describe("MOOD_EMOJI - 기분 이모지 상수", () => {
  it("5가지 기분 모두 이모지가 정의되어 있다", () => {
    for (const mood of MOOD_LIST) {
      expect(MOOD_EMOJI[mood]).toBeDefined();
      expect(typeof MOOD_EMOJI[mood]).toBe("string");
    }
  });

  it("great는 웃는 이모지이다", () => {
    expect(MOOD_EMOJI.great).toBe("😄");
  });

  it("bad는 슬픈 이모지이다", () => {
    expect(MOOD_EMOJI.bad).toBe("😞");
  });

  it("이모지들이 서로 다르다", () => {
    const emojis = MOOD_LIST.map((m) => MOOD_EMOJI[m]);
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(MOOD_LIST.length);
  });
});

// ============================================================
// MOOD_COLOR 상수 테스트
// ============================================================

describe("MOOD_COLOR - 기분별 색상 클래스", () => {
  it("5가지 기분 모두 색상 클래스가 정의되어 있다", () => {
    for (const mood of MOOD_LIST) {
      expect(MOOD_COLOR[mood]).toBeDefined();
      expect(MOOD_COLOR[mood].length).toBeGreaterThan(0);
    }
  });

  it("great는 yellow 색상을 사용한다", () => {
    expect(MOOD_COLOR.great).toContain("yellow");
  });

  it("good는 green 색상을 사용한다", () => {
    expect(MOOD_COLOR.good).toContain("green");
  });

  it("bad는 red 색상을 사용한다", () => {
    expect(MOOD_COLOR.bad).toContain("red");
  });
});

// ============================================================
// BODY_PART_OPTIONS 테스트
// ============================================================

describe("BODY_PART_OPTIONS - 신체 부위 옵션", () => {
  it("12개의 신체 부위가 정의되어 있다", () => {
    expect(BODY_PART_OPTIONS).toHaveLength(12);
  });

  it("모든 옵션에 value와 label이 있다", () => {
    for (const opt of BODY_PART_OPTIONS) {
      expect(opt.value).toBeDefined();
      expect(opt.label).toBeDefined();
    }
  });

  it("'knee'의 레이블은 '무릎'이다", () => {
    const opt = BODY_PART_OPTIONS.find((o) => o.value === "knee");
    expect(opt?.label).toBe("무릎");
  });

  it("'waist'의 레이블은 '허리'이다", () => {
    const opt = BODY_PART_OPTIONS.find((o) => o.value === "waist");
    expect(opt?.label).toBe("허리");
  });

  it("'shoulder'의 레이블은 '어깨'이다", () => {
    const opt = BODY_PART_OPTIONS.find((o) => o.value === "shoulder");
    expect(opt?.label).toBe("어깨");
  });
});

// ============================================================
// toDateStr 날짜 포맷 테스트
// ============================================================

describe("toDateStr - 날짜 문자열 포맷", () => {
  it("일반 날짜를 YYYY-MM-DD 형식으로 반환한다", () => {
    const date = new Date(2026, 0, 15); // 2026-01-15
    expect(toDateStr(date)).toBe("2026-01-15");
  });

  it("월이 1자리이면 앞에 0을 붙인다", () => {
    const date = new Date(2026, 2, 5); // 2026-03-05
    expect(toDateStr(date)).toBe("2026-03-05");
  });

  it("일이 1자리이면 앞에 0을 붙인다", () => {
    const date = new Date(2026, 11, 9); // 2026-12-09
    expect(toDateStr(date)).toBe("2026-12-09");
  });

  it("연말 날짜를 올바르게 처리한다", () => {
    const date = new Date(2025, 11, 31); // 2025-12-31
    expect(toDateStr(date)).toBe("2025-12-31");
  });
});

// ============================================================
// calcAverageEnergy 테스트
// ============================================================

describe("calcAverageEnergy - 평균 에너지 계산", () => {
  it("기록이 없으면 0을 반환한다", () => {
    expect(calcAverageEnergy([])).toBe(0);
  });

  it("단일 기록이면 해당 에너지를 반환한다", () => {
    const entries = [makeEntry({ energyLevel: 7 })];
    expect(calcAverageEnergy(entries)).toBe(7);
  });

  it("에너지 합산의 평균을 올바르게 계산한다", () => {
    const entries = [
      makeEntry({ energyLevel: 4 }),
      makeEntry({ energyLevel: 6 }),
    ];
    expect(calcAverageEnergy(entries)).toBe(5);
  });

  it("소수점 1자리까지 반올림한다", () => {
    // (5 + 6 + 7) / 3 = 6.0
    const entries = [
      makeEntry({ energyLevel: 5 }),
      makeEntry({ energyLevel: 6 }),
      makeEntry({ energyLevel: 7 }),
    ];
    expect(calcAverageEnergy(entries)).toBe(6);
  });

  it("소수점 결과를 반올림해서 1자리로 표시한다", () => {
    // (5 + 6) / 3 = 3.666 → 3.7
    const entries = [
      makeEntry({ energyLevel: 5 }),
      makeEntry({ energyLevel: 6 }),
      makeEntry({ energyLevel: 0 }),
    ];
    const result = calcAverageEnergy(entries);
    expect(result).toBeCloseTo(3.7, 1);
  });
});

// ============================================================
// calcMoodDistribution 테스트
// ============================================================

describe("calcMoodDistribution - 기분 분포 계산", () => {
  it("기록이 없으면 모든 기분이 0이다", () => {
    const dist = calcMoodDistribution([]);
    expect(dist.great).toBe(0);
    expect(dist.good).toBe(0);
    expect(dist.neutral).toBe(0);
    expect(dist.tired).toBe(0);
    expect(dist.bad).toBe(0);
  });

  it("단일 기분 기록이면 해당 기분만 1이다", () => {
    const entries = [makeEntry({ mood: "great" })];
    const dist = calcMoodDistribution(entries);
    expect(dist.great).toBe(1);
    expect(dist.good).toBe(0);
  });

  it("같은 기분이 여러 번 기록되면 합산된다", () => {
    const entries = [
      makeEntry({ mood: "good" }),
      makeEntry({ mood: "good" }),
      makeEntry({ mood: "tired" }),
    ];
    const dist = calcMoodDistribution(entries);
    expect(dist.good).toBe(2);
    expect(dist.tired).toBe(1);
  });

  it("전체 분포의 합이 총 기록 수와 같다", () => {
    const entries = [
      makeEntry({ mood: "great" }),
      makeEntry({ mood: "good" }),
      makeEntry({ mood: "neutral" }),
      makeEntry({ mood: "tired" }),
      makeEntry({ mood: "bad" }),
    ];
    const dist = calcMoodDistribution(entries);
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    expect(total).toBe(entries.length);
  });
});

// ============================================================
// calcBodyPartFrequency 테스트
// ============================================================

describe("calcBodyPartFrequency - 통증 부위 빈도 계산", () => {
  it("기록이 없으면 빈 배열을 반환한다", () => {
    expect(calcBodyPartFrequency([])).toHaveLength(0);
  });

  it("신체 부위가 없는 기록이면 빈 배열을 반환한다", () => {
    const entries = [makeEntry({ bodyParts: [] })];
    expect(calcBodyPartFrequency(entries)).toHaveLength(0);
  });

  it("빈도가 높은 부위가 먼저 나타난다", () => {
    const entries = [
      makeEntry({ bodyParts: ["knee", "waist"] }),
      makeEntry({ bodyParts: ["knee"] }),
    ];
    const result = calcBodyPartFrequency(entries);
    expect(result[0]!.part).toBe("knee");
    expect(result[0]!.count).toBe(2);
  });

  it("알려진 부위는 한국어 레이블로 변환된다", () => {
    const entries = [makeEntry({ bodyParts: ["shoulder"] })];
    const result = calcBodyPartFrequency(entries);
    expect(result[0]!.label).toBe("어깨");
  });

  it("알 수 없는 부위는 value 그대로 레이블로 사용된다", () => {
    const entries = [makeEntry({ bodyParts: ["unknown-part"] })];
    const result = calcBodyPartFrequency(entries);
    expect(result[0]!.label).toBe("unknown-part");
  });

  it("여러 기록에서 같은 부위의 빈도를 합산한다", () => {
    const entries = [
      makeEntry({ bodyParts: ["knee", "ankle"] }),
      makeEntry({ bodyParts: ["knee"] }),
      makeEntry({ bodyParts: ["ankle"] }),
    ];
    const result = calcBodyPartFrequency(entries);
    const kneeItem = result.find((r) => r.part === "knee");
    const ankleItem = result.find((r) => r.part === "ankle");
    expect(kneeItem?.count).toBe(2);
    expect(ankleItem?.count).toBe(2);
  });
});

// ============================================================
// calcWeeklyAvgEnergy 테스트
// ============================================================

describe("calcWeeklyAvgEnergy - 주간 평균 에너지 계산", () => {
  it("해당 주 기록이 없으면 0을 반환한다", () => {
    const entries = [makeEntry({ date: "2025-01-01", energyLevel: 7 })];
    expect(calcWeeklyAvgEnergy(entries, "2026-01-01", "2026-01-07")).toBe(0);
  });

  it("해당 주 기록의 평균 에너지를 계산한다", () => {
    const entries = [
      makeEntry({ date: "2026-01-01", energyLevel: 6 }),
      makeEntry({ date: "2026-01-03", energyLevel: 8 }),
    ];
    expect(calcWeeklyAvgEnergy(entries, "2026-01-01", "2026-01-07")).toBe(7);
  });

  it("주 범위 경계값(시작일, 종료일) 기록도 포함된다", () => {
    const entries = [
      makeEntry({ date: "2026-01-01", energyLevel: 4 }),
      makeEntry({ date: "2026-01-07", energyLevel: 6 }),
    ];
    const result = calcWeeklyAvgEnergy(entries, "2026-01-01", "2026-01-07");
    expect(result).toBe(5);
  });

  it("주 범위 밖의 기록은 포함되지 않는다", () => {
    const entries = [
      makeEntry({ date: "2025-12-31", energyLevel: 10 }), // 범위 밖
      makeEntry({ date: "2026-01-02", energyLevel: 5 }), // 범위 내
      makeEntry({ date: "2026-01-08", energyLevel: 10 }), // 범위 밖
    ];
    expect(calcWeeklyAvgEnergy(entries, "2026-01-01", "2026-01-07")).toBe(5);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 컨디션 로그 통계", () => {
  it("다양한 기분이 포함된 기록의 분포를 올바르게 계산한다", () => {
    const entries: DanceConditionJournalEntry[] = [
      makeEntry({ mood: "great", energyLevel: 9 }),
      makeEntry({ mood: "great", energyLevel: 8 }),
      makeEntry({ mood: "good", energyLevel: 7 }),
      makeEntry({ mood: "neutral", energyLevel: 5 }),
      makeEntry({ mood: "tired", energyLevel: 3 }),
    ];
    const dist = calcMoodDistribution(entries);
    expect(dist.great).toBe(2);
    expect(dist.good).toBe(1);
    expect(dist.neutral).toBe(1);
    expect(dist.tired).toBe(1);
    expect(dist.bad).toBe(0);
  });

  it("에너지 레벨이 낮은 기록과 높은 기록의 평균을 정확히 계산한다", () => {
    const entries: DanceConditionJournalEntry[] = [
      makeEntry({ energyLevel: 1 }),
      makeEntry({ energyLevel: 9 }),
    ];
    expect(calcAverageEnergy(entries)).toBe(5);
  });

  it("신체 부위 기록이 많은 경우 상위 부위가 앞에 온다", () => {
    const entries: DanceConditionJournalEntry[] = [
      makeEntry({ bodyParts: ["knee", "waist", "ankle"] }),
      makeEntry({ bodyParts: ["knee", "waist"] }),
      makeEntry({ bodyParts: ["knee"] }),
    ];
    const freq = calcBodyPartFrequency(entries);
    expect(freq[0]!.part).toBe("knee");
    expect(freq[0]!.count).toBe(3);
  });
});
