import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGroupMemberList } from "@/hooks/use-group-member-list";
import type { EntityContext, EntityMember } from "@/types/entity-context";
import type { MemberCategory } from "@/types";

// ============================================================
// 외부 의존성 모킹
// ============================================================

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      update: () => ({ in: () => Promise.resolve({ error: null }) }),
      delete: () => ({ in: () => Promise.resolve({ error: null }) }),
    }),
  }),
}));

vi.mock("@/lib/export/csv-exporter", () => ({
  exportToCsv: vi.fn(),
}));

// Next.js 라우터 모킹 (useTableFilter → useQueryParams 의존)
const mockReplace = vi.fn();

// 초기 URL 파라미터를 주입할 수 있는 팩토리
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => "/test",
}));

// ============================================================
// 테스트 픽스처
// ============================================================

function makeEntityMember(
  overrides: Partial<EntityMember> & { id: string; userId: string }
): EntityMember {
  return {
    id: overrides.id,
    entityId: "group-1",
    userId: overrides.userId,
    role: overrides.role ?? "member",
    nickname: overrides.nickname ?? null,
    categoryId: overrides.categoryId ?? null,
    joinedAt: overrides.joinedAt ?? "2025-01-01T00:00:00Z",
    profile: overrides.profile ?? {
      id: overrides.userId,
      name: `멤버 ${overrides.id}`,
      avatar_url: null,
      dance_genre: [],
    },
  };
}

const member1 = makeEntityMember({ id: "m1", userId: "u1", role: "leader", profile: { id: "u1", name: "김리더", avatar_url: null, dance_genre: [] }, joinedAt: "2024-01-01T00:00:00Z" });
const member2 = makeEntityMember({ id: "m2", userId: "u2", role: "member", profile: { id: "u2", name: "박멤버", avatar_url: null, dance_genre: [] }, joinedAt: "2024-06-01T00:00:00Z" });
const member3 = makeEntityMember({ id: "m3", userId: "u3", role: "sub_leader", profile: { id: "u3", name: "이서브", avatar_url: null, dance_genre: [] }, joinedAt: "2024-03-01T00:00:00Z" });
const member4 = makeEntityMember({ id: "m4", userId: "u4", role: "member", profile: { id: "u4", name: "최댄서", avatar_url: null, dance_genre: [] }, nickname: "댄서닉", categoryId: "cat-1", joinedAt: "2025-01-01T00:00:00Z" });

const ALL_MEMBERS = [member1, member2, member3, member4];

function makeContext(members: EntityMember[] = ALL_MEMBERS): EntityContext {
  return {
    entityType: "group",
    entityId: "group-1",
    groupId: "group-1",
    projectId: null,
    basePath: "/groups/group-1",
    breadcrumbs: [],
    header: { name: "테스트 그룹", description: null, badge: null },
    members,
    nicknameMap: {},
    permissions: {
      canEdit: true,
      canManageMembers: true,
      canManageFinance: true,
      canViewFinance: true,
      canManageSettings: true,
      canManageProjects: true,
      financeRole: "admin",
    },
    features: {
      board: true, schedule: true, attendance: true, finance: true, members: true,
      projects: true, subgroups: true, settings: true, memberCategories: true,
      memberInvite: true, memberAddFromParent: false, joinRequests: true,
      visibility: true, danceGenre: true, memberCapacity: true, featureToggle: false,
      deletable: false, financePermissionManager: true,
    },
    parentGroupId: null,
    inviteCode: null,
    independentFeatures: {},
    raw: {
      group: null, project: null, groupMembers: [], categories: [],
      categoryMap: {}, categoryColorMap: {},
    },
  };
}

const categories: MemberCategory[] = [
  { id: "cat-1", group_id: "group-1", name: "A팀", color: "#FF0000", order: 1 },
  { id: "cat-2", group_id: "group-1", name: "B팀", color: "#00FF00", order: 2 },
];

const onUpdate = vi.fn();

// ============================================================
// 초기 상태 테스트
// ============================================================

