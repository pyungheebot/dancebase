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

// ─── SWR mock (useBattleTournament은 SWR을 사용하지 않음) ─────
vi.mock("swr", () => ({
  default: vi.fn(),
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {},
}));

// ─── Supabase mock ────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}));

import { useBattleTournament } from "@/hooks/use-battle-tournament";
import type { TournamentFormat } from "@/types";

const GROUP_A = "group-battle-aaa";
const GROUP_B = "group-battle-bbb";

const PARTICIPANTS_4 = ["Alice", "Bob", "Charlie", "Dave"];
const PARTICIPANTS_3 = ["Alice", "Bob", "Charlie"];
const PARTICIPANTS_2 = ["Alice", "Bob"];

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ─── 1. 초기 상태 ─────────────────────────────────────────────

describe("useBattleTournament - 초기 상태", () => {
  it("tournaments는 빈 배열이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.tournaments).toEqual([]);
  });

  it("loading은 false이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.loading).toBe(false);
  });

  it("createTournament 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.createTournament).toBe("function");
  });

  it("startTournament 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.startTournament).toBe("function");
  });

  it("recordResult 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.recordResult).toBe("function");
  });

  it("completeTournament 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.completeTournament).toBe("function");
  });

  it("deleteTournament 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.deleteTournament).toBe("function");
  });

  it("stats 객체가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.stats).toBeDefined();
  });

  it("refetch 함수가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats.totalTournaments는 0이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.stats.totalTournaments).toBe(0);
  });

  it("stats.activeTournament는 null이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.stats.activeTournament).toBeNull();
  });

  it("stats.recentChampion은 null이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    expect(result.current.stats.recentChampion).toBeNull();
  });
});

// ─── 2. createTournament ─────────────────────────────────────

describe("useBattleTournament - createTournament", () => {
  it("createTournament 호출 시 tournaments 배열에 추가된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    act(() => {
      result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(result.current.tournaments).toHaveLength(1);
  });

  it("생성된 토너먼트의 status는 'upcoming'이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(tournament?.status).toBe("upcoming");
  });

  it("생성된 토너먼트의 id가 존재한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(tournament?.id).toBeTruthy();
  });

  it("생성된 토너먼트의 participants가 올바르다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(tournament?.participants).toEqual(PARTICIPANTS_4);
  });

  it("stats.totalTournaments가 createTournament 후 증가한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    act(() => {
      result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(result.current.stats.totalTournaments).toBe(1);
  });

  it("createTournament 후 localStorage에 저장된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    act(() => {
      result.current.createTournament("배틀 대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    const stored = memStore[`dancebase:battle-tournament:${GROUP_A}`];
    expect(Array.isArray(stored)).toBe(true);
    expect((stored as unknown[]).length).toBe(1);
  });
});

// ─── 3. generateMatches 로직 (single_elimination) ─────────────

describe("useBattleTournament - single_elimination 매치 생성", () => {
  it("4명 single_elimination: 1라운드 매치가 2개 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });
    expect(tournament?.matches).toHaveLength(2);
  });

  it("2명 single_elimination: 1라운드 매치가 1개 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_2, "관리자");
    });
    expect(tournament?.matches).toHaveLength(1);
  });

  it("3명 single_elimination: 홀수 참가자 → 부전승 포함 2개 매치", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_3, "관리자");
    });
    // 1쌍 + 부전승 1개 = 2개
    expect(tournament?.matches).toHaveLength(2);
  });

  it("3명 홀수 → 마지막 매치의 player2가 '부전승'이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_3, "관리자");
    });
    const byeMatch = tournament?.matches.find((m) => m.player2 === "부전승");
    expect(byeMatch).toBeDefined();
  });

  it("3명 홀수 → 부전승 매치의 winner가 player1이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_3, "관리자");
    });
    const byeMatch = tournament?.matches.find((m) => m.player2 === "부전승");
    expect(byeMatch?.winner).toBe(byeMatch?.player1);
  });
});

// ─── 4. generateMatches 로직 (round_robin) ────────────────────

