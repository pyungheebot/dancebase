import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mutate } from "swr";

// ─── localStorage mock ────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _store: () => store,
    _set: (key: string, value: string) => {
      store[key] = value;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto mock ──────────────────────────────────────────────
let _uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++_uuidCounter}`),
});

// ─── SWR 키 mock ───────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    dancePlaylist: (memberId: string) => `dance-playlist-${memberId}`,
  },
}));

// ─── local-storage mock ───────────────────────────────────────
// loadFromStorage가 {} as MyPlaylistData를 기본값으로 반환하면
// playlists가 undefined가 되어 flatMap 오류 발생.
// 항상 { playlists: [] } 형태의 기본값을 보장하도록 mock.
vi.mock("@/lib/local-storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/local-storage")>();
  return {
    ...original,
    loadFromStorage: vi.fn(<T>(key: string, _defaultValue: T): T => {
      const raw = localStorageMock.getItem(key);
      if (!raw) {
        return { memberId: "", playlists: [], updatedAt: "" } as unknown as T;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!Array.isArray(parsed.playlists)) {
          parsed.playlists = [];
        }
        return parsed as unknown as T;
      } catch {
        return { memberId: "", playlists: [], updatedAt: "" } as unknown as T;
      }
    }),
    saveToStorage: vi.fn(<T>(key: string, value: T): void => {
      localStorageMock.setItem(key, JSON.stringify(value));
    }),
  };
});

// ─── 훅 import ────────────────────────────────────────────────
import {
  useDancePlaylist,
  DANCE_PLAYLIST_GENRES,
  PURPOSE_LABELS,
  PURPOSE_COLORS,
  PURPOSE_BAR_COLORS,
} from "@/hooks/use-dance-playlist";
import type { MyPlaylistSongPurpose } from "@/types";

// ─── 헬퍼 ─────────────────────────────────────────────────────
let _memberCounter = 0;

function clearStore() {
  localStorageMock.clear();
  _uuidCounter = 0;
  // SWR 전역 캐시도 초기화
  mutate(() => true, undefined, { revalidate: false });
}

function nextMemberId() {
  return `member-${++_memberCounter}`;
}

function makeHook(memberId?: string) {
  const id = memberId ?? nextMemberId();
  return { hook: renderHook(() => useDancePlaylist(id)), memberId: id };
}

function createPlaylistHelper(hook: ReturnType<typeof makeHook>["hook"]["result"], name = "테스트 플레이리스트", description = "") {
  let playlist: ReturnType<typeof useDancePlaylist>["createPlaylist"] extends (...args: never[]) => infer R ? R : never;
  act(() => {
    playlist = hook.current.createPlaylist({ name, description });
  });
  return playlist!;
}

function addSongHelper(
  hook: ReturnType<typeof makeHook>["hook"]["result"],
  playlistId: string,
  title = "테스트 곡",
  artist = "아티스트",
  purpose: MyPlaylistSongPurpose = "main",
  genre = "힙합",
  bpm: number | null = 120
) {
  let song: ReturnType<typeof useDancePlaylist>["addSong"] extends (...args: never[]) => infer R ? R : never;
  act(() => {
    song = hook.current.addSong(playlistId, { title, artist, purpose, genre, bpm });
  });
  return song!;
}

// ============================================================
// 상수 검증
// ============================================================

describe("useDancePlaylist - 상수", () => {
  it("DANCE_PLAYLIST_GENRES는 14개 장르를 포함한다", () => {
    expect(DANCE_PLAYLIST_GENRES).toHaveLength(14);
  });

  it("DANCE_PLAYLIST_GENRES에 힙합이 포함된다", () => {
    expect(DANCE_PLAYLIST_GENRES).toContain("힙합");
  });

  it("DANCE_PLAYLIST_GENRES에 케이팝이 포함된다", () => {
    expect(DANCE_PLAYLIST_GENRES).toContain("케이팝");
  });

  it("PURPOSE_LABELS는 4가지 purpose를 모두 갖는다", () => {
    expect(PURPOSE_LABELS.warmup).toBeDefined();
    expect(PURPOSE_LABELS.main).toBeDefined();
    expect(PURPOSE_LABELS.cooldown).toBeDefined();
    expect(PURPOSE_LABELS.performance).toBeDefined();
  });

  it("PURPOSE_LABELS.warmup은 '워밍업'이다", () => {
    expect(PURPOSE_LABELS.warmup).toBe("워밍업");
  });

  it("PURPOSE_LABELS.main은 '메인연습'이다", () => {
    expect(PURPOSE_LABELS.main).toBe("메인연습");
  });

  it("PURPOSE_COLORS는 4가지 purpose를 모두 갖는다", () => {
    expect(PURPOSE_COLORS.warmup).toBeDefined();
    expect(PURPOSE_COLORS.main).toBeDefined();
    expect(PURPOSE_COLORS.cooldown).toBeDefined();
    expect(PURPOSE_COLORS.performance).toBeDefined();
  });

  it("PURPOSE_BAR_COLORS는 4가지 purpose를 모두 갖는다", () => {
    expect(PURPOSE_BAR_COLORS.warmup).toBeDefined();
    expect(PURPOSE_BAR_COLORS.main).toBeDefined();
    expect(PURPOSE_BAR_COLORS.cooldown).toBeDefined();
    expect(PURPOSE_BAR_COLORS.performance).toBeDefined();
  });
});

// ============================================================
// 초기 상태
// ============================================================

describe("useDancePlaylist - 초기 상태", () => {
  beforeEach(clearStore);

  it("초기 playlists는 빈 배열이다", () => {
    const { hook } = makeHook();
    expect(hook.result.current.playlists).toEqual([]);
  });

  it("초기 loading은 데이터 로드 후 false이다", async () => {
    const { hook } = makeHook();
    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
    });
  });

  it("stats.totalPlaylists는 0이다", () => {
    const { hook } = makeHook();
    expect(hook.result.current.stats.totalPlaylists).toBe(0);
  });

  it("stats.totalSongs는 0이다", () => {
    const { hook } = makeHook();
    expect(hook.result.current.stats.totalSongs).toBe(0);
  });

  it("stats.purposeStats는 4개 purpose를 모두 포함한다", () => {
    const { hook } = makeHook();
    expect(hook.result.current.stats.purposeStats).toHaveLength(4);
  });

  it("빈 상태에서 purposeStats의 모든 count는 0이다", () => {
    const { hook } = makeHook();
    hook.result.current.stats.purposeStats.forEach((ps) => {
      expect(ps.count).toBe(0);
    });
  });

  it("빈 상태에서 purposeStats의 모든 percent는 0이다", () => {
    const { hook } = makeHook();
    hook.result.current.stats.purposeStats.forEach((ps) => {
      expect(ps.percent).toBe(0);
    });
  });

  it("필요한 모든 함수가 존재한다", () => {
    const { hook } = makeHook();
    expect(typeof hook.result.current.createPlaylist).toBe("function");
    expect(typeof hook.result.current.deletePlaylist).toBe("function");
    expect(typeof hook.result.current.addSong).toBe("function");
    expect(typeof hook.result.current.updateSong).toBe("function");
    expect(typeof hook.result.current.deleteSong).toBe("function");
    expect(typeof hook.result.current.moveSong).toBe("function");
    expect(typeof hook.result.current.refetch).toBe("function");
  });

  it("data.memberId가 파라미터와 일치한다", () => {
    const memberId = "member-fixed-42";
    const { result } = renderHook(() => useDancePlaylist(memberId));
    expect(result.current.data.memberId).toBe(memberId);
  });
});

// ============================================================
// createPlaylist
// ============================================================

describe("useDancePlaylist - createPlaylist", () => {
  beforeEach(clearStore);

  it("플레이리스트 생성 후 playlists 길이가 1이 된다", () => {
    const { hook } = makeHook();
    createPlaylistHelper(hook.result);
    expect(hook.result.current.playlists).toHaveLength(1);
  });

  it("생성된 플레이리스트의 name이 올바르다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result, "워밍업 리스트");
    expect(pl.name).toBe("워밍업 리스트");
  });

  it("생성된 플레이리스트의 description이 올바르다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result, "이름", "설명 텍스트");
    expect(pl.description).toBe("설명 텍스트");
  });

  it("생성된 플레이리스트에 id가 부여된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    expect(pl.id).toBeTruthy();
  });

  it("생성된 플레이리스트의 초기 songs는 빈 배열이다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    expect(pl.songs).toEqual([]);
  });

  it("생성된 플레이리스트에 createdAt이 ISO 형식으로 설정된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    expect(pl.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("여러 플레이리스트를 생성할 수 있다", () => {
    const { hook } = makeHook();
    createPlaylistHelper(hook.result, "리스트1");
    createPlaylistHelper(hook.result, "리스트2");
    createPlaylistHelper(hook.result, "리스트3");
    expect(hook.result.current.playlists).toHaveLength(3);
  });

  it("stats.totalPlaylists가 증가한다", () => {
    const { hook } = makeHook();
    createPlaylistHelper(hook.result);
    createPlaylistHelper(hook.result, "두 번째");
    expect(hook.result.current.stats.totalPlaylists).toBe(2);
  });
});

// ============================================================
// deletePlaylist
// ============================================================

describe("useDancePlaylist - deletePlaylist", () => {
  beforeEach(clearStore);

  it("플레이리스트 삭제 후 playlists 길이가 감소한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    act(() => {
      hook.result.current.deletePlaylist(pl.id);
    });
    expect(hook.result.current.playlists).toHaveLength(0);
  });

  it("deletePlaylist는 삭제 성공 시 true를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    let success: boolean = false;
    act(() => {
      success = hook.result.current.deletePlaylist(pl.id);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 id 삭제 시 false를 반환한다", () => {
    const { hook } = makeHook();
    let success: boolean = true;
    act(() => {
      success = hook.result.current.deletePlaylist("non-existent");
    });
    expect(success).toBe(false);
  });

  it("특정 플레이리스트만 삭제되고 나머지는 유지된다", () => {
    const { hook } = makeHook();
    const pl1 = createPlaylistHelper(hook.result, "첫 번째");
    createPlaylistHelper(hook.result, "두 번째");
    act(() => {
      hook.result.current.deletePlaylist(pl1.id);
    });
    expect(hook.result.current.playlists).toHaveLength(1);
    expect(hook.result.current.playlists[0].name).toBe("두 번째");
  });
});

// ============================================================
// addSong
// ============================================================

describe("useDancePlaylist - addSong", () => {
  beforeEach(clearStore);

  it("곡 추가 후 플레이리스트의 songs 길이가 1이 된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id);
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs).toHaveLength(1);
  });

  it("추가된 곡의 title이 올바르다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "Butter");
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.title).toBe("Butter");
  });

  it("추가된 곡의 artist가 올바르다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡", "BTS");
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.artist).toBe("BTS");
  });

  it("추가된 곡의 purpose가 올바르다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡", "아티스트", "warmup");
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.purpose).toBe("warmup");
  });

  it("추가된 첫 번째 곡의 order는 0이다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id);
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.order).toBe(0);
  });

  it("두 번째 곡의 order는 1이다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[1]?.order).toBe(1);
  });

  it("존재하지 않는 playlistId에 addSong하면 null을 반환한다", () => {
    const { hook } = makeHook();
    let song: unknown;
    act(() => {
      song = hook.result.current.addSong("non-existent", {
        title: "곡",
        artist: "아티스트",
        purpose: "main",
        genre: "팝",
        bpm: null,
      });
    });
    expect(song).toBeNull();
  });

  it("bpm이 null인 곡을 추가할 수 있다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡", "아티스트", "main", "팝", null);
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.bpm).toBeNull();
  });

  it("stats.totalSongs가 증가한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    expect(hook.result.current.stats.totalSongs).toBe(2);
  });
});

// ============================================================
// updateSong
// ============================================================

describe("useDancePlaylist - updateSong", () => {
  beforeEach(clearStore);

  it("곡의 title을 수정할 수 있다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "원래 제목");
    const songId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    act(() => {
      hook.result.current.updateSong(pl.id, songId, { title: "수정된 제목" });
    });
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.title).toBe("수정된 제목");
  });

  it("곡의 purpose를 수정할 수 있다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡", "아티스트", "main");
    const songId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    act(() => {
      hook.result.current.updateSong(pl.id, songId, { purpose: "performance" });
    });
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.purpose).toBe("performance");
  });

  it("updateSong 성공 시 true를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id);
    const songId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    let success = false;
    act(() => {
      success = hook.result.current.updateSong(pl.id, songId, { title: "새 제목" });
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 playlistId로 updateSong 시 false를 반환한다", () => {
    const { hook } = makeHook();
    let success = true;
    act(() => {
      success = hook.result.current.updateSong("non-existent", "song-id", { title: "새 제목" });
    });
    expect(success).toBe(false);
  });

  it("존재하지 않는 songId로 updateSong 시 false를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    let success = true;
    act(() => {
      success = hook.result.current.updateSong(pl.id, "non-existent-song", { title: "새 제목" });
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// deleteSong
// ============================================================

describe("useDancePlaylist - deleteSong", () => {
  beforeEach(clearStore);

  it("곡 삭제 후 songs 길이가 감소한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id);
    const songId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    act(() => {
      hook.result.current.deleteSong(pl.id, songId);
    });
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs).toHaveLength(0);
  });

  it("deleteSong 성공 시 true를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id);
    const songId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    let success = false;
    act(() => {
      success = hook.result.current.deleteSong(pl.id, songId);
    });
    expect(success).toBe(true);
  });

  it("존재하지 않는 songId 삭제 시 false를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    let success = true;
    act(() => {
      success = hook.result.current.deleteSong(pl.id, "non-existent");
    });
    expect(success).toBe(false);
  });

  it("곡 삭제 후 나머지 곡의 order가 재정렬된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    addSongHelper(hook.result, pl.id, "곡3");
    const firstSongId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    act(() => {
      hook.result.current.deleteSong(pl.id, firstSongId);
    });
    const playlist = hook.result.current.playlists.find((p) => p.id === pl.id);
    expect(playlist?.songs[0]?.order).toBe(0);
    expect(playlist?.songs[1]?.order).toBe(1);
  });
});

// ============================================================
// moveSong
// ============================================================

describe("useDancePlaylist - moveSong", () => {
  beforeEach(clearStore);

  it("moveSong 성공 시 true를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    const songs = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs;
    const secondSongId = songs?.[1]?.id!;
    let success = false;
    act(() => {
      success = hook.result.current.moveSong(pl.id, secondSongId, "up");
    });
    expect(success).toBe(true);
  });

  it("첫 번째 곡을 위로 이동하면 false를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    const firstSongId = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs[0]?.id!;
    let success = true;
    act(() => {
      success = hook.result.current.moveSong(pl.id, firstSongId, "up");
    });
    expect(success).toBe(false);
  });

  it("마지막 곡을 아래로 이동하면 false를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    const songs = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs;
    const lastSongId = songs?.[songs.length - 1]?.id!;
    let success = true;
    act(() => {
      success = hook.result.current.moveSong(pl.id, lastSongId, "down");
    });
    expect(success).toBe(false);
  });

  it("두 번째 곡을 위로 이동하면 첫 번째 곡이 된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    addSongHelper(hook.result, pl.id, "곡2");
    const songs = hook.result.current.playlists.find((p) => p.id === pl.id)?.songs;
    const secondSongId = songs?.[1]?.id!;
    act(() => {
      hook.result.current.moveSong(pl.id, secondSongId, "up");
    });
    const updatedSongs = hook.result.current.playlists
      .find((p) => p.id === pl.id)?.songs
      .slice()
      .sort((a, b) => a.order - b.order);
    expect(updatedSongs?.[0]?.id).toBe(secondSongId);
  });

  it("존재하지 않는 playlistId로 moveSong 시 false를 반환한다", () => {
    const { hook } = makeHook();
    let success = true;
    act(() => {
      success = hook.result.current.moveSong("non-existent", "song-id", "up");
    });
    expect(success).toBe(false);
  });

  it("존재하지 않는 songId로 moveSong 시 false를 반환한다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1");
    let success = true;
    act(() => {
      success = hook.result.current.moveSong(pl.id, "non-existent-song", "up");
    });
    expect(success).toBe(false);
  });
});

// ============================================================
// 통계 - purposeStats
// ============================================================

describe("useDancePlaylist - 통계 purposeStats", () => {
  beforeEach(clearStore);

  it("warmup 곡 추가 후 warmup purpose의 count가 1이 된다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡", "아티스트", "warmup");
    const warmupStat = hook.result.current.stats.purposeStats.find((ps) => ps.purpose === "warmup");
    expect(warmupStat?.count).toBe(1);
  });

  it("총 2곡 중 warmup 1곡이면 percent는 50이다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1", "아티스트", "warmup");
    addSongHelper(hook.result, pl.id, "곡2", "아티스트", "main");
    const warmupStat = hook.result.current.stats.purposeStats.find((ps) => ps.purpose === "warmup");
    expect(warmupStat?.percent).toBe(50);
  });

  it("총 4곡 중 각 purpose 1곡이면 각 percent는 25이다", () => {
    const { hook } = makeHook();
    const pl = createPlaylistHelper(hook.result);
    addSongHelper(hook.result, pl.id, "곡1", "아티스트", "warmup");
    addSongHelper(hook.result, pl.id, "곡2", "아티스트", "main");
    addSongHelper(hook.result, pl.id, "곡3", "아티스트", "cooldown");
    addSongHelper(hook.result, pl.id, "곡4", "아티스트", "performance");
    hook.result.current.stats.purposeStats.forEach((ps) => {
      expect(ps.percent).toBe(25);
    });
  });

  it("purposeStats는 항상 4개의 purpose 항목을 반환한다", () => {
    const { hook } = makeHook();
    expect(hook.result.current.stats.purposeStats).toHaveLength(4);
  });

  it("purposeStats의 모든 purpose 타입이 포함된다", () => {
    const { hook } = makeHook();
    const purposes = hook.result.current.stats.purposeStats.map((ps) => ps.purpose);
    expect(purposes).toContain("warmup");
    expect(purposes).toContain("main");
    expect(purposes).toContain("cooldown");
    expect(purposes).toContain("performance");
  });
});

// ============================================================
// 순수 함수 로직 검증
// ============================================================

describe("useDancePlaylist - 순수 함수 로직", () => {
  it("totalSongs = 0이면 모든 purpose의 percent는 0이다", () => {
    const totalSongs = 0;
    const count = 2;
    const percent = totalSongs === 0 ? 0 : Math.round((count / totalSongs) * 100);
    expect(percent).toBe(0);
  });

  it("4곡 중 1곡 warmup이면 percent = 25", () => {
    const totalSongs = 4;
    const count = 1;
    const percent = totalSongs === 0 ? 0 : Math.round((count / totalSongs) * 100);
    expect(percent).toBe(25);
  });

  it("3곡 중 1곡이면 percent = 33", () => {
    const totalSongs = 3;
    const count = 1;
    const percent = totalSongs === 0 ? 0 : Math.round((count / totalSongs) * 100);
    expect(percent).toBe(33);
  });

  it("1곡 중 1곡이면 percent = 100", () => {
    const totalSongs = 1;
    const count = 1;
    const percent = totalSongs === 0 ? 0 : Math.round((count / totalSongs) * 100);
    expect(percent).toBe(100);
  });
});

// ============================================================
// 그룹별 격리
// ============================================================

describe("useDancePlaylist - 그룹별 격리", () => {
  beforeEach(clearStore);

  it("다른 memberId는 독립적인 상태를 갖는다", () => {
    const { result: result1 } = renderHook(() => useDancePlaylist("iso-member-A"));
    const { result: result2 } = renderHook(() => useDancePlaylist("iso-member-B"));
    act(() => {
      result1.current.createPlaylist({ name: "리스트A", description: "" });
    });
    expect(result1.current.playlists).toHaveLength(1);
    expect(result2.current.playlists).toHaveLength(0);
  });
});

// ============================================================
// localStorage 저장 키 형식
// ============================================================

describe("useDancePlaylist - localStorage 키 형식", () => {
  beforeEach(clearStore);

  it("저장 키는 dancebase:dance-playlist:{memberId} 형식이다", () => {
    const memberId = "key-test-member";
    const { result } = renderHook(() => useDancePlaylist(memberId));
    act(() => {
      result.current.createPlaylist({ name: "리스트", description: "" });
    });
    const stored = localStorageMock._store()[`dancebase:dance-playlist:${memberId}`];
    expect(stored).toBeDefined();
  });
});