describe("useGroupMemberList - 초기 상태", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("초기 categoryManagerOpen이 false다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.categoryManagerOpen).toBe(false);
  });

  it("초기 selectedCategory가 'all'이다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.selectedCategory).toBe("all");
  });

  it("초기 selectedIds가 빈 Set이다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("초기 bulkLoading이 false다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.bulkLoading).toBe(false);
  });

  it("초기 bulkRemoveOpen이 false다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.bulkRemoveOpen).toBe(false);
  });

  it("초기 filters.role이 'all'이다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("all");
  });

  it("초기 filters.sort가 'name'이다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.sort).toBe("name");
  });

  it("allMembersForList가 ctx.members를 GroupMemberWithProfile 형태로 변환한다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.allMembersForList).toHaveLength(ALL_MEMBERS.length);
    expect(result.current.allMembersForList[0].user_id).toBe("u1");
  });

  it("filteredMembers 초기값이 allMembersForList와 동일하다 (필터 없음, 이름순 정렬)", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filteredMembers).toHaveLength(ALL_MEMBERS.length);
  });
});

// ============================================================
// 카테고리 관리 상태 테스트
// ============================================================

describe("useGroupMemberList - 카테고리 관리", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("setCategoryManagerOpen(true) 호출 시 categoryManagerOpen이 true가 된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setCategoryManagerOpen(true);
    });
    expect(result.current.categoryManagerOpen).toBe(true);
  });

  it("setSelectedCategory('cat-1') 호출 시 selectedCategory가 변경된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setSelectedCategory("cat-1");
    });
    expect(result.current.selectedCategory).toBe("cat-1");
  });

  it("selectedCategory='cat-1' 이면 해당 카테고리 멤버만 필터링된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setSelectedCategory("cat-1");
    });
    // member4만 cat-1에 속함
    expect(result.current.filteredMembers).toHaveLength(1);
    expect(result.current.filteredMembers[0].id).toBe("m4");
  });

  it("selectedCategory='none' 이면 카테고리 없는 멤버만 필터링된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setSelectedCategory("none");
    });
    // member1, member2, member3은 category 없음
    expect(result.current.filteredMembers).toHaveLength(3);
  });

  it("selectedCategory='cat-2' 이면 해당 카테고리 멤버가 없으므로 빈 배열이 반환된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setSelectedCategory("cat-2");
    });
    expect(result.current.filteredMembers).toHaveLength(0);
  });
});

// ============================================================
// 역할 필터 테스트
// URL 파라미터를 초기값으로 설정하여 useTableFilter 상태를 세팅
// ============================================================

describe("useGroupMemberList - 역할 필터", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("role='leader' URL 파라미터로 리더만 반환된다", () => {
    currentSearchParams = new URLSearchParams("role=leader");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("leader");
    expect(result.current.filteredMembers.every((m) => m.role === "leader")).toBe(true);
    expect(result.current.filteredMembers).toHaveLength(1);
  });

  it("role='member' URL 파라미터로 일반 멤버만 반환된다", () => {
    currentSearchParams = new URLSearchParams("role=member");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("member");
    expect(result.current.filteredMembers.every((m) => m.role === "member")).toBe(true);
    expect(result.current.filteredMembers).toHaveLength(2); // member2, member4
  });

  it("role='sub_leader' URL 파라미터로 서브리더만 반환된다", () => {
    currentSearchParams = new URLSearchParams("role=sub_leader");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("sub_leader");
    expect(result.current.filteredMembers).toHaveLength(1);
    expect(result.current.filteredMembers[0].role).toBe("sub_leader");
  });

  it("URL 파라미터 없으면 role='all'로 모든 멤버가 반환된다", () => {
    currentSearchParams = new URLSearchParams();
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("all");
    expect(result.current.filteredMembers).toHaveLength(ALL_MEMBERS.length);
  });
});

// ============================================================
// 정렬 테스트
// URL 파라미터로 정렬 기준 초기 설정
// ============================================================

describe("useGroupMemberList - 정렬", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("기본값(sort='name')이면 이름 한국어 오름차순으로 정렬된다", () => {
    currentSearchParams = new URLSearchParams();
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    const names = result.current.filteredMembers.map(
      (m) => m.nickname || m.profiles.name || ""
    );
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "ko"));
    expect(names).toEqual(sorted);
  });

  it("sort='joined' URL 파라미터로 가입일 오름차순으로 정렬된다", () => {
    currentSearchParams = new URLSearchParams("sort=joined");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.sort).toBe("joined");
    const joinedDates = result.current.filteredMembers.map((m) => m.joined_at || "");
    const sorted = [...joinedDates].sort((a, b) => a.localeCompare(b));
    expect(joinedDates).toEqual(sorted);
  });

  it("nickname이 있는 멤버는 nickname 기준으로 정렬된다", () => {
    currentSearchParams = new URLSearchParams();
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    // member4는 nickname="댄서닉"이므로 이름 정렬에 nickname이 사용됨
    const nicknameOrNameList = result.current.filteredMembers.map(
      (m) => (m.nickname || m.profiles.name || "").toLowerCase()
    );
    const sorted = [...nicknameOrNameList].sort((a, b) => a.localeCompare(b, "ko"));
    expect(nicknameOrNameList).toEqual(sorted);
  });
});

