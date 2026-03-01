import type { MemberFilterState } from "@/hooks/use-member-filter";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// 멤버 필터/정렬 공통 유틸
// ============================================

/**
 * EntityMember 배열에 검색어/역할/고급 필터/정렬을 적용해 새 배열을 반환합니다.
 * GroupMembersContent와 ProjectMembersContent 양쪽에서 동일한 로직이 필요하므로 공통 추출.
 */
export function filterAndSortEntityMembers(
  members: EntityMember[],
  options: {
    searchQuery: string;
    roleFilter: string;
    sortOrder: string;
    advFilter: MemberFilterState;
  }
): EntityMember[] {
  let result = [...members];
  const { searchQuery, roleFilter, sortOrder, advFilter } = options;

  // 검색어 필터
  const query = searchQuery.trim().toLowerCase();
  if (query) {
    result = result.filter((m) => {
      const displayName = (m.nickname || m.profile.name || "").toLowerCase();
      return displayName.includes(query);
    });
  }

  // 역할 필터 (기본 Select)
  if (roleFilter !== "all") {
    result = result.filter((m) => m.role === roleFilter);
  }

  // 고급 필터 — 역할 (체크박스 복수 선택)
  if (advFilter.roles.length > 0) {
    result = result.filter((m) =>
      advFilter.roles.includes(m.role as "leader" | "sub_leader" | "member")
    );
  }

  // 고급 필터 — 가입일 범위
  if (advFilter.joinedFrom) {
    result = result.filter(
      (m) => m.joinedAt && m.joinedAt.slice(0, 10) >= advFilter.joinedFrom
    );
  }
  if (advFilter.joinedTo) {
    result = result.filter(
      (m) => m.joinedAt && m.joinedAt.slice(0, 10) <= advFilter.joinedTo
    );
  }

  // 정렬
  result = result.sort((a, b) => {
    if (sortOrder === "name") {
      const nameA = (a.nickname || a.profile.name || "").toLowerCase();
      const nameB = (b.nickname || b.profile.name || "").toLowerCase();
      return nameA.localeCompare(nameB, "ko");
    }
    if (sortOrder === "joined") {
      return (a.joinedAt || "").localeCompare(b.joinedAt || "");
    }
    return 0;
  });

  return result;
}
