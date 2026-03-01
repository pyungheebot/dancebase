import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDanceChallenge } from "@/hooks/use-dance-challenge";

// ─── @/lib/local-storage mock ────────────────────────────────
const memStore = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  return store;
});

vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    if (key in memStore) {
      return memStore[key] as T;
    }
    return defaultValue;
  },
  saveToStorage: <T>(key: string, value: T): void => {
    memStore[key] = value;
  },
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── SWR mock (useState 기반, mutate 호출 시 실제 리렌더링) ──
vi.mock("swr", async () => {
  const { useState, useCallback } = await import("react");

  const globalStore = new Map<string, unknown>();

  // 전역 리스너 맵: key → Set of updater fns
  const listeners = new Map<string, Set<(v: unknown) => void>>();

  function subscribe(key: string, updater: (v: unknown) => void) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(updater);
    return () => listeners.get(key)?.delete(updater);
  }

  function notify(key: string, value: unknown) {
    listeners.get(key)?.forEach((fn) => fn(value));
  }

  function resetStore() {
    globalStore.clear();
    listeners.clear();
  }

  function useSWR(key: string | null, fetcher: (() => unknown) | null) {
    const init = (() => {
      if (!key || !fetcher) return undefined;
      if (!globalStore.has(key)) globalStore.set(key, fetcher());
      return globalStore.get(key);
    })();

    const [data, setData] = useState<unknown>(init);

    // key가 변경되면 최신 값으로 동기화
    const unsub = subscribe(key ?? "__null__", (v) => setData(v));
    // cleanup은 동기적으로 즉시 해제하면 안 되므로 ref 패턴 대신 직접 반환
    void unsub; // 실제로는 effect에서 정리해야 하지만 테스트에서는 누출 허용

    const mutate = useCallback(
      (newData?: unknown, _revalidate?: boolean) => {
        const k = key;
        if (!k) return;
        const next =
          newData !== undefined ? newData : fetcher ? fetcher() : undefined;
        globalStore.set(k, next);
        setData(next);
        notify(k, next);
      },
      [key, fetcher]
    );

    return { data, mutate };
  }

  // @ts-expect-error default export
  useSWR.__reset = resetStore;
  // @ts-expect-error default export
  useSWR.__store = globalStore;

  return { default: useSWR };
});

function resetSWRStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swr = require("swr");
  if (swr.default.__reset) swr.default.__reset();
}

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── crypto.randomUUID mock ─────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: () => `challenge-uuid-${++uuidCounter}`,
});

vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceChallenge: (groupId: string) => `dance-challenge-${groupId}`,
  },
}));

beforeEach(() => {
  // memStore 초기화
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
  uuidCounter = 0;
  resetSWRStore();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-03-02T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────
// 1. 초기 상태
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - 초기 상태", () => {
  it("초기 challenges는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-init"));
    expect(result.current.challenges).toEqual([]);
  });

  it("초기 activeChallenges는 0이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-init"));
    expect(result.current.activeChallenges).toBe(0);
  });

  it("초기 totalParticipants는 0이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-init"));
    expect(result.current.totalParticipants).toBe(0);
  });

  it("초기 completionRate는 0이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-init"));
    expect(result.current.completionRate).toBe(0);
  });

  it("필요한 함수들이 모두 존재한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-init"));
    expect(typeof result.current.addChallenge).toBe("function");
    expect(typeof result.current.deleteChallenge).toBe("function");
    expect(typeof result.current.joinChallenge).toBe("function");
    expect(typeof result.current.updateProgress).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("groupId가 빈 문자열이면 challenges는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceChallenge(""));
    expect(result.current.challenges).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. computeStatus 순수 로직 검증
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - computeStatus 간접 검증", () => {
  it("오늘 이전 시작일 + 오늘 이후 종료일이면 active 상태다", () => {
    // 오늘: 2026-03-02
    const { result } = renderHook(() => useDanceChallenge("group-status-1"));
    act(() => {
      result.current.addChallenge({
        title: "진행 중 챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    const saved = memStore[`dancebase:challenges:group-status-1`] as Array<{ status: string }>;
    expect(saved[0].status).toBe("active");
  });

  it("오늘 이후 시작일이면 upcoming 상태다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-status-2"));
    act(() => {
      result.current.addChallenge({
        title: "예정 챌린지",
        description: "",
        category: "freestyle",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        targetCount: 5,
        reward: "",
      });
    });
    const saved = memStore[`dancebase:challenges:group-status-2`] as Array<{ status: string }>;
    expect(saved[0].status).toBe("upcoming");
  });

  it("종료일이 오늘 이전이면 ended 상태다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-status-3"));
    act(() => {
      result.current.addChallenge({
        title: "종료된 챌린지",
        description: "",
        category: "cover",
        startDate: "2026-02-01",
        endDate: "2026-02-28",
        targetCount: 5,
        reward: "",
      });
    });
    const saved = memStore[`dancebase:challenges:group-status-3`] as Array<{ status: string }>;
    expect(saved[0].status).toBe("ended");
  });

  it("오늘이 startDate와 같으면 active 상태다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-status-4"));
    act(() => {
      result.current.addChallenge({
        title: "오늘 시작 챌린지",
        description: "",
        category: "endurance",
        startDate: "2026-03-02",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    const saved = memStore[`dancebase:challenges:group-status-4`] as Array<{ status: string }>;
    expect(saved[0].status).toBe("active");
  });

  it("오늘이 endDate와 같으면 active 상태다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-status-5"));
    act(() => {
      result.current.addChallenge({
        title: "오늘 종료 챌린지",
        description: "",
        category: "flexibility",
        startDate: "2026-03-01",
        endDate: "2026-03-02",
        targetCount: 5,
        reward: "",
      });
    });
    const saved = memStore[`dancebase:challenges:group-status-5`] as Array<{ status: string }>;
    expect(saved[0].status).toBe("active");
  });
});

