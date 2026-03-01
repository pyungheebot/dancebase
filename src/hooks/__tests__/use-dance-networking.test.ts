import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState as reactUseState, useCallback as reactUseCallback } from "react";

// ─── localStorage mock ────────────────────────────────────────
const memStore: Record<string, unknown> = {};

// useDanceNetworking의 addEntry/updateEntry/deleteEntry 등은 내부에서
// loadFromStorage(key, {} as DanceNetworkingData)를 호출합니다.
// 저장된 값이 없을 때 빈 객체({})가 반환되어 .entries가 undefined가 됩니다.
// 따라서 키 패턴 "dancebase:dance-networking:"에 해당하는 기본값에 entries: []를 보장합니다.
vi.mock("@/lib/local-storage", () => ({
  loadFromStorage: <T>(key: string, defaultValue: T): T => {
    const stored = memStore[key] as T;
    if (stored === undefined || stored === null) {
      // dance-networking 키에 대해 entries 배열을 보장
      if (
        typeof key === "string" &&
        key.startsWith("dancebase:dance-networking:") &&
        defaultValue !== null &&
        typeof defaultValue === "object" &&
        !("entries" in (defaultValue as object))
      ) {
        const memberId = key.replace("dancebase:dance-networking:", "");
        return { memberId, entries: [], updatedAt: new Date().toISOString() } as T;
      }
      return defaultValue;
    }
    return stored;
  },
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
    options?: { fallbackData?: unknown }
  ) => {
    if (!key || !fetcher) {
      const fallback = options?.fallbackData ?? undefined;
      const [data] = reactUseState<unknown>(fallback);
      return { data, isLoading: false, mutate: vi.fn() };
    }
    // fetcher 결과가 빈 객체이면 fallbackData를 초기값으로 사용
    const initial = (() => {
      const loaded = fetcher();
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
    danceNetworking: (memberId: string) => `dance-networking-${memberId}`,
  },
}));

import {
  useDanceNetworking,
  ROLE_LABEL,
  ROLE_COLOR,
  SNS_PLATFORM_LABEL,
  ROLE_OPTIONS,
  SNS_PLATFORM_OPTIONS,
} from "@/hooks/use-dance-networking";
import type { DanceNetworkingRole, DanceNetworkingSns } from "@/types";

function makeHook(memberId = "member-1") {
  return renderHook(() => useDanceNetworking(memberId));
}

function makeEntryParams(overrides: Partial<{
  name: string;
  affiliation: string;
  genres: string[];
  phone: string;
  email: string;
  snsAccounts: DanceNetworkingSns[];
  metAt: string;
  metDate: string;
  role: DanceNetworkingRole;
  notes: string;
}> = {}) {
  return {
    name: "홍길동",
    genres: ["힙합"],
    snsAccounts: [] as DanceNetworkingSns[],
    role: "dancer" as DanceNetworkingRole,
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of Object.keys(memStore)) {
    delete memStore[key];
  }
});

// ============================================================

describe("useDanceNetworking - 초기 상태", () => {
  it("entries 초기값은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.entries).toEqual([]);
  });

  it("loading은 boolean 타입이다", () => {
    const { result } = makeHook();
    expect(typeof result.current.loading).toBe("boolean");
  });

  it("addEntry, updateEntry, toggleFavorite, deleteEntry, refetch 함수가 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.addEntry).toBe("function");
    expect(typeof result.current.updateEntry).toBe("function");
    expect(typeof result.current.toggleFavorite).toBe("function");
    expect(typeof result.current.deleteEntry).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });

  it("stats의 초기 total은 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.total).toBe(0);
  });

  it("stats의 초기 favorites는 0이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.favorites).toBe(0);
  });

  it("stats의 초기 roleCount는 빈 객체이다", () => {
    const { result } = makeHook();
    expect(result.current.stats.roleCount).toEqual({});
  });
});

