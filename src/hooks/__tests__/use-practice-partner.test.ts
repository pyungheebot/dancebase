import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  usePracticePartner,
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_COLORS,
} from "@/hooks/use-practice-partner";
import type { PracticePartnerSkillLevel } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => usePracticePartner(groupId));
}

function addMemberHelper(
  hook: ReturnType<typeof makeHook>["result"],
  name = "홍길동",
  skillLevel: PracticePartnerSkillLevel = "intermediate",
  availableTimes: string[] = ["월요일", "수요일"],
  preferredPartnerIds: string[] = []
) {
  act(() => {
    hook.current.addMember(name, skillLevel, availableTimes, preferredPartnerIds);
  });
}

// ============================================================
// SKILL_LEVEL_LABELS 상수
// ============================================================

describe("SKILL_LEVEL_LABELS 상수", () => {
  it("beginner 레이블은 '초급'이다", () => {
    expect(SKILL_LEVEL_LABELS.beginner).toBe("초급");
  });

  it("intermediate 레이블은 '중급'이다", () => {
    expect(SKILL_LEVEL_LABELS.intermediate).toBe("중급");
  });

  it("advanced 레이블은 '고급'이다", () => {
    expect(SKILL_LEVEL_LABELS.advanced).toBe("고급");
  });

  it("expert 레이블은 '전문가'이다", () => {
    expect(SKILL_LEVEL_LABELS.expert).toBe("전문가");
  });
});

// ============================================================
// SKILL_LEVEL_COLORS 상수
// ============================================================

describe("SKILL_LEVEL_COLORS 상수", () => {
  it("beginner는 green 계열 색상이다", () => {
    expect(SKILL_LEVEL_COLORS.beginner).toContain("green");
  });

  it("intermediate는 blue 계열 색상이다", () => {
    expect(SKILL_LEVEL_COLORS.intermediate).toContain("blue");
  });

  it("advanced는 purple 계열 색상이다", () => {
    expect(SKILL_LEVEL_COLORS.advanced).toContain("purple");
  });

  it("expert는 rose 계열 색상이다", () => {
    expect(SKILL_LEVEL_COLORS.expert).toContain("rose");
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("usePracticePartner - 초기 상태", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("초기 members는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.members).toEqual([]);
  });

  it("초기 matches는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.matches).toEqual([]);
  });

  it("초기 activeMatches는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.activeMatches).toEqual([]);
  });

  it("초기 endedMatches는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.endedMatches).toEqual([]);
  });

  it("초기 unmatchedMembers는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.unmatchedMembers).toEqual([]);
  });

  it("초기 matchedMembers는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.matchedMembers).toEqual([]);
  });

  it("entry.groupId가 올바르게 설정된다", () => {
    const { result } = makeHook("group-42");
    expect(result.current.entry.groupId).toBe("group-42");
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.removeMember).toBe("function");
    expect(typeof result.current.updateMember).toBe("function");
    expect(typeof result.current.createMatch).toBe("function");
    expect(typeof result.current.endMatch).toBe("function");
    expect(typeof result.current.randomMatch).toBe("function");
    expect(typeof result.current.ratePartner).toBe("function");
  });
});

// ============================================================
// addMember
// ============================================================

describe("usePracticePartner - addMember", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("멤버 추가 후 members 길이가 1이 된다", () => {
    const { result } = makeHook();
    addMemberHelper(result);
    expect(result.current.members).toHaveLength(1);
  });

  it("추가된 멤버의 name이 올바르다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "김철수");
    expect(result.current.members[0].name).toBe("김철수");
  });

  it("이름 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "  이영희  ");
    expect(result.current.members[0].name).toBe("이영희");
  });

  it("빈 이름으로 추가하면 멤버가 추가되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "");
    expect(result.current.members).toHaveLength(0);
  });

  it("공백만 있는 이름으로 추가하면 멤버가 추가되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "   ");
    expect(result.current.members).toHaveLength(0);
  });

  it("추가된 멤버의 skillLevel이 올바르다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동", "advanced");
    expect(result.current.members[0].skillLevel).toBe("advanced");
  });

  it("추가된 멤버의 availableTimes가 올바르다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동", "intermediate", ["화요일", "목요일"]);
    expect(result.current.members[0].availableTimes).toEqual(["화요일", "목요일"]);
  });

  it("추가된 멤버에 id가 부여된다", () => {
    const { result } = makeHook();
    addMemberHelper(result);
    expect(result.current.members[0].id).toBeTruthy();
  });

  it("추가된 멤버에 joinedAt이 ISO 형식으로 설정된다", () => {
    const { result } = makeHook();
    addMemberHelper(result);
    expect(result.current.members[0].joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("추가된 멤버는 초기에 currentMatchId가 없다", () => {
    const { result } = makeHook();
    addMemberHelper(result);
    expect(result.current.members[0].currentMatchId).toBeUndefined();
  });

  it("여러 멤버를 추가할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    expect(result.current.members).toHaveLength(3);
  });

  it("추가된 멤버는 unmatchedMembers에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    expect(result.current.unmatchedMembers).toHaveLength(1);
  });
});

