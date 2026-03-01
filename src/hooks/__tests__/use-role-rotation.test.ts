import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback, useRef } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

// useRoleRotation은 localStorage를 직접 사용하므로 globalThis.localStorage 모킹
const lsStore: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => lsStore[k] ?? null,
    setItem: (k: string, v: string) => { lsStore[k] = v; },
    removeItem: (k: string) => { delete lsStore[k]; },
    clear: () => { Object.keys(lsStore).forEach((k) => delete lsStore[k]); },
  },
  writable: true,
  configurable: true,
});

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef: _useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const fetchResult = fetcher();
      const [data, setData] = reactUseState<unknown>(() => fetchResult);
      const setDataRef = _useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown, _revalidate?: boolean) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          setDataRef.current(fetcher!());
        }
        return Promise.resolve();
      }, []);

      return { data, isLoading: false, mutate };
    },
  };
});

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    roleRotation: (groupId: string) => `role-rotation-${groupId}`,
  },
}));

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => `uuid-${++_uuidCounter}` },
  writable: true,
  configurable: true,
});

import { useRoleRotation } from "@/hooks/use-role-rotation";

function makeHook(groupId = "group-1") {
  return renderHook(() => useRoleRotation(groupId));
}

function clearAll() {
  Object.keys(lsStore).forEach((k) => delete lsStore[k]);
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  _uuidCounter = 0;
}

// ============================================================
// 초기 상태
// ============================================================

describe("useRoleRotation - 초기 상태", () => {
  beforeEach(clearAll);

  it("초기 config.roles는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.config.roles).toEqual([]);
  });

  it("초기 config.members는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.config.members).toEqual([]);
  });

  it("초기 config.assignments는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.config.assignments).toEqual([]);
  });

  it("초기 config.rotationWeeks는 1이다", () => {
    const { result } = makeHook();
    expect(result.current.config.rotationWeeks).toBe(1);
  });

  it("초기 totalRoles는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalRoles).toBe(0);
  });

  it("초기 totalMembers는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalMembers).toBe(0);
  });

  it("초기 currentCompletionRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.currentCompletionRate).toBe(0);
  });

  it("currentWeek는 YYYY-MM-DD 형식이다", () => {
    const { result } = makeHook();
    expect(result.current.currentWeek).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addRole).toBe("function");
    expect(typeof result.current.removeRole).toBe("function");
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.removeMember).toBe("function");
    expect(typeof result.current.setRotationWeeks).toBe("function");
    expect(typeof result.current.generateSchedule).toBe("function");
    expect(typeof result.current.toggleCompleted).toBe("function");
    expect(typeof result.current.getCurrentAssignments).toBe("function");
    expect(typeof result.current.getAssignmentHistory).toBe("function");
    expect(typeof result.current.getRoleById).toBe("function");
    expect(typeof result.current.getUniqueWeeks).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// addRole
// ============================================================

describe("useRoleRotation - addRole", () => {
  beforeEach(clearAll);

  it("역할 추가 후 config.roles에 항목이 생긴다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", "팀 리더"); });
    expect(result.current.config.roles).toHaveLength(1);
  });

  it("추가된 역할의 name이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", "팀 리더"); });
    expect(result.current.config.roles[0].name).toBe("리더");
  });

  it("빈 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addRole("", "🎭", "설명"); });
    expect(ok).toBe(false);
    expect(result.current.config.roles).toHaveLength(0);
  });

  it("공백만 있는 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addRole("   ", "🎭", "설명"); });
    expect(ok).toBe(false);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => { ok = result.current.addRole("리더", "🎭", "설명"); });
    expect(ok).toBe(true);
  });

  it("아이콘이 비어 있으면 기본값 '🎭'가 적용된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("역할", "", "설명"); });
    expect(result.current.config.roles[0].icon).toBe("🎭");
  });

  it("이름 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("  리더  ", "🎭", "설명"); });
    expect(result.current.config.roles[0].name).toBe("리더");
  });

  it("추가된 역할에 id가 부여된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("역할", "🎭", ""); });
    expect(result.current.config.roles[0].id).toBeTruthy();
  });

  it("추가된 역할에 description이 올바르다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("역할", "🎭", "역할 설명"); });
    expect(result.current.config.roles[0].description).toBe("역할 설명");
  });
});

// ============================================================
// removeRole
// ============================================================

