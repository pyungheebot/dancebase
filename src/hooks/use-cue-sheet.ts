"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { ShowCueItem, ShowCueSheet, ShowCueStatus } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// localStorage 키 생성
function localKey(projectId: string) {
  return swrKeys.showCueSheet(projectId);
}

// 고유 ID 생성 (crypto 우선, 폴백으로 timestamp)
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useCueSheet(projectId: string) {
  const { data, mutate, isLoading } = useSWR(
    swrKeys.showCueSheet(projectId),
    () => loadFromStorage<ShowCueSheet>(localKey(projectId), {} as ShowCueSheet),
    { revalidateOnFocus: false }
  );

  const sheet = data ?? { projectId, items: [], updatedAt: new Date().toISOString() };

  // 저장 후 SWR 캐시 갱신
  async function persist(nextSheet: ShowCueSheet) {
    saveToStorage(localKey(projectId), nextSheet);
    await mutate(nextSheet, { revalidate: false });
  }

  // 항목 추가
  async function addItem(payload: Omit<ShowCueItem, "id" | "order">) {
    const nextItems = [
      ...sheet.items,
      {
        ...payload,
        id: generateId(),
        order: sheet.items.length + 1,
      },
    ];
    await persist({ ...sheet, items: nextItems, updatedAt: new Date().toISOString() });
  }

  // 항목 수정
  async function updateItem(id: string, changes: Partial<Omit<ShowCueItem, "id" | "order">>) {
    const nextItems = sheet.items.map((item) =>
      item.id === id ? { ...item, ...changes } : item
    );
    await persist({ ...sheet, items: nextItems, updatedAt: new Date().toISOString() });
  }

  // 항목 삭제
  async function removeItem(id: string) {
    const filtered = sheet.items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, order: idx + 1 }));
    await persist({ ...sheet, items: filtered, updatedAt: new Date().toISOString() });
  }

  // 순서 위로 이동
  async function moveUp(id: string) {
    const idx = sheet.items.findIndex((item) => item.id === id);
    if (idx <= 0) return;
    const nextItems = [...sheet.items];
    [nextItems[idx - 1], nextItems[idx]] = [nextItems[idx], nextItems[idx - 1]];
    const reordered = nextItems.map((item, i) => ({ ...item, order: i + 1 }));
    await persist({ ...sheet, items: reordered, updatedAt: new Date().toISOString() });
  }

  // 순서 아래로 이동
  async function moveDown(id: string) {
    const idx = sheet.items.findIndex((item) => item.id === id);
    if (idx < 0 || idx >= sheet.items.length - 1) return;
    const nextItems = [...sheet.items];
    [nextItems[idx], nextItems[idx + 1]] = [nextItems[idx + 1], nextItems[idx]];
    const reordered = nextItems.map((item, i) => ({ ...item, order: i + 1 }));
    await persist({ ...sheet, items: reordered, updatedAt: new Date().toISOString() });
  }

  // 상태 토글 (대기 → 진행중 → 완료 → 대기)
  async function cycleStatus(id: string) {
    const cycleMap: Record<ShowCueStatus, ShowCueStatus> = {
      대기: "진행중",
      진행중: "완료",
      완료: "대기",
    };
    const item = sheet.items.find((i) => i.id === id);
    if (!item) return;
    await updateItem(id, { status: cycleMap[item.status] });
  }

  // 통계 계산
  const total = sheet.items.length;
  const completedCount = sheet.items.filter((i) => i.status === "완료").length;
  const inProgressCount = sheet.items.filter((i) => i.status === "진행중").length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // 예상 소요 시간 (첫 번째와 마지막 항목의 시간 차이)
  function calcDuration(): string {
    const timeParsed = sheet.items
      .map((i) => i.time)
      .filter((t) => /^\d{2}:\d{2}$/.test(t))
      .map((t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      });
    if (timeParsed.length < 2) return "-";
    const min = Math.min(...timeParsed);
    const max = Math.max(...timeParsed);
    const diff = max - min;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  }

  return {
    sheet,
    loading: isLoading,
    total,
    completedCount,
    inProgressCount,
    completionRate,
    duration: calcDuration(),
    addItem,
    updateItem,
    removeItem,
    moveUp,
    moveDown,
    cycleStatus,
    refetch: () => mutate(),
  };
}
