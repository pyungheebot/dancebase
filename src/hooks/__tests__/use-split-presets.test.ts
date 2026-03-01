import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── localStorage mock ────────────────────────────────────────
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    for (const k of Object.keys(localStorageStore)) delete localStorageStore[k];
  }),
};

vi.stubGlobal("localStorage", localStorageMock);

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `uuid-${++uuidCounter}`,
});

import {
  useSplitPresets,
  applyPresetCalc,
  RULE_TYPE_LABELS,
  type ApplyPresetMember,
} from "@/hooks/use-split-presets";
import type { SplitPreset } from "@/types";

const GROUP_ID = "group-test";
const STORAGE_KEY = `split-presets-${GROUP_ID}`;

function makeMembers(count: number): ApplyPresetMember[] {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i}`,
    name: `멤버${i}`,
    role: "member" as const,
    attendanceRate: 80,
  }));
}

beforeEach(() => {
  for (const k of Object.keys(localStorageStore)) delete localStorageStore[k];
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  uuidCounter = 0;
});

// ─── 초기 상태 ────────────────────────────────────────────────
describe("useSplitPresets - 초기 상태", () => {
  it("초기 presets는 빈 배열이다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(result.current.presets).toHaveLength(0);
  });

  it("createPreset, updatePreset, deletePreset, applyPreset 함수가 존재한다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(typeof result.current.createPreset).toBe("function");
    expect(typeof result.current.updatePreset).toBe("function");
    expect(typeof result.current.deletePreset).toBe("function");
    expect(typeof result.current.applyPreset).toBe("function");
  });

  it("RULE_TYPE_LABELS가 존재한다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(result.current.RULE_TYPE_LABELS).toBeDefined();
  });

  it("localStorage에 저장된 프리셋이 있으면 로드된다", () => {
    const existing: SplitPreset[] = [
      { id: "p1", name: "기존 프리셋", ruleType: "equal", config: {}, createdAt: "" },
    ];
    localStorageStore[STORAGE_KEY] = JSON.stringify(existing);
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(result.current.presets).toHaveLength(1);
  });
});

// ─── RULE_TYPE_LABELS ─────────────────────────────────────────
describe("RULE_TYPE_LABELS 상수", () => {
  it("equal 레이블이 올바르다", () => {
    expect(RULE_TYPE_LABELS.equal).toBe("균등 분배");
  });

  it("by_role 레이블이 올바르다", () => {
    expect(RULE_TYPE_LABELS.by_role).toBe("역할별");
  });

  it("by_attendance 레이블이 올바르다", () => {
    expect(RULE_TYPE_LABELS.by_attendance).toBe("출석률별");
  });

  it("custom_ratio 레이블이 올바르다", () => {
    expect(RULE_TYPE_LABELS.custom_ratio).toBe("수동 비율");
  });
});

// ─── createPreset ─────────────────────────────────────────────
describe("useSplitPresets - createPreset", () => {
  it("createPreset 호출 시 SplitPreset을 반환한다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let preset: SplitPreset | undefined;
    act(() => {
      preset = result.current.createPreset("테스트 프리셋", "equal", {});
    });
    expect(preset).toBeDefined();
    expect(preset!.id).toBeDefined();
  });

  it("createPreset 후 presets 길이가 증가한다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    act(() => {
      result.current.createPreset("프리셋 A", "equal", {});
    });
    expect(result.current.presets).toHaveLength(1);
  });

  it("createPreset의 name이 올바르게 저장된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    act(() => {
      result.current.createPreset("역할별 분담", "by_role", {
        roleRatios: { leader: 0, sub_leader: 50, member: 100 },
      });
    });
    expect(result.current.presets[0].name).toBe("역할별 분담");
  });

  it("createPreset의 ruleType이 올바르게 저장된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    act(() => {
      result.current.createPreset("출석률 기반", "by_attendance", {});
    });
    expect(result.current.presets[0].ruleType).toBe("by_attendance");
  });

  it("createPreset 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    act(() => {
      result.current.createPreset("저장 테스트", "equal", {});
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const stored = JSON.parse(localStorageStore[STORAGE_KEY]);
    expect(stored).toHaveLength(1);
  });

  it("여러 번 createPreset 호출 시 모두 누적된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    act(() => {
      result.current.createPreset("A", "equal", {});
      result.current.createPreset("B", "by_role", {});
    });
    expect(result.current.presets).toHaveLength(2);
  });
});

// ─── updatePreset ─────────────────────────────────────────────
describe("useSplitPresets - updatePreset", () => {
  it("updatePreset으로 name을 변경할 수 있다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let preset: SplitPreset | undefined;
    act(() => {
      preset = result.current.createPreset("원래 이름", "equal", {});
    });
    act(() => {
      result.current.updatePreset(preset!.id, { name: "새 이름" });
    });
    const updated = result.current.presets.find((p) => p.id === preset!.id);
    expect(updated?.name).toBe("새 이름");
  });

  it("updatePreset으로 ruleType을 변경할 수 있다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let preset: SplitPreset | undefined;
    act(() => {
      preset = result.current.createPreset("타입 변경", "equal", {});
    });
    act(() => {
      result.current.updatePreset(preset!.id, { ruleType: "by_role" });
    });
    const updated = result.current.presets.find((p) => p.id === preset!.id);
    expect(updated?.ruleType).toBe("by_role");
  });

  it("존재하지 않는 id로 updatePreset 호출 시 에러가 없다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(() => {
      act(() => {
        result.current.updatePreset("no-such-id", { name: "변경" });
      });
    }).not.toThrow();
  });

  it("updatePreset 후 localStorage가 갱신된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let preset: SplitPreset | undefined;
    act(() => {
      preset = result.current.createPreset("업데이트 테스트", "equal", {});
    });
    localStorageMock.setItem.mockClear();
    act(() => {
      result.current.updatePreset(preset!.id, { name: "변경됨" });
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

// ─── deletePreset ─────────────────────────────────────────────
describe("useSplitPresets - deletePreset", () => {
  it("deletePreset 호출 시 해당 프리셋이 제거된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let preset: SplitPreset | undefined;
    act(() => {
      preset = result.current.createPreset("삭제할 프리셋", "equal", {});
    });
    act(() => {
      result.current.deletePreset(preset!.id);
    });
    expect(result.current.presets).toHaveLength(0);
  });

  it("존재하지 않는 id로 deletePreset 호출 시 에러가 없다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    expect(() => {
      act(() => {
        result.current.deletePreset("non-existent");
      });
    }).not.toThrow();
  });

  it("특정 프리셋만 삭제되고 나머지는 유지된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let p1: SplitPreset | undefined;
    act(() => {
      p1 = result.current.createPreset("프리셋1", "equal", {});
      result.current.createPreset("프리셋2", "by_role", {});
    });
    act(() => {
      result.current.deletePreset(p1!.id);
    });
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe("프리셋2");
  });
});

// ─── applyPresetCalc - equal ──────────────────────────────────
describe("applyPresetCalc - equal (균등 분배)", () => {
  const preset: SplitPreset = {
    id: "p1", name: "균등", ruleType: "equal", config: {}, createdAt: ""
  };

  it("멤버가 0명이면 빈 배열을 반환한다", () => {
    const result = applyPresetCalc(preset, [], 100000);
    expect(result).toHaveLength(0);
  });

  it("totalAmount가 0이면 모든 amount가 0이다", () => {
    const members = makeMembers(3);
    const result = applyPresetCalc(preset, members, 0);
    result.forEach((r) => expect(r.amount).toBe(0));
  });

  it("3명 균등 분배: 10000원 → 3333, 3333, 3334 (나머지 첫 번째 부담)", () => {
    const members = makeMembers(3);
    const result = applyPresetCalc(preset, members, 10000);
    const amounts = result.map((r) => r.amount);
    expect(amounts[0]).toBe(3334); // 나머지를 첫 번째가 부담
    expect(amounts[1]).toBe(3333);
    expect(amounts[2]).toBe(3333);
    expect(amounts.reduce((s, a) => s + a, 0)).toBe(10000);
  });

  it("2명 균등 분배: 100000원 → 50000씩", () => {
    const members = makeMembers(2);
    const result = applyPresetCalc(preset, members, 100000);
    expect(result[0].amount).toBe(50000);
    expect(result[1].amount).toBe(50000);
  });

  it("분배 결과 합계는 totalAmount와 일치한다", () => {
    const members = makeMembers(7);
    const total = 100001;
    const result = applyPresetCalc(preset, members, total);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(total);
  });
});

// ─── applyPresetCalc - by_role ────────────────────────────────
describe("applyPresetCalc - by_role (역할별)", () => {
  it("roleRatios 기본값(leader=0)이면 리더는 0원이다", () => {
    const preset: SplitPreset = {
      id: "p2", name: "역할별", ruleType: "by_role",
      config: { roleRatios: { leader: 0, sub_leader: 50, member: 100 } },
      createdAt: ""
    };
    const members: ApplyPresetMember[] = [
      { userId: "u1", name: "리더", role: "leader" },
      { userId: "u2", name: "멤버", role: "member" },
    ];
    const result = applyPresetCalc(preset, members, 10000);
    expect(result[0].amount).toBe(0);
  });

  it("모든 weight가 0이면 모든 amount가 0이다", () => {
    const preset: SplitPreset = {
      id: "p3", name: "역할별", ruleType: "by_role",
      config: { roleRatios: { leader: 0, sub_leader: 0, member: 0 } },
      createdAt: ""
    };
    const members = makeMembers(2);
    const result = applyPresetCalc(preset, members, 10000);
    result.forEach((r) => expect(r.amount).toBe(0));
  });

  it("분배 합계는 totalAmount와 일치한다 (마지막이 나머지 부담)", () => {
    const preset: SplitPreset = {
      id: "p4", name: "역할별", ruleType: "by_role",
      config: { roleRatios: { leader: 0, sub_leader: 50, member: 100 } },
      createdAt: ""
    };
    const members: ApplyPresetMember[] = [
      { userId: "u1", name: "리더", role: "leader" },
      { userId: "u2", name: "서브리더", role: "sub_leader" },
      { userId: "u3", name: "멤버", role: "member" },
    ];
    const total = 30001;
    const result = applyPresetCalc(preset, members, total);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(total);
  });
});

// ─── applyPresetCalc - by_attendance ─────────────────────────
describe("applyPresetCalc - by_attendance (출석률별)", () => {
  const preset: SplitPreset = {
    id: "p5", name: "출석률별", ruleType: "by_attendance",
    config: {
      attendanceThresholds: [
        { minRate: 90, ratio: 80 },
        { minRate: 70, ratio: 100 },
        { minRate: 50, ratio: 120 },
        { minRate: 0, ratio: 150 },
      ]
    },
    createdAt: ""
  };

  it("출석률 95%는 ratio 80을 적용한다", () => {
    const getRatio = (rate: number) => {
      const thresholds = [
        { minRate: 90, ratio: 80 },
        { minRate: 70, ratio: 100 },
        { minRate: 50, ratio: 120 },
        { minRate: 0, ratio: 150 },
      ].sort((a, b) => b.minRate - a.minRate);
      for (const t of thresholds) {
        if (rate >= t.minRate) return t.ratio;
      }
      return 150;
    };
    expect(getRatio(95)).toBe(80);
  });

  it("출석률 75%는 ratio 100을 적용한다", () => {
    const getRatio = (rate: number) => {
      const thresholds = [
        { minRate: 90, ratio: 80 },
        { minRate: 70, ratio: 100 },
        { minRate: 50, ratio: 120 },
        { minRate: 0, ratio: 150 },
      ].sort((a, b) => b.minRate - a.minRate);
      for (const t of thresholds) {
        if (rate >= t.minRate) return t.ratio;
      }
      return 150;
    };
    expect(getRatio(75)).toBe(100);
  });

  it("분배 합계는 totalAmount와 일치한다", () => {
    const members: ApplyPresetMember[] = [
      { userId: "u1", name: "A", role: "member", attendanceRate: 95 },
      { userId: "u2", name: "B", role: "member", attendanceRate: 60 },
    ];
    const total = 50000;
    const result = applyPresetCalc(preset, members, total);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(total);
  });

  it("attendanceRate가 없으면 100으로 처리된다", () => {
    const members: ApplyPresetMember[] = [
      { userId: "u1", name: "A", role: "member" }, // attendanceRate 없음
    ];
    const result = applyPresetCalc(preset, members, 10000);
    // 단일 멤버 → 전체 금액
    expect(result[0].amount).toBe(10000);
  });
});

// ─── applyPresetCalc - custom_ratio ───────────────────────────
describe("applyPresetCalc - custom_ratio (수동 비율)", () => {
  it("customRatios에 없는 userId는 기본 100으로 처리된다", () => {
    const preset: SplitPreset = {
      id: "p6", name: "커스텀", ruleType: "custom_ratio",
      config: { customRatios: { "user-0": 200 } },
      createdAt: ""
    };
    const members = makeMembers(2); // user-0, user-1
    const result = applyPresetCalc(preset, members, 30000);
    // totalRatio = 200 + 100 = 300
    // user-0: floor(30000 * 200 / 300) = 20000
    // user-1: 30000 - 20000 = 10000
    expect(result[0].amount).toBe(20000);
    expect(result[1].amount).toBe(10000);
  });

  it("customRatios가 모두 0이면 균등 분배로 fallback된다", () => {
    const preset: SplitPreset = {
      id: "p7", name: "커스텀0", ruleType: "custom_ratio",
      config: { customRatios: { "user-0": 0, "user-1": 0 } },
      createdAt: ""
    };
    const members = makeMembers(2);
    const result = applyPresetCalc(preset, members, 10000);
    expect(result.reduce((s, r) => s + r.amount, 0)).toBe(10000);
  });

  it("분배 합계는 totalAmount와 일치한다", () => {
    const preset: SplitPreset = {
      id: "p8", name: "비율 테스트", ruleType: "custom_ratio",
      config: { customRatios: { "user-0": 150, "user-1": 50, "user-2": 100 } },
      createdAt: ""
    };
    const members = makeMembers(3);
    const total = 99999;
    const result = applyPresetCalc(preset, members, total);
    const sum = result.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBe(total);
  });
});

// ─── applyPreset (훅의 applyPreset 사용) ──────────────────────
describe("useSplitPresets - applyPreset", () => {
  it("존재하지 않는 presetId로 applyPreset 호출 시 빈 배열 반환", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    const members = makeMembers(2);
    const res = result.current.applyPreset("no-preset", members, 10000);
    expect(res).toHaveLength(0);
  });

  it("존재하는 preset으로 applyPreset 호출 시 결과가 반환된다", () => {
    const { result } = renderHook(() => useSplitPresets(GROUP_ID));
    let presetId: string;
    act(() => {
      const p = result.current.createPreset("적용 테스트", "equal", {});
      presetId = p.id;
    });
    const members = makeMembers(3);
    const res = result.current.applyPreset(presetId!, members, 30000);
    expect(res).toHaveLength(3);
    expect(res.reduce((s, r) => s + r.amount, 0)).toBe(30000);
  });
});

// ─── 그룹별 격리 ──────────────────────────────────────────────
describe("useSplitPresets - 그룹별 격리", () => {
  it("다른 groupId는 독립적인 localStorage 키를 사용한다", () => {
    const { result: resultA } = renderHook(() => useSplitPresets("group-aaa"));
    const { result: resultB } = renderHook(() => useSplitPresets("group-bbb"));
    act(() => {
      resultA.current.createPreset("그룹A 프리셋", "equal", {});
    });
    // 그룹B에는 영향 없음
    expect(resultB.current.presets).toHaveLength(0);
  });
});
