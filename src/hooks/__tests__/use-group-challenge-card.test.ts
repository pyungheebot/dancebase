import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T =>
    (memStore[key] as T) ?? defaultValue,
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
vi.mock("swr", () => {
  const { useRef } = require("react");
  return {
    default: (key: string | null, fetcher: (() => unknown) | null) => {
      if (!key || !fetcher) {
        return { data: undefined, isLoading: false, mutate: vi.fn() };
      }
      const fetchResult = fetcher();
      const [data, setData] = reactUseState<unknown>(() => fetchResult);
      const setDataRef = useRef(setData);
      setDataRef.current = setData;

      const mutate = reactUseCallback((newData?: unknown) => {
        if (newData !== undefined) {
          setDataRef.current(newData);
        } else {
          setDataRef.current(fetcher!() as unknown);
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
    groupChallengeCard: (groupId: string) => `group-challenge-card-${groupId}`,
  },
}));

// ─── invalidate mock ──────────────────────────────────────────
vi.mock("@/lib/swr/invalidate", () => ({
  invalidateGroupChallengeCard: vi.fn(),
}));

// ─── toast mock ───────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    TITLE_REQUIRED: "제목을 입력해주세요",
    DATE: {
      START_END_REQUIRED_NO_DOT: "시작일과 종료일을 입력해주세요",
      END_AFTER_START: "종료일은 시작일 이후여야 합니다",
    },
    CHALLENGE: {
      CREATED_NO_DOT: "챌린지가 생성되었습니다",
      UPDATED: "챌린지가 수정되었습니다",
      DELETED_NO_DOT: "챌린지가 삭제되었습니다",
    },
    STAFF_CALL: {
      PARTICIPANT_NAME_REQUIRED: "참여자 이름을 입력해주세요",
    },
    MISC: {
      DUPLICATE_MEMBER: "이미 추가된 참여자입니다",
    },
  },
}));

// ─── Date mock ────────────────────────────────────────────────
// 2026-03-15을 "오늘"로 고정
const FIXED_TODAY = "2026-03-15";

vi.spyOn(Date.prototype, "toISOString").mockImplementation(() => {
  return `${FIXED_TODAY}T00:00:00.000Z`;
});

// ─── 훅 import ────────────────────────────────────────────────
import { useGroupChallengeCard } from "@/hooks/use-group-challenge-card";
import { toast } from "sonner";

// ─── 헬퍼 ────────────────────────────────────────────────────
function makeHook(groupId = "group-1") {
  return renderHook(() => useGroupChallengeCard(groupId));
}

function clearStore() {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
}

function makeChallengeInput(overrides: Partial<{
  title: string;
  description: string;
  category: "choreography" | "freestyle" | "cover" | "fitness";
  startDate: string;
  endDate: string;
}> = {}) {
  return {
    title: "스핀 챌린지",
    description: "30일간 스핀 연습",
    category: "choreography" as const,
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    ...overrides,
  };
}

// ============================================================
// useGroupChallengeCard - 초기 상태
// ============================================================

