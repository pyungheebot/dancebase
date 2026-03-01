/**
 * use-practice-plan 테스트
 *
 * 훅 내부의 순수 로직을 인라인으로 재현하여 검증합니다.
 * - storageKey 생성 로직
 * - loadMemberGoals (localStorage CRUD)
 * - buildFocusAreas (집중 과제 자동 생성)
 * - buildPlanContent (플랜 내용 자동 생성)
 * - checkUnachievedGoals 로직의 달 계산
 * - 약점 스킬 필터링 (skill_level <= 2)
 * - 출석률 계산
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MemberSkill } from "@/types/members";
import type { MemberGoal } from "@/types/members";

// ============================================================
// 훅에서 추출한 순수 함수들
// ============================================================

/** localStorage 키 생성 */
function storageKey(groupId: string, userId: string): string {
  return `practice-plan-${groupId}-${userId}`;
}

/** 멤버 목표 저장 키 */
function goalStorageKey(groupId: string, userId: string): string {
  return `member-goals-${groupId}-${userId}`;
}

/** localStorage에서 목표 로드 */
function loadMemberGoals(groupId: string, userId: string): MemberGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`member-goals-${groupId}-${userId}`);
    if (!raw) return [];
    return JSON.parse(raw) as MemberGoal[];
  } catch {
    return [];
  }
}

/** 약점 스킬 필터링 (레벨 1~2) */
function filterWeakSkills(skills: MemberSkill[]): MemberSkill[] {
  return skills.filter((s) => s.skill_level <= 2);
}

/** 집중 과제 자동 생성 (최대 3개) */
function buildFocusAreas(
  attendanceRate: number,
  weakSkills: MemberSkill[],
  unachievedGoals: MemberGoal[]
): string[] {
  const areas: string[] = [];

  if (attendanceRate < 70) {
    areas.push("출석률 향상 필요");
  }

  for (const skill of weakSkills.slice(0, 2)) {
    if (areas.length >= 3) break;
    areas.push(`${skill.skill_name} 집중 연습`);
  }

  if (areas.length < 3 && unachievedGoals.length > 0) {
    areas.push("목표 달성을 위한 추가 연습");
  }

  return areas.slice(0, 3);
}

/** 플랜 내용 자동 생성 */
function buildPlanContent(
  memberName: string,
  attendanceRate: number,
  totalSchedules: number,
  weakSkills: MemberSkill[],
  unachievedGoals: MemberGoal[],
  focusAreas: string[]
): string {
  const lines: string[] = [];

  lines.push(`[${memberName} 맞춤 연습 플랜]`);
  lines.push("");

  lines.push("# 출석 현황 (최근 3개월)");
  if (totalSchedules === 0) {
    lines.push("- 출석 기록 없음");
  } else {
    lines.push(`- 출석률: ${attendanceRate}% (${totalSchedules}회 중 참석)`);
    if (attendanceRate < 70) {
      lines.push("- 권장: 주 1회 이상 정기 연습 참여 필요");
    } else if (attendanceRate < 90) {
      lines.push("- 권장: 현재 수준 유지 및 추가 개인 연습 병행");
    } else {
      lines.push("- 우수한 출석률을 유지하고 있습니다.");
    }
  }
  lines.push("");

  if (weakSkills.length > 0) {
    lines.push("# 보완이 필요한 스킬");
    for (const skill of weakSkills) {
      const levelLabel = skill.skill_level === 1 ? "입문" : "초급";
      lines.push(`- ${skill.skill_name} (현재 레벨: ${levelLabel})`);
    }
    lines.push("");
  }

  if (unachievedGoals.length > 0) {
    lines.push("# 이번 달 목표 진행 상황");
    for (const goal of unachievedGoals) {
      const goalLabel =
        goal.goalType === "attendance"
          ? `출석 ${goal.targetValue}회`
          : goal.goalType === "posts"
          ? `게시글 ${goal.targetValue}개`
          : `회비 납부 ${goal.targetValue}건`;
      lines.push(`- ${goalLabel} 미달성 → 추가 노력 필요`);
    }
    lines.push("");
  }

  if (focusAreas.length > 0) {
    lines.push("# 집중 과제");
    focusAreas.forEach((area, i) => {
      lines.push(`${i + 1}. ${area}`);
    });
  }

  return lines.join("\n");
}

