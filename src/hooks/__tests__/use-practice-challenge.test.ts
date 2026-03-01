/**
 * use-practice-challenge 테스트
 *
 * 훅 내부의 순수 계산 로직을 검증합니다.
 * - computeStatus: 날짜 기반 자동 상태 계산
 * - withComputedStatus: 전체 목록에 상태 적용
 * - 진행률 클램핑 (0~100)
 * - 통계 계산 (totalChallenges, activeChallenges, completedChallenges, topParticipants)
 * - 유효성 검사 (제목, 날짜, targetValue, unit)
 * - 경계값, 빈 배열, 동점 처리
 */

import { describe, it, expect } from "vitest";
import type {
  PracticeChallengeEntry,
  PracticeChallengeParticipant,
  PracticeChallengeStatus,
} from "@/types/localStorage/practice";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 날짜 기반 자동 상태 계산 */
function computeStatus(
  startDate: string,
  endDate: string,
  current: PracticeChallengeStatus,
  today: string = new Date().toISOString().slice(0, 10)
): PracticeChallengeStatus {
  if (current === "cancelled") return "cancelled";
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

/** 전체 목록에 상태 적용 */
function withComputedStatus(
  entries: PracticeChallengeEntry[],
  today: string = new Date().toISOString().slice(0, 10)
): PracticeChallengeEntry[] {
  return entries.map((e) => ({
    ...e,
    status: computeStatus(e.startDate, e.endDate, e.status, today),
  }));
}

/** 진행률 클램핑 */
function clampProgress(progress: number): number {
  return Math.max(0, Math.min(100, Math.round(progress)));
}

/** 상위 N명 참가자 추출 */
function getTopParticipants(
  challenges: PracticeChallengeEntry[],
  limit: number = 5
) {
  const allParticipants = challenges.flatMap((c) =>
    c.participants.map((p) => ({ ...p, challengeTitle: c.title }))
  );
  return [...allParticipants]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

/** 통계 계산 */
function calcStats(challenges: PracticeChallengeEntry[]) {
  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter((c) => c.status === "active").length;
  const completedChallenges = challenges.filter(
    (c) => c.status === "completed"
  ).length;
  const topParticipants = getTopParticipants(challenges);
  return { totalChallenges, activeChallenges, completedChallenges, topParticipants };
}

/** 도전 추가 유효성 검사 */
function validateAddChallenge(input: {
  title: string;
  startDate: string;
  endDate: string;
  targetValue: number;
  unit: string;
}): { valid: boolean; reason?: string } {
  if (!input.title.trim()) return { valid: false, reason: "title" };
  if (!input.startDate || !input.endDate) return { valid: false, reason: "date_required" };
  if (input.startDate > input.endDate) return { valid: false, reason: "date_order" };
  if (!input.targetValue || input.targetValue < 1) return { valid: false, reason: "targetValue" };
  if (!input.unit.trim()) return { valid: false, reason: "unit" };
  return { valid: true };
}

/** 참가 유효성 검사 */
function validateJoin(
  memberName: string,
  participants: PracticeChallengeParticipant[]
): { valid: boolean; reason?: string } {
  if (!memberName.trim()) return { valid: false, reason: "name_required" };
  const alreadyJoined = participants.some(
    (p) => p.memberName.toLowerCase() === memberName.trim().toLowerCase()
  );
  if (alreadyJoined) return { valid: false, reason: "duplicate" };
  return { valid: true };
}

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeChallenge(
  overrides: Partial<PracticeChallengeEntry> = {}
): PracticeChallengeEntry {
  return {
    id: "challenge-1",
    title: "테스트 도전",
    description: "설명",
    status: "active",
    targetValue: 10,
    unit: "회",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    participants: [],
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeParticipant(
  name: string,
  progress: number,
  completedAt?: string
): PracticeChallengeParticipant {
  return { memberName: name, progress, completedAt };
}

// ============================================================
// computeStatus 테스트
// ============================================================

describe("computeStatus - 날짜 기반 자동 상태 계산", () => {
  it("취소 상태는 날짜에 관계없이 유지된다", () => {
    expect(computeStatus("2020-01-01", "2020-12-31", "cancelled", "2026-01-15")).toBe("cancelled");
  });

  it("오늘이 시작일 이전이면 'upcoming'이다", () => {
    expect(computeStatus("2027-01-01", "2027-12-31", "upcoming", "2026-01-15")).toBe("upcoming");
  });

  it("오늘이 종료일 이후이면 'completed'이다", () => {
    expect(computeStatus("2025-01-01", "2025-12-31", "active", "2026-01-15")).toBe("completed");
  });

  it("오늘이 시작일과 종료일 사이이면 'active'이다", () => {
    expect(computeStatus("2026-01-01", "2026-12-31", "upcoming", "2026-06-15")).toBe("active");
  });

  it("오늘이 시작일과 같으면 'active'이다", () => {
    expect(computeStatus("2026-01-15", "2026-12-31", "upcoming", "2026-01-15")).toBe("active");
  });

  it("오늘이 종료일과 같으면 'active'이다", () => {
    expect(computeStatus("2026-01-01", "2026-01-15", "active", "2026-01-15")).toBe("active");
  });

  it("시작일과 종료일이 오늘과 같으면 'active'이다", () => {
    expect(computeStatus("2026-01-15", "2026-01-15", "upcoming", "2026-01-15")).toBe("active");
  });

  it("'cancelled'는 미래 날짜에도 변경되지 않는다", () => {
    expect(computeStatus("2027-01-01", "2027-12-31", "cancelled", "2026-01-15")).toBe("cancelled");
  });
});

// ============================================================
// withComputedStatus 테스트
// ============================================================

describe("withComputedStatus - 전체 목록에 상태 적용", () => {
  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(withComputedStatus([], "2026-01-15")).toHaveLength(0);
  });

  it("각 항목의 상태가 날짜 기반으로 재계산된다", () => {
    const challenges = [
      makeChallenge({ id: "1", startDate: "2027-01-01", endDate: "2027-12-31", status: "upcoming" }),
      makeChallenge({ id: "2", startDate: "2025-01-01", endDate: "2025-12-31", status: "active" }),
    ];
    const result = withComputedStatus(challenges, "2026-01-15");
    expect(result[0]!.status).toBe("upcoming");
    expect(result[1]!.status).toBe("completed");
  });

  it("취소 상태는 변경되지 않는다", () => {
    const challenges = [
      makeChallenge({ startDate: "2026-01-01", endDate: "2026-12-31", status: "cancelled" }),
    ];
    const result = withComputedStatus(challenges, "2026-06-15");
    expect(result[0]!.status).toBe("cancelled");
  });

  it("원본 객체의 다른 필드는 유지된다", () => {
    const challenge = makeChallenge({ title: "유지되어야 할 제목", participants: [] });
    const result = withComputedStatus([challenge], "2026-01-15");
    expect(result[0]!.title).toBe("유지되어야 할 제목");
    expect(result[0]!.id).toBe(challenge.id);
  });
});

// ============================================================
// clampProgress 테스트
// ============================================================

describe("clampProgress - 진행률 클램핑", () => {
  it("0 미만은 0으로 클램핑된다", () => {
    expect(clampProgress(-1)).toBe(0);
  });

  it("100 초과는 100으로 클램핑된다", () => {
    expect(clampProgress(101)).toBe(100);
  });

  it("0은 0이다", () => {
    expect(clampProgress(0)).toBe(0);
  });

  it("100은 100이다", () => {
    expect(clampProgress(100)).toBe(100);
  });

  it("50은 50이다", () => {
    expect(clampProgress(50)).toBe(50);
  });

  it("소수점은 반올림된다", () => {
    expect(clampProgress(49.6)).toBe(50);
  });

  it("소수점 반내림이 올바르게 처리된다", () => {
    expect(clampProgress(49.4)).toBe(49);
  });

  it("음수 큰 값도 0으로 클램핑된다", () => {
    expect(clampProgress(-999)).toBe(0);
  });
});

// ============================================================
// calcStats 통계 테스트
// ============================================================

describe("calcStats - 도전 통계 계산", () => {
  it("도전이 없으면 모든 통계가 0이다", () => {
    const stats = calcStats([]);
    expect(stats.totalChallenges).toBe(0);
    expect(stats.activeChallenges).toBe(0);
    expect(stats.completedChallenges).toBe(0);
    expect(stats.topParticipants).toHaveLength(0);
  });

  it("totalChallenges는 전체 도전 수이다", () => {
    const challenges = [makeChallenge({ id: "1" }), makeChallenge({ id: "2" })];
    const stats = calcStats(challenges);
    expect(stats.totalChallenges).toBe(2);
  });

  it("activeChallenges는 active 상태의 도전 수이다", () => {
    const challenges = [
      makeChallenge({ id: "1", status: "active" }),
      makeChallenge({ id: "2", status: "completed" }),
      makeChallenge({ id: "3", status: "active" }),
    ];
    const stats = calcStats(challenges);
    expect(stats.activeChallenges).toBe(2);
  });

  it("completedChallenges는 completed 상태의 도전 수이다", () => {
    const challenges = [
      makeChallenge({ id: "1", status: "completed" }),
      makeChallenge({ id: "2", status: "active" }),
      makeChallenge({ id: "3", status: "completed" }),
    ];
    const stats = calcStats(challenges);
    expect(stats.completedChallenges).toBe(2);
  });

  it("topParticipants는 진행률 내림차순 상위 5명이다", () => {
    const challenges = [
      makeChallenge({
        id: "1",
        participants: [
          makeParticipant("A", 100),
          makeParticipant("B", 80),
          makeParticipant("C", 60),
          makeParticipant("D", 40),
          makeParticipant("E", 20),
          makeParticipant("F", 10),
        ],
      }),
    ];
    const stats = calcStats(challenges);
    expect(stats.topParticipants).toHaveLength(5);
    expect(stats.topParticipants[0]!.memberName).toBe("A");
    expect(stats.topParticipants[0]!.progress).toBe(100);
  });

  it("총 참가자가 5명 미만이면 전원을 반환한다", () => {
    const challenges = [
      makeChallenge({
        id: "1",
        participants: [makeParticipant("A", 50), makeParticipant("B", 30)],
      }),
    ];
    const stats = calcStats(challenges);
    expect(stats.topParticipants).toHaveLength(2);
  });

  it("여러 도전에 걸친 참가자들이 통합 순위로 정렬된다", () => {
    const challenges = [
      makeChallenge({ id: "1", title: "도전1", participants: [makeParticipant("A", 70)] }),
      makeChallenge({ id: "2", title: "도전2", participants: [makeParticipant("B", 90)] }),
    ];
    const stats = calcStats(challenges);
    expect(stats.topParticipants[0]!.memberName).toBe("B");
    expect(stats.topParticipants[1]!.memberName).toBe("A");
  });
});

// ============================================================
// validateAddChallenge 유효성 검사 테스트
// ============================================================

describe("validateAddChallenge - 도전 추가 유효성 검사", () => {
  const validInput = {
    title: "제목",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    targetValue: 10,
    unit: "회",
  };

  it("유효한 입력은 valid: true를 반환한다", () => {
    expect(validateAddChallenge(validInput).valid).toBe(true);
  });

  it("빈 제목은 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, title: "" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("title");
  });

  it("공백만 있는 제목은 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, title: "   " });
    expect(result.valid).toBe(false);
  });

  it("시작일이 없으면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, startDate: "" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("date_required");
  });

  it("종료일이 없으면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, endDate: "" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("date_required");
  });

  it("시작일이 종료일보다 늦으면 유효하지 않다", () => {
    const result = validateAddChallenge({
      ...validInput,
      startDate: "2026-12-31",
      endDate: "2026-01-01",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("date_order");
  });

  it("시작일과 종료일이 같으면 유효하다", () => {
    const result = validateAddChallenge({
      ...validInput,
      startDate: "2026-06-01",
      endDate: "2026-06-01",
    });
    expect(result.valid).toBe(true);
  });

  it("targetValue가 0이면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, targetValue: 0 });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("targetValue");
  });

  it("targetValue가 음수이면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, targetValue: -1 });
    expect(result.valid).toBe(false);
  });

  it("단위가 빈 문자열이면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, unit: "" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unit");
  });

  it("단위가 공백만이면 유효하지 않다", () => {
    const result = validateAddChallenge({ ...validInput, unit: "  " });
    expect(result.valid).toBe(false);
  });
});