describe("useBattleTournament - round_robin 매치 생성", () => {
  it("4명 round_robin: C(4,2)=6개 매치가 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "round_robin", PARTICIPANTS_4, "관리자");
    });
    expect(tournament?.matches).toHaveLength(6);
  });

  it("2명 round_robin: 1개 매치가 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "round_robin", PARTICIPANTS_2, "관리자");
    });
    expect(tournament?.matches).toHaveLength(1);
  });

  it("3명 round_robin: C(3,2)=3개 매치가 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "round_robin", PARTICIPANTS_3, "관리자");
    });
    expect(tournament?.matches).toHaveLength(3);
  });

  it("round_robin 매치의 모든 round는 1이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "round_robin", PARTICIPANTS_4, "관리자");
    });
    for (const match of tournament!.matches) {
      expect(match.round).toBe(1);
    }
  });
});

// ─── 5. startTournament ──────────────────────────────────────

describe("useBattleTournament - startTournament", () => {
  it("upcoming 토너먼트를 시작하면 status가 in_progress로 변경된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      result.current.startTournament(id!);
    });
    expect(result.current.tournaments[0].status).toBe("in_progress");
  });

  it("startTournament는 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      success = result.current.startTournament(id!);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 startTournament 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let success: boolean | undefined;
    act(() => {
      success = result.current.startTournament("nonexistent");
    });
    expect(success).toBe(false);
  });

  it("이미 in_progress인 토너먼트를 start하면 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      result.current.startTournament(id!);
    });
    act(() => {
      success = result.current.startTournament(id!);
    });
    expect(success).toBe(false);
  });

  it("startTournament 후 stats.activeTournament가 설정된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      result.current.startTournament(id!);
    });
    expect(result.current.stats.activeTournament).not.toBeNull();
    expect(result.current.stats.activeTournament?.id).toBe(id);
  });
});

// ─── 6. recordResult ─────────────────────────────────────────

describe("useBattleTournament - recordResult", () => {
  it("매치 결과 기록 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournamentId: string | undefined;
    let matchId: string | undefined;
    let success: boolean | undefined;

    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      tournamentId = t.id;
      matchId = t.matches[0].id;
      result.current.startTournament(t.id);
    });
    act(() => {
      success = result.current.recordResult(tournamentId!, matchId!, "Alice");
    });
    expect(success).toBe(true);
  });

  it("recordResult 후 해당 매치의 winner가 설정된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournamentId: string | undefined;
    let matchId: string | undefined;

    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      tournamentId = t.id;
      matchId = t.matches[0].id;
    });
    act(() => {
      result.current.recordResult(tournamentId!, matchId!, "Alice", 3, 1);
    });
    const match = result.current.tournaments[0].matches.find((m) => m.id === matchId);
    expect(match?.winner).toBe("Alice");
  });

  it("recordResult 후 score1, score2가 설정된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournamentId: string | undefined;
    let matchId: string | undefined;

    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      tournamentId = t.id;
      matchId = t.matches[0].id;
    });
    act(() => {
      result.current.recordResult(tournamentId!, matchId!, "Alice", 3, 1);
    });
    const match = result.current.tournaments[0].matches.find((m) => m.id === matchId);
    expect(match?.score1).toBe(3);
    expect(match?.score2).toBe(1);
  });

  it("존재하지 않는 tournamentId로 recordResult 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let success: boolean | undefined;
    act(() => {
      success = result.current.recordResult("nonexistent", "match-id", "Alice");
    });
    expect(success).toBe(false);
  });

  it("존재하지 않는 matchId로 recordResult 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournamentId: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      tournamentId = t.id;
    });
    act(() => {
      success = result.current.recordResult(tournamentId!, "nonexistent-match", "Alice");
    });
    expect(success).toBe(false);
  });
});

// ─── 7. completeTournament ───────────────────────────────────

