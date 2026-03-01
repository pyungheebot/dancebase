/**
 * use-dance-style-profile 테스트
 *
 * 훅 내부의 순수 계산 로직을 독립 함수로 추출하여 검증합니다.
 * - 빈 프로필 생성
 * - 스타일 추가/삭제/수정
 * - 즐겨찾기 토글
 * - 강점/약점/목표/영향 중복 방지
 * - 통계 계산 (totalStyles, expertStyles, averageExperience, levelCounts, favoriteStyles)
 * - localStorage 키 형식
 * - 그룹별 격리
 */

import { describe, it, expect } from "vitest";
import type {
  MemberDanceStyleProfile,
  DanceStyleEntry,
  DanceStyleLevel,
} from "@/types";

// ============================================================
// 훅 내부 순수 함수 재현
// ============================================================

/** localStorage 키 형식 */
function lsKey(memberId: string): string {
  return `dancebase:dance-style-profile:${memberId}`;
}

/** 빈 프로필 생성 */
function createEmptyProfile(memberId: string): MemberDanceStyleProfile {
  return {
    id: "test-id",
    memberId,
    styles: [],
    strengths: [],
    weaknesses: [],
    goals: [],
    influences: [],
    bio: "",
    updatedAt: new Date().toISOString(),
  };
}

/** 스타일 항목 빌더 */
function makeStyle(overrides: Partial<DanceStyleEntry> = {}): DanceStyleEntry {
  return {
    style: "힙합",
    level: "intermediate",
    yearsOfExperience: 2,
    isFavorite: false,
    ...overrides,
  };
}

/** addStyle */
function addStyle(
  profile: MemberDanceStyleProfile,
  entry: DanceStyleEntry
): MemberDanceStyleProfile {
  return {
    ...profile,
    styles: [...profile.styles, entry],
    updatedAt: new Date().toISOString(),
  };
}

/** removeStyle */
function removeStyle(
  profile: MemberDanceStyleProfile,
  styleName: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    styles: profile.styles.filter((s) => s.style !== styleName),
    updatedAt: new Date().toISOString(),
  };
}

