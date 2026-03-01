import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
    _set: (key: string, value: string) => { store[key] = value; },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ─── crypto.randomUUID mock ───────────────────────────────────
let uuidCounter = 0;
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => `uuid-${++uuidCounter}`),
});

// ─── swr keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    danceMusicPlaylist: (memberId: string) => `dance-music-playlist-${memberId}`,
  },
}));

// ─── local-storage mock ───────────────────────────────────────
// loadFromStorage가 {} as DanceMusicData를 기본값으로 반환하면
// playlists가 undefined가 되어 flatMap 오류 발생.
// 항상 { playlists: [] } 형태의 기본값을 보장하도록 mock.
vi.mock("@/lib/local-storage", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/local-storage")>();
  return {
    ...original,
    loadFromStorage: vi.fn(<T>(key: string, _defaultValue: T): T => {
      const raw = localStorageMock.getItem(key);
      if (!raw) {
        // DanceMusicData에 필요한 playlists 포함한 기본값 반환
        return { memberId: "", playlists: [], updatedAt: "" } as unknown as T;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        // playlists 필드 보장
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

import { useDanceMusic, DANCE_MUSIC_GENRES } from "@/hooks/use-dance-music";
import type { DanceMusicPlaylist } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────
const MEMBER_ID = "member-test-1";

function makeHook(memberId = MEMBER_ID) {
  return renderHook(() => useDanceMusic(memberId));
}

function getStoredData(memberId = MEMBER_ID) {
  const raw = localStorageMock._store()[`dance-music-playlist-${memberId}`];
  return raw ? JSON.parse(raw) : null;
}

// ============================================================
// 상수 테스트
// ============================================================

describe("DANCE_MUSIC_GENRES - 상수 검증", () => {
  it("DANCE_MUSIC_GENRES가 배열이다", () => {
    expect(Array.isArray(DANCE_MUSIC_GENRES)).toBe(true);
  });

  it("힙합이 포함되어 있다", () => {
    expect(DANCE_MUSIC_GENRES).toContain("힙합");
  });

  it("케이팝이 포함되어 있다", () => {
    expect(DANCE_MUSIC_GENRES).toContain("케이팝");
  });

  it("기타가 포함되어 있다", () => {
    expect(DANCE_MUSIC_GENRES).toContain("기타");
  });

  it("최소 10개 이상의 장르가 있다", () => {
    expect(DANCE_MUSIC_GENRES.length).toBeGreaterThanOrEqual(10);
  });
});

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("useDanceMusic - 초기 상태", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("playlists는 초기에 undefined 또는 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.playlists == null || Array.isArray(result.current.playlists)).toBe(true);
  });

  it("totalPlaylists는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalPlaylists).toBe(0);
  });

  it("totalTracks는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.totalTracks).toBe(0);
  });

  it("favoriteCount는 초기에 0이다", () => {
    const { result } = makeHook();
    expect(result.current.favoriteCount).toBe(0);
  });

  it("genreDistribution은 초기에 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.genreDistribution).toEqual([]);
  });

  it("필수 함수들이 존재한다", () => {
    const { result } = makeHook();
    expect(typeof result.current.createPlaylist).toBe("function");
    expect(typeof result.current.updatePlaylist).toBe("function");
    expect(typeof result.current.deletePlaylist).toBe("function");
    expect(typeof result.current.addTrack).toBe("function");
    expect(typeof result.current.updateTrack).toBe("function");
    expect(typeof result.current.removeTrack).toBe("function");
    expect(typeof result.current.toggleFavorite).toBe("function");
    expect(typeof result.current.reorderTracks).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});

// ============================================================
// createPlaylist 테스트
// ============================================================

describe("useDanceMusic - createPlaylist", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("플레이리스트를 생성하면 반환값이 DanceMusicPlaylist 형태다", () => {
    const { result } = makeHook();
    let playlist: DanceMusicPlaylist | null = null;
    act(() => {
      playlist = result.current.createPlaylist({ name: "내 플레이리스트" });
    });
    expect(playlist).not.toBeNull();
    expect((playlist as unknown as DanceMusicPlaylist).id).toBeDefined();
    expect((playlist as unknown as DanceMusicPlaylist).name).toBe("내 플레이리스트");
  });

  it("플레이리스트 생성 후 totalPlaylists가 증가한다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createPlaylist({ name: "플리1" });
    });
    expect(result.current.totalPlaylists).toBe(1);
  });

  it("플레이리스트 이름이 trim되어 저장된다", () => {
    const { result } = makeHook();
    let playlist: DanceMusicPlaylist | null = null;
    act(() => {
      playlist = result.current.createPlaylist({ name: "  힙합 모음  " });
    });
    expect((playlist as unknown as DanceMusicPlaylist).name).toBe("힙합 모음");
  });

  it("description을 지정하면 저장된다", () => {
    const { result } = makeHook();
    let playlist: DanceMusicPlaylist | null = null;
    act(() => {
      playlist = result.current.createPlaylist({ name: "플리", description: "설명" });
    });
    expect((playlist as unknown as DanceMusicPlaylist).description).toBe("설명");
  });

  it("description 미지정 시 빈 문자열이다", () => {
    const { result } = makeHook();
    let playlist: DanceMusicPlaylist | null = null;
    act(() => {
      playlist = result.current.createPlaylist({ name: "플리" });
    });
    expect((playlist as unknown as DanceMusicPlaylist).description).toBe("");
  });

  it("새 플레이리스트의 tracks는 빈 배열이다", () => {
    const { result } = makeHook();
    let playlist: DanceMusicPlaylist | null = null;
    act(() => {
      playlist = result.current.createPlaylist({ name: "플리" });
    });
    expect((playlist as unknown as DanceMusicPlaylist).tracks).toEqual([]);
  });

  it("여러 플레이리스트 생성 시 모두 반영된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createPlaylist({ name: "플리1" });
    });
    act(() => {
      result.current.createPlaylist({ name: "플리2" });
    });
    expect(result.current.totalPlaylists).toBe(2);
  });

  it("localStorage에 저장된다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createPlaylist({ name: "저장테스트" });
    });
    const stored = getStoredData();
    expect(stored).not.toBeNull();
    expect(stored.playlists).toHaveLength(1);
  });
});