// ============================================================
// removeMember
// ============================================================

describe("usePracticePartner - removeMember", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("멤버 삭제 후 members 길이가 감소한다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.removeMember(memberId);
    });
    expect(result.current.members).toHaveLength(0);
  });

  it("특정 멤버만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    act(() => {
      result.current.removeMember(memberAId);
    });
    expect(result.current.members).toHaveLength(1);
    expect(result.current.members[0].name).toBe("멤버B");
  });

  it("활성 매칭 중인 멤버 삭제 시 해당 매칭이 종료된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    act(() => {
      result.current.removeMember(memberAId);
    });
    expect(result.current.activeMatches).toHaveLength(0);
  });

  it("매칭이 종료되면 endedMatches에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    act(() => {
      result.current.removeMember(memberAId);
    });
    expect(result.current.endedMatches).toHaveLength(1);
  });

  it("존재하지 않는 id 삭제 시 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.removeMember("non-existent-id");
      });
    }).not.toThrow();
  });
});

// ============================================================
// updateMember
// ============================================================

describe("usePracticePartner - updateMember", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("멤버 이름을 수정할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "원래 이름");
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.updateMember(memberId, { name: "수정된 이름" });
    });
    expect(result.current.members[0].name).toBe("수정된 이름");
  });

  it("멤버 스킬레벨을 수정할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동", "beginner");
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.updateMember(memberId, { skillLevel: "advanced" });
    });
    expect(result.current.members[0].skillLevel).toBe("advanced");
  });

  it("멤버 가능 시간을 수정할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동", "intermediate", ["월요일"]);
    const memberId = result.current.members[0].id;
    act(() => {
      result.current.updateMember(memberId, { availableTimes: ["화요일", "금요일"] });
    });
    expect(result.current.members[0].availableTimes).toEqual(["화요일", "금요일"]);
  });

  it("존재하지 않는 id로 수정해도 에러가 없다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateMember("non-existent", { name: "새 이름" });
      });
    }).not.toThrow();
  });
});

// ============================================================
// createMatch
// ============================================================

describe("usePracticePartner - createMatch", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("두 멤버 간 매칭 생성 후 activeMatches 길이가 1이 된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    expect(result.current.activeMatches).toHaveLength(1);
  });

  it("매칭된 멤버는 matchedMembers에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    expect(result.current.matchedMembers).toHaveLength(2);
  });

  it("매칭된 멤버는 unmatchedMembers에서 제외된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    expect(result.current.unmatchedMembers).toHaveLength(0);
  });

  it("이미 매칭된 멤버는 다시 매칭되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    const memberCId = result.current.members[2].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    // 이미 매칭된 A와 C 매칭 시도
    act(() => {
      result.current.createMatch(memberAId, memberCId);
    });
    expect(result.current.activeMatches).toHaveLength(1);
  });

  it("존재하지 않는 멤버와 매칭 시 matches가 변경되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    const memberAId = result.current.members[0].id;
    act(() => {
      result.current.createMatch(memberAId, "non-existent");
    });
    expect(result.current.activeMatches).toHaveLength(0);
  });

  it("생성된 매칭에 memberAName과 memberBName이 설정된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    addMemberHelper(result, "김철수");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const match = result.current.activeMatches[0];
    expect(match.memberAName).toBe("홍길동");
    expect(match.memberBName).toBe("김철수");
  });

  it("생성된 매칭의 status는 'active'이다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    expect(result.current.activeMatches[0].status).toBe("active");
  });
});

// ============================================================
// endMatch
// ============================================================

describe("usePracticePartner - endMatch", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("매칭 종료 후 activeMatches에서 제거된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(result.current.activeMatches).toHaveLength(0);
  });

  it("매칭 종료 후 endedMatches에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(result.current.endedMatches).toHaveLength(1);
  });

  it("매칭 종료 후 멤버의 currentMatchId가 제거된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    const memberA = result.current.members.find((m) => m.id === memberAId);
    expect(memberA?.currentMatchId).toBeUndefined();
  });

  it("매칭 종료 후 멤버는 unmatchedMembers에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(result.current.unmatchedMembers).toHaveLength(2);
  });

  it("이미 종료된 매칭을 다시 종료해도 에러가 없다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(() => {
      act(() => {
        result.current.endMatch(matchId);
      });
    }).not.toThrow();
  });

  it("매칭 종료 시 endedAt이 설정된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(result.current.endedMatches[0].endedAt).toBeDefined();
  });
});