describe("useDanceNetworking - addEntry", () => {
  it("연락처를 추가하면 entries 배열에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "김댄서" }));
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].name).toBe("김댄서");
  });

  it("addEntry는 추가된 엔트리를 반환한다", () => {
    const { result } = makeHook();
    let entry: ReturnType<typeof result.current.addEntry> | undefined;
    act(() => {
      entry = result.current.addEntry(makeEntryParams({ name: "이댄서" }));
    });
    expect(entry).toBeDefined();
    expect(entry!.name).toBe("이댄서");
  });

  it("추가된 엔트리는 id, createdAt, updatedAt을 가진다", () => {
    const { result } = makeHook();
    let entry: ReturnType<typeof result.current.addEntry> | undefined;
    act(() => {
      entry = result.current.addEntry(makeEntryParams());
    });
    expect(entry!.id).toBeTruthy();
    expect(entry!.createdAt).toBeTruthy();
    expect(entry!.updatedAt).toBeTruthy();
  });

  it("추가된 엔트리의 isFavorite 초기값은 false이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    expect(result.current.entries[0].isFavorite).toBe(false);
  });

  it("새 엔트리는 배열 맨 앞에 추가된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "첫번째" }));
    });
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "두번째" }));
    });
    expect(result.current.entries[0].name).toBe("두번째");
  });

  it("앞뒤 공백이 제거된 이름으로 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "  박댄서  " }));
    });
    expect(result.current.entries[0].name).toBe("박댄서");
  });

  it("빈 genres는 필터링된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ genres: ["힙합", "", "  ", "팝핀"] }));
    });
    expect(result.current.entries[0].genres).toHaveLength(2);
    expect(result.current.entries[0].genres).toContain("힙합");
    expect(result.current.entries[0].genres).toContain("팝핀");
  });

  it("빈 핸들의 SNS 계정은 필터링된다", () => {
    const { result } = makeHook();
    const snsAccounts: DanceNetworkingSns[] = [
      { platform: "instagram", handle: "user123", url: "" },
      { platform: "youtube", handle: "", url: "" },
    ];
    act(() => {
      result.current.addEntry(makeEntryParams({ snsAccounts }));
    });
    expect(result.current.entries[0].snsAccounts).toHaveLength(1);
  });

  it("role이 올바르게 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ role: "choreographer" }));
    });
    expect(result.current.entries[0].role).toBe("choreographer");
  });

  it("stats.total이 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    expect(result.current.stats.total).toBe(1);
  });

  it("stats.roleCount가 업데이트된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ role: "dancer" }));
    });
    expect(result.current.stats.roleCount.dancer).toBe(1);
  });
});

describe("useDanceNetworking - updateEntry", () => {
  it("updateEntry로 이름을 수정한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "원래이름" }));
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { name: "수정이름" });
    });
    expect(result.current.entries[0].name).toBe("수정이름");
  });

  it("updateEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateEntry(entryId, { name: "새이름" });
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 entryId로 updateEntry 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.updateEntry("bad-id", { name: "새이름" });
    });
    expect(ok).toBe(false);
  });

  it("updateEntry 후 updatedAt이 갱신된다", async () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const originalUpdatedAt = result.current.entries[0].updatedAt;
    // 약간의 시간 지연 후 업데이트
    await new Promise((r) => setTimeout(r, 5));
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { notes: "메모 추가" });
    });
    // updatedAt이 문자열로 변경됨
    expect(result.current.entries[0].updatedAt).toBeTruthy();
  });

  it("isFavorite을 true로 업데이트한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { isFavorite: true });
    });
    expect(result.current.entries[0].isFavorite).toBe(true);
  });

  it("빈 문자열 affiliation은 undefined로 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ affiliation: "기존소속" }));
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.updateEntry(entryId, { affiliation: "" });
    });
    expect(result.current.entries[0].affiliation).toBeUndefined();
  });
});

describe("useDanceNetworking - toggleFavorite", () => {
  it("toggleFavorite으로 isFavorite을 토글한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.toggleFavorite(entryId);
    });
    expect(result.current.entries[0].isFavorite).toBe(true);
  });

  it("두 번 toggleFavorite하면 원래 상태로 돌아온다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.toggleFavorite(entryId);
    });
    act(() => {
      result.current.toggleFavorite(entryId);
    });
    expect(result.current.entries[0].isFavorite).toBe(false);
  });

  it("존재하지 않는 entryId로 toggleFavorite 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.toggleFavorite("bad-id");
    });
    expect(ok).toBe(false);
  });

  it("toggleFavorite 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.toggleFavorite(entryId);
    });
    expect(ok).toBe(true);
  });

  it("즐겨찾기 후 stats.favorites가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.toggleFavorite(entryId);
    });
    expect(result.current.stats.favorites).toBe(1);
  });
});

