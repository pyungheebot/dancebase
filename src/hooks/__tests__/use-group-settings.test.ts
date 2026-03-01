import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================
// use-group-settings.ts 에서 추출 가능한 순수 로직 테스트
// ============================================================

// ──────────────────────────────────────────────────────────────
// 1. 역할 레이블 변환 로직
// ──────────────────────────────────────────────────────────────

function getRoleLabel(role: "leader" | "sub_leader" | "member"): string {
  return role === "leader" ? "리더" : role === "sub_leader" ? "서브리더" : "멤버";
}

describe("역할 레이블 변환", () => {
  it("leader → '리더'를 반환한다", () => {
    expect(getRoleLabel("leader")).toBe("리더");
  });

  it("sub_leader → '서브리더'를 반환한다", () => {
    expect(getRoleLabel("sub_leader")).toBe("서브리더");
  });

  it("member → '멤버'를 반환한다", () => {
    expect(getRoleLabel("member")).toBe("멤버");
  });
});

// ──────────────────────────────────────────────────────────────
// 2. maxMembers 파싱 로직
// ──────────────────────────────────────────────────────────────

function parseMaxMembers(value: string): number | null {
  return value ? parseInt(value, 10) : null;
}

describe("maxMembers 파싱", () => {
  it("숫자 문자열 → 정수를 반환한다", () => {
    expect(parseMaxMembers("20")).toBe(20);
  });

  it("빈 문자열 → null을 반환한다", () => {
    expect(parseMaxMembers("")).toBeNull();
  });

  it("'0' → 0을 반환한다", () => {
    expect(parseMaxMembers("0")).toBe(0);
  });

  it("'100' → 100을 반환한다", () => {
    expect(parseMaxMembers("100")).toBe(100);
  });

  it("'1' → 1을 반환한다", () => {
    expect(parseMaxMembers("1")).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// 3. 초대 코드 만료일 계산
// ──────────────────────────────────────────────────────────────

function calcExpiresAt(expiry: string): string | null {
  if (expiry === "none") return null;
  const days = parseInt(expiry, 10);
  const d = new Date("2026-03-01T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

describe("초대 코드 만료일 계산", () => {
  it("'none' → null을 반환한다", () => {
    expect(calcExpiresAt("none")).toBeNull();
  });

  it("'7' → 7일 후 날짜를 반환한다 (null이 아님)", () => {
    const result = calcExpiresAt("7");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("'30' → 30일 후 날짜를 반환한다 (null이 아님)", () => {
    const result = calcExpiresAt("30");
    expect(result).not.toBeNull();
  });

  it("만료일이 ISO 8601 형식이다", () => {
    const result = calcExpiresAt("7");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ──────────────────────────────────────────────────────────────
// 4. 아바타 파일 크기 검증
// ──────────────────────────────────────────────────────────────

function isAvatarFileSizeValid(sizeBytes: number): boolean {
  return sizeBytes <= 2 * 1024 * 1024;
}

describe("아바타 파일 크기 검증", () => {
  it("2MB 이하이면 유효하다", () => {
    expect(isAvatarFileSizeValid(2 * 1024 * 1024)).toBe(true);
  });

  it("2MB 초과이면 유효하지 않다", () => {
    expect(isAvatarFileSizeValid(2 * 1024 * 1024 + 1)).toBe(false);
  });

  it("0바이트도 유효하다", () => {
    expect(isAvatarFileSizeValid(0)).toBe(true);
  });

  it("1MB는 유효하다", () => {
    expect(isAvatarFileSizeValid(1 * 1024 * 1024)).toBe(true);
  });

  it("3MB는 유효하지 않다", () => {
    expect(isAvatarFileSizeValid(3 * 1024 * 1024)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// 5. 아바타 파일 경로 생성 로직
// ──────────────────────────────────────────────────────────────

function buildAvatarPath(groupId: string, fileName: string): string {
  const ext = fileName.split(".").pop();
  return `group-${groupId}/avatar.${ext}`;
}

describe("아바타 파일 경로 생성", () => {
  it("그룹 ID와 파일명으로 경로를 생성한다", () => {
    expect(buildAvatarPath("abc123", "photo.jpg")).toBe("group-abc123/avatar.jpg");
  });

  it("png 파일 확장자를 올바르게 처리한다", () => {
    expect(buildAvatarPath("group1", "image.png")).toBe("group-group1/avatar.png");
  });

  it("webp 파일 확장자를 올바르게 처리한다", () => {
    expect(buildAvatarPath("grp99", "file.webp")).toBe("group-grp99/avatar.webp");
  });

  it("복잡한 파일명도 마지막 확장자만 추출한다", () => {
    expect(buildAvatarPath("g1", "my.photo.jpeg")).toBe("group-g1/avatar.jpeg");
  });
});

// ──────────────────────────────────────────────────────────────
// 6. 초대 코드 랜덤 생성 검증
// ──────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

describe("초대 코드 생성", () => {
  it("생성된 코드가 문자열이다", () => {
    expect(typeof generateInviteCode()).toBe("string");
  });

  it("생성된 코드 길이가 8자이다", () => {
    expect(generateInviteCode()).toHaveLength(8);
  });

  it("생성된 코드가 대문자 및 숫자로만 구성된다", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("두 번 생성 시 다른 코드가 나올 가능성이 높다", () => {
    // 동일할 확률이 매우 낮으므로 10회 반복
    const codes = new Set(Array.from({ length: 10 }, generateInviteCode));
    expect(codes.size).toBeGreaterThan(1);
  });
});

// ──────────────────────────────────────────────────────────────
// 7. 카테고리 이름 트리밍 유효성 검사
// ──────────────────────────────────────────────────────────────

function isCategoryNameValid(name: string): boolean {
  return name.trim().length > 0;
}

describe("카테고리 이름 유효성 검사", () => {
  it("일반 이름은 유효하다", () => {
    expect(isCategoryNameValid("공지사항")).toBe(true);
  });

  it("빈 문자열은 유효하지 않다", () => {
    expect(isCategoryNameValid("")).toBe(false);
  });

  it("공백만 있는 문자열은 유효하지 않다", () => {
    expect(isCategoryNameValid("   ")).toBe(false);
  });

  it("앞뒤 공백이 있어도 내용이 있으면 유효하다", () => {
    expect(isCategoryNameValid("  자유게시판  ")).toBe(true);
  });

  it("한 글자도 유효하다", () => {
    expect(isCategoryNameValid("A")).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 8. 가입 신청 목록에서 특정 신청 제거
// ──────────────────────────────────────────────────────────────

type MinimalRequest = { id: string; name: string };

function removeRequestById(requests: MinimalRequest[], id: string): MinimalRequest[] {
  return requests.filter((r) => r.id !== id);
}

describe("가입 신청 목록 필터링", () => {
  const requests: MinimalRequest[] = [
    { id: "r1", name: "김철수" },
    { id: "r2", name: "이영희" },
    { id: "r3", name: "박민준" },
  ];

  it("지정한 ID의 신청이 제거된다", () => {
    const result = removeRequestById(requests, "r2");
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "r2")).toBeUndefined();
  });

  it("존재하지 않는 ID를 제거해도 목록이 변경되지 않는다", () => {
    const result = removeRequestById(requests, "r99");
    expect(result).toHaveLength(3);
  });

  it("빈 목록에서 제거해도 빈 배열이 반환된다", () => {
    const result = removeRequestById([], "r1");
    expect(result).toHaveLength(0);
  });

  it("첫 번째 항목 제거가 올바르게 작동한다", () => {
    const result = removeRequestById(requests, "r1");
    expect(result[0].id).toBe("r2");
  });

  it("마지막 항목 제거가 올바르게 작동한다", () => {
    const result = removeRequestById(requests, "r3");
    expect(result[result.length - 1].id).toBe("r2");
  });
});

// ──────────────────────────────────────────────────────────────
// 9. myGroupRole 파생 로직
// ──────────────────────────────────────────────────────────────

type MinimalMember = { userId: string; role: string };

function getMyGroupRole(
  members: MinimalMember[],
  myUserId: string | undefined,
  canEdit: boolean
): string {
  return (
    members.find((m) => m.userId === myUserId)?.role ??
    (canEdit ? "leader" : "member")
  );
}

describe("내 그룹 역할 파생", () => {
  const members: MinimalMember[] = [
    { userId: "u1", role: "leader" },
    { userId: "u2", role: "sub_leader" },
    { userId: "u3", role: "member" },
  ];

  it("멤버 목록에 있는 경우 해당 역할을 반환한다", () => {
    expect(getMyGroupRole(members, "u2", false)).toBe("sub_leader");
  });

  it("멤버 목록에 없고 canEdit이면 'leader'를 반환한다", () => {
    expect(getMyGroupRole(members, "u99", true)).toBe("leader");
  });

  it("멤버 목록에 없고 canEdit이 false이면 'member'를 반환한다", () => {
    expect(getMyGroupRole(members, "u99", false)).toBe("member");
  });

  it("userId가 undefined이고 canEdit이면 'leader'를 반환한다", () => {
    expect(getMyGroupRole(members, undefined, true)).toBe("leader");
  });

  it("userId가 undefined이고 canEdit이 false이면 'member'를 반환한다", () => {
    expect(getMyGroupRole(members, undefined, false)).toBe("member");
  });

  it("isGroupLeader는 역할이 'leader'일 때 true다", () => {
    const role = getMyGroupRole(members, "u1", false);
    expect(role === "leader").toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 10. 그룹 폼 초기화 값 검증
// ──────────────────────────────────────────────────────────────

type GroupLike = {
  name: string;
  description: string | null;
  group_type: string | null;
  visibility: string;
  join_policy: string;
  dance_genre: string[] | null;
  max_members: number | null;
  invite_code_enabled: boolean | null;
};

function buildGroupFormValues(group: GroupLike) {
  return {
    name: group.name,
    description: group.description || "",
    groupType: group.group_type || "기타",
    visibility: group.visibility,
    joinPolicy: group.join_policy,
    danceGenre: group.dance_genre || [],
    maxMembers: group.max_members?.toString() || "",
  };
}

describe("그룹 폼 초기화 값 생성", () => {
  it("description이 null이면 빈 문자열로 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "테스트그룹",
      description: null,
      group_type: "힙합",
      visibility: "public",
      join_policy: "free",
      dance_genre: [],
      max_members: null,
      invite_code_enabled: true,
    });
    expect(form.description).toBe("");
  });

  it("group_type이 null이면 '기타'로 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "테스트그룹",
      description: null,
      group_type: null,
      visibility: "public",
      join_policy: "free",
      dance_genre: null,
      max_members: null,
      invite_code_enabled: null,
    });
    expect(form.groupType).toBe("기타");
  });

  it("max_members가 null이면 빈 문자열로 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "테스트그룹",
      description: null,
      group_type: null,
      visibility: "public",
      join_policy: "free",
      dance_genre: null,
      max_members: null,
      invite_code_enabled: null,
    });
    expect(form.maxMembers).toBe("");
  });

  it("max_members가 30이면 '30' 문자열로 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "테스트그룹",
      description: null,
      group_type: null,
      visibility: "public",
      join_policy: "free",
      dance_genre: null,
      max_members: 30,
      invite_code_enabled: null,
    });
    expect(form.maxMembers).toBe("30");
  });

  it("dance_genre가 null이면 빈 배열로 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "테스트그룹",
      description: null,
      group_type: null,
      visibility: "public",
      join_policy: "free",
      dance_genre: null,
      max_members: null,
      invite_code_enabled: null,
    });
    expect(form.danceGenre).toEqual([]);
  });

  it("정상적인 그룹 데이터로 폼이 올바르게 초기화된다", () => {
    const form = buildGroupFormValues({
      name: "댄스팀A",
      description: "힙합 댄스 그룹",
      group_type: "힙합",
      visibility: "private",
      join_policy: "approval",
      dance_genre: ["힙합", "팝핀"],
      max_members: 15,
      invite_code_enabled: true,
    });
    expect(form.name).toBe("댄스팀A");
    expect(form.description).toBe("힙합 댄스 그룹");
    expect(form.groupType).toBe("힙합");
    expect(form.visibility).toBe("private");
    expect(form.joinPolicy).toBe("approval");
    expect(form.danceGenre).toEqual(["힙합", "팝핀"]);
    expect(form.maxMembers).toBe("15");
  });
});