/** 이번 달 YYYY-MM 계산 */
function getCurrentYearMonth(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 다음 달 첫날 계산 */
function getNextMonthFirst(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
}

/** 출석률 계산 */
function calcAttendanceRate(attended: number, total: number): number {
  return total > 0 ? Math.round((attended / total) * 100) : 0;
}

// ============================================================
// storageKey 테스트
// ============================================================

describe("localStorage 키 생성 (storageKey)", () => {
  it("올바른 형식의 키를 생성한다", () => {
    expect(storageKey("group-1", "user-1")).toBe("practice-plan-group-1-user-1");
  });

  it("groupId와 userId를 포함한다", () => {
    const key = storageKey("abc", "xyz");
    expect(key).toContain("abc");
    expect(key).toContain("xyz");
  });

  it("prefix가 'practice-plan-'이다", () => {
    const key = storageKey("g1", "u1");
    expect(key.startsWith("practice-plan-")).toBe(true);
  });

  it("다른 groupId + userId 조합이면 다른 키가 된다", () => {
    const key1 = storageKey("group-1", "user-1");
    const key2 = storageKey("group-2", "user-1");
    const key3 = storageKey("group-1", "user-2");
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });
});

// ============================================================
// loadMemberGoals (localStorage) 테스트
// ============================================================

describe("목표 로드 (loadMemberGoals)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("저장된 데이터가 없으면 빈 배열을 반환한다", () => {
    const goals = loadMemberGoals("group-1", "user-1");
    expect(goals).toEqual([]);
  });

  it("저장된 목표 목록을 올바르게 파싱한다", () => {
    const mockGoals: MemberGoal[] = [
      { id: "g1", groupId: "group-1", userId: "user-1", goalType: "attendance", targetValue: 4, yearMonth: "2026-03" },
    ];
    localStorage.setItem("member-goals-group-1-user-1", JSON.stringify(mockGoals));
    const goals = loadMemberGoals("group-1", "user-1");
    expect(goals).toHaveLength(1);
    expect(goals[0].id).toBe("g1");
  });

  it("JSON 파싱 오류 시 빈 배열을 반환한다", () => {
    localStorage.setItem("member-goals-group-1-user-1", "invalid-json{{{");
    const goals = loadMemberGoals("group-1", "user-1");
    expect(goals).toEqual([]);
  });

  it("다른 groupId + userId 조합의 데이터는 불러오지 않는다", () => {
    const mockGoals: MemberGoal[] = [
      { id: "g1", groupId: "group-2", userId: "user-2", goalType: "posts", targetValue: 5, yearMonth: "2026-03" },
    ];
    localStorage.setItem("member-goals-group-2-user-2", JSON.stringify(mockGoals));
    const goals = loadMemberGoals("group-1", "user-1");
    expect(goals).toEqual([]);
  });

  it("여러 목표를 모두 불러온다", () => {
    const mockGoals: MemberGoal[] = [
      { id: "g1", groupId: "group-1", userId: "user-1", goalType: "attendance", targetValue: 4, yearMonth: "2026-03" },
      { id: "g2", groupId: "group-1", userId: "user-1", goalType: "posts", targetValue: 3, yearMonth: "2026-03" },
    ];
    localStorage.setItem("member-goals-group-1-user-1", JSON.stringify(mockGoals));
    const goals = loadMemberGoals("group-1", "user-1");
    expect(goals).toHaveLength(2);
  });
});

// ============================================================
// filterWeakSkills 테스트
// ============================================================