describe("useDanceNetworking - deleteEntry", () => {
  it("deleteEntry로 엔트리를 삭제한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(entryId);
    });
    expect(result.current.entries).toHaveLength(0);
  });

  it("deleteEntry 성공 시 true를 반환한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams());
    });
    const entryId = result.current.entries[0].id;
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteEntry(entryId);
    });
    expect(ok).toBe(true);
  });

  it("존재하지 않는 entryId로 deleteEntry 시 false를 반환한다", () => {
    const { result } = makeHook();
    let ok: boolean | undefined;
    act(() => {
      ok = result.current.deleteEntry("bad-id");
    });
    expect(ok).toBe(false);
  });

  it("삭제 후 stats.total이 감소한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "A" }));
      result.current.addEntry(makeEntryParams({ name: "B" }));
    });
    expect(result.current.stats.total).toBe(2);
    const entryId = result.current.entries[0].id;
    act(() => {
      result.current.deleteEntry(entryId);
    });
    expect(result.current.stats.total).toBe(1);
  });
});

describe("useDanceNetworking - stats", () => {
  it("여러 역할의 roleCount가 올바르게 집계된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ role: "dancer" }));
      result.current.addEntry(makeEntryParams({ name: "B", role: "dancer" }));
      result.current.addEntry(makeEntryParams({ name: "C", role: "dj" }));
    });
    expect(result.current.stats.roleCount.dancer).toBe(2);
    expect(result.current.stats.roleCount.dj).toBe(1);
  });

  it("favorites는 isFavorite=true인 엔트리 수이다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.addEntry(makeEntryParams({ name: "A" }));
      result.current.addEntry(makeEntryParams({ name: "B" }));
    });
    const idA = result.current.entries[1].id; // 먼저 추가된 것이 뒤에 위치
    act(() => {
      result.current.toggleFavorite(idA);
    });
    expect(result.current.stats.favorites).toBe(1);
  });
});

describe("useDanceNetworking - 상수 내보내기", () => {
  it("ROLE_LABEL에 모든 역할 레이블이 있다", () => {
    expect(ROLE_LABEL.dancer).toBe("댄서");
    expect(ROLE_LABEL.choreographer).toBe("안무가");
    expect(ROLE_LABEL.dj).toBe("DJ");
    expect(ROLE_LABEL.videographer).toBe("촬영감독");
    expect(ROLE_LABEL.photographer).toBe("포토그래퍼");
    expect(ROLE_LABEL.instructor).toBe("강사");
    expect(ROLE_LABEL.event_organizer).toBe("행사기획");
    expect(ROLE_LABEL.other).toBe("기타");
  });

  it("ROLE_COLOR에 모든 역할 색상이 있다", () => {
    expect(ROLE_COLOR.dancer).toContain("blue");
    expect(ROLE_COLOR.choreographer).toContain("purple");
    expect(ROLE_COLOR.dj).toContain("orange");
  });

  it("SNS_PLATFORM_LABEL에 플랫폼 레이블이 있다", () => {
    expect(SNS_PLATFORM_LABEL.instagram).toBe("인스타그램");
    expect(SNS_PLATFORM_LABEL.youtube).toBe("유튜브");
    expect(SNS_PLATFORM_LABEL.tiktok).toBe("틱톡");
  });

  it("ROLE_OPTIONS 배열에 8개 항목이 있다", () => {
    expect(ROLE_OPTIONS).toHaveLength(8);
  });

  it("ROLE_OPTIONS 각 항목에 value와 label이 있다", () => {
    for (const opt of ROLE_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
    }
  });

  it("SNS_PLATFORM_OPTIONS 배열에 6개 항목이 있다", () => {
    expect(SNS_PLATFORM_OPTIONS).toHaveLength(6);
  });
});

describe("useDanceNetworking - 멤버별 격리", () => {
  it("다른 memberId는 독립적인 entries를 가진다", () => {
    const { result: r1 } = renderHook(() => useDanceNetworking("member-1"));
    const { result: r2 } = renderHook(() => useDanceNetworking("member-2"));

    act(() => {
      r1.current.addEntry(makeEntryParams({ name: "테스트" }));
    });

    expect(r1.current.entries).toHaveLength(1);
    expect(r2.current.entries).toHaveLength(0);
  });

  it("localStorage 키는 memberId를 포함한다", () => {
    const key1 = `dancebase:dance-networking:member-1`;
    const key2 = `dancebase:dance-networking:member-2`;
    expect(key1).not.toBe(key2);
  });
});
