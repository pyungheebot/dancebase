"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTableFilter } from "@/hooks/use-table-filter";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { useMemberFilter } from "@/hooks/use-member-filter";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { exportToCsv } from "@/lib/export/csv-exporter";
import type { EntityContext } from "@/types/entity-context";
import type { GroupMemberWithProfile, MemberCategory, Profile } from "@/types";

// ============================================
// roleLabel 유틸
// ============================================

function roleLabel(role: string): string {
  if (role === "leader") return "리더";
  if (role === "sub_leader") return "서브리더";
  return "멤버";
}

// ============================================
// 훅 반환 타입
// ============================================

export type UseGroupMemberListReturn = {
  // 카테고리 관련
  categoryManagerOpen: boolean;
  setCategoryManagerOpen: (open: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // 검색/필터/정렬 (useTableFilter)
  filters: { q: string; role: string; sort: string };
  searchInput: string;
  setSearchInput: (v: string) => void;
  setFilter: (key: string, value: string) => void;

  // 고급 필터 (useMemberFilter)
  advFilter: ReturnType<typeof useMemberFilter>["filter"];
  advActiveCount: number;
  advToggleRole: (role: "leader" | "sub_leader" | "member") => void;
  advSetJoinedFrom: (v: string) => void;
  advSetJoinedTo: (v: string) => void;
  advSetAttendanceMin: (v: string) => void;
  advSetAttendanceMax: (v: string) => void;
  advResetFilter: () => void;

  // 일괄 선택
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
  handleToggleSelectAll: () => void;
  handleToggleSelect: (memberId: string) => void;

  // 일괄 작업
  bulkLoading: boolean;
  bulkRemoveOpen: boolean;
  setBulkRemoveOpen: (open: boolean) => void;
  handleBulkRoleChange: (newRole: "leader" | "sub_leader" | "member") => Promise<void>;
  handleBulkRemoveConfirm: () => Promise<void>;

  // 필터된 멤버 목록
  filteredMembers: GroupMemberWithProfile[];
  allMembersForList: GroupMemberWithProfile[];

  // 그룹화 여부
  isGrouped: boolean;

  // CSV 내보내기
  handleExportCsv: () => void;
};

// ============================================
// 훅 본체
// ============================================

/**
 * GroupMembersContent의 상태 관리 로직을 추출한 훅.
 * 멤버 필터링/정렬, 일괄 선택/역할변경/삭제, 카테고리 관리, 추세 모달 상태를 통합 관리합니다.
 */
export function useGroupMemberList(
  ctx: EntityContext,
  currentUserId: string,
  categories: MemberCategory[],
  onUpdate: () => void
): UseGroupMemberListReturn {
  const supabase = createClient();

  // ---- 카테고리 관리 ----
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // ---- 검색/필터/정렬 (URL 동기화) ----
  const {
    filters,
    setFilter,
    searchInput,
    setSearchInput,
    debouncedSearch,
  } = useTableFilter(
    { q: "", role: "all", sort: "name" },
    { searchKey: "q", debounceMs: 500 }
  );

  const roleFilter = filters.role;
  const sortOrder = filters.sort;
  // 실제 필터링에는 디바운싱된 검색어 사용
  const searchQuery = debouncedSearch;

  // 외부에 노출할 래퍼 함수 — 타입을 string으로 완화해 소비 컴포넌트가 편하게 사용
  const setFilterWrapper = (key: string, value: string) =>
    setFilter(key as "q" | "role" | "sort", value as never);

  // ---- 고급 필터 ----
  const {
    filter: advFilter,
    activeCount: advActiveCount,
    toggleRole: advToggleRole,
    setJoinedFrom: advSetJoinedFrom,
    setJoinedTo: advSetJoinedTo,
    setAttendanceMin: advSetAttendanceMin,
    setAttendanceMax: advSetAttendanceMax,
    resetFilter: advResetFilter,
  } = useMemberFilter();

  // ---- 일괄 선택 상태 ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false);

  // 일괄 작업 pending 관리
  const { pending: bulkLoading, submit: submitBulk } = useFormSubmission();

  // ---- 현재 사용자의 group_member id (자기 자신은 선택 불가) ----
  const currentUserMemberId = useMemo(
    () => ctx.members.find((m) => m.userId === currentUserId)?.id ?? null,
    [ctx.members, currentUserId]
  );

  // ---- NormalizedMember → GroupMemberWithProfile 역변환 ----
  const allMembersForList: GroupMemberWithProfile[] = useMemo(
    () =>
      ctx.members.map((m) => ({
        id: m.id,
        group_id: ctx.groupId,
        user_id: m.userId,
        role: m.role,
        joined_at: m.joinedAt,
        nickname: m.nickname,
        category_id: m.categoryId ?? null,
        profiles: {
          ...({} as Profile),
          id: m.profile.id,
          name: m.profile.name,
          avatar_url: m.profile.avatar_url,
          dance_genre: m.profile.dance_genre ?? [],
        },
      })),
    [ctx.members, ctx.groupId]
  );

  // ---- 멤버 필터링/정렬 ----
  const filteredMembers = useMemo(() => {
    let result = allMembersForList;

    // 카테고리 필터
    if (selectedCategory !== "all") {
      result =
        selectedCategory === "none"
          ? result.filter(
              (m) => !m.category_id || !categories.some((c) => c.id === m.category_id)
            )
          : result.filter((m) => m.category_id === selectedCategory);
    }

    // 검색어 필터
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => {
        const displayName = (m.nickname || m.profiles.name || "").toLowerCase();
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
        (m) => m.joined_at && m.joined_at.slice(0, 10) >= advFilter.joinedFrom
      );
    }
    if (advFilter.joinedTo) {
      result = result.filter(
        (m) => m.joined_at && m.joined_at.slice(0, 10) <= advFilter.joinedTo
      );
    }

    // 정렬
    result = [...result].sort((a, b) => {
      if (sortOrder === "name") {
        const nameA = (a.nickname || a.profiles.name || "").toLowerCase();
        const nameB = (b.nickname || b.profiles.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "ko");
      }
      if (sortOrder === "joined") {
        return (a.joined_at || "").localeCompare(b.joined_at || "");
      }
      return 0;
    });

    return result;
  }, [allMembersForList, selectedCategory, categories, searchQuery, roleFilter, sortOrder, advFilter]);

  // ---- 그룹화 여부 (카테고리별 섹션으로 나눌지) ----
  const isGrouped =
    selectedCategory === "all" &&
    !searchQuery.trim() &&
    roleFilter === "all" &&
    advActiveCount === 0;

  // ---- 선택 가능한 멤버 ids (자기 자신 제외) ----
  const selectableIds = useMemo(
    () => filteredMembers.filter((m) => m.id !== currentUserMemberId).map((m) => m.id),
    [filteredMembers, currentUserMemberId]
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  // ---- 전체 선택/해제 ----
  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  }, [allSelected, selectableIds]);

  // ---- 개별 선택 토글 ----
  const handleToggleSelect = useCallback((memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  // ---- 일괄 역할 변경 ----
  const handleBulkRoleChange = useCallback(
    async (newRole: "leader" | "sub_leader" | "member") => {
      if (selectedIds.size === 0) return;
      const ids = Array.from(selectedIds);

      await submitBulk(async () => {
        const { error } = await supabase
          .from("group_members")
          .update({ role: newRole })
          .in("id", ids);
        if (error) throw new Error(TOAST.MEMBERS.ROLE_CHANGE_ERROR);

        const label =
          newRole === "leader" ? "그룹장" : newRole === "sub_leader" ? "부그룹장" : "멤버";
        toast.success(`${ids.length}명의 역할이 ${label}(으)로 변경되었습니다`);
        setSelectedIds(new Set());
        onUpdate();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, submitBulk, onUpdate]
  );

  // ---- 일괄 멤버 제거 ----
  const handleBulkRemoveConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    await submitBulk(async () => {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .in("id", ids);
      if (error) throw new Error(TOAST.MEMBERS.MEMBER_REMOVE_ERROR);

      setBulkRemoveOpen(false);
      toast.success(`${ids.length}명이 제거되었습니다`);
      setSelectedIds(new Set());
      onUpdate();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, submitBulk, onUpdate]);

  // ---- CSV 내보내기 ----
  const handleExportCsv = useCallback(() => {
    const headers = ["이름", "역할", "가입일"];
    const rows = ctx.members.map((m) => [
      m.nickname || m.profile.name,
      roleLabel(m.role),
      m.joinedAt ? m.joinedAt.slice(0, 10) : "",
    ]);
    exportToCsv(`멤버목록_${ctx.header.name}`, headers, rows);
    toast.success(TOAST.MEMBERS.CSV_DOWNLOADED);
  }, [ctx.members, ctx.header.name]);

  return {
    // 카테고리
    categoryManagerOpen,
    setCategoryManagerOpen,
    selectedCategory,
    setSelectedCategory,

    // 검색/필터/정렬
    filters,
    searchInput,
    setSearchInput,
    setFilter: setFilterWrapper,

    // 고급 필터
    advFilter,
    advActiveCount,
    advToggleRole,
    advSetJoinedFrom,
    advSetJoinedTo,
    advSetAttendanceMin,
    advSetAttendanceMax,
    advResetFilter,

    // 일괄 선택
    selectedIds,
    allSelected,
    someSelected,
    handleToggleSelectAll,
    handleToggleSelect,

    // 일괄 작업
    bulkLoading,
    bulkRemoveOpen,
    setBulkRemoveOpen,
    handleBulkRoleChange,
    handleBulkRemoveConfirm,

    // 필터된 멤버
    filteredMembers,
    allMembersForList,
    isGrouped,

    // CSV
    handleExportCsv,
  };
}