describe("약점 스킬 필터링 (skill_level <= 2)", () => {
  const skills: MemberSkill[] = [
    { id: "s1", groupId: "g1", userId: "u1", skill_name: "팝핀", skill_level: 1, created_at: "", updated_at: "" },
    { id: "s2", groupId: "g1", userId: "u1", skill_name: "락킹", skill_level: 2, created_at: "", updated_at: "" },
    { id: "s3", groupId: "g1", userId: "u1", skill_name: "비보잉", skill_level: 3, created_at: "", updated_at: "" },
    { id: "s4", groupId: "g1", userId: "u1", skill_name: "하우스", skill_level: 4, created_at: "", updated_at: "" },
    { id: "s5", groupId: "g1", userId: "u1", skill_name: "웨이브", skill_level: 5, created_at: "", updated_at: "" },
  ];

  it("레벨 1, 2인 스킬만 반환한다", () => {
    const weak = filterWeakSkills(skills);
    expect(weak).toHaveLength(2);
    expect(weak.map((s) => s.skill_name)).toContain("팝핀");
    expect(weak.map((s) => s.skill_name)).toContain("락킹");
  });

  it("레벨 3 이상은 포함하지 않는다", () => {
    const weak = filterWeakSkills(skills);
    expect(weak.map((s) => s.skill_name)).not.toContain("비보잉");
    expect(weak.map((s) => s.skill_name)).not.toContain("하우스");
    expect(weak.map((s) => s.skill_name)).not.toContain("웨이브");
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(filterWeakSkills([])).toEqual([]);
  });

  it("모두 레벨 4 이상이면 빈 배열을 반환한다", () => {
    const highSkills = skills.filter((s) => s.skill_level >= 4);
    expect(filterWeakSkills(highSkills)).toHaveLength(0);
  });

  it("모두 레벨 1이면 전부 반환한다", () => {
    const level1Skills = skills.map((s) => ({ ...s, skill_level: 1 }));
    expect(filterWeakSkills(level1Skills)).toHaveLength(5);
  });
});

// ============================================================
// buildFocusAreas 테스트
// ============================================================

describe("집중 과제 자동 생성 (buildFocusAreas)", () => {
  const makeSkill = (name: string, level: number): MemberSkill => ({
    id: `s-${name}`,
    groupId: "g1",
    userId: "u1",
    skill_name: name,
    skill_level: level,
    created_at: "",
    updated_at: "",
  });

  const makeGoal = (type: MemberGoal["goalType"]): MemberGoal => ({
    id: `goal-${type}`,
    groupId: "g1",
    userId: "u1",
    goalType: type,
    targetValue: 5,
    yearMonth: "2026-03",
  });

  it("출석률 70% 미만이면 '출석률 향상 필요'가 포함된다", () => {
    const areas = buildFocusAreas(60, [], []);
    expect(areas).toContain("출석률 향상 필요");
  });

  it("출석률 70% 이상이면 '출석률 향상 필요'가 포함되지 않는다", () => {
    const areas = buildFocusAreas(70, [], []);
    expect(areas).not.toContain("출석률 향상 필요");
  });

  it("약점 스킬이 있으면 '집중 연습' 항목이 포함된다", () => {
    const weakSkills = [makeSkill("팝핀", 1)];
    const areas = buildFocusAreas(80, weakSkills, []);
    expect(areas).toContain("팝핀 집중 연습");
  });

  it("약점 스킬은 최대 2개까지만 집중 과제에 포함된다", () => {
    const weakSkills = [
      makeSkill("팝핀", 1),
      makeSkill("락킹", 2),
      makeSkill("비보잉", 1),
    ];
    const areas = buildFocusAreas(80, weakSkills, []);
    const skillAreas = areas.filter((a) => a.includes("집중 연습"));
    expect(skillAreas.length).toBeLessThanOrEqual(2);
  });

  it("미달 목표가 있으면 '목표 달성을 위한 추가 연습'이 포함될 수 있다", () => {
    const unachievedGoals = [makeGoal("attendance")];
    const areas = buildFocusAreas(80, [], unachievedGoals);
    expect(areas).toContain("목표 달성을 위한 추가 연습");
  });

  it("집중 과제는 최대 3개이다", () => {
    const weakSkills = [makeSkill("팝핀", 1), makeSkill("락킹", 2)];
    const unachievedGoals = [makeGoal("attendance")];
    const areas = buildFocusAreas(60, weakSkills, unachievedGoals);
    expect(areas.length).toBeLessThanOrEqual(3);
  });

  it("모든 조건 없으면 빈 배열이다", () => {
    const areas = buildFocusAreas(80, [], []);
    expect(areas).toHaveLength(0);
  });

  it("출석률 저하 + 약점 스킬 2개이면 딱 3개이다", () => {
    const weakSkills = [makeSkill("팝핀", 1), makeSkill("락킹", 2)];
    const areas = buildFocusAreas(60, weakSkills, []);
    expect(areas).toHaveLength(3);
    expect(areas[0]).toBe("출석률 향상 필요");
    expect(areas[1]).toBe("팝핀 집중 연습");
    expect(areas[2]).toBe("락킹 집중 연습");
  });

  it("출석률 69%는 70% 미만이므로 출석률 향상 포함된다", () => {
    const areas = buildFocusAreas(69, [], []);
    expect(areas).toContain("출석률 향상 필요");
  });

  it("출석률 71%는 출석률 향상 포함되지 않는다", () => {
    const areas = buildFocusAreas(71, [], []);
    expect(areas).not.toContain("출석률 향상 필요");
  });
});

