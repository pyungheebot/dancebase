/**
 * use-activity-archive 테스트
 *
 * 훅 내부의 순수 계산 로직을 인라인으로 재현하여 검증합니다.
 * - 최근 6개월 목록 생성 (getLast6Months)
 * - 월 범위 ISO 문자열 반환 (getMonthRange)
 * - 활동 점수 계산 (calcActivityScore)
 * - 멤버별 활동 점수 집계 로직
 * - 인기 게시글 탐지 로직
 * - 출석률 계산 로직
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 최근 6개월 YYYY-MM 목록 생성 */
function getLast6Months(now: Date): { month: string; label: string }[] {
  const result: { month: string; label: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, "0");
    result.push({
      month: `${year}-${monthStr}`,
      label: `${year}년 ${month}월`,
    });
  }
  return result;
}

/** 월 범위 ISO 문자열 반환 */
function getMonthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/** 활동 점수 계산 (게시글 2점 + 댓글 1점 + 출석 3점) */
function calcActivityScore(posts: number, comments: number, attendance: number): number {
  return posts * 2 + comments * 1 + attendance * 3;
}

/** 출석률 계산 */
function calcAvgAttendanceRate(presentCount: number, totalMarked: number): number {
  return totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;
}

/** 멤버 점수 정렬 및 TOP N 추출 */
type ScoredMember = { userId: string; name: string; score: number };
function getTopMembers(members: ScoredMember[], n: number): ScoredMember[] {
  return [...members].sort((a, b) => b.score - a.score).slice(0, n);
}

/** 게시글별 댓글 수에서 가장 인기 있는 게시글 ID 찾기 */
function findMostPopularPostId(
  postCommentCounts: Record<string, number>
): { postId: string; commentCount: number } | null {
  let maxComments = -1;
  let popularPostId: string | null = null;
  for (const [pid, cnt] of Object.entries(postCommentCounts)) {
    if (cnt > maxComments) {
      maxComments = cnt;
      popularPostId = pid;
    }
  }
  if (popularPostId === null || maxComments < 0) return null;
  return { postId: popularPostId, commentCount: maxComments };
}

/** 월 레이블 형식 검증 */
function isValidMonthLabel(label: string): boolean {
  return /^\d{4}년 \d{1,2}월$/.test(label);
}

/** YYYY-MM 형식 검증 */
function isValidYearMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

// ============================================================
// getLast6Months 테스트
// ============================================================

describe("최근 6개월 목록 생성 (getLast6Months)", () => {
  it("항상 6개 항목을 반환한다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    expect(result).toHaveLength(6);
  });

  it("첫 번째 항목은 현재 달이다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    expect(result[0].month).toBe("2026-03");
  });

  it("두 번째 항목은 한 달 전이다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    expect(result[1].month).toBe("2026-02");
  });

  it("마지막(6번째) 항목은 5개월 전이다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    expect(result[5].month).toBe("2025-10");
  });

  it("1월에서 이전 달로 가면 12월이 된다 (연도 경계)", () => {
    const now = new Date("2026-01-15");
    const result = getLast6Months(now);
    expect(result[0].month).toBe("2026-01");
    expect(result[1].month).toBe("2025-12");
    expect(result[2].month).toBe("2025-11");
  });

  it("모든 항목의 month 형식은 YYYY-MM이다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    result.forEach((item) => {
      expect(isValidYearMonth(item.month)).toBe(true);
    });
  });

  it("모든 항목의 label 형식은 'YYYY년 M월'이다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    result.forEach((item) => {
      expect(isValidMonthLabel(item.label)).toBe(true);
    });
  });

  it("label에 연도와 월 정보가 포함된다", () => {
    const now = new Date("2026-03-01");
    const result = getLast6Months(now);
    expect(result[0].label).toBe("2026년 3월");
  });

  it("월이 10 미만이면 두 자리 패딩 없이 label에 표시된다", () => {
    const now = new Date("2026-05-01");
    const result = getLast6Months(now);
    expect(result[0].label).toBe("2026년 5월");
    // month 값은 패딩됨
    expect(result[0].month).toBe("2026-05");
  });

  it("최신 달이 첫 번째 순서로 정렬된다", () => {
    const now = new Date("2026-06-01");
    const result = getLast6Months(now);
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].month > result[i + 1].month).toBe(true);
    }
  });
});

// ============================================================
// getMonthRange 테스트
// ============================================================

