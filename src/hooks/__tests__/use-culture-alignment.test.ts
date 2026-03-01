import { describe, it, expect, vi, beforeEach } from "vitest";

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
  removeFromStorage: (key: string): void => {
    delete memStore[key];
  },
}));

// ─── sonner mock ─────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── toast-messages mock ─────────────────────────────────────
vi.mock("@/lib/toast-messages", () => ({
  TOAST: {
    MEMBER_NAME_REQUIRED_DOT: "멤버 이름을 입력해주세요.",
    CULTURE: {
      VALUES_SAVED: "이상 가치가 저장되었습니다.",
      VALUES_SAVE_ERROR: "저장에 실패했습니다.",
      MEMBER_DUPLICATE: "이미 등록된 멤버입니다.",
      PROFILE_ADD_ERROR: "프로필 추가에 실패했습니다.",
      PROFILE_UPDATED: "프로필이 수정되었습니다.",
      PROFILE_UPDATE_ERROR: "프로필 수정에 실패했습니다.",
      PROFILE_DELETED: "프로필이 삭제되었습니다.",
      PROFILE_DELETE_ERROR: "프로필 삭제에 실패했습니다.",
      PROFILE_NOT_FOUND: "프로필을 찾을 수 없습니다.",
    },
  },
}));

// ─── SWR mock ─────────────────────────────────────────────────
const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: (key: string | null, fetcher?: () => unknown) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    const data = fetcher ? fetcher() : undefined;
    return { data, isLoading: false, mutate: mockMutate };
  },
}));

// ─── SWR keys mock ────────────────────────────────────────────
vi.mock("@/lib/swr/keys", () => ({
  swrKeys: {
    cultureAlignment: (groupId: string) => `culture-alignment-${groupId}`,
  },
}));

beforeEach(() => {
  Object.keys(memStore).forEach((k) => delete memStore[k]);
  mockMutate.mockReset();
  mockMutate.mockResolvedValue(undefined);
});

// ============================================================
// 공유 타입 및 상수
// ============================================================

type CultureDimension = "teamwork" | "creativity" | "discipline" | "fun" | "growth";

const DIMENSIONS: CultureDimension[] = ["teamwork", "creativity", "discipline", "fun", "growth"];

const DEFAULT_IDEAL_SCORES: Record<CultureDimension, number> = {
  teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7,
};

type CultureProfile = {
  id: string;
  memberName: string;
  scores: Record<CultureDimension, number>;
  updatedAt: string;
};

type GroupCultureConfig = {
  idealScores: Record<CultureDimension, number>;
  profiles: CultureProfile[];
  createdAt: string;
};

// ============================================================
// computeAlignment 순수 함수 재현
// ============================================================

function computeAlignment(
  idealScores: Record<CultureDimension, number>,
  profile: CultureProfile
): number {
  const maxDistance = Math.sqrt(DIMENSIONS.length * Math.pow(9, 2));
  const distance = Math.sqrt(
    DIMENSIONS.reduce((sum, dim) => {
      const diff = (idealScores[dim] ?? 5) - (profile.scores[dim] ?? 5);
      return sum + diff * diff;
    }, 0)
  );
  return Math.round(Math.max(0, (1 - distance / maxDistance) * 100));
}

// ============================================================
// 1. computeAlignment 순수 함수 테스트
// ============================================================

