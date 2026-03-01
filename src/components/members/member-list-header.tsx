"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAdvancedFilter } from "@/components/members/member-advanced-filter";
import { Search } from "lucide-react";
import type { MemberFilterState } from "@/hooks/use-member-filter";

// ============================================
// Props
// ============================================

type MemberListHeaderProps = {
  /** 검색 입력값 (Input에 바인딩) */
  searchInput: string;
  /** 검색 입력 변경 핸들러 */
  onSearchChange: (v: string) => void;
  /** 역할 필터값 */
  roleFilter: string;
  /** 역할 필터 변경 핸들러 */
  onRoleFilterChange: (v: string) => void;
  /** 정렬 순서 */
  sortOrder: string;
  /** 정렬 변경 핸들러 */
  onSortOrderChange: (v: string) => void;
  /** 고급 필터 상태 */
  advFilter: MemberFilterState;
  /** 활성 고급 필터 수 */
  advActiveCount: number;
  /** 역할 토글 핸들러 */
  onAdvToggleRole: (role: "leader" | "sub_leader" | "member") => void;
  /** 가입일 시작 설정 */
  onAdvSetJoinedFrom: (v: string) => void;
  /** 가입일 종료 설정 */
  onAdvSetJoinedTo: (v: string) => void;
  /** 출석률 최소 설정 */
  onAdvSetAttendanceMin: (v: string) => void;
  /** 출석률 최대 설정 */
  onAdvSetAttendanceMax: (v: string) => void;
  /** 고급 필터 초기화 */
  onAdvReset: () => void;
};

// ============================================
// 컴포넌트
// ============================================

/**
 * 멤버 목록의 검색 / 역할 필터 / 정렬 / 고급 필터 툴바.
 * GroupMembersContent와 ProjectMembersContent 양쪽에서 공통으로 사용합니다.
 */
export function MemberListHeader({
  searchInput,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  sortOrder,
  onSortOrderChange,
  advFilter,
  advActiveCount,
  onAdvToggleRole,
  onAdvSetJoinedFrom,
  onAdvSetJoinedTo,
  onAdvSetAttendanceMin,
  onAdvSetAttendanceMax,
  onAdvReset,
}: MemberListHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      {/* 검색 인풋 */}
      <div className="relative flex-1">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="멤버 검색"
          className="h-7 pl-6 text-xs"
        />
      </div>

      {/* 역할 필터 */}
      <Select value={roleFilter} onValueChange={onRoleFilterChange}>
        <SelectTrigger className="w-24 h-7 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="leader">리더</SelectItem>
          <SelectItem value="sub_leader">서브리더</SelectItem>
          <SelectItem value="member">멤버</SelectItem>
        </SelectContent>
      </Select>

      {/* 정렬 */}
      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-24 h-7 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">이름순</SelectItem>
          <SelectItem value="joined">가입일순</SelectItem>
        </SelectContent>
      </Select>

      {/* 고급 필터 */}
      <MemberAdvancedFilter
        filter={advFilter}
        activeCount={advActiveCount}
        onToggleRole={onAdvToggleRole}
        onSetJoinedFrom={onAdvSetJoinedFrom}
        onSetJoinedTo={onAdvSetJoinedTo}
        onSetAttendanceMin={onAdvSetAttendanceMin}
        onSetAttendanceMax={onAdvSetAttendanceMax}
        onReset={onAdvReset}
      />
    </div>
  );
}