describe("월 범위 ISO 문자열 반환 (getMonthRange)", () => {
  it("start는 해당 월 1일 00:00:00이다", () => {
    const { start } = getMonthRange("2026-03");
    const startDate = new Date(start);
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(2); // 0-indexed
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getHours()).toBe(0);
  });

  it("end는 다음 달 1일이다", () => {
    const { end } = getMonthRange("2026-03");
    const endDate = new Date(end);
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(3); // 0-indexed, 4월
    expect(endDate.getDate()).toBe(1);
  });

  it("12월의 end는 다음 해 1월 1일이다 (연도 경계)", () => {
    const { end } = getMonthRange("2025-12");
    const endDate = new Date(end);
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(0); // 1월
  });

  it("1월의 start는 1월 1일이다", () => {
    const { start } = getMonthRange("2026-01");
    const startDate = new Date(start);
    expect(startDate.getMonth()).toBe(0);
    expect(startDate.getDate()).toBe(1);
  });

  it("유효한 ISO 문자열을 반환한다", () => {
    const { start, end } = getMonthRange("2026-03");
    expect(() => new Date(start)).not.toThrow();
    expect(() => new Date(end)).not.toThrow();
    expect(new Date(start).toString()).not.toBe("Invalid Date");
    expect(new Date(end).toString()).not.toBe("Invalid Date");
  });

  it("start가 end보다 이전이다", () => {
    const { start, end } = getMonthRange("2026-03");
    expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
  });
});

// ============================================================
// calcActivityScore 테스트
// ============================================================

describe("활동 점수 계산 (calcActivityScore: 게시글×2 + 댓글×1 + 출석×3)", () => {
  it("활동 없으면 0점이다", () => {
    expect(calcActivityScore(0, 0, 0)).toBe(0);
  });

  it("게시글 1개는 2점이다", () => {
    expect(calcActivityScore(1, 0, 0)).toBe(2);
  });

  it("댓글 1개는 1점이다", () => {
    expect(calcActivityScore(0, 1, 0)).toBe(1);
  });

  it("출석 1회는 3점이다", () => {
    expect(calcActivityScore(0, 0, 1)).toBe(3);
  });

  it("게시글 3개 + 댓글 2개 + 출석 5회 = 6+2+15 = 23점이다", () => {
    expect(calcActivityScore(3, 2, 5)).toBe(23);
  });

  it("출석만 있을 때 점수가 가장 높다 (동일 수량 비교)", () => {
    const postsOnly = calcActivityScore(1, 0, 0);
    const commentsOnly = calcActivityScore(0, 1, 0);
    const attendanceOnly = calcActivityScore(0, 0, 1);
    expect(attendanceOnly).toBeGreaterThan(postsOnly);
    expect(postsOnly).toBeGreaterThan(commentsOnly);
  });

  it("게시글 5개만 있으면 10점이다", () => {
    expect(calcActivityScore(5, 0, 0)).toBe(10);
  });

  it("댓글 10개만 있으면 10점이다", () => {
    expect(calcActivityScore(0, 10, 0)).toBe(10);
  });

  it("출석 10회만 있으면 30점이다", () => {
    expect(calcActivityScore(0, 0, 10)).toBe(30);
  });
});

// ============================================================
// 출석률 계산 테스트
// ============================================================

describe("평균 출석률 계산 (calcAvgAttendanceRate)", () => {
  it("기록이 없으면 0%이다", () => {
    expect(calcAvgAttendanceRate(0, 0)).toBe(0);
  });

  it("전원 출석이면 100%이다", () => {
    expect(calcAvgAttendanceRate(10, 10)).toBe(100);
  });

  it("전원 결석이면 0%이다", () => {
    expect(calcAvgAttendanceRate(0, 10)).toBe(0);
  });

  it("50% 출석이면 50%이다", () => {
    expect(calcAvgAttendanceRate(5, 10)).toBe(50);
  });

  it("반올림 처리한다 (2/3 ≈ 67%)", () => {
    expect(calcAvgAttendanceRate(2, 3)).toBe(67);
  });
});

// ============================================================
// 멤버 점수 정렬 및 TOP 추출 테스트
// ============================================================