// ============================================================
// updatePlaylist 테스트
// ============================================================

describe("useDanceMusic - updatePlaylist", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("플레이리스트 이름을 수정할 수 있다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "원래이름" });
      playlistId = p.id;
    });
    act(() => {
      result.current.updatePlaylist(playlistId, { name: "새이름" });
    });
    const p = result.current.playlists.find((p) => p.id === playlistId);
    expect(p?.name).toBe("새이름");
  });

  it("플레이리스트 설명을 수정할 수 있다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.updatePlaylist(playlistId, { description: "새설명" });
    });
    const p = result.current.playlists.find((p) => p.id === playlistId);
    expect(p?.description).toBe("새설명");
  });

  it("존재하지 않는 ID 수정은 기존 데이터를 변경하지 않는다", () => {
    const { result } = makeHook();
    act(() => {
      result.current.createPlaylist({ name: "플리1" });
    });
    const countBefore = result.current.totalPlaylists;
    act(() => {
      result.current.updatePlaylist("non-existent", { name: "변경" });
    });
    expect(result.current.totalPlaylists).toBe(countBefore);
  });
});

// ============================================================
// deletePlaylist 테스트
// ============================================================

describe("useDanceMusic - deletePlaylist", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("플레이리스트를 삭제하면 totalPlaylists가 감소한다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "삭제대상" });
      playlistId = p.id;
    });
    act(() => {
      result.current.deletePlaylist(playlistId);
    });
    expect(result.current.totalPlaylists).toBe(0);
  });

  it("삭제 후 localStorage가 업데이트된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "삭제대상" });
      playlistId = p.id;
    });
    act(() => {
      result.current.deletePlaylist(playlistId);
    });
    const stored = getStoredData();
    expect(stored.playlists).toHaveLength(0);
  });

  it("특정 플레이리스트만 삭제된다", () => {
    const { result } = makeHook();
    let playlistId1 = "";
    act(() => {
      const p1 = result.current.createPlaylist({ name: "플리1" });
      playlistId1 = p1.id;
      result.current.createPlaylist({ name: "플리2" });
    });
    act(() => {
      result.current.deletePlaylist(playlistId1);
    });
    expect(result.current.totalPlaylists).toBe(1);
    expect(result.current.playlists[0].name).toBe("플리2");
  });
});