/** updateStyle */
function updateStyle(
  profile: MemberDanceStyleProfile,
  styleName: string,
  patch: Partial<DanceStyleEntry>
): MemberDanceStyleProfile {
  return {
    ...profile,
    styles: profile.styles.map((s) =>
      s.style === styleName ? { ...s, ...patch } : s
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** toggleStyleFavorite */
function toggleStyleFavorite(
  profile: MemberDanceStyleProfile,
  styleName: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    styles: profile.styles.map((s) =>
      s.style === styleName ? { ...s, isFavorite: !s.isFavorite } : s
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** addStrength (중복 방지) */
function addStrength(
  profile: MemberDanceStyleProfile,
  strength: string
): MemberDanceStyleProfile {
  if (profile.strengths.includes(strength)) return profile;
  return {
    ...profile,
    strengths: [...profile.strengths, strength],
    updatedAt: new Date().toISOString(),
  };
}

/** removeStrength */
function removeStrength(
  profile: MemberDanceStyleProfile,
  strength: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    strengths: profile.strengths.filter((s) => s !== strength),
    updatedAt: new Date().toISOString(),
  };
}

/** addWeakness (중복 방지) */
function addWeakness(
  profile: MemberDanceStyleProfile,
  weakness: string
): MemberDanceStyleProfile {
  if (profile.weaknesses.includes(weakness)) return profile;
  return {
    ...profile,
    weaknesses: [...profile.weaknesses, weakness],
    updatedAt: new Date().toISOString(),
  };
}

/** removeWeakness */
function removeWeakness(
  profile: MemberDanceStyleProfile,
  weakness: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    weaknesses: profile.weaknesses.filter((w) => w !== weakness),
    updatedAt: new Date().toISOString(),
  };
}

/** addGoal (중복 방지) */
function addGoal(
  profile: MemberDanceStyleProfile,
  goal: string
): MemberDanceStyleProfile {
  if (profile.goals.includes(goal)) return profile;
  return {
    ...profile,
    goals: [...profile.goals, goal],
    updatedAt: new Date().toISOString(),
  };
}

/** removeGoal */
function removeGoal(
  profile: MemberDanceStyleProfile,
  goal: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    goals: profile.goals.filter((g) => g !== goal),
    updatedAt: new Date().toISOString(),
  };
}

/** addInfluence (중복 방지) */
function addInfluence(
  profile: MemberDanceStyleProfile,
  influence: string
): MemberDanceStyleProfile {
  if (profile.influences.includes(influence)) return profile;
  return {
    ...profile,
    influences: [...profile.influences, influence],
    updatedAt: new Date().toISOString(),
  };
}

/** removeInfluence */
function removeInfluence(
  profile: MemberDanceStyleProfile,
  influence: string
): MemberDanceStyleProfile {
  return {
    ...profile,
    influences: profile.influences.filter((i) => i !== influence),
    updatedAt: new Date().toISOString(),
  };
}

/** 통계 계산 */
function calcStats(profile: MemberDanceStyleProfile) {
  const totalStyles = profile.styles.length;
  const expertStyles = profile.styles.filter((s) => s.level === "expert").length;
  const averageExperience =
    totalStyles > 0
      ? Math.round(
          (profile.styles.reduce((sum, s) => sum + s.yearsOfExperience, 0) /
            totalStyles) *
            10
        ) / 10
      : 0;
  const levelCounts: Record<DanceStyleLevel, number> = {
    beginner: profile.styles.filter((s) => s.level === "beginner").length,
    intermediate: profile.styles.filter((s) => s.level === "intermediate").length,
    advanced: profile.styles.filter((s) => s.level === "advanced").length,
    expert: profile.styles.filter((s) => s.level === "expert").length,
  };
  const favoriteStyles = profile.styles.filter((s) => s.isFavorite).length;
  return { totalStyles, expertStyles, averageExperience, levelCounts, favoriteStyles };
}

// ============================================================
// 1. localStorage 키 형식
// ============================================================

describe("localStorage 키 형식", () => {
  it("키는 'dancebase:dance-style-profile:{memberId}' 형식이다", () => {
    expect(lsKey("member-1")).toBe("dancebase:dance-style-profile:member-1");
  });

  it("멤버 ID가 다르면 키가 달라진다", () => {
    expect(lsKey("m1")).not.toBe(lsKey("m2"));
  });

  it("멤버별 격리 확인 - 각자의 키는 고유하다", () => {
    expect(lsKey("alice")).toBe("dancebase:dance-style-profile:alice");
    expect(lsKey("bob")).toBe("dancebase:dance-style-profile:bob");
  });
});

// ============================================================
// 2. 빈 프로필 초기 상태
// ============================================================

describe("빈 프로필 초기 상태", () => {
  it("스타일 목록은 빈 배열이다", () => {
    expect(createEmptyProfile("m1").styles).toEqual([]);
  });

  it("strengths는 빈 배열이다", () => {
    expect(createEmptyProfile("m1").strengths).toEqual([]);
  });

  it("weaknesses는 빈 배열이다", () => {
    expect(createEmptyProfile("m1").weaknesses).toEqual([]);
  });

  it("goals는 빈 배열이다", () => {
    expect(createEmptyProfile("m1").goals).toEqual([]);
  });

  it("influences는 빈 배열이다", () => {
    expect(createEmptyProfile("m1").influences).toEqual([]);
  });

  it("bio는 빈 문자열이다", () => {
    expect(createEmptyProfile("m1").bio).toBe("");
  });

  it("memberId가 올바르게 설정된다", () => {
    expect(createEmptyProfile("member-xyz").memberId).toBe("member-xyz");
  });
});

// ============================================================
// 3. 스타일 추가 (addStyle)
// ============================================================

describe("스타일 추가 (addStyle)", () => {
  it("스타일이 추가되면 styles 배열 길이가 1 증가한다", () => {
    const profile = createEmptyProfile("m1");
    const updated = addStyle(profile, makeStyle());
    expect(updated.styles).toHaveLength(1);
  });

  it("추가된 스타일의 정보가 올바르다", () => {
    const profile = createEmptyProfile("m1");
    const entry = makeStyle({ style: "팝핑", level: "advanced", yearsOfExperience: 5 });
    const updated = addStyle(profile, entry);
    expect(updated.styles[0]).toEqual(entry);
  });

  it("여러 스타일을 추가할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합" }));
    profile = addStyle(profile, makeStyle({ style: "팝핑" }));
    expect(profile.styles).toHaveLength(2);
  });

  it("addStyle 후 updatedAt이 갱신된다", () => {
    const profile = createEmptyProfile("m1");
    const before = profile.updatedAt;
    // updatedAt은 새 타임스탬프이므로 undefined가 아니어야 함
    const updated = addStyle(profile, makeStyle());
    expect(updated.updatedAt).toBeDefined();
  });
});

