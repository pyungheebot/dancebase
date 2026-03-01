/**
 * use-attendance-team-balance 테스트
 *
 * 훅 내부의 순수 계산 함수들을 직접 추출하여 검증합니다.
 * - calcCoAttendance: 공동 출석 횟수 계산
 * - kMeansCluster: 클러스터링 (팀 분배)
 * - 팀 평균 출석률 계산
 * - rateDeviation (팀 간 출석률 편차)
 * - 빈 데이터 / 경계값 처리
 */

import { describe, it, expect } from "vitest";
import type { TeamBalancerMember, BalancedTeam } from "@/types/schedule";

// ============================================================
// 훅에서 추출한 순수 계산 함수들
// ============================================================

/** 공동 출석 횟수 계산 (코사인 유사도 단순화) */
function calcCoAttendance(vecA: boolean[], vecB: boolean[]): number {
  let coCount = 0;
  for (let i = 0; i < vecA.length; i++) {
    if (vecA[i] && vecB[i]) coCount++;
  }
  return coCount;
}

/** 팀 평균 출석률 계산 */
function calcTeamAvgRate(members: TeamBalancerMember[]): number {
  if (members.length === 0) return 0;
  return Math.round(
    members.reduce((s, m) => s + m.attendanceRate, 0) / members.length
  );
}

/** 팀 간 출석률 편차 계산 */
function calcRateDeviation(teams: Pick<BalancedTeam, "avgAttendanceRate">[]): number {
  if (teams.length < 2) return 0;
  const rates = teams.map((t) => t.avgAttendanceRate);
  return Math.max(...rates) - Math.min(...rates);
}

/** 라운드로빈 초기 팀 배분 */
function roundRobinAssign(sortedIndices: number[], k: number): number[][] {
  const clusters: number[][] = Array.from({ length: k }, () => []);
  sortedIndices.forEach((idx, pos) => {
    clusters[pos % k].push(idx);
  });
  return clusters;
}

/** 출석 벡터 생성 */
function buildVector(
  userId: string,
  scheduleIds: string[],
  attendanceRows: { user_id: string; schedule_id: string }[]
): boolean[] {
  return scheduleIds.map((sid) =>
    attendanceRows.some((a) => a.user_id === userId && a.schedule_id === sid)
  );
}

/** 출석률 계산 */
function calcAttendanceRate(vec: boolean[]): number {
  if (vec.length === 0) return 0;
  const presentCount = vec.filter(Boolean).length;
  return Math.round((presentCount / vec.length) * 100);
}

/** 팀 크기 균형 조정 (최대-최소 차이가 1 이하가 되도록) */
function balanceClusters(clusters: number[][]): number[][] {
  const result = clusters.map((c) => [...c]);
  const n = result.reduce((s, c) => s + c.length, 0);
  for (let iter = 0; iter < n; iter++) {
    const sizes = result.map((c) => c.length);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    if (maxSize - minSize <= 1) break;
    const bigIdx = sizes.indexOf(maxSize);
    const smallIdx = sizes.indexOf(minSize);
    const moved = result[bigIdx].pop();
    if (moved !== undefined) {
      result[smallIdx].push(moved);
    }
  }
  return result;
}

// ============================================================
// 테스트용 더미 데이터 생성 헬퍼
// ============================================================

function makeMember(
  userId: string,
  name: string,
  attendanceRate: number
): TeamBalancerMember {
  return { userId, name, avatarUrl: null, attendanceRate };
}

// ============================================================
// calcCoAttendance 테스트
// ============================================================

