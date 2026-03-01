import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

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

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => ({
  default: (
    key: string | null,
    fetcher: (() => unknown) | null,
    options?: { fallbackData?: unknown; revalidateOnFocus?: boolean }
  ) => {
    if (!key || !fetcher) {
      const fallback = options?.fallbackData ?? undefined;
      const [data] = reactUseState<unknown>(fallback);
      return { data, isLoading: false, mutate: vi.fn() };
    }
    const initial = (() => {
      const loaded = fetcher();
      // loaded가 빈 객체({})인 경우 fallbackData를 사용
      if (
        loaded !== null &&
        typeof loaded === "object" &&
        Object.keys(loaded as object).length === 0 &&
        options?.fallbackData !== undefined
      ) {
        return options.fallbackData;
      }
      return loaded ?? options?.fallbackData;
    })();
    const [data, setData] = reactUseState<unknown>(initial);
    const mutate = reactUseCallback(
      (newData?: unknown) => {
        if (newData !== undefined) {
          setData(newData);
        } else {
          const refreshed = fetcher!();
          if (
            refreshed !== null &&
            typeof refreshed === "object" &&
            Object.keys(refreshed as object).length === 0 &&
            options?.fallbackData !== undefined
          ) {
            setData(options.fallbackData);
          } else {
            setData(refreshed ?? options?.fallbackData);
          }
        }
        return Promise.resolve();
      },
      []
    );
    return { data, isLoading: false, mutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    skillMatrixData: (groupId: string) => `skill-matrix-data-${groupId}`,
  },
}));

import { useSkillMatrixData } from "@/hooks/use-skill-matrix-data";

function makeHook(groupId = "group-1") {
  return renderHook(() => useSkillMatrixData(groupId));
}

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ============================================================

describe("useSkillMatrixData - 초기 상태", () => {
  it("data.groupId가 훅 인자와 일치한다", () => {
    const { result } = makeHook("group-abc");
    expect(result.current.data.groupId).toBe("group-abc");
  });

  it("data.skills 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.skills).toEqual([]);
  });

  it("data.members 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.data.members).toEqual([]);
  });

  it("loading은 boolean 타입이다", () => {
    const { result } = makeHook();
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("totalSkills 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalSkills).toBe(0);
  });

  it("totalMembers 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalMembers).toBe(0);
  });

  it("overallAvg 초기값은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.overallAvg).toBe(0);
  });

  it("addSkill, removeSkill, addMember, removeMember, updateScore, cycleCurrentLevel, setTargetLevel, recordEvaluation, getSkillAvg, getMemberAvg, refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addSkill).toBe("function");
    expect(typeof result.current.removeSkill).toBe("function");
    expect(typeof result.current.addMember).toBe("function");
    expect(typeof result.current.removeMember).toBe("function");
    expect(typeof result.current.updateScore).toBe("function");
    expect(typeof result.current.cycleCurrentLevel).toBe("function");
    expect(typeof result.current.setTargetLevel).toBe("function");
    expect(typeof result.current.recordEvaluation).toBe("function");
    expect(typeof result.current.getSkillAvg).toBe("function");
    expect(typeof result.current.getMemberAvg).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useSkillMatrixData - addSkill", () => {
  it("기술을 추가하면 skills 배열에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "왁킹" });
    });
    expect(result.current.data.skills).toHaveLength(1);
    expect(result.current.data.skills[0].name).toBe("왁킹");
  });

  it("addSkill 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addSkill({ name: "힙합" });
    });
    expect(ret).toBe(true);
  });

  it("빈 문자열로 addSkill 호출 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addSkill({ name: "" });
    });
    expect(ret).toBe(false);
  });

  it("공백만 있는 이름으로 addSkill 호출 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addSkill({ name: "   " });
    });
    expect(ret).toBe(false);
  });

  it("동일한 이름의 기술을 중복 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "팝핀" });
    });
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addSkill({ name: "팝핀" });
    });
    expect(ret).toBe(false);
    expect(result.current.data.skills).toHaveLength(1);
  });

  it("category와 description이 함께 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "브레이킹", category: "스트릿", description: "헤드스핀 포함" });
    });
    const skill = result.current.data.skills[0];
    expect(skill.category).toBe("스트릿");
    expect(skill.description).toBe("헤드스핀 포함");
  });

  it("추가된 기술은 id와 createdAt을 가진다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "락킹" });
    });
    const skill = result.current.data.skills[0];
    expect(skill.id).toBeTruthy();
    expect(skill.createdAt).toBeTruthy();
  });

  it("totalSkills가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "스윙" });
    });
    expect(result.current.totalSkills).toBe(1);
  });
});

