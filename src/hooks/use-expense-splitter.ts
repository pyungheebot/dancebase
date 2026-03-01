"use client";

import { useState, useCallback } from "react";
import type { ExpenseSplitItem, ExpenseSplitSession } from "@/types";

const MAX_SESSIONS = 10;
const MAX_ITEMS_PER_SESSION = 20;

function storageKey(groupId: string): string {
  return `dancebase:expense-split:${groupId}`;
}

function loadSessions(groupId: string): ExpenseSplitSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ExpenseSplitSession[];
  } catch {
    return [];
  }
}

function saveSessions(groupId: string, sessions: ExpenseSplitSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(sessions));
  } catch {
    // 무시
  }
}

// 누가 누구에게 얼마를 보내야 하는지 계산
export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export function calculateSettlements(items: ExpenseSplitItem[]): Settlement[] {
  // 멤버별 순잔액(순수취 = 양수, 순지불 = 음수)
  const balanceMap: Record<string, number> = {};

  for (const item of items) {
    const count = item.splitAmong.length;
    if (count === 0) continue;

    const share = item.amount / count;

    // 지불자는 전액 수취
    balanceMap[item.paidBy] = (balanceMap[item.paidBy] ?? 0) + item.amount;

    // 분할 대상은 각자 몫만큼 차감
    for (const name of item.splitAmong) {
      balanceMap[name] = (balanceMap[name] ?? 0) - share;
    }
  }

  // 채권자(양수)와 채무자(음수) 분리
  const creditors: { name: string; amount: number }[] = [];
  const debtors: { name: string; amount: number }[] = [];

  for (const [name, balance] of Object.entries(balanceMap)) {
    if (balance > 0.01) {
      creditors.push({ name, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ name, amount: -balance });
    }
  }

  // 그리디 정산: 채무자가 채권자에게 순차 지불
  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const transfer = Math.min(creditor.amount, debtor.amount);

    if (transfer > 0.01) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(transfer),
      });
    }

    creditor.amount -= transfer;
    debtor.amount -= transfer;

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return settlements;
}

export function useExpenseSplitter(groupId: string) {
  const [sessions, setSessions] = useState<ExpenseSplitSession[]>([]);


  // 상태 업데이트 + localStorage 동기화
  const updateSessions = useCallback(
    (next: ExpenseSplitSession[]) => {
      setSessions(next);
      saveSessions(groupId, next);
    },
    [groupId]
  );

  // 세션 생성 (최대 10개)
  const createSession = useCallback(
    (title: string): ExpenseSplitSession | null => {
      if (sessions.length >= MAX_SESSIONS) return null;
      const newSession: ExpenseSplitSession = {
        id: crypto.randomUUID(),
        title: title.trim(),
        items: [],
        createdAt: new Date().toISOString(),
      };
      updateSessions([newSession, ...sessions]);
      return newSession;
    },
    [sessions, updateSessions]
  );

  // 항목 추가 (최대 20개/세션)
  const addItem = useCallback(
    (
      sessionId: string,
      item: Omit<ExpenseSplitItem, "id" | "createdAt">
    ): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;
      if (session.items.length >= MAX_ITEMS_PER_SESSION) return false;

      const newItem: ExpenseSplitItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const updatedSessions = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, items: [...s.items, newItem] }
          : s
      );
      updateSessions(updatedSessions);
      return true;
    },
    [sessions, updateSessions]
  );

  // 항목 삭제
  const removeItem = useCallback(
    (sessionId: string, itemId: string): void => {
      const updatedSessions = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
          : s
      );
      updateSessions(updatedSessions);
    },
    [sessions, updateSessions]
  );

  // 세션 삭제
  const deleteSession = useCallback(
    (sessionId: string): void => {
      updateSessions(sessions.filter((s) => s.id !== sessionId));
    },
    [sessions, updateSessions]
  );

  return {
    sessions,
    loading: false,
    canCreateSession: sessions.length < MAX_SESSIONS,
    createSession,
    addItem,
    removeItem,
    deleteSession,
    calculateSettlements,
  };
}
