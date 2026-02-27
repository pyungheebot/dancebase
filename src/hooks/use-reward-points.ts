"use client";

import { useState, useCallback, useMemo } from "react";
import { ACTIVITY_POINT_DEFAULTS } from "@/types";
import type {
  RewardItem,
  PointTransaction,
  ActivityPointTransaction,
  PointActionType,
  MemberPointSummary,
} from "@/types";

// localStorage 키 생성
function itemsKey(groupId: string) {
  return `reward-items-${groupId}`;
}
function txKey(groupId: string) {
  return `point-transactions-${groupId}`;
}

// localStorage 읽기 헬퍼
function readItems(groupId: string): RewardItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(itemsKey(groupId));
    return raw ? (JSON.parse(raw) as RewardItem[]) : [];
  } catch {
    return [];
  }
}

function readTransactions(groupId: string): PointTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(txKey(groupId));
    return raw ? (JSON.parse(raw) as PointTransaction[]) : [];
  } catch {
    return [];
  }
}

// localStorage 쓰기 헬퍼
function writeItems(groupId: string, items: RewardItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(itemsKey(groupId), JSON.stringify(items));
}

function writeTransactions(groupId: string, txs: PointTransaction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(txKey(groupId), JSON.stringify(txs));
}

export function useRewardPoints(groupId: string) {
  // 강제 리렌더를 위한 상태 카운터
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // ---- 포인트 조회 ----

  const getBalance = useCallback(
    (userId: string): number => {
      const txs = readTransactions(groupId);
      return txs
        .filter((t) => t.userId === userId)
        .reduce((sum, t) => sum + t.amount, 0);
    },
    [groupId]
  );

  const getTransactions = useCallback(
    (userId: string): PointTransaction[] => {
      const txs = readTransactions(groupId);
      return txs
        .filter((t) => t.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [groupId]
  );

  // ---- 포인트 적립/차감 ----

  const addPoints = useCallback(
    (userId: string, amount: number, reason: string) => {
      const txs = readTransactions(groupId);
      const newTx: PointTransaction = {
        id: crypto.randomUUID(),
        userId,
        amount: Math.abs(amount),
        reason,
        createdAt: new Date().toISOString(),
      };
      writeTransactions(groupId, [...txs, newTx]);
      bump();
    },
    [groupId, bump]
  );

  const spendPoints = useCallback(
    (userId: string, amount: number, reason: string) => {
      const txs = readTransactions(groupId);
      const newTx: PointTransaction = {
        id: crypto.randomUUID(),
        userId,
        amount: -Math.abs(amount),
        reason,
        createdAt: new Date().toISOString(),
      };
      writeTransactions(groupId, [...txs, newTx]);
      bump();
    },
    [groupId, bump]
  );

  // ---- 보상 아이템 관리 ----

  const getItems = useCallback((): RewardItem[] => {
    return readItems(groupId);
  }, [groupId]);

  const createItem = useCallback(
    (item: Omit<RewardItem, "id">) => {
      const items = readItems(groupId);
      const newItem: RewardItem = {
        ...item,
        id: crypto.randomUUID(),
      };
      writeItems(groupId, [...items, newItem]);
      bump();
    },
    [groupId, bump]
  );

  const updateItem = useCallback(
    (id: string, data: Partial<Omit<RewardItem, "id">>) => {
      const items = readItems(groupId);
      const updated = items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      writeItems(groupId, updated);
      bump();
    },
    [groupId, bump]
  );

  const deleteItem = useCallback(
    (id: string) => {
      const items = readItems(groupId);
      writeItems(groupId, items.filter((item) => item.id !== id));
      bump();
    },
    [groupId, bump]
  );

  const purchaseItem = useCallback(
    (userId: string, itemId: string): { success: boolean; message: string } => {
      const items = readItems(groupId);
      const item = items.find((i) => i.id === itemId);
      if (!item) return { success: false, message: "보상 아이템을 찾을 수 없습니다" };
      if (!item.isActive) return { success: false, message: "비활성 보상입니다" };

      const balance = getBalance(userId);
      if (balance < item.cost) {
        return {
          success: false,
          message: `포인트가 부족합니다 (보유: ${balance}pt / 필요: ${item.cost}pt)`,
        };
      }

      spendPoints(userId, item.cost, `[교환] ${item.emoji} ${item.name}`);
      return { success: true, message: `${item.emoji} ${item.name} 교환 완료!` };
    },
    [groupId, getBalance, spendPoints]
  );

  return {
    // 포인트
    getBalance,
    getTransactions,
    addPoints,
    spendPoints,
    // 아이템
    getItems,
    createItem,
    updateItem,
    deleteItem,
    purchaseItem,
  };
}

// ============================================
// 활동 보상 포인트 훅 (출석/게시글/칭찬 등)
// localStorage 키: dancebase:reward-points:${groupId}
// ============================================

function activityTxKey(groupId: string) {
  return `dancebase:reward-points:${groupId}`;
}

function readActivityTransactions(groupId: string): ActivityPointTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(activityTxKey(groupId));
    return raw ? (JSON.parse(raw) as ActivityPointTransaction[]) : [];
  } catch {
    return [];
  }
}

