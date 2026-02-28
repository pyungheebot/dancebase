"use client";

import { useCallback, useState, useEffect } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  FlexibilityTestItem,
  FlexibilityTestItemKey,
  FlexibilityTestUnit,
  FlexibilityTestRecord,
  FlexibilityTestEntry,
  FlexibilityTestData,
} from "@/types";

// ============================================================
// 기본 테스트 항목 정의
// ============================================================

export const DEFAULT_FLEXIBILITY_ITEMS: Omit<FlexibilityTestItem, "id">[] = [
  {
    key: "sit_and_reach",
    name: "앉아서 앞으로 굽히기",
    unit: "cm",
    higherIsBetter: true,
    description: "바닥에 앉아 무릎을 펴고 손을 최대한 앞으로 뻗습니다.",
  },
  {
    key: "standing_reach",
    name: "서서 앞으로 굽히기",
    unit: "cm",
    higherIsBetter: true,
    description: "서서 무릎을 펴고 손을 최대한 아래로 내립니다.",
  },
  {
    key: "side_split",
    name: "개각 (사이드 스플릿)",
    unit: "도",
    higherIsBetter: true,
    description: "양쪽 다리를 옆으로 최대한 벌린 각도입니다.",
  },
  {
    key: "front_split",
    name: "전굴 (프론트 스플릿)",
    unit: "도",
    higherIsBetter: true,
    description: "앞뒤로 다리를 최대한 벌린 각도입니다.",
  },
  {
    key: "shoulder_flexibility",
    name: "어깨 유연성",
    unit: "cm",
    higherIsBetter: false,
    description: "등 뒤로 손을 모았을 때 두 손 사이의 거리입니다. (낮을수록 유연)",
  },
  {
    key: "hip_flexibility",
    name: "힙 유연성",
    unit: "도",
    higherIsBetter: true,
    description: "고관절 가동 범위를 각도로 측정합니다.",
  },
  {
    key: "spine_flexibility",
    name: "척추 유연성",
    unit: "cm",
    higherIsBetter: true,
    description: "등을 뒤로 젖혔을 때 손이 닿는 높이입니다.",
  },
  {
    key: "ankle_flexibility",
    name: "발목 유연성",
    unit: "도",
    higherIsBetter: true,
    description: "발목의 배굴/저굴 가동 범위 각도입니다.",
  },
];

export const FLEXIBILITY_UNIT_LABELS: Record<FlexibilityTestUnit, string> = {
  cm: "cm",
  도: "도",
  mm: "mm",
  초: "초",
  회: "회",
  기타: "기타",
};

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.flexibilityTest(memberId);
}

function loadData(memberId: string): FlexibilityTestData {
  if (typeof window === "undefined") return { items: [], records: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) return { items: [], records: [] };
    return JSON.parse(raw) as FlexibilityTestData;
  } catch {
    return { items: [], records: [] };
  }
}