// ============================================================
// buildPlanContent 테스트
// ============================================================

describe("플랜 내용 자동 생성 (buildPlanContent)", () => {
  const makeSkill = (name: string, level: number): MemberSkill => ({
    id: `s-${name}`,
    groupId: "g1",
    userId: "u1",
    skill_name: name,
    skill_level: level,
    created_at: "",
    updated_at: "",
  });

  const makeGoal = (type: MemberGoal["goalType"], value: number): MemberGoal => ({
    id: `goal-${type}`,
    groupId: "g1",
    userId: "u1",
    goalType: type,
    targetValue: value,
    yearMonth: "2026-03",
  });

  it("멤버 이름이 플랜 제목에 포함된다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).toContain("[홍길동 맞춤 연습 플랜]");
  });

  it("출석 기록이 없으면 '출석 기록 없음'이 포함된다", () => {
    const content = buildPlanContent("홍길동", 0, 0, [], [], []);
    expect(content).toContain("출석 기록 없음");
  });

  it("출석률이 있으면 퍼센트와 일정 수가 표시된다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).toContain("80%");
    expect(content).toContain("10회 중 참석");
  });

  it("출석률 70% 미만이면 정기 연습 참여 권장 메시지가 포함된다", () => {
    const content = buildPlanContent("홍길동", 60, 10, [], [], []);
    expect(content).toContain("주 1회 이상 정기 연습 참여 필요");
  });

  it("출석률 70~89%이면 현재 수준 유지 권장 메시지가 포함된다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).toContain("현재 수준 유지 및 추가 개인 연습 병행");
  });

  it("출석률 90% 이상이면 우수한 출석률 메시지가 포함된다", () => {
    const content = buildPlanContent("홍길동", 95, 10, [], [], []);
    expect(content).toContain("우수한 출석률을 유지하고 있습니다");
  });

  it("약점 스킬이 있으면 '보완이 필요한 스킬' 섹션이 포함된다", () => {
    const weakSkills = [makeSkill("팝핀", 1)];
    const content = buildPlanContent("홍길동", 80, 10, weakSkills, [], []);
    expect(content).toContain("# 보완이 필요한 스킬");
    expect(content).toContain("팝핀");
  });

  it("레벨 1 스킬은 '입문'으로 표시된다", () => {
    const weakSkills = [makeSkill("팝핀", 1)];
    const content = buildPlanContent("홍길동", 80, 10, weakSkills, [], []);
    expect(content).toContain("입문");
  });

  it("레벨 2 스킬은 '초급'으로 표시된다", () => {
    const weakSkills = [makeSkill("락킹", 2)];
    const content = buildPlanContent("홍길동", 80, 10, weakSkills, [], []);
    expect(content).toContain("초급");
  });

  it("약점 스킬이 없으면 '보완이 필요한 스킬' 섹션이 없다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).not.toContain("# 보완이 필요한 스킬");
  });

  it("미달 목표가 있으면 '이번 달 목표 진행 상황' 섹션이 포함된다", () => {
    const unachievedGoals = [makeGoal("attendance", 4)];
    const content = buildPlanContent("홍길동", 80, 10, [], unachievedGoals, []);
    expect(content).toContain("# 이번 달 목표 진행 상황");
  });

  it("출석 목표 미달성은 '출석 N회 미달성' 형식으로 표시된다", () => {
    const unachievedGoals = [makeGoal("attendance", 4)];
    const content = buildPlanContent("홍길동", 80, 10, [], unachievedGoals, []);
    expect(content).toContain("출석 4회");
    expect(content).toContain("미달성");
  });

  it("게시글 목표 미달성은 '게시글 N개 미달성' 형식으로 표시된다", () => {
    const unachievedGoals = [makeGoal("posts", 3)];
    const content = buildPlanContent("홍길동", 80, 10, [], unachievedGoals, []);
    expect(content).toContain("게시글 3개");
  });

  it("회비 납부 목표 미달성은 '회비 납부 N건 미달성' 형식으로 표시된다", () => {
    const unachievedGoals = [makeGoal("payment", 1)];
    const content = buildPlanContent("홍길동", 80, 10, [], unachievedGoals, []);
    expect(content).toContain("회비 납부 1건");
  });

  it("집중 과제가 있으면 번호가 붙어 표시된다", () => {
    const focusAreas = ["출석률 향상 필요", "팝핀 집중 연습"];
    const content = buildPlanContent("홍길동", 60, 10, [], [], focusAreas);
    expect(content).toContain("1. 출석률 향상 필요");
    expect(content).toContain("2. 팝핀 집중 연습");
  });

  it("집중 과제가 없으면 '# 집중 과제' 섹션이 없다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).not.toContain("# 집중 과제");
  });

  it("전체 플랜 내용에 '출석 현황' 섹션이 항상 포함된다", () => {
    const content = buildPlanContent("홍길동", 80, 10, [], [], []);
    expect(content).toContain("# 출석 현황 (최근 3개월)");
  });
});