describe("useRoleRotation - removeRole", () => {
  beforeEach(clearAll);

  it("역할 삭제 후 config.roles에서 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", ""); });
    const roleId = result.current.config.roles[0].id;
    act(() => { result.current.removeRole(roleId); });
    expect(result.current.config.roles).toHaveLength(0);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", ""); });
    const roleId = result.current.config.roles[0].id;
    let ok: boolean = false;
    act(() => { ok = result.current.removeRole(roleId); });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.removeRole("non-existent"); });
    expect(ok).toBe(false);
  });

  it("특정 역할만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addRole("역할B", "🎤", "");
    });
    const roleAId = result.current.config.roles[0].id;
    act(() => { result.current.removeRole(roleAId); });
    expect(result.current.config.roles).toHaveLength(1);
    expect(result.current.config.roles[0].name).toBe("역할B");
  });
});

// ============================================================
// addMember
// ============================================================

describe("useRoleRotation - addMember", () => {
  beforeEach(clearAll);

  it("멤버 추가 후 config.members에 항목이 생긴다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    expect(result.current.config.members).toHaveLength(1);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = false;
    act(() => { ok = result.current.addMember("홍길동"); });
    expect(ok).toBe(true);
  });

  it("빈 이름으로 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.addMember(""); });
    expect(ok).toBe(false);
  });

  it("이름 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("  홍길동  "); });
    expect(result.current.config.members[0]).toBe("홍길동");
  });

  it("중복 이름 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.addMember("홍길동"); });
    expect(ok).toBe(false);
    expect(result.current.config.members).toHaveLength(1);
  });

  it("여러 멤버를 추가할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
      result.current.addMember("멤버C");
    });
    expect(result.current.config.members).toHaveLength(3);
  });
});

// ============================================================
// removeMember
// ============================================================

describe("useRoleRotation - removeMember", () => {
  beforeEach(clearAll);

  it("멤버 삭제 후 config.members에서 제거된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    act(() => { result.current.removeMember("홍길동"); });
    expect(result.current.config.members).toHaveLength(0);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = false;
    act(() => { ok = result.current.removeMember("홍길동"); });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 멤버 삭제 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.removeMember("없는사람"); });
    expect(ok).toBe(false);
  });

  it("특정 멤버만 삭제되고 나머지는 유지된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
    });
    act(() => { result.current.removeMember("멤버A"); });
    expect(result.current.config.members).toHaveLength(1);
    expect(result.current.config.members[0]).toBe("멤버B");
  });
});

// ============================================================
// setRotationWeeks
// ============================================================

describe("useRoleRotation - setRotationWeeks", () => {
  beforeEach(clearAll);

  it("rotationWeeks를 4로 설정할 수 있다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(4); });
    expect(result.current.config.rotationWeeks).toBe(4);
  });

  it("0 이하의 값은 1로 클램핑된다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(0); });
    expect(result.current.config.rotationWeeks).toBe(1);
  });

  it("음수 값은 1로 클램핑된다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(-5); });
    expect(result.current.config.rotationWeeks).toBe(1);
  });

  it("52를 초과하는 값은 52로 클램핑된다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(100); });
    expect(result.current.config.rotationWeeks).toBe(52);
  });

  it("경계값 1은 그대로 유지된다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(1); });
    expect(result.current.config.rotationWeeks).toBe(1);
  });

  it("경계값 52는 그대로 유지된다", () => {
    const { result } = makeHook();
    act(() => { result.current.setRotationWeeks(52); });
    expect(result.current.config.rotationWeeks).toBe(52);
  });
});

// ============================================================
// generateSchedule
// ============================================================

