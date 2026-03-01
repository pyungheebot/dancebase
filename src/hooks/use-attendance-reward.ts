"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type {
  AttendanceRewardRule,
  AttendanceRewardTier,
  MemberRewardRecord,
} from "@/types";

// ============================================================
// 스토리지 키
// ============================================================

const STORAGE_KEY_PREFIX = "dancebase:attendance-reward:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

// ============================================================
// 스토리지 데이터 형식
// ============================================================

type StorageData = {
  rules: AttendanceRewardRule[];
  records: MemberRewardRecord[];
};

// ============================================================
// 훅
// ============================================================

export function useAttendanceReward(groupId: string) {
  const [data, setData] = useState<StorageData>({ rules: [], records: [] });

  // 상태 업데이트 + localStorage 동기화
  const updateData = useCallback(
    (updater: (prev: StorageData) => StorageData) => {
      setData((prev) => {
        const next = updater(prev);
        saveToStorage(getStorageKey(groupId), next);
        return next;
      });
    },
    [groupId]
  );

  // ============================================================
  // 보상 규칙
  // ============================================================

  const addRule = useCallback(
    (
      tier: AttendanceRewardTier,
      requiredAttendance: number,
      rewardName: string,
      rewardDescription: string,
      points: number
    ) => {
      const newRule: AttendanceRewardRule = {
        id: crypto.randomUUID(),
        tier,
        requiredAttendance,
        rewardName: rewardName.trim(),
        rewardDescription: rewardDescription.trim(),
        points,
        createdAt: new Date().toISOString(),
      };
      updateData((prev) => ({
        ...prev,
        rules: [...prev.rules, newRule],
      }));
    },
    [updateData]
  );

  const deleteRule = useCallback(
    (ruleId: string) => {
      updateData((prev) => ({
        ...prev,
        rules: prev.rules.filter((r) => r.id !== ruleId),
      }));
    },
    [updateData]
  );

  // ============================================================
  // 보상 수여 / 취소
  // ============================================================

  const awardReward = useCallback(
    (
      memberName: string,
      tier: AttendanceRewardTier,
      attendanceRate: number,
      points: number
    ) => {
      const newRecord: MemberRewardRecord = {
        id: crypto.randomUUID(),
        memberName,
        tier,
        earnedAt: new Date().toISOString(),
        attendanceRate,
        points,
      };
      updateData((prev) => ({
        ...prev,
        records: [...prev.records, newRecord],
      }));
    },
    [updateData]
  );

  const revokeReward = useCallback(
    (recordId: string) => {
      updateData((prev) => ({
        ...prev,
        records: prev.records.filter((r) => r.id !== recordId),
      }));
    },
    [updateData]
  );

  // ============================================================
  // 조회 헬퍼
  // ============================================================

  const getMemberRewards = useCallback(
    (memberName: string): MemberRewardRecord[] => {
      return data.records.filter((r) => r.memberName === memberName);
    },
    [data.records]
  );

  const getMemberTotalPoints = useCallback(
    (memberName: string): number => {
      return data.records
        .filter((r) => r.memberName === memberName)
        .reduce((sum, r) => sum + r.points, 0);
    },
    [data.records]
  );

  // ============================================================
  // 통계
  // ============================================================

  const totalRules = data.rules.length;
  const totalRecords = data.records.length;

  // 멤버별 총 포인트 집계
  const memberPointsMap: Record<string, number> = {};
  for (const record of data.records) {
    memberPointsMap[record.memberName] =
      (memberPointsMap[record.memberName] ?? 0) + record.points;
  }

  const topPointHolder =
    Object.keys(memberPointsMap).length > 0
      ? Object.entries(memberPointsMap).reduce(
          (top, [name, points]) => (points > top.points ? { name, points } : top),
          { name: "", points: -1 }
        )
      : null;

  // 티어별 보상 수 분포
  const tierDistribution: Record<AttendanceRewardTier, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    diamond: 0,
  };
  for (const record of data.records) {
    tierDistribution[record.tier] += 1;
  }

  return {
    rules: data.rules,
    records: data.records,
    // 규칙 관리
    addRule,
    deleteRule,
    // 보상 수여
    awardReward,
    revokeReward,
    // 조회
    getMemberRewards,
    getMemberTotalPoints,
    // 통계
    totalRules,
    totalRecords,
    topPointHolder,
    tierDistribution,
    memberPointsMap,
  };
}
