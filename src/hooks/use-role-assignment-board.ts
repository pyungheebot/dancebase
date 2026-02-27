"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectRoleAssignment } from "@/types";

// ============================================
// 상수
// ============================================

const MAX_ROLES = 15;

function makeStorageKey(groupId: string, projectId: string): string {
  return `dancebase:role-board:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useRoleAssignmentBoard(groupId: string, projectId: string) {
  const storageKey = makeStorageKey(groupId, projectId);

  const [roles, setRoles] = useState<ProjectRoleAssignment[]>([]);

  // 마운트 시 localStorage에서 불러오기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectRoleAssignment[];
        setRoles(parsed);
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }, [storageKey]);

  /** localStorage에 저장하고 state 업데이트 */
  const persist = useCallback(
    (next: ProjectRoleAssignment[]) => {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRoles(next);
    },
    [storageKey]
  );

  /** 역할 추가 */
  const addRole = useCallback(
    (roleName: string, color: string, note: string) => {
      if (roles.length >= MAX_ROLES) return false;
      if (!roleName.trim()) return false;
      const newRole: ProjectRoleAssignment = {
        id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roleName: roleName.trim(),
        assignees: [],
        status: "open",
        color,
        note,
        createdAt: new Date().toISOString(),
      };
      persist([...roles, newRole]);
      return true;
    },
    [roles, persist]
  );

  /** 역할 삭제 */
  const deleteRole = useCallback(
    (roleId: string) => {
      persist(roles.filter((r) => r.id !== roleId));
    },
    [roles, persist]
  );

  /** 역할 수정 (역할명, 색상, 메모) */
  const updateRole = useCallback(
    (roleId: string, patch: Partial<Pick<ProjectRoleAssignment, "roleName" | "color" | "note">>) => {
      persist(
        roles.map((r) =>
          r.id === roleId ? { ...r, ...patch } : r
        )
      );
    },
    [roles, persist]
  );

  /** 담당자 추가 */
  const assignMember = useCallback(
    (roleId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      persist(
        roles.map((r) => {
          if (r.id !== roleId) return r;
          if (r.assignees.includes(trimmed)) return r; // 중복 방지
          return { ...r, assignees: [...r.assignees, trimmed] };
        })
      );
      return true;
    },
    [roles, persist]
  );

  /** 담당자 제거 */
  const removeMember = useCallback(
    (roleId: string, name: string) => {
      persist(
        roles.map((r) => {
          if (r.id !== roleId) return r;
          return { ...r, assignees: r.assignees.filter((a) => a !== name) };
        })
      );
    },
    [roles, persist]
  );

  /** 상태 변경 */
  const changeStatus = useCallback(
    (roleId: string, status: ProjectRoleAssignment["status"]) => {
      persist(
        roles.map((r) =>
          r.id === roleId ? { ...r, status } : r
        )
      );
    },
    [roles, persist]
  );

  return {
    roles,
    maxRoles: MAX_ROLES,
    addRole,
    deleteRole,
    updateRole,
    assignMember,
    removeMember,
    changeStatus,
  };
}
