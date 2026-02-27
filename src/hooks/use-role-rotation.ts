"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  RotationRole,
  RotationAssignment,
  RoleRotationConfig,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:role-rotation:${groupId}`;

const DEFAULT_CONFIG: RoleRotationConfig = {
  roles: [],
  members: [],
  assignments: [],
  rotationWeeks: 1,
  createdAt: new Date().toISOString(),
};

function loadConfig(groupId: string): RoleRotationConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return { ...DEFAULT_CONFIG };
    return JSON.parse(raw) as RoleRotationConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(groupId: string, config: RoleRotationConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

// ─── 주 시작일(월요일) 계산 헬퍼 ─────────────────────────────

/** 주어진 날짜가 속한 주의 월요일을 YYYY-MM-DD로 반환 */
function getWeekMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ... 6=토
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 -6, 나머지는 1-day
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD 문자열에서 날짜 생성 */
function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** weekStart 문자열에서 N주 후 월요일 계산 */
function addWeeks(weekStart: string, n: number): string {
  const d = parseDate(weekStart);
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

/** 현재 주의 월요일 */
function currentWeekMonday(): string {
  return getWeekMonday(new Date());
}

// ─── 스케줄 자동 생성 (라운드 로빈) ─────────────────────────

function generateRoundRobin(
  roles: RotationRole[],
  members: string[],
  startWeek: string,
  weeks: number
): RotationAssignment[] {
  if (roles.length === 0 || members.length === 0) return [];

  const assignments: RotationAssignment[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = addWeeks(startWeek, w);
    for (let r = 0; r < roles.length; r++) {
      const memberIdx = (w * roles.length + r) % members.length;
      const member = members[memberIdx];
      assignments.push({
        id: crypto.randomUUID(),
        roleId: roles[r].id,
        memberName: member,
        weekStart,
        completed: false,
      });
    }
  }

  return assignments;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useRoleRotation(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.roleRotation(groupId) : null,
    () => loadConfig(groupId),
    { revalidateOnFocus: false }
  );

  const config: RoleRotationConfig = data ?? { ...DEFAULT_CONFIG };

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: RoleRotationConfig): void {
    saveConfig(groupId, next);
    mutate(next, false);
  }

  // ── 역할 추가 ────────────────────────────────────────────

  function addRole(name: string, icon: string, description: string): boolean {
    if (!name.trim()) return false;
    const stored = loadConfig(groupId);
    const newRole: RotationRole = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: icon.trim() || "🎭",
      description: description.trim(),
    };
    update({ ...stored, roles: [...stored.roles, newRole] });
    return true;
  }

  // ── 역할 삭제 ────────────────────────────────────────────

  function removeRole(roleId: string): boolean {
    const stored = loadConfig(groupId);
    const nextRoles = stored.roles.filter((r) => r.id !== roleId);
    if (nextRoles.length === stored.roles.length) return false;
    // 해당 역할 배정도 제거
    const nextAssignments = stored.assignments.filter(
      (a) => a.roleId !== roleId
    );
    update({ ...stored, roles: nextRoles, assignments: nextAssignments });
    return true;
  }

  // ── 멤버 추가 ────────────────────────────────────────────

  function addMember(name: string): boolean {
    if (!name.trim()) return false;
    const stored = loadConfig(groupId);
    if (stored.members.includes(name.trim())) return false;
    update({ ...stored, members: [...stored.members, name.trim()] });
    return true;
  }

  // ── 멤버 삭제 ────────────────────────────────────────────

  function removeMember(name: string): boolean {
    const stored = loadConfig(groupId);
    const nextMembers = stored.members.filter((m) => m !== name);
    if (nextMembers.length === stored.members.length) return false;
    // 해당 멤버 배정도 제거
    const nextAssignments = stored.assignments.filter(
      (a) => a.memberName !== name
    );
    update({ ...stored, members: nextMembers, assignments: nextAssignments });
    return true;
  }

  // ── 로테이션 주기 설정 ───────────────────────────────────

  function setRotationWeeks(weeks: number): void {
    const stored = loadConfig(groupId);
    update({ ...stored, rotationWeeks: Math.max(1, Math.min(52, weeks)) });
  }

  // ── 스케줄 자동 생성 ─────────────────────────────────────

  function generateSchedule(weeks: number): boolean {
    const stored = loadConfig(groupId);
    if (stored.roles.length === 0 || stored.members.length === 0) return false;

    const startWeek = currentWeekMonday();
    const newAssignments = generateRoundRobin(
      stored.roles,
      stored.members,
      startWeek,
      Math.max(1, Math.min(52, weeks))
    );

    // 이번 주 이전 과거 배정은 유지, 이번 주 이후는 새 배정으로 교체
    const pastAssignments = stored.assignments.filter(
      (a) => a.weekStart < startWeek
    );
    update({
      ...stored,
      assignments: [...pastAssignments, ...newAssignments],
    });
    return true;
  }

  // ── 완료 토글 ────────────────────────────────────────────

  function toggleCompleted(assignmentId: string): boolean {
    const stored = loadConfig(groupId);
    const idx = stored.assignments.findIndex((a) => a.id === assignmentId);
    if (idx === -1) return false;
    const next = stored.assignments.map((a) =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
    );
    update({ ...stored, assignments: next });
    return true;
  }

  // ── 이번 주 배정 ─────────────────────────────────────────

  function getCurrentAssignments(): RotationAssignment[] {
    const thisWeek = currentWeekMonday();
    return config.assignments.filter((a) => a.weekStart === thisWeek);
  }

  // ── 과거 배정 이력 ───────────────────────────────────────

  function getAssignmentHistory(): RotationAssignment[] {
    const thisWeek = currentWeekMonday();
    return config.assignments
      .filter((a) => a.weekStart < thisWeek)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }

  // ── 역할명 조회 ──────────────────────────────────────────

  function getRoleById(roleId: string): RotationRole | undefined {
    return config.roles.find((r) => r.id === roleId);
  }

  // ── 고유 주차 목록 (배정 이력용) ─────────────────────────

  function getUniqueWeeks(): string[] {
    const thisWeek = currentWeekMonday();
    return Array.from(
      new Set(
        config.assignments
          .filter((a) => a.weekStart < thisWeek)
          .map((a) => a.weekStart)
      )
    ).sort((a, b) => b.localeCompare(a));
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalRoles = config.roles.length;
  const totalMembers = config.members.length;
  const currentWeek = currentWeekMonday();
  const currentCompletionRate = (() => {
    const cur = getCurrentAssignments();
    if (cur.length === 0) return 0;
    const done = cur.filter((a) => a.completed).length;
    return Math.round((done / cur.length) * 100);
  })();

  return {
    config,
    // CRUD
    addRole,
    removeRole,
    addMember,
    removeMember,
    setRotationWeeks,
    generateSchedule,
    toggleCompleted,
    // 조회
    getCurrentAssignments,
    getAssignmentHistory,
    getRoleById,
    getUniqueWeeks,
    // 통계
    totalRoles,
    totalMembers,
    currentWeek,
    currentCompletionRate,
    // SWR
    refetch: () => mutate(),
  };
}