describe("useGroupChallengeCard - 초기 상태", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("초기 entries는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("초기 total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.total).toBe(0);
  });

  it("초기 completionRate는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.completionRate).toBe(0);
  });

  it("초기 activeChallenges는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.activeChallenges).toEqual([]);
  });

  it("초기 upcomingChallenges는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.upcomingChallenges).toEqual([]);
  });

  it("초기 completedList는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.completedList).toEqual([]);
  });

  it("초기 categoryCounts는 모두 0이다", () => {
    const { result } = makeHook();
    expect(result.current.categoryCounts).toEqual({
      choreography: 0,
      freestyle: 0,
      cover: 0,
      fitness: 0,
    });
  });

  it("초기 popularCategory는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.popularCategory).toBeNull();
  });

  it("loading은 false이다", () => {
    const { result } = makeHook();
    expect(result.current.loading).toBe(false);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createChallenge).toBe("function");
    expect(typeof result.current.updateChallenge).toBe("function");
    expect(typeof result.current.deleteChallenge).toBe("function");
    expect(typeof result.current.addParticipant).toBe("function");
    expect(typeof result.current.updateParticipantStatus).toBe("function");
    expect(typeof result.current.removeParticipant).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// useGroupChallengeCard - createChallenge 챌린지 생성
// ============================================================

describe("useGroupChallengeCard - createChallenge 챌린지 생성", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("유효한 입력으로 생성 시 entries 길이가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("생성 시 true를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = false;
    act(() => {
      ret = result.current.createChallenge(makeChallengeInput());
    });
    expect(ret).toBe(true);
  });

  it("title이 올바르게 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "브레이킹 챌린지" }));
    });
    expect(result.current.entries[0].title).toBe("브레이킹 챌린지");
  });

  it("category가 올바르게 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "fitness" }));
    });
    expect(result.current.entries[0].category).toBe("fitness");
  });

  it("초기 participants는 빈 배열이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    expect(result.current.entries[0].participants).toEqual([]);
  });

  it("빈 title로 생성 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.createChallenge(makeChallengeInput({ title: "" }));
    });
    expect(ret).toBe(false);
    expect(result.current.entries).toHaveLength(0);
  });

  it("빈 title로 생성 시 toast.error가 호출된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "" }));
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it("startDate가 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.createChallenge(makeChallengeInput({ startDate: "" }));
    });
    expect(ret).toBe(false);
  });

  it("endDate가 없으면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.createChallenge(makeChallengeInput({ endDate: "" }));
    });
    expect(ret).toBe(false);
  });

  it("startDate가 endDate보다 늦으면 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.createChallenge(makeChallengeInput({
        startDate: "2026-04-01",
        endDate: "2026-03-01",
      }));
    });
    expect(ret).toBe(false);
  });

  it("생성 성공 시 toast.success가 호출된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("총 개수(total)가 생성 후 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    expect(result.current.total).toBe(1);
  });

  it("title의 앞뒤 공백이 제거된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "  챌린지  " }));
    });
    expect(result.current.entries[0].title).toBe("챌린지");
  });
});

// ============================================================
// useGroupChallengeCard - updateChallenge 챌린지 수정
// ============================================================

describe("useGroupChallengeCard - updateChallenge 챌린지 수정", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("유효한 id로 수정 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.updateChallenge(id, makeChallengeInput({ title: "수정된 챌린지" }));
    });
    expect(ret).toBe(true);
  });

  it("title을 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "원래 제목" }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateChallenge(id, makeChallengeInput({ title: "수정된 제목" }));
    });
    expect(result.current.entries[0].title).toBe("수정된 제목");
  });

  it("category를 수정할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "choreography" }));
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.updateChallenge(id, makeChallengeInput({ category: "freestyle" }));
    });
    expect(result.current.entries[0].category).toBe("freestyle");
  });

  it("빈 title로 수정 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = true;
    act(() => {
      ret = result.current.updateChallenge(id, makeChallengeInput({ title: "" }));
    });
    expect(ret).toBe(false);
  });

  it("종료일이 시작일보다 빠르면 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    let ret: boolean = true;
    act(() => {
      ret = result.current.updateChallenge(id, makeChallengeInput({
        startDate: "2026-04-01",
        endDate: "2026-03-01",
      }));
    });
    expect(ret).toBe(false);
  });

  it("수정 성공 시 toast.success가 호출된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    vi.clearAllMocks();
    act(() => {
      result.current.updateChallenge(id, makeChallengeInput({ title: "수정됨" }));
    });
    expect(toast.success).toHaveBeenCalled();
  });
});

// ============================================================
// useGroupChallengeCard - deleteChallenge 챌린지 삭제
// ============================================================

describe("useGroupChallengeCard - deleteChallenge 챌린지 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("삭제 후 entries 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteChallenge(id);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("삭제 성공 시 toast.success가 호출된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    vi.clearAllMocks();
    act(() => {
      result.current.deleteChallenge(id);
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("특정 챌린지만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "챌린지1" }));
    });
    act(() => {
      result.current.createChallenge(makeChallengeInput({ title: "챌린지2" }));
    });
    const firstId = result.current.entries.find((e) => e.title === "챌린지1")!.id;
    act(() => {
      result.current.deleteChallenge(firstId);
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].title).toBe("챌린지2");
  });

  it("삭제 후 total이 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const id = result.current.entries[0].id;
    act(() => {
      result.current.deleteChallenge(id);
    });
    expect(result.current.total).toBe(0);
  });
});