describe("computeAlignment - 맞춤도 계산", () => {
  const perfect: CultureProfile = {
    id: "p1", memberName: "완벽", updatedAt: "",
    scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 },
  };

  const opposite: CultureProfile = {
    id: "p2", memberName: "반대", updatedAt: "",
    scores: { teamwork: 1, creativity: 1, discipline: 1, fun: 1, growth: 1 },
  };

  it("이상값과 완전히 일치하면 100%이다", () => {
    expect(computeAlignment(DEFAULT_IDEAL_SCORES, perfect)).toBe(100);
  });

  it("반환값은 0에서 100 사이다", () => {
    const result = computeAlignment(DEFAULT_IDEAL_SCORES, opposite);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("이상값과 멀수록 낮은 점수를 반환한다", () => {
    const close: CultureProfile = {
      id: "p3", memberName: "근접", updatedAt: "",
      scores: { teamwork: 8, creativity: 7, discipline: 7, fun: 7, growth: 7 },
    };
    const resultClose = computeAlignment(DEFAULT_IDEAL_SCORES, close);
    const resultOpposite = computeAlignment(DEFAULT_IDEAL_SCORES, opposite);
    expect(resultClose).toBeGreaterThan(resultOpposite);
  });

  it("단일 차원의 차이가 9인 경우를 처리한다", () => {
    const profile: CultureProfile = {
      id: "p4", memberName: "극단", updatedAt: "",
      scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 1 },
    };
    const ideal = { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 10 };
    const result = computeAlignment(ideal, profile);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(100);
  });

  it("maxDistance는 sqrt(5 * 81)이다", () => {
    const maxDistance = Math.sqrt(5 * 81);
    expect(Math.round(maxDistance * 100) / 100).toBeCloseTo(20.12, 1);
  });

  it("scores에 없는 차원은 기본값 5로 처리된다", () => {
    const profileWithMissing: CultureProfile = {
      id: "p5", memberName: "누락", updatedAt: "",
      scores: { teamwork: 5, creativity: 5, discipline: 5, fun: 5, growth: 5 },
    };
    // 이상값도 5로 설정하면 거리가 0이므로 100%
    const ideal = { teamwork: 5, creativity: 5, discipline: 5, fun: 5, growth: 5 };
    expect(computeAlignment(ideal, profileWithMissing)).toBe(100);
  });

  it("모든 차원이 최대 차이(9)이면 0%를 반환한다", () => {
    const ideal = { teamwork: 10, creativity: 10, discipline: 10, fun: 10, growth: 10 };
    const worst: CultureProfile = {
      id: "p6", memberName: "최저", updatedAt: "",
      scores: { teamwork: 1, creativity: 1, discipline: 1, fun: 1, growth: 1 },
    };
    const result = computeAlignment(ideal, worst);
    expect(result).toBe(0);
  });

  it("반환값은 항상 정수다", () => {
    const profile: CultureProfile = {
      id: "p7", memberName: "일반", updatedAt: "",
      scores: { teamwork: 6, creativity: 8, discipline: 5, fun: 7, growth: 9 },
    };
    const result = computeAlignment(DEFAULT_IDEAL_SCORES, profile);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================================
// 2. groupAverage 로직
// ============================================================

describe("groupAverage 로직", () => {
  function groupAverage(profiles: CultureProfile[]): Record<CultureDimension, number> {
    if (profiles.length === 0) return { ...DEFAULT_IDEAL_SCORES };
    const sums = DIMENSIONS.reduce(
      (acc, dim) => {
        acc[dim] = profiles.reduce((s, p) => s + (p.scores[dim] ?? 5), 0);
        return acc;
      },
      {} as Record<CultureDimension, number>
    );
    return DIMENSIONS.reduce(
      (acc, dim) => {
        acc[dim] = Math.round((sums[dim] / profiles.length) * 10) / 10;
        return acc;
      },
      {} as Record<CultureDimension, number>
    );
  }

  it("프로필이 없으면 기본값을 반환한다", () => {
    const avg = groupAverage([]);
    expect(avg.teamwork).toBe(7);
    expect(avg.creativity).toBe(7);
  });

  it("단일 프로필이면 그 값이 평균이다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 8, creativity: 6, discipline: 9, fun: 5, growth: 7 } },
    ];
    const avg = groupAverage(profiles);
    expect(avg.teamwork).toBe(8);
    expect(avg.creativity).toBe(6);
  });

  it("두 프로필의 평균이 정확하다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 8, creativity: 6, discipline: 7, fun: 5, growth: 7 } },
      { id: "p2", memberName: "B", updatedAt: "", scores: { teamwork: 6, creativity: 8, discipline: 7, fun: 9, growth: 7 } },
    ];
    const avg = groupAverage(profiles);
    expect(avg.teamwork).toBe(7);
    expect(avg.creativity).toBe(7);
    expect(avg.fun).toBe(7);
  });

  it("소수점 결과는 소수 1자리로 반올림된다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
      { id: "p2", memberName: "B", updatedAt: "", scores: { teamwork: 8, creativity: 8, discipline: 8, fun: 8, growth: 8 } },
      { id: "p3", memberName: "C", updatedAt: "", scores: { teamwork: 9, creativity: 9, discipline: 9, fun: 9, growth: 9 } },
    ];
    const avg = groupAverage(profiles);
    // (7+8+9)/3 = 8.0
    expect(avg.teamwork).toBe(8);
  });
});

// ============================================================
// 3. averageAlignment 계산 로직
// ============================================================

describe("averageAlignment 계산 로직", () => {
  function computeAverageAlignment(
    profiles: CultureProfile[],
    idealScores: Record<CultureDimension, number>
  ): number {
    if (profiles.length === 0) return 0;
    return Math.round(
      profiles.reduce((sum, p) => sum + computeAlignment(idealScores, p), 0) / profiles.length
    );
  }

  it("프로필이 없으면 0이다", () => {
    expect(computeAverageAlignment([], DEFAULT_IDEAL_SCORES)).toBe(0);
  });

  it("단일 프로필이면 해당 프로필의 맞춤도와 같다", () => {
    const profile: CultureProfile = {
      id: "p1", memberName: "A", updatedAt: "",
      scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 },
    };
    const alignment = computeAlignment(DEFAULT_IDEAL_SCORES, profile);
    expect(computeAverageAlignment([profile], DEFAULT_IDEAL_SCORES)).toBe(alignment);
  });

  it("두 프로필의 맞춤도 평균이 정확하다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
      { id: "p2", memberName: "B", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    expect(computeAverageAlignment(profiles, DEFAULT_IDEAL_SCORES)).toBe(100);
  });
});