// ============================================================
// randomMatch
// ============================================================

describe("usePracticePartner - randomMatch", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("4명 멤버 랜덤 매칭 시 2개의 매칭이 생성된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    addMemberHelper(result, "멤버D");
    act(() => {
      result.current.randomMatch();
    });
    expect(result.current.activeMatches).toHaveLength(2);
  });

  it("멤버가 1명 이하면 매칭이 생성되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    act(() => {
      result.current.randomMatch();
    });
    expect(result.current.activeMatches).toHaveLength(0);
  });

  it("멤버가 없으면 매칭이 생성되지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.randomMatch();
    });
    expect(result.current.activeMatches).toHaveLength(0);
  });

  it("이미 매칭된 멤버는 랜덤 매칭 대상에서 제외된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    // 매칭 안 된 멤버C만 있으므로 1명 → 매칭 불가
    act(() => {
      result.current.randomMatch();
    });
    // 기존 1개 + 새로 생성된 0개 = 1개
    expect(result.current.activeMatches).toHaveLength(1);
  });

  it("3명 멤버 랜덤 매칭 시 1개의 매칭이 생성된다 (홀수는 1명 제외)", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    act(() => {
      result.current.randomMatch();
    });
    // 3명 중 2명 매칭, 1명 남음
    expect(result.current.activeMatches).toHaveLength(1);
  });
});

// ============================================================
// ratePartner
// ============================================================

describe("usePracticePartner - ratePartner", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("A→B 평가를 등록할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    addMemberHelper(result, "김철수");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.ratePartner(matchId, memberAId, 5, "최고의 파트너");
    });
    expect(result.current.matches[0].ratingAtoB).toBe(5);
  });

  it("B→A 평가를 등록할 수 있다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    addMemberHelper(result, "김철수");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.ratePartner(matchId, memberBId, 4, "좋은 파트너");
    });
    expect(result.current.matches[0].ratingBtoA).toBe(4);
  });

  it("A→B 평가 노트가 저장된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    addMemberHelper(result, "김철수");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.ratePartner(matchId, memberAId, 3, "좋았습니다");
    });
    expect(result.current.matches[0].noteAtoB).toBe("좋았습니다");
  });

  it("관련 없는 멤버 id로 평가 시 rating이 저장되지 않는다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    addMemberHelper(result, "김철수");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.ratePartner(matchId, "non-existent-rater", 5);
    });
    // ratingAtoB와 ratingBtoA 모두 undefined
    expect(result.current.matches[0].ratingAtoB).toBeUndefined();
    expect(result.current.matches[0].ratingBtoA).toBeUndefined();
  });

  it("존재하지 않는 matchId로 평가해도 에러가 없다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "홍길동");
    const memberAId = result.current.members[0].id;
    expect(() => {
      act(() => {
        result.current.ratePartner("non-existent-match", memberAId, 5);
      });
    }).not.toThrow();
  });
});

// ============================================================
// 파생 데이터
// ============================================================

describe("usePracticePartner - 파생 데이터", () => {
  beforeEach(() => {
    Object.keys(memStore).forEach((k) => delete memStore[k]);
    _uuidCounter = 0;
  });

  it("매칭 전 모든 멤버는 unmatchedMembers에 포함된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    expect(result.current.unmatchedMembers).toHaveLength(2);
    expect(result.current.matchedMembers).toHaveLength(0);
  });

  it("activeMatches와 endedMatches는 status 기준으로 올바르게 분리된다", () => {
    const { result } = makeHook();
    addMemberHelper(result, "멤버A");
    addMemberHelper(result, "멤버B");
    addMemberHelper(result, "멤버C");
    addMemberHelper(result, "멤버D");
    const memberAId = result.current.members[0].id;
    const memberBId = result.current.members[1].id;
    const memberCId = result.current.members[2].id;
    const memberDId = result.current.members[3].id;
    act(() => {
      result.current.createMatch(memberAId, memberBId);
      result.current.createMatch(memberCId, memberDId);
    });
    const matchId = result.current.activeMatches[0].id;
    act(() => {
      result.current.endMatch(matchId);
    });
    expect(result.current.activeMatches).toHaveLength(1);
    expect(result.current.endedMatches).toHaveLength(1);
  });
});