describe("useRoleRotation - generateSchedule", () => {
  beforeEach(clearAll);

  it("역할이 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addMember("홍길동"); });
    let ok: boolean = true;
    act(() => { ok = result.current.generateSchedule(2); });
    expect(ok).toBe(false);
  });

  it("멤버가 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", ""); });
    let ok: boolean = true;
    act(() => { ok = result.current.generateSchedule(2); });
    expect(ok).toBe(false);
  });

  it("역할과 멤버가 있으면 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("리더", "🎭", "");
      result.current.addMember("홍길동");
    });
    let ok: boolean = false;
    act(() => { ok = result.current.generateSchedule(2); });
    expect(ok).toBe(true);
  });

  it("스케줄 생성 후 config.assignments가 비어있지 않다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(2); });
    expect(result.current.config.assignments.length).toBeGreaterThan(0);
  });

  it("각 배정에는 roleId, memberName, weekStart, completed 필드가 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    const a = result.current.config.assignments[0];
    expect(a).toHaveProperty("roleId");
    expect(a).toHaveProperty("memberName");
    expect(a).toHaveProperty("weekStart");
    expect(a).toHaveProperty("completed");
  });

  it("생성된 배정의 completed 초기값은 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    expect(result.current.config.assignments[0].completed).toBe(false);
  });

  it("0주 이하 요청 시 최소 1주 배정이 생성된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(0); });
    expect(result.current.config.assignments.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// toggleCompleted
// ============================================================

describe("useRoleRotation - toggleCompleted", () => {
  beforeEach(clearAll);

  it("completed 상태가 토글된다 (false → true)", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    const assignmentId = result.current.config.assignments[0].id;
    expect(result.current.config.assignments[0].completed).toBe(false);
    act(() => { result.current.toggleCompleted(assignmentId); });
    expect(result.current.config.assignments[0].completed).toBe(true);
  });

  it("두 번 토글하면 다시 false가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    const assignmentId = result.current.config.assignments[0].id;
    act(() => { result.current.toggleCompleted(assignmentId); });
    act(() => { result.current.toggleCompleted(assignmentId); });
    expect(result.current.config.assignments[0].completed).toBe(false);
  });

  it("존재하지 않는 id로 호출하면 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean = true;
    act(() => { ok = result.current.toggleCompleted("non-existent"); });
    expect(ok).toBe(false);
  });

  it("성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    const assignmentId = result.current.config.assignments[0].id;
    let ok: boolean = false;
    act(() => { ok = result.current.toggleCompleted(assignmentId); });
    expect(ok).toBe(true);
  });
});

// ============================================================
// getRoleById
// ============================================================

describe("useRoleRotation - getRoleById", () => {
  beforeEach(clearAll);

  it("존재하는 역할 id로 조회하면 역할 객체를 반환한다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", "팀 리더"); });
    const roleId = result.current.config.roles[0].id;
    const found = result.current.getRoleById(roleId);
    expect(found).toBeDefined();
    expect(found?.name).toBe("리더");
  });

  it("존재하지 않는 id 조회 시 undefined를 반환한다", () => {
    const { result } = makeHook();
    const found = result.current.getRoleById("non-existent");
    expect(found).toBeUndefined();
  });

  it("역할 아이콘이 올바르게 조회된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("DJ", "🎧", "음악 담당"); });
    const roleId = result.current.config.roles[0].id;
    const found = result.current.getRoleById(roleId);
    expect(found?.icon).toBe("🎧");
  });

  it("역할 description이 올바르게 조회된다", () => {
    const { result } = makeHook();
    act(() => { result.current.addRole("리더", "🎭", "팀을 이끈다"); });
    const roleId = result.current.config.roles[0].id;
    const found = result.current.getRoleById(roleId);
    expect(found?.description).toBe("팀을 이끈다");
  });
});

// ============================================================
// getUniqueWeeks
// ============================================================

describe("useRoleRotation - getUniqueWeeks", () => {
  beforeEach(clearAll);

  it("배정이 없으면 빈 배열을 반환한다", () => {
    const { result } = makeHook();
    const weeks = result.current.getUniqueWeeks();
    expect(weeks).toEqual([]);
  });
});

// ============================================================
// 통계 (totalRoles, totalMembers, currentCompletionRate)
// ============================================================

describe("useRoleRotation - 통계", () => {
  beforeEach(clearAll);

  it("totalRoles는 roles 배열 길이와 일치한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addRole("역할B", "🎤", "");
    });
    expect(result.current.totalRoles).toBe(result.current.config.roles.length);
  });

  it("totalMembers는 members 배열 길이와 일치한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("멤버A");
      result.current.addMember("멤버B");
    });
    expect(result.current.totalMembers).toBe(result.current.config.members.length);
  });

  it("완료된 배정이 없으면 currentCompletionRate는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addRole("역할A", "🎭", "");
      result.current.addMember("멤버A");
    });
    act(() => { result.current.generateSchedule(1); });
    expect(result.current.currentCompletionRate).toBe(0);
  });
});