function writeActivityTransactions(
  groupId: string,
  txs: ActivityPointTransaction[]
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(activityTxKey(groupId), JSON.stringify(txs));
}

export function useActivityRewardPoints(groupId: string) {
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // 전체 트랜잭션 읽기
  const getAllTransactions = useCallback((): ActivityPointTransaction[] => {
    return readActivityTransactions(groupId).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }, [groupId]);

  // 포인트 부여
  const grantPoints = useCallback(
    (
      memberId: string,
      memberName: string,
      actionType: PointActionType,
      points: number,
      description: string
    ) => {
      const txs = readActivityTransactions(groupId);
      const newTx: ActivityPointTransaction = {
        id: crypto.randomUUID(),
        memberId,
        memberName,
        actionType,
        points,
        description,
        createdAt: new Date().toISOString(),
      };
      writeActivityTransactions(groupId, [...txs, newTx]);
      bump();
    },
    [groupId, bump]
  );

  // 포인트 차감 (points를 음수로 저장)
  const deductPoints = useCallback(
    (
      memberId: string,
      memberName: string,
      points: number,
      description: string
    ) => {
      const txs = readActivityTransactions(groupId);
      const newTx: ActivityPointTransaction = {
        id: crypto.randomUUID(),
        memberId,
        memberName,
        actionType: "manual",
        points: -Math.abs(points),
        description,
        createdAt: new Date().toISOString(),
      };
      writeActivityTransactions(groupId, [...txs, newTx]);
      bump();
    },
    [groupId, bump]
  );

  // 멤버별 총 포인트
  const getMemberTotalPoints = useCallback(
    (memberId: string): number => {
      const txs = readActivityTransactions(groupId);
      return txs
        .filter((t) => t.memberId === memberId)
        .reduce((sum, t) => sum + t.points, 0);
    },
    [groupId]
  );

  // 리더보드 (포인트 내림차순)
  const getLeaderboard = useCallback((): MemberPointSummary[] => {
    const txs = readActivityTransactions(groupId);
    const map = new Map<string, { memberName: string; totalPoints: number }>();
    for (const tx of txs) {
      const existing = map.get(tx.memberId);
      if (existing) {
        existing.totalPoints += tx.points;
      } else {
        map.set(tx.memberId, {
          memberName: tx.memberName,
          totalPoints: tx.points,
        });
      }
    }
    const sorted = Array.from(map.entries())
      .map(([memberId, v]) => ({ memberId, ...v }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [groupId]);

  // 총 발행 포인트
  const getTotalIssuedPoints = useCallback((): number => {
    const txs = readActivityTransactions(groupId);
    return txs.filter((t) => t.points > 0).reduce((sum, t) => sum + t.points, 0);
  }, [groupId]);

  // 활성 멤버 수 (포인트 보유 멤버)
  const getActiveMemberCount = useCallback((): number => {
    const txs = readActivityTransactions(groupId);
    const uniqueMembers = new Set(txs.map((t) => t.memberId));
    return uniqueMembers.size;
  }, [groupId]);

  // 액션 유형별 분포
  const getActionDistribution = useCallback((): Record<PointActionType, number> => {
    const txs = readActivityTransactions(groupId);
    const dist: Record<PointActionType, number> = {
      attendance: 0,
      post: 0,
      comment: 0,
      kudos: 0,
      streak: 0,
      manual: 0,
    };
    for (const tx of txs) {
      if (tx.points > 0) {
        dist[tx.actionType] = (dist[tx.actionType] ?? 0) + tx.points;
      }
    }
    return dist;
  }, [groupId]);

  // 기본 포인트 값 반환
  const getDefaultPoints = useCallback((actionType: PointActionType): number => {
    return ACTIVITY_POINT_DEFAULTS[actionType];
  }, []);

  return {
    getAllTransactions,
    grantPoints,
    deductPoints,
    getMemberTotalPoints,
    getLeaderboard,
    getTotalIssuedPoints,
    getActiveMemberCount,
    getActionDistribution,
    getDefaultPoints,
    bump,
  };
}
