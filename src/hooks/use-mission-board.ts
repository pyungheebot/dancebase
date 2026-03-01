"use client";

import { useState, useCallback } from "react";
import type { MissionBoardEntry, MissionDifficulty } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:mission-board:${groupId}`;
}

// ============================================================
// 리더보드 타입
// ============================================================

export type MissionLeaderboardEntry = {
  memberName: string;
  totalPoints: number;
  completedCount: number;
};

// ============================================================
// 통계 타입
// ============================================================

export type MissionBoardStats = {
  totalMissions: number;
  activeMissions: number;
  totalCompletions: number;
  topScorer: string | null;
};

// ============================================================
// 훅
// ============================================================

export function useMissionBoard(groupId: string) {
  const [missions, setMissions] = useState<MissionBoardEntry[]>(() => loadFromStorage<MissionBoardEntry[]>(storageKey(groupId), []));

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadFromStorage<MissionBoardEntry[]>(storageKey(groupId), []);
    setMissions(data);
  }, [groupId]);

  const persist = useCallback(
    (next: MissionBoardEntry[]) => {
      saveToStorage(storageKey(groupId), next);
      setMissions(next);
    },
    [groupId]
  );

  // 미션 추가
  const addMission = useCallback(
    (
      title: string,
      description: string,
      difficulty: MissionDifficulty,
      points: number,
      deadline?: string,
      maxCompletions?: number,
      createdBy?: string
    ): MissionBoardEntry => {
      const entry: MissionBoardEntry = {
        id: crypto.randomUUID(),
        title,
        description,
        difficulty,
        points,
        deadline: deadline || undefined,
        completedBy: [],
        maxCompletions: maxCompletions || undefined,
        createdBy: createdBy ?? "알 수 없음",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      persist([...missions, entry]);
      return entry;
    },
    [missions, persist]
  );

  // 미션 수정
  const updateMission = useCallback(
    (id: string, patch: Partial<MissionBoardEntry>): boolean => {
      const idx = missions.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      const next = [...missions];
      next[idx] = { ...next[idx], ...patch };
      persist(next);
      return true;
    },
    [missions, persist]
  );

  // 미션 삭제
  const deleteMission = useCallback(
    (id: string): boolean => {
      const next = missions.filter((m) => m.id !== id);
      if (next.length === missions.length) return false;
      persist(next);
      return true;
    },
    [missions, persist]
  );

  // 미션 완료
  const completeMission = useCallback(
    (id: string, memberName: string): { ok: boolean; reason?: string } => {
      const idx = missions.findIndex((m) => m.id === id);
      if (idx === -1) return { ok: false, reason: "미션을 찾을 수 없습니다." };

      const mission = missions[idx];

      if (!mission.isActive) {
        return { ok: false, reason: "비활성 미션입니다." };
      }

      const alreadyCompleted = mission.completedBy.some(
        (c) => c.memberName === memberName
      );
      if (alreadyCompleted) {
        return { ok: false, reason: "이미 완료한 미션입니다." };
      }

      if (
        mission.maxCompletions !== undefined &&
        mission.completedBy.length >= mission.maxCompletions
      ) {
        return { ok: false, reason: "최대 완료 인원에 도달했습니다." };
      }

      const updatedCompletedBy = [
        ...mission.completedBy,
        { memberName, completedAt: new Date().toISOString() },
      ];

      updateMission(id, { completedBy: updatedCompletedBy });
      return { ok: true };
    },
    [missions, updateMission]
  );

  // 활성/비활성 토글
  const toggleActive = useCallback(
    (id: string): boolean => {
      const mission = missions.find((m) => m.id === id);
      if (!mission) return false;
      return updateMission(id, { isActive: !mission.isActive });
    },
    [missions, updateMission]
  );

  // 멤버 총 포인트
  const getMemberPoints = useCallback(
    (memberName: string): number => {
      return missions.reduce((sum, mission) => {
        const completed = mission.completedBy.some(
          (c) => c.memberName === memberName
        );
        return completed ? sum + mission.points : sum;
      }, 0);
    },
    [missions]
  );

  // 포인트 리더보드
  const getLeaderboard = useCallback((): MissionLeaderboardEntry[] => {
    const memberMap: Record<
      string,
      { totalPoints: number; completedCount: number }
    > = {};

    missions.forEach((mission) => {
      mission.completedBy.forEach(({ memberName }) => {
        if (!memberMap[memberName]) {
          memberMap[memberName] = { totalPoints: 0, completedCount: 0 };
        }
        memberMap[memberName].totalPoints += mission.points;
        memberMap[memberName].completedCount += 1;
      });
    });

    return Object.entries(memberMap)
      .map(([memberName, stats]) => ({ memberName, ...stats }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [missions]);

  // 통계
  const stats: MissionBoardStats = (() => {
    const activeMissions = missions.filter((m) => m.isActive).length;
    const totalCompletions = missions.reduce(
      (sum, m) => sum + m.completedBy.length,
      0
    );

    const leaderboard = getLeaderboard();
    const topScorer =
      leaderboard.length > 0 ? leaderboard[0].memberName : null;

    return {
      totalMissions: missions.length,
      activeMissions,
      totalCompletions,
      topScorer,
    };
  })();

  return {
    missions,
    loading: false,
    addMission,
    updateMission,
    deleteMission,
    completeMission,
    toggleActive,
    getMemberPoints,
    getLeaderboard,
    stats,
    refetch: reload,
  };
}