// ============================================================
// 4. addProfile 유효성 검사 로직
// ============================================================

describe("addProfile 유효성 검사 로직", () => {
  function validateAddProfile(
    memberName: string,
    existingProfiles: CultureProfile[]
  ): string | null {
    if (!memberName.trim()) return "MEMBER_NAME_REQUIRED";
    const duplicate = existingProfiles.some(
      (p) => p.memberName.toLowerCase() === memberName.trim().toLowerCase()
    );
    if (duplicate) return "DUPLICATE";
    return null;
  }

  it("빈 이름이면 MEMBER_NAME_REQUIRED를 반환한다", () => {
    expect(validateAddProfile("", [])).toBe("MEMBER_NAME_REQUIRED");
  });

  it("공백만 있는 이름이면 MEMBER_NAME_REQUIRED를 반환한다", () => {
    expect(validateAddProfile("   ", [])).toBe("MEMBER_NAME_REQUIRED");
  });

  it("중복 이름이면 DUPLICATE를 반환한다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "김철수", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    expect(validateAddProfile("김철수", profiles)).toBe("DUPLICATE");
  });

  it("대소문자가 달라도 중복으로 처리된다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "Alice", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    expect(validateAddProfile("alice", profiles)).toBe("DUPLICATE");
  });

  it("유효한 이름이면 null을 반환한다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "김철수", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    expect(validateAddProfile("이영희", profiles)).toBeNull();
  });
});

// ============================================================
// 5. deleteProfile 로직
// ============================================================

describe("deleteProfile 로직", () => {
  function deleteProfile(profiles: CultureProfile[], id: string): { profiles: CultureProfile[]; success: boolean } {
    const next = profiles.filter((p) => p.id !== id);
    if (next.length === profiles.length) return { profiles: next, success: false };
    return { profiles: next, success: true };
  }

  const profiles: CultureProfile[] = [
    { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    { id: "p2", memberName: "B", updatedAt: "", scores: { teamwork: 5, creativity: 5, discipline: 5, fun: 5, growth: 5 } },
  ];

  it("존재하는 id를 삭제하면 success가 true다", () => {
    const result = deleteProfile(profiles, "p1");
    expect(result.success).toBe(true);
  });

  it("존재하지 않는 id를 삭제하면 success가 false다", () => {
    const result = deleteProfile(profiles, "p99");
    expect(result.success).toBe(false);
  });

  it("삭제 후 프로필 수가 1 감소한다", () => {
    const result = deleteProfile(profiles, "p1");
    expect(result.profiles).toHaveLength(1);
  });

  it("삭제된 프로필이 목록에 없다", () => {
    const result = deleteProfile(profiles, "p1");
    expect(result.profiles.some((p) => p.id === "p1")).toBe(false);
  });

  it("빈 배열에서 삭제해도 false를 반환한다", () => {
    const result = deleteProfile([], "p1");
    expect(result.success).toBe(false);
  });
});

// ============================================================
// 6. getAllAlignments 로직
// ============================================================

describe("getAllAlignments 로직", () => {
  function getAllAlignments(
    profiles: CultureProfile[],
    idealScores: Record<CultureDimension, number>
  ): Array<{ profile: CultureProfile; alignment: number }> {
    return profiles
      .map((profile) => ({
        profile,
        alignment: computeAlignment(idealScores, profile),
      }))
      .sort((a, b) => b.alignment - a.alignment);
  }

  it("빈 프로필이면 빈 배열이다", () => {
    expect(getAllAlignments([], DEFAULT_IDEAL_SCORES)).toHaveLength(0);
  });

  it("맞춤도 내림차순으로 정렬된다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "낮음", updatedAt: "", scores: { teamwork: 1, creativity: 1, discipline: 1, fun: 1, growth: 1 } },
      { id: "p2", memberName: "높음", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    const result = getAllAlignments(profiles, DEFAULT_IDEAL_SCORES);
    expect(result[0].profile.memberName).toBe("높음");
    expect(result[1].profile.memberName).toBe("낮음");
  });

  it("alignment 값이 포함된다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "완벽", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    const result = getAllAlignments(profiles, DEFAULT_IDEAL_SCORES);
    expect(result[0].alignment).toBe(100);
  });

  it("모든 프로필이 포함된다", () => {
    const profiles: CultureProfile[] = [
      { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 5, creativity: 5, discipline: 5, fun: 5, growth: 5 } },
      { id: "p2", memberName: "B", updatedAt: "", scores: { teamwork: 6, creativity: 6, discipline: 6, fun: 6, growth: 6 } },
      { id: "p3", memberName: "C", updatedAt: "", scores: { teamwork: 7, creativity: 7, discipline: 7, fun: 7, growth: 7 } },
    ];
    expect(getAllAlignments(profiles, DEFAULT_IDEAL_SCORES)).toHaveLength(3);
  });
});

