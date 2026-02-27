"use client";

import { useState, useCallback } from "react";

// ============================================
// 필터 조건 타입
// ============================================

export type MemberFilterRoles = ("leader" | "sub_leader" | "member")[];

export type MemberFilterState = {
  roles: MemberFilterRoles;
  joinedFrom: string;   // ISO date string "YYYY-MM-DD" 또는 ""
  joinedTo: string;     // ISO date string "YYYY-MM-DD" 또는 ""
  attendanceMin: string; // "0"~"100" 또는 ""
  attendanceMax: string; // "0"~"100" 또는 ""
};

const EMPTY_FILTER: MemberFilterState = {
  roles: [],
  joinedFrom: "",
  joinedTo: "",
  attendanceMin: "",
  attendanceMax: "",
};

// ============================================
// 훅
// ============================================

export function useMemberFilter() {
  const [filter, setFilter] = useState<MemberFilterState>(EMPTY_FILTER);

  /** 역할 토글 */
  const toggleRole = useCallback((role: "leader" | "sub_leader" | "member") => {
    setFilter((prev) => {
      const already = prev.roles.includes(role);
      return {
        ...prev,
        roles: already
          ? prev.roles.filter((r) => r !== role)
          : [...prev.roles, role],
      };
    });
  }, []);

  /** 가입일 시작 */
  const setJoinedFrom = useCallback((v: string) => {
    setFilter((prev) => ({ ...prev, joinedFrom: v }));
  }, []);

  /** 가입일 끝 */
  const setJoinedTo = useCallback((v: string) => {
    setFilter((prev) => ({ ...prev, joinedTo: v }));
  }, []);

  /** 출석률 최소 */
  const setAttendanceMin = useCallback((v: string) => {
    setFilter((prev) => ({ ...prev, attendanceMin: v }));
  }, []);

  /** 출석률 최대 */
  const setAttendanceMax = useCallback((v: string) => {
    setFilter((prev) => ({ ...prev, attendanceMax: v }));
  }, []);

  /** 필터 초기화 */
  const resetFilter = useCallback(() => {
    setFilter(EMPTY_FILTER);
  }, []);

  /** 활성 필터 개수 (조건이 비어 있지 않은 항목 수) */
  const activeCount = (() => {
    let count = 0;
    if (filter.roles.length > 0) count += 1;
    if (filter.joinedFrom || filter.joinedTo) count += 1;
    if (filter.attendanceMin !== "" || filter.attendanceMax !== "") count += 1;
    return count;
  })();

  /** 필터가 하나라도 활성 상태인지 */
  const isActive = activeCount > 0;

  return {
    filter,
    activeCount,
    isActive,
    toggleRole,
    setJoinedFrom,
    setJoinedTo,
    setAttendanceMin,
    setAttendanceMax,
    resetFilter,
  };
}