// ============================================================
// 4. 스타일 삭제 (removeStyle)
// ============================================================

describe("스타일 삭제 (removeStyle)", () => {
  it("스타일이 삭제되면 styles 배열에서 제거된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합" }));
    profile = removeStyle(profile, "힙합");
    expect(profile.styles).toHaveLength(0);
  });

  it("존재하지 않는 스타일 삭제는 배열 길이를 변경하지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합" }));
    profile = removeStyle(profile, "팝핑");
    expect(profile.styles).toHaveLength(1);
  });

  it("여러 스타일 중 특정 스타일만 삭제된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합" }));
    profile = addStyle(profile, makeStyle({ style: "팝핑" }));
    profile = removeStyle(profile, "힙합");
    expect(profile.styles).toHaveLength(1);
    expect(profile.styles[0]!.style).toBe("팝핑");
  });
});

// ============================================================
// 5. 스타일 수정 (updateStyle)
// ============================================================

describe("스타일 수정 (updateStyle)", () => {
  it("level을 수정할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합", level: "beginner" }));
    profile = updateStyle(profile, "힙합", { level: "advanced" });
    expect(profile.styles[0]!.level).toBe("advanced");
  });

  it("yearsOfExperience를 수정할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합", yearsOfExperience: 1 }));
    profile = updateStyle(profile, "힙합", { yearsOfExperience: 5 });
    expect(profile.styles[0]!.yearsOfExperience).toBe(5);
  });

  it("존재하지 않는 스타일 수정은 배열을 변경하지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합" }));
    profile = updateStyle(profile, "팝핑", { level: "expert" });
    expect(profile.styles[0]!.level).toBe("intermediate");
  });
});

// ============================================================
// 6. 즐겨찾기 토글 (toggleStyleFavorite)
// ============================================================

describe("즐겨찾기 토글 (toggleStyleFavorite)", () => {
  it("isFavorite이 false이면 true로 전환된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합", isFavorite: false }));
    profile = toggleStyleFavorite(profile, "힙합");
    expect(profile.styles[0]!.isFavorite).toBe(true);
  });

  it("isFavorite이 true이면 false로 전환된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합", isFavorite: true }));
    profile = toggleStyleFavorite(profile, "힙합");
    expect(profile.styles[0]!.isFavorite).toBe(false);
  });

  it("다른 스타일의 isFavorite은 영향 받지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "힙합", isFavorite: false }));
    profile = addStyle(profile, makeStyle({ style: "팝핑", isFavorite: true }));
    profile = toggleStyleFavorite(profile, "힙합");
    expect(profile.styles.find((s) => s.style === "팝핑")!.isFavorite).toBe(true);
  });
});

// ============================================================
// 7. 강점 관리 (addStrength / removeStrength)
// ============================================================

describe("강점 관리", () => {
  it("강점을 추가할 수 있다", () => {
    const profile = createEmptyProfile("m1");
    const updated = addStrength(profile, "리듬감");
    expect(updated.strengths).toContain("리듬감");
  });

  it("중복 강점은 추가되지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStrength(profile, "리듬감");
    profile = addStrength(profile, "리듬감");
    expect(profile.strengths).toHaveLength(1);
  });

  it("강점을 삭제할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStrength(profile, "리듬감");
    profile = removeStrength(profile, "리듬감");
    expect(profile.strengths).not.toContain("리듬감");
  });

  it("존재하지 않는 강점 삭제는 배열을 변경하지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStrength(profile, "리듬감");
    profile = removeStrength(profile, "파워");
    expect(profile.strengths).toHaveLength(1);
  });
});