// ─────────────────────────────────────────────────────────────
// 3. addChallenge
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - addChallenge", () => {
  it("정상 생성 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-1"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "새 챌린지",
        description: "설명",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "메달",
      });
    });
    expect(returned!).toBe(true);
  });

  it("title이 빈 문자열이면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-2"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
    expect(result.current.challenges).toHaveLength(0);
  });

  it("title이 공백만이면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-3"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "   ",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
  });

  it("startDate가 없으면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-4"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
  });

  it("endDate가 없으면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "",
        targetCount: 10,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
  });

  it("startDate가 endDate보다 늦으면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-6"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-31",
        endDate: "2026-03-01",
        targetCount: 10,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
  });

  it("targetCount가 0이면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-7"));
    let returned: boolean;
    act(() => {
      returned = result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 0,
        reward: "",
      });
    });
    expect(returned!).toBe(false);
  });

  it("정상 생성 후 challenges에 항목이 추가된다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-8"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(result.current.challenges).toHaveLength(1);
  });

  it("생성된 챌린지의 title이 trim된 값이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-9"));
    act(() => {
      result.current.addChallenge({
        title: "  타이틀  ",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(result.current.challenges[0].title).toBe("타이틀");
  });

  it("생성된 챌린지의 participants는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-10"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(result.current.challenges[0].participants).toEqual([]);
  });

  it("생성 후 memStore에 저장된다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-add-11"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 10,
        reward: "",
      });
    });
    expect(memStore["dancebase:challenges:group-add-11"]).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// 4. deleteChallenge
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - deleteChallenge", () => {
  it("존재하는 챌린지 삭제 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-del-1"));
    act(() => {
      result.current.addChallenge({
        title: "삭제할 챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    let returned: boolean;
    act(() => {
      returned = result.current.deleteChallenge(challengeId);
    });
    expect(returned!).toBe(true);
  });

  it("존재하는 챌린지 삭제 후 challenges에서 제거된다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-del-2"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.deleteChallenge(challengeId);
    });
    expect(result.current.challenges).toHaveLength(0);
  });

  it("존재하지 않는 ID 삭제 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-del-3"));
    let returned: boolean;
    act(() => {
      returned = result.current.deleteChallenge("non-existent");
    });
    expect(returned!).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. joinChallenge
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - joinChallenge", () => {
  it("정상 참여 시 true를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-1"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    let returned: boolean;
    act(() => {
      returned = result.current.joinChallenge(challengeId, "홍길동");
    });
    expect(returned!).toBe(true);
  });

  it("참여 후 participants 수가 증가한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-2"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    expect(result.current.challenges[0].participants).toHaveLength(1);
  });

  it("참여자의 초기 progress는 0이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-3"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    expect(result.current.challenges[0].participants[0].progress).toBe(0);
  });

  it("이름이 빈 문자열이면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-4"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    let returned: boolean;
    act(() => {
      returned = result.current.joinChallenge(challengeId, "");
    });
    expect(returned!).toBe(false);
  });

  it("존재하지 않는 challengeId이면 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-5"));
    let returned: boolean;
    act(() => {
      returned = result.current.joinChallenge("non-existent", "홍길동");
    });
    expect(returned!).toBe(false);
  });

  it("동일 이름으로 중복 참여 시 false를 반환한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-6"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    let returned: boolean;
    act(() => {
      returned = result.current.joinChallenge(challengeId, "홍길동");
    });
    expect(returned!).toBe(false);
    expect(result.current.challenges[0].participants).toHaveLength(1);
  });

  it("대소문자 구분 없이 중복 참여를 막는다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-join-7"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "Alice");
    });
    let returned: boolean;
    act(() => {
      returned = result.current.joinChallenge(challengeId, "alice");
    });
    expect(returned!).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. updateProgress
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - updateProgress", () => {
  function setupChallengeWithParticipant(groupId: string) {
    const { result } = renderHook(() => useDanceChallenge(groupId));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    const participantId = result.current.challenges[0].participants[0].id;
    return { result, challengeId, participantId };
  }

  it("진행률 업데이트 후 progress가 변경된다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-1");
    act(() => {
      result.current.updateProgress(challengeId, participantId, 50);
    });
    expect(result.current.challenges[0].participants[0].progress).toBe(50);
  });

  it("progress가 100 초과이면 100으로 clamp된다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-2");
    act(() => {
      result.current.updateProgress(challengeId, participantId, 150);
    });
    expect(result.current.challenges[0].participants[0].progress).toBe(100);
  });

  it("progress가 음수이면 0으로 clamp된다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-3");
    act(() => {
      result.current.updateProgress(challengeId, participantId, -10);
    });
    expect(result.current.challenges[0].participants[0].progress).toBe(0);
  });

  it("progress가 100이면 completedAt이 설정된다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-4");
    act(() => {
      result.current.updateProgress(challengeId, participantId, 100);
    });
    expect(result.current.challenges[0].participants[0].completedAt).toBeTruthy();
  });

  it("progress가 100 미만이면 completedAt이 없다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-5");
    act(() => {
      result.current.updateProgress(challengeId, participantId, 80);
    });
    expect(result.current.challenges[0].participants[0].completedAt).toBeUndefined();
  });

  it("true를 반환한다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-6");
    let returned: boolean;
    act(() => {
      returned = result.current.updateProgress(challengeId, participantId, 50);
    });
    expect(returned!).toBe(true);
  });

  it("소수점 progress는 반올림된다", () => {
    const { result, challengeId, participantId } = setupChallengeWithParticipant("group-prog-7");
    act(() => {
      result.current.updateProgress(challengeId, participantId, 33.7);
    });
    expect(result.current.challenges[0].participants[0].progress).toBe(34);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. 통계 계산
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - 통계 계산", () => {
  it("active 챌린지가 생기면 activeChallenges 카운트가 증가한다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-stat-1"));
    act(() => {
      result.current.addChallenge({
        title: "진행 중",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    expect(result.current.activeChallenges).toBe(1);
  });

  it("ended 챌린지는 activeChallenges에 포함되지 않는다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-stat-2"));
    act(() => {
      result.current.addChallenge({
        title: "종료된",
        description: "",
        category: "technique",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        targetCount: 5,
        reward: "",
      });
    });
    expect(result.current.activeChallenges).toBe(0);
  });

  it("참여자 합계가 totalParticipants에 반영된다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-stat-3"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    act(() => {
      result.current.joinChallenge(challengeId, "김철수");
    });
    expect(result.current.totalParticipants).toBe(2);
  });

  it("모든 참여자가 100%이면 completionRate는 100이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-stat-4"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    const challengeId = result.current.challenges[0].id;
    act(() => {
      result.current.joinChallenge(challengeId, "홍길동");
    });
    const participantId = result.current.challenges[0].participants[0].id;
    act(() => {
      result.current.updateProgress(challengeId, participantId, 100);
    });
    expect(result.current.completionRate).toBe(100);
  });

  it("참여자가 없으면 completionRate는 0이다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-stat-5"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    expect(result.current.completionRate).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. 그룹별 격리
// ─────────────────────────────────────────────────────────────

describe("useDanceChallenge - 그룹별 격리", () => {
  it("다른 groupId의 훅은 독립된 challenges를 가진다", () => {
    const { result: r1 } = renderHook(() => useDanceChallenge("group-iso-A"));
    const { result: r2 } = renderHook(() => useDanceChallenge("group-iso-B"));

    act(() => {
      r1.current.addChallenge({
        title: "그룹A 챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });

    expect(r1.current.challenges).toHaveLength(1);
    expect(r2.current.challenges).toHaveLength(0);
  });

  it("groupId가 falsy이면 challenges는 빈 배열이다", () => {
    const { result } = renderHook(() => useDanceChallenge(""));
    expect(result.current.challenges).toEqual([]);
  });

  it("group-C에 추가해도 group-D memStore에 저장되지 않는다", () => {
    const { result } = renderHook(() => useDanceChallenge("group-iso-C"));
    act(() => {
      result.current.addChallenge({
        title: "챌린지",
        description: "",
        category: "technique",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        targetCount: 5,
        reward: "",
      });
    });
    expect(memStore["dancebase:challenges:group-iso-C"]).toBeDefined();
    expect(memStore["dancebase:challenges:group-iso-D"]).toBeUndefined();
  });
});
