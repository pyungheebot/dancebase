import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-123" } } }),
    },
  }),
}));

// ─── localStorage mock ────────────────────────────────────────
const lsStore: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => { lsStore[k] = v; },
    removeItem: (k: string) => { delete lsStore[k]; },
    clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
  },
  writable: true,
});

// ─── 테스트 대상 내부 함수들을 직접 복제해서 단위 테스트 ────────
// (훅 내부 순수 함수를 여기서 직접 정의하여 테스트)

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getCurrentWeekRange(): [Date, Date] {
  const monday = getWeekMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return [monday, sunday];
}

function getPrevWeekRange(): [Date, Date] {
  const thisMonday = getWeekMonday(new Date());
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  prevSunday.setHours(23, 59, 59, 999);
  const prevMonday = getWeekMonday(prevSunday);
  return [prevMonday, prevSunday];
}

type PracticeEntry = {
  id: string;
  date: string;
  durationMinutes: number;
  content: string;
  selfRating: number;
  memo: string;
  createdAt: string;
};

function filterEntries(entries: PracticeEntry[], from: Date, to: Date): PracticeEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= from && d <= to;
  });
}

function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function extractTopCategory(entries: PracticeEntry[]): string | null {
  if (entries.length === 0) return null;
  const freq: Record<string, number> = {};
  const stopWords = new Set([
    "연습", "오늘", "했다", "했습니다", "했어요", "하기", "하고",
    "그리고", "이번", "다시", "계속", "조금", "많이", "천천히",
  ]);
  entries.forEach((e) => {
    const words = e.content
      .split(/[\s,./|!?]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !stopWords.has(w));
    words.forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

function calcStreakDays(entries: PracticeEntry[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const practicedSet = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const dateStr = toDateStr(cursor);
    if (practicedSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterdayStr = toDateStr(cursor);
        if (practicedSet.has(yesterdayStr)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}

function buildSummaryText(
  practiceCount: number,
  totalMinutes: number,
  averageRating: number,
  topCategory: string | null,
  streakDays: number
): string {
  if (practiceCount === 0) {
    return "이번 주 아직 연습 기록이 없습니다.";
  }
  const timeText =
    totalMinutes < 60
      ? `${totalMinutes}분`
      : (() => {
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
        })();
  const parts: string[] = [`이번 주 ${practiceCount}회 연습, 총 ${timeText}`];
  if (averageRating > 0) parts.push(`평균 만족도 ${averageRating.toFixed(1)}점`);
  if (topCategory) parts.push(`"${topCategory}" 집중 연습`);
  if (streakDays >= 2) parts.push(`${streakDays}일 연속 달성 중`);
  return parts.join(" | ");
}

function makeEntry(overrides: Partial<PracticeEntry> = {}): PracticeEntry {
  return {
    id: "e1",
    date: "2026-03-02",
    durationMinutes: 60,
    content: "스트레칭 기초 동작",
    selfRating: 4,
    memo: "",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================
// toDateStr
// ============================================================

describe("toDateStr - 날짜 포맷 변환", () => {
  it("2026년 1월 5일은 '2026-01-05'이다", () => {
    expect(toDateStr(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("2026년 12월 31일은 '2026-12-31'이다", () => {
    expect(toDateStr(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("월이 두 자리 미만이면 0으로 패딩된다", () => {
    expect(toDateStr(new Date(2026, 2, 3))).toBe("2026-03-03");
  });

  it("일이 두 자리 미만이면 0으로 패딩된다", () => {
    expect(toDateStr(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
});

// ============================================================
// getWeekMonday
// ============================================================

describe("getWeekMonday - 주 월요일 계산", () => {
  it("월요일 입력 시 같은 날을 반환한다", () => {
    const mon = new Date(2026, 2, 2); // 2026-03-02 월요일
    const result = getWeekMonday(mon);
    expect(toDateStr(result)).toBe("2026-03-02");
  });

  it("일요일 입력 시 해당 주 월요일을 반환한다", () => {
    const sun = new Date(2026, 2, 8); // 2026-03-08 일요일
    const result = getWeekMonday(sun);
    expect(toDateStr(result)).toBe("2026-03-02");
  });

  it("토요일 입력 시 해당 주 월요일을 반환한다", () => {
    const sat = new Date(2026, 2, 7); // 2026-03-07 토요일
    const result = getWeekMonday(sat);
    expect(toDateStr(result)).toBe("2026-03-02");
  });

  it("수요일 입력 시 해당 주 월요일을 반환한다", () => {
    const wed = new Date(2026, 2, 4); // 2026-03-04 수요일
    const result = getWeekMonday(wed);
    expect(toDateStr(result)).toBe("2026-03-02");
  });
});

// ============================================================
// getCurrentWeekRange / getPrevWeekRange
// ============================================================

describe("getCurrentWeekRange - 이번 주 범위", () => {
  it("반환되는 시작일은 월요일이다", () => {
    const [monday] = getCurrentWeekRange();
    expect(monday.getDay()).toBe(1); // 1 = 월요일
  });

  it("반환되는 종료일은 일요일이다", () => {
    const [, sunday] = getCurrentWeekRange();
    expect(sunday.getDay()).toBe(0); // 0 = 일요일
  });

  it("시작일과 종료일의 날짜 차이는 6일 이상이다 (일요일 23:59:59 포함)", () => {
    const [monday, sunday] = getCurrentWeekRange();
    const diffDays = (sunday.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24);
    // 일요일은 23:59:59:999이므로 약 6.999...일
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThan(8);
  });
});

describe("getPrevWeekRange - 전주 범위", () => {
  it("전주 시작일은 월요일이다", () => {
    const [prevMonday] = getPrevWeekRange();
    expect(prevMonday.getDay()).toBe(1);
  });

  it("전주 종료일은 일요일이다", () => {
    const [, prevSunday] = getPrevWeekRange();
    expect(prevSunday.getDay()).toBe(0);
  });

  it("전주는 이번 주보다 7일 이전이다", () => {
    const [thisMonday] = getCurrentWeekRange();
    const [prevMonday] = getPrevWeekRange();
    const diffDays = Math.round(
      (thisMonday.getTime() - prevMonday.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(7);
  });
});

// ============================================================
// filterEntries
// ============================================================

describe("filterEntries - 날짜 범위 필터", () => {
  it("범위 내 항목만 반환한다", () => {
    const entries = [
      makeEntry({ date: "2026-03-02" }),
      makeEntry({ date: "2026-03-05" }),
      makeEntry({ date: "2026-03-10" }),
    ];
    const from = new Date(2026, 2, 2);
    const to = new Date(2026, 2, 7, 23, 59, 59, 999);
    const result = filterEntries(entries, from, to);
    expect(result).toHaveLength(2);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    const [monday, sunday] = getCurrentWeekRange();
    expect(filterEntries([], monday, sunday)).toEqual([]);
  });

  it("범위 경계 날짜는 포함된다", () => {
    const from = new Date(2026, 2, 2, 0, 0, 0, 0);
    const to = new Date(2026, 2, 2, 23, 59, 59, 999);
    const entries = [makeEntry({ date: "2026-03-02" })];
    expect(filterEntries(entries, from, to)).toHaveLength(1);
  });

  it("범위 밖 날짜는 포함되지 않는다", () => {
    const from = new Date(2026, 2, 2);
    const to = new Date(2026, 2, 7, 23, 59, 59, 999);
    const entries = [makeEntry({ date: "2026-03-01" }), makeEntry({ date: "2026-03-08" })];
    expect(filterEntries(entries, from, to)).toHaveLength(0);
  });
});

// ============================================================
// calcChangeRate
// ============================================================

describe("calcChangeRate - 변화율 계산", () => {
  it("이전 값이 0이면 null을 반환한다", () => {
    expect(calcChangeRate(10, 0)).toBeNull();
  });

  it("50% 증가를 올바르게 계산한다", () => {
    expect(calcChangeRate(3, 2)).toBe(50);
  });

  it("50% 감소를 올바르게 계산한다", () => {
    expect(calcChangeRate(1, 2)).toBe(-50);
  });

  it("변화 없으면 0을 반환한다", () => {
    expect(calcChangeRate(5, 5)).toBe(0);
  });

  it("결과는 반올림된다", () => {
    // (3-2)/2*100 = 50, (4-3)/3*100 ≈ 33.33 → 33
    expect(calcChangeRate(4, 3)).toBe(33);
  });

  it("100% 증가를 올바르게 계산한다", () => {
    expect(calcChangeRate(4, 2)).toBe(100);
  });
});

// ============================================================
// extractTopCategory
// ============================================================

describe("extractTopCategory - 상위 키워드 추출", () => {
  it("빈 배열이면 null을 반환한다", () => {
    expect(extractTopCategory([])).toBeNull();
  });

  it("가장 많이 등장하는 단어를 반환한다", () => {
    const entries = [
      makeEntry({ content: "힙합 동작 힙합 스타일" }),
      makeEntry({ content: "힙합 기초 동작" }),
    ];
    expect(extractTopCategory(entries)).toBe("힙합");
  });

  it("불용어는 결과에 포함되지 않는다", () => {
    const entries = [
      makeEntry({ content: "연습 연습 연습 스윙" }),
    ];
    // '연습'은 불용어이므로 '스윙'이 반환되어야 함
    const result = extractTopCategory(entries);
    expect(result).not.toBe("연습");
  });

  it("단어 길이 1 이하는 추출되지 않는다", () => {
    const entries = [makeEntry({ content: "a b c 힙합" })];
    expect(extractTopCategory(entries)).toBe("힙합");
  });

  it("내용이 없으면 null이 반환될 수 있다", () => {
    const entries = [makeEntry({ content: "a b c" })];
    // 1글자 단어만 있으면 null
    const result = extractTopCategory(entries);
    expect(result).toBeNull();
  });
});

// ============================================================
// calcStreakDays
// ============================================================

describe("calcStreakDays - 연속 연습 일수 계산", () => {
  it("연습 기록이 없으면 0을 반환한다", () => {
    expect(calcStreakDays([])).toBe(0);
  });

  it("오늘만 연습했으면 최소 1을 반환한다", () => {
    const today = toDateStr(new Date());
    const entries = [makeEntry({ date: today })];
    const result = calcStreakDays(entries);
    expect(result).toBeGreaterThanOrEqual(1);
  });

  it("연속이 아닌 날짜들은 스트릭을 끊는다", () => {
    // 아주 오래된 날짜들만 있는 경우 → 스트릭 0
    const entries = [
      makeEntry({ date: "2020-01-01" }),
      makeEntry({ date: "2020-01-03" }),
    ];
    expect(calcStreakDays(entries)).toBe(0);
  });
});

// ============================================================
// buildSummaryText
// ============================================================

describe("buildSummaryText - 요약 텍스트 생성", () => {
  it("연습이 없으면 기본 메시지를 반환한다", () => {
    const text = buildSummaryText(0, 0, 0, null, 0);
    expect(text).toBe("이번 주 아직 연습 기록이 없습니다.");
  });

  it("60분 미만은 분 단위로 표시된다", () => {
    const text = buildSummaryText(1, 45, 0, null, 0);
    expect(text).toContain("45분");
  });

  it("60분 이상은 시간 단위로 표시된다", () => {
    const text = buildSummaryText(1, 120, 0, null, 0);
    expect(text).toContain("2시간");
  });

  it("90분은 '1시간 30분'으로 표시된다", () => {
    const text = buildSummaryText(1, 90, 0, null, 0);
    expect(text).toContain("1시간 30분");
  });

  it("평균 평점이 0보다 크면 만족도가 포함된다", () => {
    const text = buildSummaryText(1, 60, 4.5, null, 0);
    expect(text).toContain("4.5점");
  });

  it("평균 평점이 0이면 만족도가 포함되지 않는다", () => {
    const text = buildSummaryText(1, 60, 0, null, 0);
    expect(text).not.toContain("점");
  });

  it("topCategory가 있으면 집중 연습 텍스트가 포함된다", () => {
    const text = buildSummaryText(1, 60, 0, "힙합", 0);
    expect(text).toContain('"힙합" 집중 연습');
  });

  it("topCategory가 null이면 집중 연습 텍스트가 없다", () => {
    const text = buildSummaryText(1, 60, 0, null, 0);
    expect(text).not.toContain("집중 연습");
  });

  it("streakDays가 2 이상이면 연속 달성 텍스트가 포함된다", () => {
    const text = buildSummaryText(1, 60, 0, null, 3);
    expect(text).toContain("3일 연속 달성 중");
  });

  it("streakDays가 1이면 연속 달성 텍스트가 없다", () => {
    const text = buildSummaryText(1, 60, 0, null, 1);
    expect(text).not.toContain("연속 달성");
  });

  it("practiceCount가 텍스트에 포함된다", () => {
    const text = buildSummaryText(5, 60, 0, null, 0);
    expect(text).toContain("5회 연습");
  });

  it("여러 파트는 ' | '로 구분된다", () => {
    const text = buildSummaryText(1, 60, 4.0, "힙합", 0);
    expect(text).toContain(" | ");
  });
});
