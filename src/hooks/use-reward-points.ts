"use client";

import { useState, useCallback } from "react";
import type { RewardItem, PointTransaction } from "@/types";

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
