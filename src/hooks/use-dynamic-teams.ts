"use client";

import { useState, useEffect, useCallback } from "react";
import type { DynamicTeam, DynamicTeamsData, TeamColor } from "@/types";

const MAX_TEAMS = 8;
const MAX_TEAM_NAME_LENGTH = 20;
const STORAGE_KEY = (groupId: string) =>
  `dancebase:dynamic-teams:${groupId}`;

function loadFromStorage(groupId: string): DynamicTeamsData {
  if (typeof window === "undefined") return { teams: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return { teams: [] };
    const parsed = JSON.parse(raw) as DynamicTeamsData;
    return parsed;
  } catch {
    return { teams: [] };
  }
}

function saveToStorage(groupId: string, data: DynamicTeamsData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(data));
}

export function useDynamicTeams(groupId: string) {
  const [data, setData] = useState<DynamicTeamsData>({ teams: [] });

  // 초기 로드
  useEffect(() => {
    setData(loadFromStorage(groupId));
  }, [groupId]);

  // 저장 및 상태 갱신
  const persist = useCallback(
    (next: DynamicTeamsData) => {
      saveToStorage(groupId, next);
      setData(next);
    },
    [groupId]
  );

  // 팀 생성
  const createTeam = useCallback(
    (name: string, color: TeamColor): { error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { error: "팀 이름을 입력해 주세요" };
      if (trimmed.length > MAX_TEAM_NAME_LENGTH)
        return { error: `팀 이름은 최대 ${MAX_TEAM_NAME_LENGTH}자입니다` };
      if (data.teams.length >= MAX_TEAMS)
        return { error: `팀은 최대 ${MAX_TEAMS}개까지 만들 수 있습니다` };
      if (data.teams.some((t) => t.name === trimmed))
        return { error: "이미 같은 이름의 팀이 있습니다" };

      const newTeam: DynamicTeam = {
        id: crypto.randomUUID(),
        name: trimmed,
        color,
        memberIds: [],
        createdAt: new Date().toISOString(),
      };
      persist({ teams: [...data.teams, newTeam] });
      return {};
    },
    [data, persist]
  );

  // 팀 이름 변경
  const renameTeam = useCallback(
    (teamId: string, newName: string): { error?: string } => {
      const trimmed = newName.trim();
      if (!trimmed) return { error: "팀 이름을 입력해 주세요" };
      if (trimmed.length > MAX_TEAM_NAME_LENGTH)
        return { error: `팀 이름은 최대 ${MAX_TEAM_NAME_LENGTH}자입니다` };
      if (
        data.teams.some((t) => t.name === trimmed && t.id !== teamId)
      )
        return { error: "이미 같은 이름의 팀이 있습니다" };

      persist({
        teams: data.teams.map((t) =>
          t.id === teamId ? { ...t, name: trimmed } : t
        ),
      });
      return {};
    },
    [data, persist]
  );

  // 팀 삭제 (소속 멤버는 미배정으로 이동 = 다른 팀 memberIds에도 없으면 자동으로 미배정)
  const deleteTeam = useCallback(
    (teamId: string) => {
      persist({ teams: data.teams.filter((t) => t.id !== teamId) });
    },
    [data, persist]
  );

  // 멤버를 특정 팀에 배정 (기존 팀에서는 제거 후 새 팀에 추가)
  const assignMember = useCallback(
    (memberId: string, targetTeamId: string | null) => {
      const next = data.teams.map((t) => {
        if (t.id === targetTeamId) {
          // 이미 있으면 중복 방지
          if (t.memberIds.includes(memberId)) return t;
          return { ...t, memberIds: [...t.memberIds, memberId] };
        }
        // 다른 팀에서 제거
        return { ...t, memberIds: t.memberIds.filter((id) => id !== memberId) };
      });
      persist({ teams: next });
    },
    [data, persist]
  );

  // 멤버를 미배정으로 이동
  const unassignMember = useCallback(
    (memberId: string) => {
      const next = data.teams.map((t) => ({
        ...t,
        memberIds: t.memberIds.filter((id) => id !== memberId),
      }));
      persist({ teams: next });
    },
    [data, persist]
  );

  // 멤버가 속한 팀 ID 조회 (없으면 null)
  const getTeamOfMember = useCallback(
    (memberId: string): string | null => {
      const found = data.teams.find((t) => t.memberIds.includes(memberId));
      return found?.id ?? null;
    },
    [data]
  );

  // 팀별 멤버 수
  const getTeamMemberCount = useCallback(
    (teamId: string): number => {
      const team = data.teams.find((t) => t.id === teamId);
      return team?.memberIds.length ?? 0;
    },
    [data]
  );

  // 미배정 멤버 IDs (allMemberIds 기준)
  const getUnassignedMemberIds = useCallback(
    (allMemberIds: string[]): string[] => {
      const assignedIds = new Set(data.teams.flatMap((t) => t.memberIds));
      return allMemberIds.filter((id) => !assignedIds.has(id));
    },
    [data]
  );

  return {
    teams: data.teams,
    createTeam,
    renameTeam,
    deleteTeam,
    assignMember,
    unassignMember,
    getTeamOfMember,
    getTeamMemberCount,
    getUnassignedMemberIds,
    maxTeams: MAX_TEAMS,
  };
}