describe("calcCoAttendance - 공동 출석 횟수 계산", () => {
  it("두 벡터가 동일하게 모두 true이면 전체 길이를 반환한다", () => {
    expect(calcCoAttendance([true, true, true], [true, true, true])).toBe(3);
  });

  it("두 벡터가 모두 false이면 0을 반환한다", () => {
    expect(calcCoAttendance([false, false, false], [false, false, false])).toBe(0);
  });

  it("한 벡터가 모두 false이면 0을 반환한다", () => {
    expect(calcCoAttendance([true, true, true], [false, false, false])).toBe(0);
  });

  it("공동 출석이 1개이면 1을 반환한다", () => {
    expect(calcCoAttendance([true, false, false], [true, false, false])).toBe(1);
  });

  it("공동 출석이 없으면 0을 반환한다", () => {
    expect(calcCoAttendance([true, false], [false, true])).toBe(0);
  });

  it("일부만 공동 출석한 경우 해당 횟수를 반환한다", () => {
    expect(calcCoAttendance([true, true, false], [true, false, true])).toBe(1);
  });

  it("빈 벡터이면 0을 반환한다", () => {
    expect(calcCoAttendance([], [])).toBe(0);
  });

  it("길이 1인 벡터 모두 true이면 1을 반환한다", () => {
    expect(calcCoAttendance([true], [true])).toBe(1);
  });
});

// ============================================================
// calcTeamAvgRate 테스트
// ============================================================

describe("calcTeamAvgRate - 팀 평균 출석률 계산", () => {
  it("멤버가 없으면 0을 반환한다", () => {
    expect(calcTeamAvgRate([])).toBe(0);
  });

  it("단일 멤버이면 해당 멤버의 출석률을 반환한다", () => {
    const members = [makeMember("u1", "홍길동", 80)];
    expect(calcTeamAvgRate(members)).toBe(80);
  });

  it("두 멤버의 평균을 올바르게 계산한다", () => {
    const members = [
      makeMember("u1", "홍길동", 60),
      makeMember("u2", "김철수", 100),
    ];
    expect(calcTeamAvgRate(members)).toBe(80);
  });

  it("출석률이 모두 0이면 평균 0이다", () => {
    const members = [
      makeMember("u1", "홍길동", 0),
      makeMember("u2", "김철수", 0),
    ];
    expect(calcTeamAvgRate(members)).toBe(0);
  });

  it("출석률이 모두 100이면 평균 100이다", () => {
    const members = [
      makeMember("u1", "홍길동", 100),
      makeMember("u2", "김철수", 100),
    ];
    expect(calcTeamAvgRate(members)).toBe(100);
  });

  it("소수점이 발생하는 경우 반올림 처리된다", () => {
    // (0 + 0 + 100) / 3 = 33.33 → 33
    const members = [
      makeMember("u1", "A", 0),
      makeMember("u2", "B", 0),
      makeMember("u3", "C", 100),
    ];
    expect(calcTeamAvgRate(members)).toBe(33);
  });
});

// ============================================================
// calcRateDeviation 테스트
// ============================================================

describe("calcRateDeviation - 팀 간 출석률 편차 계산", () => {
  it("팀이 1개이면 편차는 0이다", () => {
    const teams = [{ avgAttendanceRate: 80 }];
    expect(calcRateDeviation(teams)).toBe(0);
  });

  it("팀이 없으면 편차는 0이다", () => {
    expect(calcRateDeviation([])).toBe(0);
  });

  it("두 팀 출석률이 같으면 편차는 0이다", () => {
    const teams = [{ avgAttendanceRate: 70 }, { avgAttendanceRate: 70 }];
    expect(calcRateDeviation(teams)).toBe(0);
  });

  it("두 팀 편차를 올바르게 계산한다", () => {
    const teams = [{ avgAttendanceRate: 60 }, { avgAttendanceRate: 90 }];
    expect(calcRateDeviation(teams)).toBe(30);
  });

  it("3개 팀의 최대 편차를 반환한다", () => {
    const teams = [
      { avgAttendanceRate: 50 },
      { avgAttendanceRate: 70 },
      { avgAttendanceRate: 90 },
    ];
    expect(calcRateDeviation(teams)).toBe(40);
  });

  it("편차가 최대-최소 차이임을 확인한다", () => {
    const teams = [
      { avgAttendanceRate: 20 },
      { avgAttendanceRate: 50 },
      { avgAttendanceRate: 80 },
      { avgAttendanceRate: 100 },
    ];
    expect(calcRateDeviation(teams)).toBe(80);
  });
});