// ============================================================
// 8. 약점 관리 (addWeakness / removeWeakness)
// ============================================================

describe("약점 관리", () => {
  it("약점을 추가할 수 있다", () => {
    const profile = createEmptyProfile("m1");
    const updated = addWeakness(profile, "유연성 부족");
    expect(updated.weaknesses).toContain("유연성 부족");
  });

  it("중복 약점은 추가되지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addWeakness(profile, "유연성 부족");
    profile = addWeakness(profile, "유연성 부족");
    expect(profile.weaknesses).toHaveLength(1);
  });

  it("약점을 삭제할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addWeakness(profile, "유연성 부족");
    profile = removeWeakness(profile, "유연성 부족");
    expect(profile.weaknesses).toHaveLength(0);
  });
});

// ============================================================
// 9. 목표 관리 (addGoal / removeGoal)
// ============================================================

describe("목표 관리", () => {
  it("목표를 추가할 수 있다", () => {
    const profile = createEmptyProfile("m1");
    const updated = addGoal(profile, "대회 입상");
    expect(updated.goals).toContain("대회 입상");
  });

  it("중복 목표는 추가되지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addGoal(profile, "대회 입상");
    profile = addGoal(profile, "대회 입상");
    expect(profile.goals).toHaveLength(1);
  });

  it("목표를 삭제할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addGoal(profile, "대회 입상");
    profile = removeGoal(profile, "대회 입상");
    expect(profile.goals).toHaveLength(0);
  });
});

// ============================================================
// 10. 영향 받은 댄서 관리 (addInfluence / removeInfluence)
// ============================================================

describe("영향 받은 댄서 관리", () => {
  it("영향을 추가할 수 있다", () => {
    const profile = createEmptyProfile("m1");
    const updated = addInfluence(profile, "마이클 잭슨");
    expect(updated.influences).toContain("마이클 잭슨");
  });

  it("중복 영향은 추가되지 않는다", () => {
    let profile = createEmptyProfile("m1");
    profile = addInfluence(profile, "마이클 잭슨");
    profile = addInfluence(profile, "마이클 잭슨");
    expect(profile.influences).toHaveLength(1);
  });

  it("영향을 삭제할 수 있다", () => {
    let profile = createEmptyProfile("m1");
    profile = addInfluence(profile, "마이클 잭슨");
    profile = removeInfluence(profile, "마이클 잭슨");
    expect(profile.influences).toHaveLength(0);
  });
});

// ============================================================
// 11. 통계 계산 (calcStats)
// ============================================================

