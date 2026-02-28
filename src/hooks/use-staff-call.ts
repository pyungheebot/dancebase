"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type { StaffCallItem, StaffCallRole, StaffCallSheet } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:staff-call:${groupId}:${projectId}`;
}

function loadSheet(groupId: string, projectId: string): StaffCallSheet {
  if (typeof window === "undefined") {
    return { groupId, projectId, items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (raw) return JSON.parse(raw) as StaffCallSheet;
  } catch {
    // 파싱 실패 시 빈 시트 반환
  }
  return { groupId, projectId, items: [], updatedAt: new Date().toISOString() };
}

function saveSheet(sheet: StaffCallSheet): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(sheet.groupId, sheet.projectId),
      JSON.stringify(sheet)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddStaffCallInput = {
  name: string;
  role: StaffCallRole;
  callTime: string;
  location?: string;
  phone?: string;
  note?: string;
};

export type UpdateStaffCallInput = Partial<AddStaffCallInput>;

// ============================================================
// 훅
// ============================================================

export function useStaffCall(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.staffCall(groupId, projectId) : null,
    async () => loadSheet(groupId, projectId)
  );

  const sheet = data ?? { groupId, projectId, items: [], updatedAt: new Date().toISOString() };

  // 콜 시간순 정렬
  const items = [...sheet.items].sort((a, b) =>
    a.callTime.localeCompare(b.callTime)
  );

  // ── 스태프 추가 ──
  const addItem = useCallback(
    async (input: AddStaffCallInput): Promise<boolean> => {
      if (!input.name.trim()) {
        toast.error("스태프 이름을 입력해주세요");
        return false;
      }
      if (!input.callTime) {
        toast.error("콜 시간을 입력해주세요");
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();

      const newItem: StaffCallItem = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        role: input.role,
        callTime: input.callTime,
        location: input.location?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        note: input.note?.trim() || undefined,
        confirmed: false,
        createdAt: now,
        updatedAt: now,
      };

      const updated: StaffCallSheet = {
        ...current,
        items: [...current.items, newItem],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success("스태프가 추가되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 스태프 수정 ──
  const updateItem = useCallback(
    async (id: string, changes: UpdateStaffCallInput): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.items.find((i) => i.id === id);
      if (!target) {
        toast.error("항목을 찾을 수 없습니다");
        return false;
      }

      const now = new Date().toISOString();
      const updated: StaffCallSheet = {
        ...current,
        items: current.items.map((i) =>
          i.id === id
            ? {
                ...i,
                name:
                  changes.name !== undefined
                    ? changes.name.trim()
                    : i.name,
                role: changes.role !== undefined ? changes.role : i.role,
                callTime:
                  changes.callTime !== undefined ? changes.callTime : i.callTime,
                location:
                  changes.location !== undefined
                    ? changes.location?.trim() || undefined
                    : i.location,
                phone:
                  changes.phone !== undefined
                    ? changes.phone?.trim() || undefined
                    : i.phone,
                note:
                  changes.note !== undefined
                    ? changes.note?.trim() || undefined
                    : i.note,
                updatedAt: now,
              }
            : i
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success("항목이 수정되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 스태프 삭제 ──
  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: StaffCallSheet = {
        ...current,
        items: current.items.filter((i) => i.id !== id),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success("항목이 삭제되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 확인 상태 토글 ──
  const toggleConfirmed = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: StaffCallSheet = {
        ...current,
        items: current.items.map((i) =>
          i.id === id
            ? { ...i, confirmed: !i.confirmed, updatedAt: now }
            : i
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 역할별 필터 ──
  function getByRole(role: StaffCallRole): StaffCallItem[] {
    return items.filter((i) => i.role === role);
  }

  // ── 통계 ──
  const stats = {
    total: items.length,
    confirmed: items.filter((i) => i.confirmed).length,
    pending: items.filter((i) => !i.confirmed).length,
    byRole: {
      stage_manager: items.filter((i) => i.role === "stage_manager").length,
      sound: items.filter((i) => i.role === "sound").length,
      lighting: items.filter((i) => i.role === "lighting").length,
      costume: items.filter((i) => i.role === "costume").length,
      makeup: items.filter((i) => i.role === "makeup").length,
      stage_crew: items.filter((i) => i.role === "stage_crew").length,
      front_of_house: items.filter((i) => i.role === "front_of_house").length,
      other: items.filter((i) => i.role === "other").length,
    },
  };

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    deleteItem,
    toggleConfirmed,
    getByRole,
    stats,
  };
}