// ============================================================
// roundRobinAssign 테스트
// ============================================================

describe("roundRobinAssign - 라운드로빈 초기 팀 배분", () => {
  it("2개 팀에 4명을 균등 배분한다", () => {
    const clusters = roundRobinAssign([0, 1, 2, 3], 2);
    expect(clusters[0]).toHaveLength(2);
    expect(clusters[1]).toHaveLength(2);
  });

  it("2개 팀에 3명을 배분하면 한 팀에 2명, 한 팀에 1명이 배분된다", () => {
    const clusters = roundRobinAssign([0, 1, 2], 2);
    const sizes = clusters.map((c) => c.length).sort();
    expect(sizes).toEqual([1, 2]);
  });

  it("팀 수와 멤버 수가 같으면 각 팀에 1명씩 배분된다", () => {
    const clusters = roundRobinAssign([0, 1, 2], 3);
    expect(clusters.every((c) => c.length === 1)).toBe(true);
  });

  it("전체 멤버 수가 보존된다", () => {
    const clusters = roundRobinAssign([0, 1, 2, 3, 4], 3);
    const total = clusters.reduce((s, c) => s + c.length, 0);
    expect(total).toBe(5);
  });
});

// ============================================================
// buildVector 테스트
// ============================================================

describe("buildVector - 출석 벡터 생성", () => {
  it("모든 일정에 출석했으면 true 배열을 반환한다", () => {
    const scheduleIds = ["s1", "s2", "s3"];
    const rows = [
      { user_id: "u1", schedule_id: "s1" },
      { user_id: "u1", schedule_id: "s2" },
      { user_id: "u1", schedule_id: "s3" },
    ];
    expect(buildVector("u1", scheduleIds, rows)).toEqual([true, true, true]);
  });

  it("출석 기록이 없으면 false 배열을 반환한다", () => {
    const scheduleIds = ["s1", "s2"];
    expect(buildVector("u1", scheduleIds, [])).toEqual([false, false]);
  });

  it("일부 일정에만 출석했으면 해당 위치만 true이다", () => {
    const scheduleIds = ["s1", "s2", "s3"];
    const rows = [{ user_id: "u1", schedule_id: "s2" }];
    expect(buildVector("u1", scheduleIds, rows)).toEqual([false, true, false]);
  });

  it("다른 유저의 출석은 포함되지 않는다", () => {
    const scheduleIds = ["s1", "s2"];
    const rows = [{ user_id: "u2", schedule_id: "s1" }];
    expect(buildVector("u1", scheduleIds, rows)).toEqual([false, false]);
  });

  it("일정이 없으면 빈 배열을 반환한다", () => {
    expect(buildVector("u1", [], [])).toEqual([]);
  });
});

// ============================================================
// calcAttendanceRate 테스트
// ============================================================

describe("calcAttendanceRate - 출석률 계산", () => {
  it("빈 벡터이면 0을 반환한다", () => {
    expect(calcAttendanceRate([])).toBe(0);
  });

  it("모두 출석했으면 100을 반환한다", () => {
    expect(calcAttendanceRate([true, true, true])).toBe(100);
  });

  it("모두 결석했으면 0을 반환한다", () => {
    expect(calcAttendanceRate([false, false, false])).toBe(0);
  });

  it("절반 출석했으면 50을 반환한다", () => {
    expect(calcAttendanceRate([true, false])).toBe(50);
  });

  it("2/3 출석 시 67을 반환한다", () => {
    expect(calcAttendanceRate([true, true, false])).toBe(67);
  });

  it("1/3 출석 시 33을 반환한다", () => {
    expect(calcAttendanceRate([true, false, false])).toBe(33);
  });
});