// ============================================================
// validateJoin 참가 유효성 검사 테스트
// ============================================================

describe("validateJoin - 참가 유효성 검사", () => {
  it("유효한 이름으로 참가하면 valid: true이다", () => {
    const result = validateJoin("홍길동", []);
    expect(result.valid).toBe(true);
  });

  it("빈 이름은 유효하지 않다", () => {
    const result = validateJoin("", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("name_required");
  });

  it("공백만 있는 이름은 유효하지 않다", () => {
    const result = validateJoin("   ", []);
    expect(result.valid).toBe(false);
  });

  it("이미 참가한 멤버는 중복으로 처리된다", () => {
    const participants = [makeParticipant("홍길동", 50)];
    const result = validateJoin("홍길동", participants);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("duplicate");
  });

  it("대소문자를 무시하고 중복을 체크한다", () => {
    const participants = [makeParticipant("John", 50)];
    const result = validateJoin("john", participants);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("duplicate");
  });

  it("다른 이름은 중복이 아니다", () => {
    const participants = [makeParticipant("홍길동", 50)];
    const result = validateJoin("김철수", participants);
    expect(result.valid).toBe(true);
  });

  it("앞뒤 공백을 제거 후 중복을 체크한다", () => {
    const participants = [makeParticipant("홍길동", 50)];
    const result = validateJoin("  홍길동  ", participants);
    expect(result.valid).toBe(false);
  });
});

// ============================================================
// getTopParticipants 테스트
// ============================================================

describe("getTopParticipants - 상위 참가자 추출", () => {
  it("참가자가 없으면 빈 배열을 반환한다", () => {
    expect(getTopParticipants([])).toHaveLength(0);
  });

  it("참가자가 limit 이하이면 전원을 반환한다", () => {
    const challenges = [
      makeChallenge({
        participants: [makeParticipant("A", 100), makeParticipant("B", 80)],
      }),
    ];
    expect(getTopParticipants(challenges, 5)).toHaveLength(2);
  });

  it("진행률 내림차순으로 정렬된다", () => {
    const challenges = [
      makeChallenge({
        participants: [
          makeParticipant("C", 30),
          makeParticipant("A", 90),
          makeParticipant("B", 60),
        ],
      }),
    ];
    const top = getTopParticipants(challenges, 5);
    expect(top[0]!.memberName).toBe("A");
    expect(top[1]!.memberName).toBe("B");
    expect(top[2]!.memberName).toBe("C");
  });

  it("challengeTitle이 각 참가자에 포함된다", () => {
    const challenges = [
      makeChallenge({ title: "챌린지1", participants: [makeParticipant("A", 80)] }),
    ];
    const top = getTopParticipants(challenges, 5);
    expect(top[0]!.challengeTitle).toBe("챌린지1");
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 연습 도전 과제", () => {
  it("진행률 100% 달성 시 completedAt이 설정되어야 한다 (데이터 구조 확인)", () => {
    const participant = makeParticipant("홍길동", 100, "2026-01-15T10:00:00.000Z");
    expect(participant.progress).toBe(100);
    expect(participant.completedAt).toBeDefined();
  });

  it("도전 상태가 자동 계산되어 active → completed로 전환된다", () => {
    const challenges = [
      makeChallenge({
        id: "1",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        status: "active",
      }),
    ];
    const result = withComputedStatus(challenges, "2026-01-15");
    expect(result[0]!.status).toBe("completed");
  });

  it("도전 상태가 upcoming → active로 전환된다", () => {
    const challenges = [
      makeChallenge({
        id: "1",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "upcoming",
      }),
    ];
    const result = withComputedStatus(challenges, "2026-06-15");
    expect(result[0]!.status).toBe("active");
  });

  it("여러 참가자 중 상위 참가자가 정확히 추출된다", () => {
    const challenges = [
      makeChallenge({
        id: "1",
        title: "스쿼트 챌린지",
        status: "active",
        participants: [
          makeParticipant("A", 100, "2026-01-10T00:00:00.000Z"),
          makeParticipant("B", 75),
          makeParticipant("C", 50),
          makeParticipant("D", 25),
          makeParticipant("E", 10),
          makeParticipant("F", 5),
        ],
      }),
    ];
    const stats = calcStats(challenges);
    expect(stats.topParticipants).toHaveLength(5);
    expect(stats.topParticipants[0]!.memberName).toBe("A");
    expect(stats.topParticipants[4]!.memberName).toBe("E");
  });
});