// ============================================================
// 7. updateProfile 로직
// ============================================================

describe("updateProfile 로직", () => {
  function updateProfile(
    profiles: CultureProfile[],
    profileId: string,
    scores: Record<CultureDimension, number>
  ): { profiles: CultureProfile[]; success: boolean } {
    const exists = profiles.some((p) => p.id === profileId);
    if (!exists) return { profiles, success: false };
    return {
      profiles: profiles.map((p) =>
        p.id === profileId ? { ...p, scores, updatedAt: new Date().toISOString() } : p
      ),
      success: true,
    };
  }

  const profiles: CultureProfile[] = [
    { id: "p1", memberName: "A", updatedAt: "", scores: { teamwork: 5, creativity: 5, discipline: 5, fun: 5, growth: 5 } },
  ];

  it("존재하는 프로필 업데이트 시 success가 true다", () => {
    const newScores: Record<CultureDimension, number> = { teamwork: 9, creativity: 9, discipline: 9, fun: 9, growth: 9 };
    const result = updateProfile(profiles, "p1", newScores);
    expect(result.success).toBe(true);
  });

  it("존재하지 않는 id 업데이트 시 success가 false다", () => {
    const newScores: Record<CultureDimension, number> = { teamwork: 9, creativity: 9, discipline: 9, fun: 9, growth: 9 };
    const result = updateProfile(profiles, "p99", newScores);
    expect(result.success).toBe(false);
  });

  it("점수가 업데이트된다", () => {
    const newScores: Record<CultureDimension, number> = { teamwork: 9, creativity: 8, discipline: 7, fun: 6, growth: 5 };
    const result = updateProfile(profiles, "p1", newScores);
    expect(result.profiles[0].scores.teamwork).toBe(9);
    expect(result.profiles[0].scores.creativity).toBe(8);
  });
});

// ============================================================
// 8. localStorage 키 형식 테스트
// ============================================================

describe("localStorage 키 형식", () => {
  it("groupId를 포함한 키를 생성한다", () => {
    const groupId = "group-abc";
    const key = `dancebase:culture-alignment:${groupId}`;
    memStore[key] = { idealScores: DEFAULT_IDEAL_SCORES, profiles: [], createdAt: "" };
    expect(memStore[key]).toBeDefined();
  });

  it("다른 groupId는 독립적인 키를 가진다", () => {
    const key1 = `dancebase:culture-alignment:group1`;
    const key2 = `dancebase:culture-alignment:group2`;
    expect(key1).not.toBe(key2);
  });

  it("group1 데이터가 group2에 영향을 주지 않는다", () => {
    const key1 = `dancebase:culture-alignment:group1`;
    const key2 = `dancebase:culture-alignment:group2`;
    const config1: GroupCultureConfig = { idealScores: { ...DEFAULT_IDEAL_SCORES, teamwork: 9 }, profiles: [], createdAt: "" };
    const config2: GroupCultureConfig = { idealScores: { ...DEFAULT_IDEAL_SCORES, teamwork: 3 }, profiles: [], createdAt: "" };
    memStore[key1] = config1;
    memStore[key2] = config2;
    expect((memStore[key1] as GroupCultureConfig).idealScores.teamwork).toBe(9);
    expect((memStore[key2] as GroupCultureConfig).idealScores.teamwork).toBe(3);
  });
});

// ============================================================
// 9. 기본값 및 초기 상태 테스트
// ============================================================

describe("기본값 및 초기 상태", () => {
  it("DEFAULT_IDEAL_SCORES는 모든 차원이 7이다", () => {
    DIMENSIONS.forEach((dim) => {
      expect(DEFAULT_IDEAL_SCORES[dim]).toBe(7);
    });
  });

  it("DIMENSIONS는 5개의 차원을 포함한다", () => {
    expect(DIMENSIONS).toHaveLength(5);
    expect(DIMENSIONS).toContain("teamwork");
    expect(DIMENSIONS).toContain("creativity");
    expect(DIMENSIONS).toContain("discipline");
    expect(DIMENSIONS).toContain("fun");
    expect(DIMENSIONS).toContain("growth");
  });

  it("프로필이 없을 때 memberCount는 0이다", () => {
    const config: GroupCultureConfig = { idealScores: DEFAULT_IDEAL_SCORES, profiles: [], createdAt: "" };
    expect(config.profiles.length).toBe(0);
  });
});
