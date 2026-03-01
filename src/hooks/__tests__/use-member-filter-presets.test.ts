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

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${++uuidCounter}`,
});

import {
  useMemberFilterPresets,
  filterMembers,
  countActiveFilters,
  EMPTY_FILTER_CONDITION,
} from "@/hooks/use-member-filter-presets";
import type {
  MemberFilterCondition,
  MemberFilterPreset,
  GroupMemberWithProfile,
} from "@/types";

const GROUP_ID = "group-filter-test";
const STORAGE_KEY = `dancebase:member-filter-presets:${GROUP_ID}`;

const EMPTY_FILTERS: MemberFilterCondition = {
  role: [],
  joinedAfter: null,
  joinedBefore: null,
  minAttendanceRate: null,
  maxAttendanceRate: null,
  activityStatus: "all",
};

function makeMember(overrides: Partial<GroupMemberWithProfile> = {}): GroupMemberWithProfile {
  return {
    id: `member-${++uuidCounter}`,
    group_id: GROUP_ID,
    user_id: `user-${uuidCounter}`,
    role: "member",
    joined_at: "2026-01-01",
    profiles: { id: `user-${uuidCounter}`, display_name: "테스터", avatar_url: null, email: "" } as GroupMemberWithProfile["profiles"],
    ...overrides,
  };
}

beforeEach(() => {
  for (const k of Object.keys(memStore)) delete memStore[k];
  uuidCounter = 0;
});

// ─── 초기 상태 ────────────────────────────────────────────────
describe("useMemberFilterPresets - 초기 상태", () => {
  it("presets 배열이 반환된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    expect(Array.isArray(result.current.presets)).toBe(true);
  });

  it("defaultPresets에 기본 프리셋 3개가 포함된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    expect(result.current.defaultPresets).toHaveLength(3);
  });

  it("초기 userPresets는 빈 배열이다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    expect(result.current.userPresets).toHaveLength(0);
  });

  it("allPresets는 defaultPresets + userPresets의 합이다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const total = result.current.defaultPresets.length + result.current.userPresets.length;
    expect(result.current.presets).toHaveLength(total);
  });

  it("필수 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    expect(typeof result.current.savePreset).toBe("function");
    expect(typeof result.current.loadPreset).toBe("function");
    expect(typeof result.current.deletePreset).toBe("function");
    expect(typeof result.current.filterMembers).toBe("function");
    expect(typeof result.current.countActiveFilters).toBe("function");
  });

  it("EMPTY_FILTER_CONDITION이 반환된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    expect(result.current.EMPTY_FILTER_CONDITION).toBeDefined();
  });
});

// ─── 기본 프리셋 내용 검증 ────────────────────────────────────
describe("useMemberFilterPresets - 기본 프리셋 내용", () => {
  it("'신규 멤버' 기본 프리셋이 존재한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const preset = result.current.defaultPresets.find((p) =>
      p.name.includes("신규 멤버")
    );
    expect(preset).toBeDefined();
  });

  it("'비활성 멤버' 기본 프리셋이 존재한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const preset = result.current.defaultPresets.find((p) =>
      p.name.includes("비활성 멤버")
    );
    expect(preset).toBeDefined();
  });

  it("'리더 & 서브리더' 기본 프리셋이 존재한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const preset = result.current.defaultPresets.find((p) =>
      p.name.includes("리더")
    );
    expect(preset).toBeDefined();
  });

  it("기본 프리셋은 isDefault가 true이다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    result.current.defaultPresets.forEach((p) => {
      expect(p.isDefault).toBe(true);
    });
  });

  it("'비활성 멤버' 프리셋의 activityStatus는 inactive이다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const preset = result.current.defaultPresets.find((p) =>
      p.name.includes("비활성")
    );
    expect(preset?.filters.activityStatus).toBe("inactive");
  });

  it("'리더 & 서브리더' 프리셋의 role 필터에 leader와 sub_leader가 포함된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const preset = result.current.defaultPresets.find((p) =>
      p.name.includes("리더")
    );
    expect(preset?.filters.role).toContain("leader");
    expect(preset?.filters.role).toContain("sub_leader");
  });
});

// ─── savePreset ───────────────────────────────────────────────
describe("useMemberFilterPresets - savePreset", () => {
  it("savePreset 호출 시 MemberFilterPreset을 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let preset: MemberFilterPreset | undefined;
    act(() => {
      preset = result.current.savePreset("내 프리셋", EMPTY_FILTERS);
    });
    expect(preset).toBeDefined();
    expect(preset!.id).toBeDefined();
  });

  it("savePreset 후 userPresets 길이가 증가한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    act(() => {
      result.current.savePreset("프리셋A", EMPTY_FILTERS);
    });
    expect(result.current.userPresets).toHaveLength(1);
  });

  it("savePreset 반환값의 name이 올바르다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let preset: MemberFilterPreset | undefined;
    act(() => {
      preset = result.current.savePreset("리더만 보기", {
        ...EMPTY_FILTERS,
        role: ["leader"],
      });
    });
    expect(preset!.name).toBe("리더만 보기");
  });

  it("savePreset으로 저장한 프리셋은 isDefault가 false이다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let preset: MemberFilterPreset | undefined;
    act(() => {
      preset = result.current.savePreset("사용자 프리셋", EMPTY_FILTERS);
    });
    expect(preset!.isDefault).toBe(false);
  });

  it("savePreset 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    act(() => {
      result.current.savePreset("저장 테스트", EMPTY_FILTERS);
    });
    expect(memStore[STORAGE_KEY]).toBeDefined();
    const stored = memStore[STORAGE_KEY] as MemberFilterPreset[];
    expect(stored).toHaveLength(1);
  });

  it("여러 프리셋 저장 시 모두 누적된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    act(() => {
      result.current.savePreset("프리셋1", EMPTY_FILTERS);
      result.current.savePreset("프리셋2", EMPTY_FILTERS);
    });
    expect(result.current.userPresets).toHaveLength(2);
  });

  it("savePreset 후 allPresets도 증가한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const initialCount = result.current.presets.length;
    act(() => {
      result.current.savePreset("추가 프리셋", EMPTY_FILTERS);
    });
    expect(result.current.presets).toHaveLength(initialCount + 1);
  });
});

// ─── loadPreset ───────────────────────────────────────────────
describe("useMemberFilterPresets - loadPreset", () => {
  it("존재하는 id로 loadPreset 호출 시 MemberFilterCondition을 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let presetId: string;
    act(() => {
      const p = result.current.savePreset("로드 테스트", {
        ...EMPTY_FILTERS,
        role: ["leader"],
      });
      presetId = p.id;
    });
    const filters = result.current.loadPreset(presetId!);
    expect(filters).not.toBeNull();
    expect(filters!.role).toContain("leader");
  });

  it("존재하지 않는 id로 loadPreset 호출 시 null을 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const filters = result.current.loadPreset("no-such-id");
    expect(filters).toBeNull();
  });

  it("기본 프리셋 id로 loadPreset 호출 시 필터 조건을 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const defaultId = result.current.defaultPresets[0].id;
    const filters = result.current.loadPreset(defaultId);
    expect(filters).not.toBeNull();
  });
});

// ─── deletePreset ─────────────────────────────────────────────
describe("useMemberFilterPresets - deletePreset", () => {
  it("사용자 프리셋 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let presetId: string;
    act(() => {
      const p = result.current.savePreset("삭제할 프리셋", EMPTY_FILTERS);
      presetId = p.id;
    });
    let res: boolean | undefined;
    act(() => {
      res = result.current.deletePreset(presetId!);
    });
    expect(res).toBe(true);
  });

  it("기본 프리셋 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const defaultId = result.current.defaultPresets[0].id;
    let res: boolean | undefined;
    act(() => {
      res = result.current.deletePreset(defaultId);
    });
    expect(res).toBe(false);
  });

  it("기본 프리셋은 삭제 후에도 presets에 유지된다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    const defaultId = result.current.defaultPresets[0].id;
    const initialCount = result.current.presets.length;
    act(() => {
      result.current.deletePreset(defaultId);
    });
    expect(result.current.presets).toHaveLength(initialCount);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let res: boolean | undefined;
    act(() => {
      res = result.current.deletePreset("no-such-id");
    });
    expect(res).toBe(false);
  });

  it("사용자 프리셋 삭제 후 userPresets 길이가 감소한다", () => {
    const { result } = renderHook(() => useMemberFilterPresets(GROUP_ID));
    let presetId: string;
    act(() => {
      const p = result.current.savePreset("삭제용", EMPTY_FILTERS);
      presetId = p.id;
    });
    act(() => {
      result.current.deletePreset(presetId!);
    });
    expect(result.current.userPresets).toHaveLength(0);
  });
});

// ─── EMPTY_FILTER_CONDITION 상수 ─────────────────────────────
describe("EMPTY_FILTER_CONDITION 상수", () => {
  it("role은 빈 배열이다", () => {
    expect(EMPTY_FILTER_CONDITION.role).toHaveLength(0);
  });

  it("joinedAfter는 null이다", () => {
    expect(EMPTY_FILTER_CONDITION.joinedAfter).toBeNull();
  });

  it("joinedBefore는 null이다", () => {
    expect(EMPTY_FILTER_CONDITION.joinedBefore).toBeNull();
  });

  it("activityStatus는 all이다", () => {
    expect(EMPTY_FILTER_CONDITION.activityStatus).toBe("all");
  });

  it("minAttendanceRate는 null이다", () => {
    expect(EMPTY_FILTER_CONDITION.minAttendanceRate).toBeNull();
  });
});

// ─── filterMembers 함수 ───────────────────────────────────────
describe("filterMembers - 역할 필터", () => {
  it("role 필터가 비어 있으면 모든 멤버를 반환한다", () => {
    const members = [
      makeMember({ role: "leader" }),
      makeMember({ role: "member" }),
    ];
    const result = filterMembers(members, EMPTY_FILTERS);
    expect(result).toHaveLength(2);
  });

  it("role=['leader']이면 leader만 반환한다", () => {
    const members = [
      makeMember({ role: "leader" }),
      makeMember({ role: "member" }),
      makeMember({ role: "sub_leader" }),
    ];
    const result = filterMembers(members, { ...EMPTY_FILTERS, role: ["leader"] });
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("leader");
  });

  it("role=['leader','sub_leader']이면 leader와 sub_leader를 반환한다", () => {
    const members = [
      makeMember({ role: "leader" }),
      makeMember({ role: "sub_leader" }),
      makeMember({ role: "member" }),
    ];
    const result = filterMembers(members, {
      ...EMPTY_FILTERS,
      role: ["leader", "sub_leader"],
    });
    expect(result).toHaveLength(2);
  });
});

describe("filterMembers - 가입 시기 필터", () => {
  it("joinedAfter 필터로 이후 가입자만 반환한다", () => {
    const members = [
      makeMember({ joined_at: "2026-01-01" }),
      makeMember({ joined_at: "2025-06-01" }),
      makeMember({ joined_at: "2026-02-01" }),
    ];
    const result = filterMembers(members, {
      ...EMPTY_FILTERS,
      joinedAfter: "2026-01-01",
    });
    // 2026-01-01 이상인 멤버 2명
    expect(result).toHaveLength(2);
  });

  it("joinedBefore 필터로 이전 가입자만 반환한다", () => {
    const members = [
      makeMember({ joined_at: "2025-12-01" }),
      makeMember({ joined_at: "2026-02-01" }),
    ];
    const result = filterMembers(members, {
      ...EMPTY_FILTERS,
      joinedBefore: "2026-01-01",
    });
    expect(result).toHaveLength(1);
    expect(result[0].joined_at).toBe("2025-12-01");
  });

  it("joined_at이 null인 멤버는 joinedAfter 필터에서 제외된다", () => {
    const members = [
      { ...makeMember(), joined_at: null as unknown as string },
      makeMember({ joined_at: "2026-02-01" }),
    ];
    const result = filterMembers(members as GroupMemberWithProfile[], {
      ...EMPTY_FILTERS,
      joinedAfter: "2026-01-01",
    });
    expect(result).toHaveLength(1);
  });
});

describe("filterMembers - activityStatus 필터", () => {
  it("activityStatus='all'이면 모든 멤버를 반환한다", () => {
    const members = [
      makeMember({ joined_at: "2020-01-01" }),
      makeMember({ joined_at: "2026-02-01" }),
    ];
    const result = filterMembers(members, EMPTY_FILTERS);
    expect(result).toHaveLength(2);
  });

  it("activityStatus='inactive'이면 90일 이전 가입자만 반환한다", () => {
    // 90일 전 날짜 계산
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const oldDate = "2020-01-01"; // 확실히 90일 이전
    const recentDate = new Date().toISOString().slice(0, 10); // 오늘

    const members = [
      makeMember({ joined_at: oldDate }),
      makeMember({ joined_at: recentDate }),
    ];
    const result = filterMembers(members, {
      ...EMPTY_FILTERS,
      activityStatus: "inactive",
    });
    // 오래된 멤버만 포함
    expect(result.some((m) => m.joined_at === oldDate)).toBe(true);
    expect(result.some((m) => m.joined_at === recentDate)).toBe(false);
  });

  it("activityStatus='active'이면 90일 이내 가입자만 반환한다", () => {
    const recentDate = new Date().toISOString().slice(0, 10); // 오늘
    const oldDate = "2020-01-01";

    const members = [
      makeMember({ joined_at: recentDate }),
      makeMember({ joined_at: oldDate }),
    ];
    const result = filterMembers(members, {
      ...EMPTY_FILTERS,
      activityStatus: "active",
    });
    expect(result.some((m) => m.joined_at === recentDate)).toBe(true);
    expect(result.some((m) => m.joined_at === oldDate)).toBe(false);
  });

  it("joined_at이 null인 멤버는 inactive로 분류된다", () => {
    const members = [
      { ...makeMember(), joined_at: null as unknown as string },
    ];
    const result = filterMembers(members as GroupMemberWithProfile[], {
      ...EMPTY_FILTERS,
      activityStatus: "inactive",
    });
    expect(result).toHaveLength(1);
  });
});

describe("filterMembers - 빈 목록", () => {
  it("멤버가 없으면 빈 배열을 반환한다", () => {
    const result = filterMembers([], EMPTY_FILTERS);
    expect(result).toHaveLength(0);
  });
});

// ─── countActiveFilters 함수 ──────────────────────────────────
describe("countActiveFilters - 활성 필터 개수 계산", () => {
  it("모든 필터가 비어 있으면 0을 반환한다", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
  });

  it("role 필터가 있으면 1을 반환한다", () => {
    const filters: MemberFilterCondition = { ...EMPTY_FILTERS, role: ["leader"] };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("joinedAfter가 있으면 1을 반환한다", () => {
    const filters: MemberFilterCondition = { ...EMPTY_FILTERS, joinedAfter: "2026-01-01" };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("joinedBefore가 있으면 1을 반환한다", () => {
    const filters: MemberFilterCondition = { ...EMPTY_FILTERS, joinedBefore: "2026-12-31" };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("joinedAfter와 joinedBefore가 모두 있어도 1로 카운트한다", () => {
    const filters: MemberFilterCondition = {
      ...EMPTY_FILTERS,
      joinedAfter: "2026-01-01",
      joinedBefore: "2026-12-31",
    };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("minAttendanceRate가 있으면 1을 반환한다", () => {
    const filters: MemberFilterCondition = {
      ...EMPTY_FILTERS,
      minAttendanceRate: 80,
    };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("maxAttendanceRate가 있으면 1을 반환한다", () => {
    const filters: MemberFilterCondition = {
      ...EMPTY_FILTERS,
      maxAttendanceRate: 100,
    };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("activityStatus가 all이 아니면 1을 반환한다", () => {
    const filters: MemberFilterCondition = {
      ...EMPTY_FILTERS,
      activityStatus: "inactive",
    };
    expect(countActiveFilters(filters)).toBe(1);
  });

  it("모든 필터가 활성화되면 4를 반환한다", () => {
    const filters: MemberFilterCondition = {
      role: ["leader"],
      joinedAfter: "2026-01-01",
      joinedBefore: null,
      minAttendanceRate: 50,
      maxAttendanceRate: null,
      activityStatus: "active",
    };
    expect(countActiveFilters(filters)).toBe(4);
  });

  it("role이 빈 배열이면 0으로 카운트한다", () => {
    const filters: MemberFilterCondition = { ...EMPTY_FILTERS, role: [] };
    expect(countActiveFilters(filters)).toBe(0);
  });
});

// ─── 그룹별 격리 ──────────────────────────────────────────────
describe("useMemberFilterPresets - 그룹별 격리", () => {
  it("다른 groupId의 userPresets는 서로 독립적이다", () => {
    const { result: resultA } = renderHook(() =>
      useMemberFilterPresets("group-a")
    );
    const { result: resultB } = renderHook(() =>
      useMemberFilterPresets("group-b")
    );
    act(() => {
      resultA.current.savePreset("그룹A 프리셋", EMPTY_FILTERS);
    });
    // 그룹B의 userPresets는 영향 없음
    expect(resultB.current.userPresets).toHaveLength(0);
  });

  it("다른 groupId는 독립적인 localStorage 키를 사용한다", () => {
    const KEY_A = `dancebase:member-filter-presets:group-a`;
    const KEY_B = `dancebase:member-filter-presets:group-b`;
    const { result: resultA } = renderHook(() =>
      useMemberFilterPresets("group-a")
    );
    act(() => {
      resultA.current.savePreset("프리셋A", EMPTY_FILTERS);
    });
    expect(memStore[KEY_A]).toBeDefined();
    expect(memStore[KEY_B]).toBeUndefined();
  });
});