describe("useBattleTournament - completeTournament", () => {
  it("completeTournament 호출 시 status가 completed로 변경된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
      result.current.startTournament(id);
    });
    act(() => {
      result.current.completeTournament(id!);
    });
    expect(result.current.tournaments[0].status).toBe("completed");
  });

  it("completeTournament는 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_2, "관리자");
      id = t.id;
    });
    act(() => {
      success = result.current.completeTournament(id!);
    });
    expect(success).toBe(true);
  });

  it("이미 completed인 토너먼트를 complete하면 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_2, "관리자");
      id = t.id;
    });
    act(() => {
      result.current.completeTournament(id!);
    });
    act(() => {
      success = result.current.completeTournament(id!);
    });
    expect(success).toBe(false);
  });

  it("매치 결과 기록 후 completeTournament 시 champion이 설정된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let matchId: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "round_robin", PARTICIPANTS_2, "관리자");
      id = t.id;
      matchId = t.matches[0].id;
    });
    act(() => {
      result.current.recordResult(id!, matchId!, "Alice");
    });
    act(() => {
      result.current.completeTournament(id!);
    });
    expect(result.current.tournaments[0].champion).toBe("Alice");
  });

  it("완료 후 stats.recentChampion이 설정된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let matchId: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "round_robin", PARTICIPANTS_2, "관리자");
      id = t.id;
      matchId = t.matches[0].id;
    });
    act(() => {
      result.current.recordResult(id!, matchId!, "Alice");
    });
    act(() => {
      result.current.completeTournament(id!);
    });
    expect(result.current.stats.recentChampion).toBe("Alice");
  });

  it("존재하지 않는 id로 completeTournament 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let success: boolean | undefined;
    act(() => {
      success = result.current.completeTournament("nonexistent");
    });
    expect(success).toBe(false);
  });
});

// ─── 8. deleteTournament ─────────────────────────────────────

describe("useBattleTournament - deleteTournament", () => {
  it("deleteTournament 호출 시 해당 토너먼트가 제거된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      result.current.deleteTournament(id!);
    });
    expect(result.current.tournaments).toHaveLength(0);
  });

  it("deleteTournament는 성공 시 true를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let id: string | undefined;
    let success: boolean | undefined;
    act(() => {
      const t = result.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
      id = t.id;
    });
    act(() => {
      success = result.current.deleteTournament(id!);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 id로 deleteTournament 호출 시 false를 반환한다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let success: boolean | undefined;
    act(() => {
      success = result.current.deleteTournament("nonexistent");
    });
    expect(success).toBe(false);
  });
});

// ─── 9. 그룹별 격리 ─────────────────────────────────────────

describe("useBattleTournament - 그룹별 격리", () => {
  it("그룹 A에 토너먼트를 추가해도 그룹 B에 영향을 주지 않는다", () => {
    const { result: resA } = renderHook(() => useBattleTournament(GROUP_A));
    const { result: resB } = renderHook(() => useBattleTournament(GROUP_B));

    act(() => {
      resA.current.createTournament("대회", "single_elimination", PARTICIPANTS_4, "관리자");
    });

    expect(resA.current.tournaments).toHaveLength(1);
    expect(resB.current.tournaments).toHaveLength(0);
  });
});

// ─── 10. 경계값 ──────────────────────────────────────────────

describe("useBattleTournament - 경계값", () => {
  it("빈 participants 배열로 single_elimination 생성 시 매치가 0개이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", [], "관리자");
    });
    expect(tournament?.matches).toHaveLength(0);
  });

  it("빈 participants 배열로 round_robin 생성 시 매치가 0개이다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "round_robin", [], "관리자");
    });
    expect(tournament?.matches).toHaveLength(0);
  });

  it("1명 참가자 single_elimination 시 부전승 매치 1개가 생성된다", () => {
    const { result } = renderHook(() => useBattleTournament(GROUP_A));
    let tournament: ReturnType<typeof result.current.createTournament> | undefined;
    act(() => {
      tournament = result.current.createTournament("대회", "single_elimination", ["Solo"], "관리자");
    });
    expect(tournament?.matches).toHaveLength(1);
    expect(tournament?.matches[0].player2).toBe("부전승");
  });
});