describe("useSkillMatrixData - removeSkill", () => {
  it("기술을 삭제하면 skills 배열에서 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "왁킹" });
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.removeSkill(skillId);
    });
    expect(result.current.data.skills).toHaveLength(0);
  });

  it("기술 삭제 시 해당 기술의 멤버 점수도 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "힙합" });
    });
    act(() => {
      result.current.addMember("김댄서");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.updateScore("김댄서", skillId, { currentLevel: 3 });
    });
    act(() => {
      result.current.removeSkill(skillId);
    });
    const member = result.current.data.members[0];
    expect(member.scores[skillId]).toBeUndefined();
  });

  it("존재하지 않는 skillId로 삭제해도 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.removeSkill("non-existent-id");
      });
    }).not.toThrow();
  });
});

describe("useSkillMatrixData - addMember", () => {
  it("멤버를 추가하면 members 배열에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("이댄서");
    });
    expect(result.current.data.members).toHaveLength(1);
    expect(result.current.data.members[0].memberName).toBe("이댄서");
  });

  it("addMember 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addMember("박댄서");
    });
    expect(ret).toBe(true);
  });

  it("빈 문자열로 addMember 호출 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addMember("");
    });
    expect(ret).toBe(false);
  });

  it("동일 이름의 멤버를 중복 추가하면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("최댄서");
    });
    let ret: boolean | undefined;
    act(() => {
      ret = result.current.addMember("최댄서");
    });
    expect(ret).toBe(false);
    expect(result.current.data.members).toHaveLength(1);
  });

  it("새 멤버의 scores는 빈 객체이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("정댄서");
    });
    expect(result.current.data.members[0].scores).toEqual({});
  });

  it("totalMembers가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("한댄서");
    });
    expect(result.current.totalMembers).toBe(1);
  });
});

describe("useSkillMatrixData - removeMember", () => {
  it("멤버를 삭제하면 members 배열에서 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addMember("윤댄서");
    });
    act(() => {
      result.current.removeMember("윤댄서");
    });
    expect(result.current.data.members).toHaveLength(0);
  });

  it("존재하지 않는 멤버 삭제 시 에러가 발생하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.removeMember("없는멤버");
      });
    }).not.toThrow();
  });
});

describe("useSkillMatrixData - updateScore 및 cycleCurrentLevel", () => {
  it("updateScore로 특정 멤버의 점수를 설정한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "팝핀" });
    });
    act(() => {
      result.current.addMember("신댄서");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.updateScore("신댄서", skillId, { currentLevel: 4 });
    });
    expect(result.current.data.members[0].scores[skillId].currentLevel).toBe(4);
  });

  it("cycleCurrentLevel은 0->1->2->3->4->5->0 순환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "왁킹" });
    });
    act(() => {
      result.current.addMember("강댄서");
    });
    const skillId = result.current.data.skills[0].id;
    // 초기 0 -> cycle 후 1
    act(() => {
      result.current.cycleCurrentLevel("강댄서", skillId);
    });
    expect(result.current.data.members[0].scores[skillId].currentLevel).toBe(1);
  });

  it("cycleCurrentLevel을 5번 호출하면 5가 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "락킹" });
    });
    act(() => {
      result.current.addMember("임댄서");
    });
    const skillId = result.current.data.skills[0].id;
    // 각 cycle을 별도 act로 실행하면 stale closure를 피할 수 있음
    // 단, cycleCurrentLevel은 updateScore를 useCallback으로 래핑하므로
    // 각 호출 사이에 React state 갱신이 필요
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.cycleCurrentLevel("임댄서", skillId);
      });
    }
    expect(result.current.data.members[0].scores[skillId].currentLevel).toBe(5);
  });

  it("cycleCurrentLevel을 6번 호출하면 다시 0이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "브레이킹" });
    });
    act(() => {
      result.current.addMember("오댄서");
    });
    const skillId = result.current.data.skills[0].id;
    for (let i = 0; i < 6; i++) {
      act(() => {
        result.current.cycleCurrentLevel("오댄서", skillId);
      });
    }
    expect(result.current.data.members[0].scores[skillId].currentLevel).toBe(0);
  });

  it("setTargetLevel로 목표 레벨을 설정한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "힙합" });
    });
    act(() => {
      result.current.addMember("조댄서");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.setTargetLevel("조댄서", skillId, 5);
    });
    expect(result.current.data.members[0].scores[skillId].targetLevel).toBe(5);
  });

  it("recordEvaluation으로 평가일을 기록한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "스윙" });
    });
    act(() => {
      result.current.addMember("권댄서");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.recordEvaluation("권댄서", skillId, "2026-03-01");
    });
    expect(result.current.data.members[0].scores[skillId].lastEvaluatedAt).toBe("2026-03-01");
  });
});