// ============================================================
// 멤버 선택 테스트
// ============================================================

describe("useGroupMemberList - 멤버 선택", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("handleToggleSelect 호출 시 해당 멤버가 selectedIds에 추가된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleToggleSelect("m2");
    });
    expect(result.current.selectedIds.has("m2")).toBe(true);
    expect(result.current.selectedIds.size).toBe(1);
  });

  it("이미 선택된 멤버를 handleToggleSelect 호출 시 선택 해제된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => { result.current.handleToggleSelect("m2"); });
    act(() => { result.current.handleToggleSelect("m2"); });
    expect(result.current.selectedIds.has("m2")).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("현재 사용자(u1)는 선택 목록에서 제외된다 (자기 자신은 선택 불가)", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      // currentUserId = "u1", member1.userId = "u1" → m1은 선택 불가
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleToggleSelectAll();
    });
    // 전체 선택 시 m1(자기 자신)은 제외됨
    expect(result.current.selectedIds.has("m1")).toBe(false);
  });

  it("someSelected는 하나라도 선택되면 true다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.someSelected).toBe(false);
    act(() => {
      result.current.handleToggleSelect("m2");
    });
    expect(result.current.someSelected).toBe(true);
  });

  it("handleToggleSelectAll 호출 시 선택 가능한 모든 멤버가 선택된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleToggleSelectAll();
    });
    // u1(m1)을 제외한 m2, m3, m4가 선택됨
    expect(result.current.selectedIds.has("m2")).toBe(true);
    expect(result.current.selectedIds.has("m3")).toBe(true);
    expect(result.current.selectedIds.has("m4")).toBe(true);
    expect(result.current.selectedIds.size).toBe(3);
  });

  it("allSelected인 상태에서 handleToggleSelectAll 호출 시 전체 해제된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => { result.current.handleToggleSelectAll(); }); // 전체 선택
    expect(result.current.allSelected).toBe(true);

    act(() => { result.current.handleToggleSelectAll(); }); // 전체 해제
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.allSelected).toBe(false);
  });

  it("allSelected는 선택 가능한 모든 멤버가 선택된 경우 true다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      // m2, m3, m4 각각 선택 (m1은 자기 자신)
      result.current.handleToggleSelect("m2");
      result.current.handleToggleSelect("m3");
      result.current.handleToggleSelect("m4");
    });
    expect(result.current.allSelected).toBe(true);
  });

  it("setBulkRemoveOpen(true) 호출 시 bulkRemoveOpen이 true가 된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setBulkRemoveOpen(true);
    });
    expect(result.current.bulkRemoveOpen).toBe(true);
  });
});

// ============================================================
// isGrouped 테스트
// ============================================================

describe("useGroupMemberList - isGrouped", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("기본 상태(필터 없음)에서 isGrouped는 true다", () => {
    currentSearchParams = new URLSearchParams();
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.isGrouped).toBe(true);
  });

  it("카테고리 필터 적용 시 isGrouped가 false가 된다", () => {
    currentSearchParams = new URLSearchParams();
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.setSelectedCategory("cat-1");
    });
    expect(result.current.isGrouped).toBe(false);
  });

  it("role=leader URL 파라미터 적용 시 isGrouped가 false가 된다", () => {
    currentSearchParams = new URLSearchParams("role=leader");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.filters.role).toBe("leader");
    expect(result.current.isGrouped).toBe(false);
  });
});

// ============================================================
// allMembersForList 변환 테스트
// ============================================================