function saveData(memberId: string, data: FlexibilityTestData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 진행률 계산 헬퍼
// ============================================================

export function calcProgress(
  current: number,
  target: number,
  higherIsBetter: boolean
): number {
  if (target === 0) return 0;
  if (higherIsBetter) {
    return Math.min(100, Math.round((current / target) * 100));
  } else {
    // 낮을수록 좋은 경우: target 이하로 줄어들수록 100%에 가까움
    if (current <= target) return 100;
    // target의 2배 이상이면 0%
    const worstCase = target * 2;
    return Math.max(0, Math.round(((worstCase - current) / target) * 100));
  }
}

// ============================================================
// 훅
// ============================================================

export function useFlexibilityTest(memberId: string) {
  const [items, setItems] = useState<FlexibilityTestItem[]>([]);
  const [records, setRecords] = useState<FlexibilityTestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadData(memberId);
    setItems(data.items);
    setRecords(data.records);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextItems: FlexibilityTestItem[], nextRecords: FlexibilityTestRecord[]) => {
      saveData(memberId, { items: nextItems, records: nextRecords });
      setItems(nextItems);
      setRecords(nextRecords);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // 테스트 항목 CRUD
  // ────────────────────────────────────────────

  /** 기본 항목을 한 번에 초기화합니다. */
  const initDefaultItems = useCallback(() => {
    if (items.length > 0) return;
    const defaultItems: FlexibilityTestItem[] = DEFAULT_FLEXIBILITY_ITEMS.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));
    persist(defaultItems, records);
  }, [items, records, persist]);

  /** 새 테스트 항목을 추가합니다. */
  const addItem = useCallback(
    (
      name: string,
      unit: FlexibilityTestUnit,
      higherIsBetter: boolean,
      targetValue?: number,
      description?: string
    ): FlexibilityTestItem => {
      const newItem: FlexibilityTestItem = {
        id: crypto.randomUUID(),
        key: "custom",
        name: name.trim(),
        unit,
        higherIsBetter,
        targetValue,
        description: description?.trim(),
      };
      persist([...items, newItem], records);
      return newItem;
    },
    [items, records, persist]
  );

  /** 테스트 항목의 목표값을 업데이트합니다. */
  const updateItemTarget = useCallback(
    (itemId: string, targetValue: number | undefined): void => {
      const nextItems = items.map((item) =>
        item.id === itemId ? { ...item, targetValue } : item
      );
      persist(nextItems, records);
    },
    [items, records, persist]
  );

  /** 테스트 항목을 삭제합니다 (연관 기록의 entry도 정리). */
  const deleteItem = useCallback(
    (itemId: string): void => {
      const nextItems = items.filter((item) => item.id !== itemId);
      const nextRecords = records.map((rec) => ({
        ...rec,
        entries: rec.entries.filter((e) => e.itemId !== itemId),
      }));
      persist(nextItems, nextRecords);
    },
    [items, records, persist]
  );

  // ────────────────────────────────────────────
  // 기록 CRUD
  // ────────────────────────────────────────────

  /** 새 테스트 기록을 추가합니다. */
  const addRecord = useCallback(
    (
      date: string,
      entries: FlexibilityTestEntry[],
      notes?: string
    ): FlexibilityTestRecord => {
      const newRecord: FlexibilityTestRecord = {
        id: crypto.randomUUID(),
        memberId,
        date,
        entries,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist(items, [...records, newRecord]);
      return newRecord;
    },
    [memberId, items, records, persist]
  );

  /** 기록을 삭제합니다. */
  const deleteRecord = useCallback(
    (recordId: string): void => {
      const nextRecords = records.filter((r) => r.id !== recordId);
      persist(items, nextRecords);
    },
    [items, records, persist]
  );

  // ────────────────────────────────────────────
  // 통계 / 조회
  // ────────────────────────────────────────────

  /** 날짜 내림차순 정렬된 기록 목록 */
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  /** 최근 기록 (날짜 기준 가장 최신) */
  const latestRecord = sortedRecords[0] ?? null;

  /** 항목별 최신 측정값 */
  function getLatestValue(itemId: string): number | null {
    for (const rec of sortedRecords) {
      const entry = rec.entries.find((e) => e.itemId === itemId);
      if (entry !== undefined) return entry.value;
    }
    return null;
  }

  /** 항목별 진행률 (0~100, 목표값이 없으면 null) */
  function getItemProgress(itemId: string): number | null {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.targetValue === undefined) return null;
    const latest = getLatestValue(itemId);
    if (latest === null) return 0;
    return calcProgress(latest, item.targetValue, item.higherIsBetter);
  }

  /** 항목별 측정 이력 (날짜 오름차순) */
  function getItemHistory(
    itemId: string
  ): { date: string; value: number }[] {
    return records
      .filter((rec) => rec.entries.some((e) => e.itemId === itemId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((rec) => ({
        date: rec.date,
        value: rec.entries.find((e) => e.itemId === itemId)!.value,
      }));
  }

  /** 전체 목표 달성률 평균 (목표값이 있는 항목 기준) */
  const overallProgress = (() => {
    const targetItems = items.filter((i) => i.targetValue !== undefined);
    if (targetItems.length === 0) return null;
    const progresses = targetItems
      .map((i) => getItemProgress(i.id))
      .filter((p): p is number => p !== null);
    if (progresses.length === 0) return null;
    return Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length);
  })();

  return {
    items,
    records: sortedRecords,
    loading,
    latestRecord,
    overallProgress,
    initDefaultItems,
    addItem,
    updateItemTarget,
    deleteItem,
    addRecord,
    deleteRecord,
    getLatestValue,
    getItemProgress,
    getItemHistory,
    refetch: reload,
  };
}