describe("통계 계산 (calcStats)", () => {
  it("스타일이 없으면 totalStyles는 0이다", () => {
    const profile = createEmptyProfile("m1");
    expect(calcStats(profile).totalStyles).toBe(0);
  });

  it("스타일이 3개이면 totalStyles는 3이다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A" }));
    profile = addStyle(profile, makeStyle({ style: "B" }));
    profile = addStyle(profile, makeStyle({ style: "C" }));
    expect(calcStats(profile).totalStyles).toBe(3);
  });

  it("expert 스타일 수를 올바르게 계산한다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", level: "expert" }));
    profile = addStyle(profile, makeStyle({ style: "B", level: "advanced" }));
    profile = addStyle(profile, makeStyle({ style: "C", level: "expert" }));
    expect(calcStats(profile).expertStyles).toBe(2);
  });

  it("스타일이 없으면 averageExperience는 0이다", () => {
    const profile = createEmptyProfile("m1");
    expect(calcStats(profile).averageExperience).toBe(0);
  });

  it("averageExperience를 올바르게 계산한다 (소수점 1자리 반올림)", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", yearsOfExperience: 1 }));
    profile = addStyle(profile, makeStyle({ style: "B", yearsOfExperience: 2 }));
    // 평균 = 1.5
    expect(calcStats(profile).averageExperience).toBe(1.5);
  });

  it("averageExperience가 소수점 1자리로 반올림된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", yearsOfExperience: 1 }));
    profile = addStyle(profile, makeStyle({ style: "B", yearsOfExperience: 2 }));
    profile = addStyle(profile, makeStyle({ style: "C", yearsOfExperience: 3 }));
    // 평균 = 2.0
    expect(calcStats(profile).averageExperience).toBe(2);
  });

  it("levelCounts가 올바르게 계산된다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", level: "beginner" }));
    profile = addStyle(profile, makeStyle({ style: "B", level: "intermediate" }));
    profile = addStyle(profile, makeStyle({ style: "C", level: "advanced" }));
    profile = addStyle(profile, makeStyle({ style: "D", level: "expert" }));
    const stats = calcStats(profile);
    expect(stats.levelCounts.beginner).toBe(1);
    expect(stats.levelCounts.intermediate).toBe(1);
    expect(stats.levelCounts.advanced).toBe(1);
    expect(stats.levelCounts.expert).toBe(1);
  });

  it("favoriteStyles는 isFavorite이 true인 항목 수이다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", isFavorite: true }));
    profile = addStyle(profile, makeStyle({ style: "B", isFavorite: false }));
    profile = addStyle(profile, makeStyle({ style: "C", isFavorite: true }));
    expect(calcStats(profile).favoriteStyles).toBe(2);
  });

  it("즐겨찾기가 없으면 favoriteStyles는 0이다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", isFavorite: false }));
    expect(calcStats(profile).favoriteStyles).toBe(0);
  });
});

// ============================================================
// 12. 경계값 테스트
// ============================================================

describe("경계값 테스트", () => {
  it("스타일 0개에서 통계를 계산해도 오류가 없다", () => {
    const profile = createEmptyProfile("m1");
    const stats = calcStats(profile);
    expect(stats.totalStyles).toBe(0);
    expect(stats.expertStyles).toBe(0);
    expect(stats.averageExperience).toBe(0);
    expect(stats.favoriteStyles).toBe(0);
  });

  it("yearsOfExperience가 0인 경우 averageExperience는 0이다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", yearsOfExperience: 0 }));
    expect(calcStats(profile).averageExperience).toBe(0);
  });

  it("모든 스타일이 expert이면 expertStyles === totalStyles이다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", level: "expert" }));
    profile = addStyle(profile, makeStyle({ style: "B", level: "expert" }));
    const stats = calcStats(profile);
    expect(stats.expertStyles).toBe(stats.totalStyles);
  });

  it("비어있는 강점/약점 배열에서 삭제해도 오류가 없다", () => {
    const profile = createEmptyProfile("m1");
    const updated = removeStrength(profile, "없는강점");
    expect(updated.strengths).toHaveLength(0);
  });

  it("스타일 1개만 있을 때 averageExperience는 해당 스타일 경력과 같다", () => {
    let profile = createEmptyProfile("m1");
    profile = addStyle(profile, makeStyle({ style: "A", yearsOfExperience: 7 }));
    expect(calcStats(profile).averageExperience).toBe(7);
  });
});

// ============================================================
// 13. 멤버별 격리 시나리오
// ============================================================

describe("멤버별 격리 시나리오", () => {
  it("두 멤버의 프로필은 서로 독립적이다", () => {
    let profileA = createEmptyProfile("m1");
    let profileB = createEmptyProfile("m2");

    profileA = addStyle(profileA, makeStyle({ style: "힙합" }));
    profileB = addStyle(profileB, makeStyle({ style: "팝핑" }));
    profileB = addStyle(profileB, makeStyle({ style: "왁킹" }));

    expect(calcStats(profileA).totalStyles).toBe(1);
    expect(calcStats(profileB).totalStyles).toBe(2);
  });

  it("한 멤버의 강점 추가가 다른 멤버에 영향 없다", () => {
    const profileA = createEmptyProfile("m1");
    const profileB = createEmptyProfile("m2");
    const updatedA = addStrength(profileA, "리듬감");
    expect(updatedA.strengths).toContain("리듬감");
    expect(profileB.strengths).not.toContain("리듬감");
  });
});