// ============================================================
// useGroupChallengeCard - addParticipant 참여자 추가
// ============================================================

describe("useGroupChallengeCard - addParticipant 참여자 추가", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("참여자 추가 후 participants 길이가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    expect(result.current.entries[0].participants).toHaveLength(1);
  });

  it("참여자 추가 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    let ret: boolean = false;
    act(() => {
      ret = result.current.addParticipant(challengeId, "홍길동");
    });
    expect(ret).toBe(true);
  });

  it("빈 이름으로 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    let ret: boolean = true;
    act(() => {
      ret = result.current.addParticipant(challengeId, "");
    });
    expect(ret).toBe(false);
  });

  it("중복 참여자 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    let ret: boolean = true;
    act(() => {
      ret = result.current.addParticipant(challengeId, "홍길동");
    });
    expect(ret).toBe(false);
    expect(result.current.entries[0].participants).toHaveLength(1);
  });

  it("존재하지 않는 challengeId로 추가 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ret: boolean = true;
    act(() => {
      ret = result.current.addParticipant("non-existent", "홍길동");
    });
    expect(ret).toBe(false);
  });

  it("추가된 참여자의 초기 상태는 not_started이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    expect(result.current.entries[0].participants[0].status).toBe("not_started");
  });

  it("추가된 참여자의 completedRank는 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    expect(result.current.entries[0].participants[0].completedRank).toBeNull();
  });
});

// ============================================================
// useGroupChallengeCard - updateParticipantStatus 참여자 상태 변경
// ============================================================

describe("useGroupChallengeCard - updateParticipantStatus 참여자 상태 변경", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("참여자 상태를 in_progress로 변경할 수 있다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    const participantId = result.current.entries[0].participants[0].id;
    act(() => {
      result.current.updateParticipantStatus(challengeId, participantId, "in_progress");
    });
    expect(result.current.entries[0].participants[0].status).toBe("in_progress");
  });

  it("참여자 상태를 completed로 변경하면 completedRank가 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    const participantId = result.current.entries[0].participants[0].id;
    act(() => {
      result.current.updateParticipantStatus(challengeId, participantId, "completed");
    });
    expect(result.current.entries[0].participants[0].completedRank).toBe(1);
  });

  it("두 번째 완료 참여자의 completedRank는 2이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    act(() => {
      result.current.addParticipant(challengeId, "김철수");
    });
    const p1Id = result.current.entries[0].participants[0].id;
    const p2Id = result.current.entries[0].participants[1].id;
    act(() => {
      result.current.updateParticipantStatus(challengeId, p1Id, "completed");
    });
    act(() => {
      result.current.updateParticipantStatus(challengeId, p2Id, "completed");
    });
    expect(result.current.entries[0].participants[1].completedRank).toBe(2);
  });

  it("completed가 아닌 상태로 변경 시 completedRank는 null이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    const participantId = result.current.entries[0].participants[0].id;
    act(() => {
      result.current.updateParticipantStatus(challengeId, participantId, "in_progress");
    });
    expect(result.current.entries[0].participants[0].completedRank).toBeNull();
  });

  it("존재하지 않는 challengeId로 상태 변경 시 아무것도 변하지 않는다", () => {
    const { result } = makeHook();
    expect(() => {
      act(() => {
        result.current.updateParticipantStatus("non-existent", "p-1", "completed");
      });
    }).not.toThrow();
  });
});

// ============================================================
// useGroupChallengeCard - removeParticipant 참여자 삭제
// ============================================================