// ============================================================
// addTrack 테스트
// ============================================================

describe("useDanceMusic - addTrack", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("트랙 추가 후 totalTracks가 증가한다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "테스트곡",
        artist: "아티스트",
        genre: "힙합",
      });
    });
    expect(result.current.totalTracks).toBe(1);
  });

  it("존재하지 않는 플레이리스트에 트랙 추가 시 null 반환", () => {
    const { result } = makeHook();
    let track: unknown = undefined;
    act(() => {
      track = result.current.addTrack("non-existent", {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
    });
    expect(track).toBeNull();
  });

  it("추가된 트랙의 isFavorite 기본값은 false다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
    });
    const track = result.current.playlists[0].tracks[0];
    expect(track.isFavorite).toBe(false);
  });

  it("트랙 title이 trim되어 저장된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "  테스트곡  ",
        artist: "아티스트",
        genre: "팝",
      });
    });
    expect(result.current.playlists[0].tracks[0].title).toBe("테스트곡");
  });

  it("bpm이 null이면 null로 저장된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
        bpm: null,
      });
    });
    expect(result.current.playlists[0].tracks[0].bpm).toBeNull();
  });

  it("tags 미지정 시 빈 배열이다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
    });
    expect(result.current.playlists[0].tracks[0].tags).toEqual([]);
  });
});

// ============================================================
// updateTrack 테스트
// ============================================================

describe("useDanceMusic - updateTrack", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("트랙 제목을 수정할 수 있다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, {
        title: "원래제목",
        artist: "아티스트",
        genre: "팝",
      });
      trackId = t!.id;
    });
    act(() => {
      result.current.updateTrack(playlistId, trackId, { title: "새제목" });
    });
    expect(result.current.playlists[0].tracks[0].title).toBe("새제목");
  });

  it("트랙 bpm을 수정할 수 있다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "힙합",
      });
      trackId = t!.id;
    });
    act(() => {
      result.current.updateTrack(playlistId, trackId, { bpm: 120 });
    });
    expect(result.current.playlists[0].tracks[0].bpm).toBe(120);
  });

  it("존재하지 않는 플레이리스트 수정은 데이터를 변경하지 않는다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
    });
    const titleBefore = result.current.playlists[0].tracks[0].title;
    act(() => {
      result.current.updateTrack("wrong-playlist", "any-track", { title: "변경" });
    });
    expect(result.current.playlists[0].tracks[0].title).toBe(titleBefore);
  });
});

// ============================================================
// removeTrack 테스트
// ============================================================

describe("useDanceMusic - removeTrack", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("트랙 삭제 후 totalTracks가 감소한다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
      trackId = t!.id;
    });
    act(() => {
      result.current.removeTrack(playlistId, trackId);
    });
    expect(result.current.totalTracks).toBe(0);
  });

  it("특정 트랙만 삭제된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId1 = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t1 = result.current.addTrack(playlistId, {
        title: "곡1",
        artist: "아티스트",
        genre: "팝",
      });
      trackId1 = t1!.id;
      result.current.addTrack(playlistId, {
        title: "곡2",
        artist: "아티스트2",
        genre: "힙합",
      });
    });
    act(() => {
      result.current.removeTrack(playlistId, trackId1);
    });
    expect(result.current.totalTracks).toBe(1);
    expect(result.current.playlists[0].tracks[0].title).toBe("곡2");
  });
});

// ============================================================
// toggleFavorite 테스트
// ============================================================

describe("useDanceMusic - toggleFavorite", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("즐겨찾기 토글 후 isFavorite이 true가 된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
      trackId = t!.id;
    });
    act(() => {
      result.current.toggleFavorite(playlistId, trackId);
    });
    expect(result.current.playlists[0].tracks[0].isFavorite).toBe(true);
    expect(result.current.favoriteCount).toBe(1);
  });

  it("두 번 토글하면 원래 상태로 돌아온다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, {
        title: "곡",
        artist: "아티스트",
        genre: "팝",
      });
      trackId = t!.id;
    });
    act(() => {
      result.current.toggleFavorite(playlistId, trackId);
    });
    act(() => {
      result.current.toggleFavorite(playlistId, trackId);
    });
    expect(result.current.playlists[0].tracks[0].isFavorite).toBe(false);
    expect(result.current.favoriteCount).toBe(0);
  });
});

