"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  EquipmentChecklistSheet,
  EquipmentChecklistItem,
  EquipmentChecklistRecord,
  EquipmentChecklistEntry,
  EquipmentChecklistPhase,
} from "@/types";

// ============================================================
// 기본 템플릿 항목
// ============================================================

const DEFAULT_ITEMS: Omit<EquipmentChecklistItem, "id">[] = [
  // 연습 전
  { name: "음향 장비 연결 확인", phase: "before", category: "음향", order: 0 },
  { name: "마이크 배터리 확인", phase: "before", category: "음향", order: 1 },
  { name: "거울 상태 확인", phase: "before", category: "시설", order: 2 },
  { name: "바닥 청소 및 안전 확인", phase: "before", category: "시설", order: 3 },
  { name: "조명 작동 확인", phase: "before", category: "조명", order: 4 },
  { name: "출석부 준비", phase: "before", category: "행정", order: 5 },
  // 연습 후
  { name: "음향 장비 전원 끄기", phase: "after", category: "음향", order: 0 },
  { name: "마이크 보관함 정리", phase: "after", category: "음향", order: 1 },
  { name: "바닥 청소", phase: "after", category: "시설", order: 2 },
  { name: "조명 전원 끄기", phase: "after", category: "조명", order: 3 },
  { name: "창문·문 잠금 확인", phase: "after", category: "시설", order: 4 },
  { name: "분실물 확인", phase: "after", category: "행정", order: 5 },
];