describe("useGroupMemberList - allMembersForList 변환", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("EntityMember를 GroupMemberWithProfile 형태로 올바르게 변환한다", () => {
    const ctx = makeContext([member1]);
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", [], onUpdate)
    );
    const converted = result.current.allMembersForList[0];
    expect(converted.id).toBe("m1");
    expect(converted.user_id).toBe("u1");
    expect(converted.role).toBe("leader");
    expect(converted.group_id).toBe("group-1");
    expect(converted.joined_at).toBe("2024-01-01T00:00:00Z");
    expect(converted.profiles.name).toBe("김리더");
  });

  it("nickname이 있는 멤버는 nickname 필드가 올바르게 설정된다", () => {
    const ctx = makeContext([member4]);
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u99", [], onUpdate)
    );
    expect(result.current.allMembersForList[0].nickname).toBe("댄서닉");
  });

  it("ctx.members가 빈 배열이면 allMembersForList도 빈 배열이다", () => {
    const ctx = makeContext([]);
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", [], onUpdate)
    );
    expect(result.current.allMembersForList).toHaveLength(0);
    expect(result.current.filteredMembers).toHaveLength(0);
  });
});

// ============================================================
// CSV 내보내기 테스트
// ============================================================

describe("useGroupMemberList - CSV 내보내기", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("handleExportCsv 호출 시 exportToCsv가 호출된다", async () => {
    const { exportToCsv } = await import("@/lib/export/csv-exporter");
    const mockedExport = vi.mocked(exportToCsv);

    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleExportCsv();
    });
    expect(mockedExport).toHaveBeenCalledOnce();
  });

  it("handleExportCsv 호출 시 파일명에 그룹 이름이 포함된다", async () => {
    const { exportToCsv } = await import("@/lib/export/csv-exporter");
    const mockedExport = vi.mocked(exportToCsv);

    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleExportCsv();
    });
    const [filename] = mockedExport.mock.calls[0];
    expect(filename).toContain("테스트 그룹");
  });

  it("handleExportCsv 호출 시 성공 토스트가 호출된다", async () => {
    const { toast } = await import("sonner");
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.handleExportCsv();
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
  });
});

// ============================================================
// 고급 필터 인터페이스 테스트
// ============================================================

describe("useGroupMemberList - 고급 필터 인터페이스", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearchParams = new URLSearchParams();
  });

  it("advFilter 초기값이 비어있다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.advFilter.roles).toHaveLength(0);
    expect(result.current.advFilter.joinedFrom).toBe("");
    expect(result.current.advFilter.joinedTo).toBe("");
  });

  it("advActiveCount 초기값이 0이다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    expect(result.current.advActiveCount).toBe(0);
  });

  it("advToggleRole 호출 시 역할이 토글된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.advToggleRole("leader");
    });
    expect(result.current.advFilter.roles).toContain("leader");
    expect(result.current.advActiveCount).toBe(1);
  });

  it("advSetJoinedFrom 호출 시 joinedFrom이 설정된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.advSetJoinedFrom("2024-06-01");
    });
    expect(result.current.advFilter.joinedFrom).toBe("2024-06-01");
  });

  it("advSetJoinedTo 호출 시 joinedTo가 설정된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.advSetJoinedTo("2024-12-31");
    });
    expect(result.current.advFilter.joinedTo).toBe("2024-12-31");
  });

  it("가입일 범위 필터 적용 시 해당 범위 멤버만 반환된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      // 2024-06-01 이후 가입 멤버만: member2(2024-06-01), member4(2025-01-01)
      result.current.advSetJoinedFrom("2024-06-01");
    });
    const ids = result.current.filteredMembers.map((m) => m.id);
    expect(ids).toContain("m2");
    expect(ids).toContain("m4");
    expect(ids).not.toContain("m1"); // 2024-01-01
    expect(ids).not.toContain("m3"); // 2024-03-01
  });

  it("advResetFilter 호출 시 고급 필터가 초기화된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.advToggleRole("leader");
      result.current.advSetJoinedFrom("2024-01-01");
    });
    expect(result.current.advActiveCount).toBe(2);

    act(() => {
      result.current.advResetFilter();
    });
    expect(result.current.advActiveCount).toBe(0);
    expect(result.current.advFilter.roles).toHaveLength(0);
    expect(result.current.advFilter.joinedFrom).toBe("");
  });

  it("advSetAttendanceMin/Max 호출 시 값이 설정된다", () => {
    const ctx = makeContext();
    const { result } = renderHook(() =>
      useGroupMemberList(ctx, "u1", categories, onUpdate)
    );
    act(() => {
      result.current.advSetAttendanceMin("50");
      result.current.advSetAttendanceMax("100");
    });
    expect(result.current.advFilter.attendanceMin).toBe("50");
    expect(result.current.advFilter.attendanceMax).toBe("100");
  });
});