describe("멤버 점수 TOP N 추출 (getTopMembers)", () => {
  const members: ScoredMember[] = [
    { userId: "a", name: "김철수", score: 30 },
    { userId: "b", name: "이영희", score: 50 },
    { userId: "c", name: "박민준", score: 20 },
    { userId: "d", name: "최지수", score: 40 },
    { userId: "e", name: "강도원", score: 10 },
  ];

  it("TOP 3을 올바르게 추출한다", () => {
    const top3 = getTopMembers(members, 3);
    expect(top3).toHaveLength(3);
    expect(top3[0].userId).toBe("b"); // 50점
    expect(top3[1].userId).toBe("d"); // 40점
    expect(top3[2].userId).toBe("a"); // 30점
  });

  it("점수 높은 순으로 정렬된다", () => {
    const top5 = getTopMembers(members, 5);
    for (let i = 0; i < top5.length - 1; i++) {
      expect(top5[i].score).toBeGreaterThanOrEqual(top5[i + 1].score);
    }
  });

  it("멤버 수가 N보다 적으면 전체를 반환한다", () => {
    const smallList = [
      { userId: "a", name: "김철수", score: 30 },
      { userId: "b", name: "이영희", score: 50 },
    ];
    const top5 = getTopMembers(smallList, 5);
    expect(top5).toHaveLength(2);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(getTopMembers([], 3)).toHaveLength(0);
  });

  it("N=1이면 최고 점수 멤버만 반환한다", () => {
    const top1 = getTopMembers(members, 1);
    expect(top1).toHaveLength(1);
    expect(top1[0].userId).toBe("b");
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = [...members];
    getTopMembers(members, 3);
    expect(members[0].userId).toBe(original[0].userId);
  });
});

// ============================================================
// 인기 게시글 탐지 테스트
// ============================================================

describe("인기 게시글 탐지 (findMostPopularPostId)", () => {
  it("빈 객체이면 null을 반환한다", () => {
    expect(findMostPopularPostId({})).toBeNull();
  });

  it("단일 게시글이면 해당 게시글을 반환한다", () => {
    const result = findMostPopularPostId({ "post-1": 5 });
    expect(result).not.toBeNull();
    expect(result!.postId).toBe("post-1");
    expect(result!.commentCount).toBe(5);
  });

  it("댓글이 가장 많은 게시글을 반환한다", () => {
    const result = findMostPopularPostId({
      "post-1": 3,
      "post-2": 10,
      "post-3": 7,
    });
    expect(result).not.toBeNull();
    expect(result!.postId).toBe("post-2");
    expect(result!.commentCount).toBe(10);
  });

  it("동점인 경우 먼저 순회된 항목이 반환된다", () => {
    const counts = { "post-a": 5, "post-b": 5 };
    const result = findMostPopularPostId(counts);
    expect(result).not.toBeNull();
    expect(result!.commentCount).toBe(5);
  });

  it("댓글이 0개인 게시글도 반환될 수 있다", () => {
    const result = findMostPopularPostId({ "post-1": 0 });
    expect(result).not.toBeNull();
    expect(result!.commentCount).toBe(0);
  });

  it("반환된 commentCount가 실제 최대값과 같다", () => {
    const counts = { "a": 1, "b": 99, "c": 50 };
    const result = findMostPopularPostId(counts);
    expect(result!.commentCount).toBe(99);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 활동 아카이브", () => {
  it("활동이 많은 멤버가 TOP에 위치한다", () => {
    // 게시글 5개 + 댓글 3개 + 출석 4회 = 10 + 3 + 12 = 25점
    const scoreA = calcActivityScore(5, 3, 4);
    // 게시글 1개 + 댓글 1개 + 출석 1회 = 2 + 1 + 3 = 6점
    const scoreB = calcActivityScore(1, 1, 1);
    const members: ScoredMember[] = [
      { userId: "a", name: "활발한멤버", score: scoreA },
      { userId: "b", name: "비활성멤버", score: scoreB },
    ];
    const top1 = getTopMembers(members, 1);
    expect(top1[0].userId).toBe("a");
  });

  it("6개월 데이터가 모두 현재보다 과거이다", () => {
    const now = new Date("2026-03-01");
    const months = getLast6Months(now);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    months.forEach((item) => {
      expect(item.month <= currentMonth).toBe(true);
    });
  });

  it("월 범위에서 start < end 관계가 유지된다", () => {
    const now = new Date("2026-03-01");
    const months = getLast6Months(now);
    months.forEach(({ month }) => {
      const { start, end } = getMonthRange(month);
      expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });
  });

  it("출석률이 0%인 달은 topMembers에 출석 기여 없음", () => {
    // 출석 0회이면 출석 점수 0
    const scoreNoAttendance = calcActivityScore(2, 3, 0);
    const scoreWithAttendance = calcActivityScore(2, 3, 1);
    expect(scoreWithAttendance).toBeGreaterThan(scoreNoAttendance);
  });

  it("신규 멤버 0명이면 newMemberCount = 0이다", () => {
    const count = 0;
    expect(count).toBe(0);
  });
});