function buildDefaultItems(): EquipmentChecklistItem[] {
  return DEFAULT_ITEMS.map((item) => ({
    ...item,
    id: `default-${item.phase}-${item.order}`,
  }));
}

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:equipment-checklist:${groupId}`;
}

function loadSheet(groupId: string): EquipmentChecklistSheet {
  if (typeof window === "undefined") {
    return {
      groupId,
      items: buildDefaultItems(),
      records: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (raw) return JSON.parse(raw) as EquipmentChecklistSheet;
  } catch {
    // 파싱 실패 시 기본값 반환
  }
  return {
    groupId,
    items: buildDefaultItems(),
    records: [],
    updatedAt: new Date().toISOString(),
  };
}

function saveSheet(sheet: EquipmentChecklistSheet): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(sheet.groupId), JSON.stringify(sheet));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useEquipmentChecklist(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.equipmentChecklist(groupId) : null,
    async () => loadSheet(groupId)
  );

  const sheet = data ?? {
    groupId,
    items: buildDefaultItems(),
    records: [],
    updatedAt: new Date().toISOString(),
  };

  // phase별 항목 (order 정렬)
  const beforeItems = [...sheet.items]
    .filter((i) => i.phase === "before")
    .sort((a, b) => a.order - b.order);

  const afterItems = [...sheet.items]
    .filter((i) => i.phase === "after")
    .sort((a, b) => a.order - b.order);

  // 날짜 내림차순 정렬된 기록 목록
  const records = [...sheet.records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ── 템플릿 항목 추가 ──
  const addItem = useCallback(
    async (
      input: Pick<EquipmentChecklistItem, "name" | "phase" | "category">
    ): Promise<boolean> => {
      const trimmed = input.name.trim();
      if (!trimmed) {
        toast.error(TOAST.ITEM_NAME_REQUIRED);
        return false;
      }
      const current = loadSheet(groupId);
      const phaseItems = current.items.filter((i) => i.phase === input.phase);
      const newItem: EquipmentChecklistItem = {
        id: crypto.randomUUID(),
        name: trimmed,
        phase: input.phase,
        category: input.category.trim() || "기타",
        order: phaseItems.length,
      };
      const updated: EquipmentChecklistSheet = {
        ...current,
        items: [...current.items, newItem],
        updatedAt: new Date().toISOString(),
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ITEM_ADDED);
      return true;
    },
    [groupId, mutate]
  );

  // ── 템플릿 항목 삭제 ──
  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      const current = loadSheet(groupId);
      const updated: EquipmentChecklistSheet = {
        ...current,
        items: current.items.filter((i) => i.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ITEM_DELETED);
      return true;
    },
    [groupId, mutate]
  );

  // ── 날짜별 기록 생성 ──
  const createRecord = useCallback(
    async (
      date: string,
      phase: EquipmentChecklistPhase,
      assignee?: string
    ): Promise<string | null> => {
      if (!date) {
        toast.error(TOAST.DATE_SELECT);
        return null;
      }
      const current = loadSheet(groupId);
      const phaseItems = current.items.filter((i) => i.phase === phase);
      const now = new Date().toISOString();

      // 기존에 동일 날짜+phase 기록이 있으면 반환
      const existing = current.records.find(
        (r) => r.date === date && r.phase === phase
      );
      if (existing) {
        toast.error(TOAST.DATA.DUPLICATE_DATE);
        return null;
      }

      const entries: EquipmentChecklistEntry[] = phaseItems.map((item) => ({
        itemId: item.id,
        checked: false,
      }));

      const newRecord: EquipmentChecklistRecord = {
        id: crypto.randomUUID(),
        date,
        phase,
        assignee: assignee?.trim() || undefined,
        entries,
        createdAt: now,
        updatedAt: now,
      };

      const updated: EquipmentChecklistSheet = {
        ...current,
        records: [...current.records, newRecord],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.EQUIPMENT.CHECKLIST_CREATED);
      return newRecord.id;
    },
    [groupId, mutate]
  );

  // ── 항목 체크 토글 ──
  const toggleEntry = useCallback(
    async (
      recordId: string,
      itemId: string,
      checkedBy?: string
    ): Promise<boolean> => {
      const current = loadSheet(groupId);
      const record = current.records.find((r) => r.id === recordId);
      if (!record) {
        toast.error(TOAST.RECORD.NOT_FOUND);
        return false;
      }
      const now = new Date().toISOString();
      const updatedEntries: EquipmentChecklistEntry[] = record.entries.map(
        (e) => {
          if (e.itemId !== itemId) return e;
          const newChecked = !e.checked;
          return {
            ...e,
            checked: newChecked,
            checkedBy: newChecked ? checkedBy?.trim() || undefined : undefined,
            checkedAt: newChecked ? now : undefined,
          };
        }
      );

      // 모든 항목 체크 여부 확인
      const allChecked = updatedEntries.every((e) => e.checked);

      const updatedRecord: EquipmentChecklistRecord = {
        ...record,
        entries: updatedEntries,
        completedAt: allChecked ? now : undefined,
        updatedAt: now,
      };

      const updated: EquipmentChecklistSheet = {
        ...current,
        records: current.records.map((r) =>
          r.id === recordId ? updatedRecord : r
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // ── 기록 삭제 ──
  const deleteRecord = useCallback(
    async (recordId: string): Promise<boolean> => {
      const current = loadSheet(groupId);
      const now = new Date().toISOString();
      const updated: EquipmentChecklistSheet = {
        ...current,
        records: current.records.filter((r) => r.id !== recordId),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.ENERGY.DELETED);
      return true;
    },
    [groupId, mutate]
  );

  // ── 기록 담당자 업데이트 ──
  const updateAssignee = useCallback(
    async (recordId: string, assignee: string): Promise<boolean> => {
      const current = loadSheet(groupId);
      const now = new Date().toISOString();
      const updated: EquipmentChecklistSheet = {
        ...current,
        records: current.records.map((r) =>
          r.id === recordId
            ? { ...r, assignee: assignee.trim() || undefined, updatedAt: now }
            : r
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.INFO.ASSIGNEE_CHANGED);
      return true;
    },
    [groupId, mutate]
  );

  // ── 진행률 계산 유틸 ──
  function calcProgress(record: EquipmentChecklistRecord): {
    total: number;
    checked: number;
    rate: number;
  } {
    const total = record.entries.length;
    const checked = record.entries.filter((e) => e.checked).length;
    const rate = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, rate };
  }

  return {
    items: sheet.items,
    beforeItems,
    afterItems,
    records,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    deleteItem,
    createRecord,
    toggleEntry,
    deleteRecord,
    updateAssignee,
    calcProgress,
  };
}
