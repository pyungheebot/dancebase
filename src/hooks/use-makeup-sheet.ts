"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MakeupSheetLook,
  MakeupSheetProduct,
  MakeupSheetArea,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:makeup-sheet:${groupId}:${projectId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type MakeupSheetStats = {
  totalLooks: number;
  totalProducts: number;
  assignedMembers: string[];
};

// ============================================================
// 훅
// ============================================================

export function useMakeupSheet(groupId: string, projectId: string) {
  const [looks, setLooks] = useState<MakeupSheetLook[]>(() => loadFromStorage<MakeupSheetLook[]>(storageKey(groupId, projectId), []));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadFromStorage<MakeupSheetLook[]>(storageKey(groupId, projectId), []);
    setLooks(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: MakeupSheetLook[]) => {
      saveToStorage(storageKey(groupId, projectId), next);
      setLooks(next);
    },
    [groupId, projectId]
  );

  // ── 룩(Look) CRUD ─────────────────────────────────────────

  const addLook = useCallback(
    (
      partial: Pick<MakeupSheetLook, "lookName" | "performanceName"> &
        Partial<Pick<MakeupSheetLook, "notes" | "estimatedMinutes">>
    ): MakeupSheetLook => {
      const newLook: MakeupSheetLook = {
        id: crypto.randomUUID(),
        lookName: partial.lookName,
        performanceName: partial.performanceName,
        products: [],
        assignedMembers: [],
        notes: partial.notes,
        estimatedMinutes: partial.estimatedMinutes,
        createdAt: new Date().toISOString(),
      };
      persist([...looks, newLook]);
      return newLook;
    },
    [looks, persist]
  );

  const updateLook = useCallback(
    (
      lookId: string,
      partial: Partial<
        Pick<
          MakeupSheetLook,
          "lookName" | "performanceName" | "notes" | "estimatedMinutes"
        >
      >
    ): boolean => {
      const idx = looks.findIndex((l) => l.id === lookId);
      if (idx === -1) return false;
      const next = [...looks];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  const deleteLook = useCallback(
    (lookId: string): boolean => {
      const next = looks.filter((l) => l.id !== lookId);
      if (next.length === looks.length) return false;
      persist(next);
      return true;
    },
    [looks, persist]
  );

  // ── 제품(Product) CRUD ────────────────────────────────────

  const addProduct = useCallback(
    (
      lookId: string,
      product: Omit<MakeupSheetProduct, "id">
    ): MakeupSheetProduct | null => {
      const idx = looks.findIndex((l) => l.id === lookId);
      if (idx === -1) return null;

      const newProduct: MakeupSheetProduct = {
        id: crypto.randomUUID(),
        ...product,
      };

      const next = [...looks];
      next[idx] = {
        ...next[idx],
        products: [...next[idx].products, newProduct],
      };
      persist(next);
      return newProduct;
    },
    [looks, persist]
  );

  const updateProduct = useCallback(
    (
      lookId: string,
      productId: string,
      partial: Partial<Omit<MakeupSheetProduct, "id">>
    ): boolean => {
      const lookIdx = looks.findIndex((l) => l.id === lookId);
      if (lookIdx === -1) return false;

      const productIdx = looks[lookIdx].products.findIndex(
        (p) => p.id === productId
      );
      if (productIdx === -1) return false;

      const next = [...looks];
      const updatedProducts = [...next[lookIdx].products];
      updatedProducts[productIdx] = {
        ...updatedProducts[productIdx],
        ...partial,
      };
      next[lookIdx] = { ...next[lookIdx], products: updatedProducts };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  const deleteProduct = useCallback(
    (lookId: string, productId: string): boolean => {
      const lookIdx = looks.findIndex((l) => l.id === lookId);
      if (lookIdx === -1) return false;

      const filtered = looks[lookIdx].products.filter(
        (p) => p.id !== productId
      );
      if (filtered.length === looks[lookIdx].products.length) return false;

      const next = [...looks];
      next[lookIdx] = { ...next[lookIdx], products: filtered };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  const reorderProducts = useCallback(
    (lookId: string, area: MakeupSheetArea, orderedIds: string[]): boolean => {
      const lookIdx = looks.findIndex((l) => l.id === lookId);
      if (lookIdx === -1) return false;

      const next = [...looks];
      const updatedProducts = next[lookIdx].products.map((p) => {
        if (p.area !== area) return p;
        const newOrder = orderedIds.indexOf(p.id);
        return newOrder === -1 ? p : { ...p, order: newOrder };
      });
      next[lookIdx] = { ...next[lookIdx], products: updatedProducts };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  // ── 멤버 배정 ─────────────────────────────────────────────

  const assignMember = useCallback(
    (lookId: string, memberName: string): boolean => {
      const idx = looks.findIndex((l) => l.id === lookId);
      if (idx === -1) return false;
      if (looks[idx].assignedMembers.includes(memberName)) return false;

      const next = [...looks];
      next[idx] = {
        ...next[idx],
        assignedMembers: [...next[idx].assignedMembers, memberName],
      };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  const unassignMember = useCallback(
    (lookId: string, memberName: string): boolean => {
      const idx = looks.findIndex((l) => l.id === lookId);
      if (idx === -1) return false;

      const filtered = looks[idx].assignedMembers.filter(
        (m) => m !== memberName
      );
      if (filtered.length === looks[idx].assignedMembers.length) return false;

      const next = [...looks];
      next[idx] = { ...next[idx], assignedMembers: filtered };
      persist(next);
      return true;
    },
    [looks, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const stats: MakeupSheetStats = (() => {
    const totalLooks = looks.length;
    const totalProducts = looks.reduce(
      (sum, l) => sum + l.products.length,
      0
    );
    const allMembers = looks.flatMap((l) => l.assignedMembers);
    const assignedMembers = Array.from(new Set(allMembers));
    return { totalLooks, totalProducts, assignedMembers };
  })();

  return {
    looks,
    loading: false,
    addLook,
    updateLook,
    deleteLook,
    addProduct,
    updateProduct,
    deleteProduct,
    reorderProducts,
    assignMember,
    unassignMember,
    stats,
    refetch: reload,
  };
}