describe("useGroupChallengeCard - removeParticipant 참여자 삭제", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("참여자 삭제 후 participants 길이가 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    const participantId = result.current.entries[0].participants[0].id;
    act(() => {
      result.current.removeParticipant(challengeId, participantId);
    });
    expect(result.current.entries[0].participants).toHaveLength(0);
  });

  it("특정 참여자만 삭제된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput());
    });
    const challengeId = result.current.entries[0].id;
    act(() => {
      result.current.addParticipant(challengeId, "홍길동");
    });
    act(() => {
      result.current.addParticipant(challengeId, "김철수");
    });
    const firstId = result.current.entries[0].participants[0].id;
    act(() => {
      result.current.removeParticipant(challengeId, firstId);
    });
    expect(result.current.entries[0].participants).toHaveLength(1);
    expect(result.current.entries[0].participants[0].name).toBe("김철수");
  });
});

// ============================================================
// useGroupChallengeCard - calcChallengeStatus 상태 분류
// ============================================================

describe("useGroupChallengeCard - 챌린지 상태별 필터링", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("과거 챌린지는 completedList에 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      // 오늘(2026-03-15) 기준 이미 지난 챌린지
      result.current.createChallenge(makeChallengeInput({
        startDate: "2026-01-01",
        endDate: "2026-02-28",
      }));
    });
    expect(result.current.completedList).toHaveLength(1);
    expect(result.current.activeChallenges).toHaveLength(0);
    expect(result.current.upcomingChallenges).toHaveLength(0);
  });

  it("현재 진행 중인 챌린지는 activeChallenges에 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      // 오늘(2026-03-15) 범위에 해당하는 챌린지
      result.current.createChallenge(makeChallengeInput({
        startDate: "2026-03-01",
        endDate: "2026-03-31",
      }));
    });
    expect(result.current.activeChallenges).toHaveLength(1);
    expect(result.current.completedList).toHaveLength(0);
    expect(result.current.upcomingChallenges).toHaveLength(0);
  });

  it("미래 챌린지는 upcomingChallenges에 포함된다", () => {
    const { result } = makeHook();
    act(() => {
      // 오늘(2026-03-15) 기준 아직 시작하지 않은 챌린지
      result.current.createChallenge(makeChallengeInput({
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      }));
    });
    expect(result.current.upcomingChallenges).toHaveLength(1);
    expect(result.current.activeChallenges).toHaveLength(0);
    expect(result.current.completedList).toHaveLength(0);
  });

  it("완료된 챌린지가 있으면 completionRate가 계산된다", () => {
    const { result } = makeHook();
    act(() => {
      // 완료된 챌린지
      result.current.createChallenge(makeChallengeInput({
        title: "완료됨",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      }));
    });
    act(() => {
      // 진행 중인 챌린지
      result.current.createChallenge(makeChallengeInput({
        title: "진행중",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
      }));
    });
    // 전체 2개 중 완료 1개 → 50%
    expect(result.current.completionRate).toBe(50);
  });
});

// ============================================================
// useGroupChallengeCard - categoryCounts & popularCategory
// ============================================================

describe("useGroupChallengeCard - categoryCounts 카테고리별 통계", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("choreography 챌린지 추가 시 categoryCounts.choreography가 1이 된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "choreography" }));
    });
    expect(result.current.categoryCounts.choreography).toBe(1);
  });

  it("가장 많은 카테고리가 popularCategory로 설정된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "fitness" }));
    });
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "fitness" }));
    });
    act(() => {
      result.current.createChallenge(makeChallengeInput({ category: "cover" }));
    });
    expect(result.current.popularCategory).toBe("fitness");
  });

  it("챌린지가 없으면 popularCategory는 null이다", () => {
    const { result } = makeHook();
    expect(result.current.popularCategory).toBeNull();
  });
});

// ============================================================
// useGroupChallengeCard - 그룹별 격리
// ============================================================

describe("useGroupChallengeCard - 그룹별 데이터 격리", () => {
  beforeEach(() => {
    clearStore();
    vi.clearAllMocks();
  });

  it("다른 groupId는 독립적인 entries를 가진다", () => {
    const { result: r1 } = renderHook(() => useGroupChallengeCard("group-A"));
    const { result: r2 } = renderHook(() => useGroupChallengeCard("group-B"));

    act(() => {
      r1.current.createChallenge(makeChallengeInput({ title: "그룹A 챌린지" }));
    });

    expect(r1.current.entries).toHaveLength(1);
    expect(r2.current.entries).toHaveLength(0);
  });
});
