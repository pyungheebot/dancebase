"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DASHBOARD_CARDS,
  DEFAULT_DASHBOARD_CARDS,
  PROJECT_DASHBOARD_CARDS,
  DEFAULT_PROJECT_DASHBOARD_CARDS,
} from "@/types";

// 대시보드 카드 순서 아이템 타입
export type DashboardOrderItem = {
  id: string;
  label: string;
};

const STORAGE_KEY_PREFIX = "dashboard-card-order-";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

// localStorage에서 카드 순서를 불러옴
function loadOrder(groupId: string, defaultIds: string[]): string[] {
  if (typeof window === "undefined") return defaultIds;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return defaultIds;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultIds;
    // 저장된 순서에 없는 새 카드를 뒤에 추가
    const saved = parsed as string[];
    const merged = saved.filter((id) => defaultIds.includes(id));
    for (const id of defaultIds) {
      if (!merged.includes(id)) {
        merged.push(id);
      }
    }
    return merged;
  } catch {
    return defaultIds;
  }
}

// localStorage에 카드 순서를 저장
function saveOrder(groupId: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(ids));
  } catch {
    // 저장 실패 무시
  }
}

type UseDashboardOrderParams = {
  groupId: string;
  entityType: "group" | "project";
};

export function useDashboardOrder({ groupId, entityType }: UseDashboardOrderParams) {
  const isGroup = entityType === "group";
  const cardMeta = isGroup ? DASHBOARD_CARDS : PROJECT_DASHBOARD_CARDS;
  const defaultCards = isGroup ? DEFAULT_DASHBOARD_CARDS : DEFAULT_PROJECT_DASHBOARD_CARDS;
  const defaultIds = useMemo(
    () => defaultCards.map((c) => c.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultCards는 상수 배열이므로 entityType 변경 시에만 재계산
    [entityType]
  );

  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    loadOrder(groupId, defaultIds)
  );

  // groupId가 바뀌면 재로드
  useEffect(() => {
    setOrderedIds(loadOrder(groupId, defaultIds));
  }, [groupId, defaultIds]);

  // 순서 적용: orderedIds 기준으로 카드 목록 반환
  const orderedCards: DashboardOrderItem[] = orderedIds.reduce<DashboardOrderItem[]>((acc, id) => {
    const meta = cardMeta.find((c) => c.id === id);
    if (meta) acc.push({ id: meta.id, label: meta.label });
    return acc;
  }, []);

  // 위로 이동
  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      setOrderedIds((prev) => {
        const next = [...prev];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        saveOrder(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 아래로 이동
  const moveDown = useCallback(
    (index: number) => {
      setOrderedIds((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        saveOrder(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 순서 초기화
  const resetOrder = useCallback(() => {
    const ids = defaultCards.map((c) => c.id);
    setOrderedIds(ids);
    saveOrder(groupId, ids);
  }, [groupId, defaultCards]);

  // 외부에서 전달된 visibleCards를 orderedIds 기준으로 정렬
  const sortVisibleCards = useCallback(
    <T extends { id: string }>(visibleCards: T[]): T[] => {
      const indexMap = new Map(orderedIds.map((id, i) => [id, i]));
      return [...visibleCards].sort((a, b) => {
        const ai = indexMap.get(a.id) ?? 9999;
        const bi = indexMap.get(b.id) ?? 9999;
        return ai - bi;
      });
    },
    [orderedIds]
  );

  return {
    orderedCards,
    orderedIds,
    moveUp,
    moveDown,
    resetOrder,
    sortVisibleCards,
  };
}