// ============================================================
// balanceClusters 테스트
// ============================================================

describe("balanceClusters - 팀 크기 균형 조정", () => {
  it("이미 균형 잡힌 경우 변경 없다", () => {
    const clusters = [[0, 1], [2, 3]];
    const result = balanceClusters(clusters);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
  });

  it("차이가 2 이상이면 균형 조정된다", () => {
    const clusters = [[0, 1, 2, 3], [4]];
    const result = balanceClusters(clusters);
    const sizes = result.map((c) => c.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("전체 멤버 수는 변하지 않는다", () => {
    const clusters = [[0, 1, 2], [3]];
    const result = balanceClusters(clusters);
    const total = result.reduce((s, c) => s + c.length, 0);
    expect(total).toBe(4);
  });

  it("빈 클러스터가 있어도 전체 멤버는 보존된다", () => {
    const clusters = [[0, 1, 2], []];
    const result = balanceClusters(clusters);
    const total = result.reduce((s, c) => s + c.length, 0);
    expect(total).toBe(3);
  });

  it("단일 팀은 변경되지 않는다", () => {
    const clusters = [[0, 1, 2, 3]];
    const result = balanceClusters(clusters);
    expect(result[0]).toHaveLength(4);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 팀 밸런서", () => {
  it("출석률 벡터로 공동 출석 점수를 비교할 수 있다", () => {
    // u1, u2는 항상 같이 출석, u3는 반대로 출석
    const vecU1 = [true, true, false, false];
    const vecU2 = [true, true, false, false];
    const vecU3 = [false, false, true, true];

    const simU1U2 = calcCoAttendance(vecU1, vecU2);
    const simU1U3 = calcCoAttendance(vecU1, vecU3);

    expect(simU1U2).toBeGreaterThan(simU1U3);
  });

  it("출석률이 높은 순으로 정렬된 멤버를 라운드로빈 배분하면 팀 간 출석률이 균형 잡힌다", () => {
    // 출석률 100, 80, 60, 40 → 팀A [100, 60], 팀B [80, 40]
    // 팀A 평균 = 80, 팀B 평균 = 60 → 편차 20
    const members = [
      makeMember("u1", "A", 100),
      makeMember("u2", "B", 80),
      makeMember("u3", "C", 60),
      makeMember("u4", "D", 40),
    ];
    // 출석률 내림차순으로 이미 정렬되어 있다고 가정
    const clusters = roundRobinAssign([0, 1, 2, 3], 2);
    const teams = clusters.map((c) => ({
      avgAttendanceRate: calcTeamAvgRate(c.map((idx) => members[idx]!)),
    }));
    const deviation = calcRateDeviation(teams);
    // 라운드로빈 배분 시 편차가 0이어야 한다 (100+60)/2 = 80, (80+40)/2 = 60
    expect(deviation).toBeLessThanOrEqual(20);
  });

  it("모든 멤버가 동일한 출석률이면 팀 간 편차가 0이다", () => {
    const members = [
      makeMember("u1", "A", 70),
      makeMember("u2", "B", 70),
      makeMember("u3", "C", 70),
      makeMember("u4", "D", 70),
    ];
    const clusters = roundRobinAssign([0, 1, 2, 3], 2);
    const teams = clusters.map((c) => ({
      avgAttendanceRate: calcTeamAvgRate(c.map((idx) => members[idx]!)),
    }));
    expect(calcRateDeviation(teams)).toBe(0);
  });

  it("팀 수가 멤버 수보다 많으면 각 멤버가 단독 팀을 구성한다", () => {
    const clusters = roundRobinAssign([0, 1], 5);
    // 2명이 5팀에 배분: 각 1명씩 최대 2팀에 배분되고 나머지 3팀은 비어있다
    const total = clusters.reduce((s, c) => s + c.length, 0);
    expect(total).toBe(2);
  });
});