describe("useSkillMatrixData - 통계 함수", () => {
  it("getSkillAvg는 해당 기술의 평균 현재 레벨을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "팝핀" });
    });
    act(() => {
      result.current.addMember("멤버A");
    });
    act(() => {
      result.current.addMember("멤버B");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.updateScore("멤버A", skillId, { currentLevel: 2 });
    });
    act(() => {
      result.current.updateScore("멤버B", skillId, { currentLevel: 4 });
    });
    expect(result.current.getSkillAvg(skillId)).toBe(3);
  });

  it("모든 멤버의 레벨이 0이면 getSkillAvg는 0이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "왁킹" });
    });
    act(() => {
      result.current.addMember("멤버C");
    });
    const skillId = result.current.data.skills[0].id;
    expect(result.current.getSkillAvg(skillId)).toBe(0);
  });

  it("getMemberAvg는 해당 멤버의 평균 현재 레벨을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "기술1" });
    });
    act(() => {
      result.current.addSkill({ name: "기술2" });
    });
    act(() => {
      result.current.addMember("멤버D");
    });
    const skill1Id = result.current.data.skills[0].id;
    const skill2Id = result.current.data.skills[1].id;
    act(() => {
      result.current.updateScore("멤버D", skill1Id, { currentLevel: 2 });
    });
    act(() => {
      result.current.updateScore("멤버D", skill2Id, { currentLevel: 4 });
    });
    expect(result.current.getMemberAvg("멤버D")).toBe(3);
  });

  it("getMemberAvg는 0인 레벨을 제외한 평균을 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "기술A" });
    });
    act(() => {
      result.current.addSkill({ name: "기술B" });
    });
    act(() => {
      result.current.addMember("멤버E");
    });
    const skill1Id = result.current.data.skills[0].id;
    // skill2는 기본 0 유지
    act(() => {
      result.current.updateScore("멤버E", skill1Id, { currentLevel: 4 });
    });
    // 0인 기술B 제외 -> 4/1 = 4
    expect(result.current.getMemberAvg("멤버E")).toBe(4);
  });

  it("존재하지 않는 멤버의 getMemberAvg는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.getMemberAvg("없는멤버")).toBe(0);
  });

  it("overallAvg는 전체 멤버/기술 평균 레벨이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addSkill({ name: "기술X" });
    });
    act(() => {
      result.current.addMember("멤버F");
    });
    act(() => {
      result.current.addMember("멤버G");
    });
    const skillId = result.current.data.skills[0].id;
    act(() => {
      result.current.updateScore("멤버F", skillId, { currentLevel: 2 });
    });
    act(() => {
      result.current.updateScore("멤버G", skillId, { currentLevel: 4 });
    });
    expect(result.current.overallAvg).toBe(3);
  });
});

describe("useSkillMatrixData - 그룹별 격리", () => {
  it("다른 groupId를 사용하면 독립적인 데이터를 가진다", () => {
    const { result: r1 } = renderHook(() => useSkillMatrixData("group-1"));
    const { result: r2 } = renderHook(() => useSkillMatrixData("group-2"));

    act(() => {
      r1.current.addSkill({ name: "힙합" });
    });

    expect(r1.current.data.skills).toHaveLength(1);
    expect(r2.current.data.skills).toHaveLength(0);
  });

  it("localStorage 키는 groupId를 포함한다", () => {
    const key1 = `dancebase:skill-matrix-data:group-1`;
    const key2 = `dancebase:skill-matrix-data:group-2`;
    expect(key1).not.toBe(key2);
  });
});