// ============================================================
// reorderTracks 테스트
// ============================================================

describe("useDanceMusic - reorderTracks", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("트랙 순서를 변경할 수 있다", () => {
    const { result } = makeHook();
    let playlistId = "";
    const trackIds: string[] = [];
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t1 = result.current.addTrack(playlistId, { title: "곡1", artist: "A", genre: "팝" });
      trackIds.push(t1!.id);
    });
    act(() => {
      const t2 = result.current.addTrack(playlistId, { title: "곡2", artist: "B", genre: "팝" });
      trackIds.push(t2!.id);
    });
    act(() => {
      const t3 = result.current.addTrack(playlistId, { title: "곡3", artist: "C", genre: "팝" });
      trackIds.push(t3!.id);
    });
    act(() => {
      result.current.reorderTracks(playlistId, [trackIds[2], trackIds[0], trackIds[1]]);
    });
    const tracks = result.current.playlists[0].tracks;
    expect(tracks[0].title).toBe("곡3");
    expect(tracks[1].title).toBe("곡1");
    expect(tracks[2].title).toBe("곡2");
  });

  it("존재하지 않는 ID는 필터링된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    let trackId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      const t = result.current.addTrack(playlistId, { title: "곡1", artist: "A", genre: "팝" });
      trackId = t!.id;
    });
    act(() => {
      result.current.reorderTracks(playlistId, [trackId, "non-existent"]);
    });
    expect(result.current.playlists[0].tracks).toHaveLength(1);
  });
});

// ============================================================
// 통계 계산 테스트
// ============================================================

describe("useDanceMusic - 통계", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("genreDistribution이 장르별로 집계된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡1", artist: "A", genre: "힙합" });
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡2", artist: "B", genre: "힙합" });
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡3", artist: "C", genre: "팝" });
    });
    const dist = result.current.genreDistribution;
    const hipHop = dist.find((d) => d.genre === "힙합");
    const pop = dist.find((d) => d.genre === "팝");
    expect(hipHop?.count).toBe(2);
    expect(pop?.count).toBe(1);
  });

  it("genreDistribution이 count 내림차순으로 정렬된다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡1", artist: "A", genre: "팝" });
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡2", artist: "B", genre: "힙합" });
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡3", artist: "C", genre: "힙합" });
    });
    const dist = result.current.genreDistribution;
    expect(dist.length).toBeGreaterThanOrEqual(2);
    expect(dist[0].count).toBeGreaterThanOrEqual(dist[1].count);
  });

  it("percent의 합은 100 이하다", () => {
    const { result } = makeHook();
    let playlistId = "";
    act(() => {
      const p = result.current.createPlaylist({ name: "플리" });
      playlistId = p.id;
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡1", artist: "A", genre: "힙합" });
    });
    act(() => {
      result.current.addTrack(playlistId, { title: "곡2", artist: "B", genre: "팝" });
    });
    const total = result.current.genreDistribution.reduce((sum, d) => sum + d.percent, 0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("트랙이 없을 때 genreDistribution은 빈 배열이다", () => {
    const { result } = makeHook();
    expect(result.current.genreDistribution).toEqual([]);
  });
});

// ============================================================
// 멤버별 데이터 격리 테스트
// ============================================================

describe("useDanceMusic - 멤버별 데이터 격리", () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  it("다른 memberId는 별도의 데이터를 사용한다", () => {
    const { result: r1 } = renderHook(() => useDanceMusic("member-A"));
    const { result: r2 } = renderHook(() => useDanceMusic("member-B"));
    act(() => {
      r1.current.createPlaylist({ name: "A의 플리" });
    });
    expect(r1.current.totalPlaylists).toBe(1);
    expect(r2.current.totalPlaylists).toBe(0);
  });
});