// ============================================================
// getCurrentYearMonth / getNextMonthFirst 테스트
// ============================================================

describe("달 계산 유틸", () => {
  it("getCurrentYearMonth: 3월이면 '2026-03'이다", () => {
    const now = new Date("2026-03-15");
    expect(getCurrentYearMonth(now)).toBe("2026-03");
  });

  it("getCurrentYearMonth: 1월이면 '2026-01'이다", () => {
    const now = new Date("2026-01-01");
    expect(getCurrentYearMonth(now)).toBe("2026-01");
  });

  it("getCurrentYearMonth: 12월이면 '2025-12'이다", () => {
    const now = new Date("2025-12-31");
    expect(getCurrentYearMonth(now)).toBe("2025-12");
  });

  it("getNextMonthFirst: 3월이면 다음 달은 '2026-04-01'이다", () => {
    expect(getNextMonthFirst("2026-03")).toBe("2026-04-01");
  });

  it("getNextMonthFirst: 12월이면 다음 달은 '2027-01-01'이다 (연도 경계)", () => {
    expect(getNextMonthFirst("2026-12")).toBe("2027-01-01");
  });

  it("getNextMonthFirst: 1월이면 다음 달은 '2026-02-01'이다", () => {
    expect(getNextMonthFirst("2026-01")).toBe("2026-02-01");
  });

  it("getNextMonthFirst: 11월이면 다음 달은 '2026-12-01'이다", () => {
    expect(getNextMonthFirst("2026-11")).toBe("2026-12-01");
  });
});

// ============================================================
// 출석률 계산 테스트
// ============================================================

describe("출석률 계산 (calcAttendanceRate)", () => {
  it("일정이 없으면 0%이다", () => {
    expect(calcAttendanceRate(0, 0)).toBe(0);
  });

  it("전부 출석이면 100%이다", () => {
    expect(calcAttendanceRate(10, 10)).toBe(100);
  });

  it("출석이 없으면 0%이다", () => {
    expect(calcAttendanceRate(0, 10)).toBe(0);
  });

  it("50% 출석이면 50%이다", () => {
    expect(calcAttendanceRate(5, 10)).toBe(50);
  });

  it("2/3 출석이면 67%이다 (반올림)", () => {
    expect(calcAttendanceRate(2, 3)).toBe(67);
  });

  it("1/3 출석이면 33%이다 (반올림)", () => {
    expect(calcAttendanceRate(1, 3)).toBe(33);
  });
});

// ============================================================
// 통합 시나리오 테스트
// ============================================================

describe("통합 시나리오 - 연습 계획 생성", () => {
  const makeSkill = (name: string, level: number): MemberSkill => ({
    id: `s-${name}`,
    groupId: "g1",
    userId: "u1",
    skill_name: name,
    skill_level: level,
    created_at: "",
    updated_at: "",
  });

  const makeGoal = (type: MemberGoal["goalType"], value: number): MemberGoal => ({
    id: `goal-${type}`,
    groupId: "g1",
    userId: "u1",
    goalType: type,
    targetValue: value,
    yearMonth: "2026-03",
  });

  it("출석률 60% + 약점 스킬 2개 → 집중 과제 최대 3개", () => {
    const weakSkills = [makeSkill("팝핀", 1), makeSkill("락킹", 2)];
    const focusAreas = buildFocusAreas(60, weakSkills, []);
    expect(focusAreas.length).toBeLessThanOrEqual(3);
    expect(focusAreas).toContain("출석률 향상 필요");
  });

  it("플랜 내용에 멤버 이름과 출석률이 함께 포함된다", () => {
    const content = buildPlanContent("김댄서", 75, 8, [], [], ["팝핀 집중 연습"]);
    expect(content).toContain("김댄서");
    expect(content).toContain("75%");
    expect(content).toContain("8회 중 참석");
  });

  it("모든 정보가 완비된 플랜이 올바르게 생성된다", () => {
    const weakSkills = [makeSkill("팝핀", 1)];
    const unachievedGoals = [makeGoal("attendance", 4)];
    const focusAreas = buildFocusAreas(65, weakSkills, unachievedGoals);
    const content = buildPlanContent("이댄서", 65, 12, weakSkills, unachievedGoals, focusAreas);

    expect(content).toContain("[이댄서 맞춤 연습 플랜]");
    expect(content).toContain("# 출석 현황");
    expect(content).toContain("# 보완이 필요한 스킬");
    expect(content).toContain("# 이번 달 목표 진행 상황");
    expect(content).toContain("# 집중 과제");
  });

  it("localStorage 키가 그룹과 사용자를 유일하게 식별한다", () => {
    const key1 = storageKey("group-A", "user-1");
    const key2 = storageKey("group-B", "user-1");
    expect(key1).not.toBe(key2);
  });

  it("출석률 90%인 우수 멤버는 집중 과제가 없을 수 있다", () => {
    const focusAreas = buildFocusAreas(90, [], []);
    expect(focusAreas).toHaveLength(0);
  });
});
