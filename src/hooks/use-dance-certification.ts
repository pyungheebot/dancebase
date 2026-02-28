"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { DanceCertItem, DanceCertKind } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

export const DANCE_CERT_KIND_LABELS: Record<DanceCertKind, string> = {
  certificate: "자격증",
  completion: "수료증",
  workshop: "워크숍",
  award: "대회수상",
};

export const DANCE_CERT_KIND_COLORS: Record<
  DanceCertKind,
  { badge: string; text: string; bar: string }
> = {
  certificate: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    text: "text-blue-700",
    bar: "bg-blue-500",
  },
  completion: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-700",
    bar: "bg-green-500",
  },
  workshop: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    text: "text-orange-700",
    bar: "bg-orange-500",
  },
  award: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    text: "text-purple-700",
    bar: "bg-purple-500",
  },
};

export const DANCE_CERT_KINDS: DanceCertKind[] = [
  "certificate",
  "completion",
  "workshop",
  "award",
];

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (memberId: string) => `dancebase:dance-cert:${memberId}`;

function loadItems(memberId: string): DanceCertItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(memberId));
    if (!raw) return [];
    return JSON.parse(raw) as DanceCertItem[];
  } catch {
    return [];
  }
}

function saveItems(memberId: string, items: DanceCertItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(memberId), JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

// ─── 만료 관련 유틸 ───────────────────────────────────────────

/** 만료된 항목인지 여부 */
export function isExpired(item: DanceCertItem): boolean {
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt) < new Date();
}

/** 만료 임박(30일 이내) 항목인지 여부 */
export function isExpiringSoon(item: DanceCertItem): boolean {
  if (!item.expiresAt) return false;
  const now = new Date();
  const exp = new Date(item.expiresAt);
  if (exp < now) return false;
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useDanceCertification(memberId: string) {
  const { data, mutate, isLoading } = useSWR(
    memberId ? swrKeys.danceCertification(memberId) : null,
    () => loadItems(memberId),
    { revalidateOnFocus: false }
  );

  const items: DanceCertItem[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  const persist = useCallback(
    (next: DanceCertItem[]): void => {
      saveItems(memberId, next);
      mutate(next, false);
    },
    [memberId, mutate]
  );

  // ── 항목 추가 ────────────────────────────────────────────

  const addItem = useCallback(
    (params: {
      name: string;
      issuer: string;
      acquiredAt: string;
      expiresAt?: string;
      kind: DanceCertKind;
      grade?: string;
      memo?: string;
    }): boolean => {
      const { name, issuer, acquiredAt, expiresAt, kind, grade, memo } = params;
      if (!name.trim() || !issuer.trim() || !acquiredAt) return false;
      const stored = loadItems(memberId);
      const newItem: DanceCertItem = {
        id: crypto.randomUUID(),
        name: name.trim(),
        issuer: issuer.trim(),
        acquiredAt,
        expiresAt: expiresAt || undefined,
        kind,
        grade: grade?.trim() || undefined,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      persist([newItem, ...stored]);
      return true;
    },
    [memberId, persist]
  );

  // ── 항목 수정 ────────────────────────────────────────────

  const updateItem = useCallback(
    (
      itemId: string,
      partial: Partial<Omit<DanceCertItem, "id" | "createdAt">>
    ): boolean => {
      const stored = loadItems(memberId);
      const idx = stored.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const next = [...stored];
      next[idx] = {
        ...next[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      return true;
    },
    [memberId, persist]
  );

  // ── 항목 삭제 ────────────────────────────────────────────

  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const stored = loadItems(memberId);
      const next = stored.filter((i) => i.id !== itemId);
      if (next.length === stored.length) return false;
      persist(next);
      return true;
    },
    [memberId, persist]
  );

  // ── 통계 ─────────────────────────────────────────────────

  const stats = {
    total: items.length,
    valid: items.filter((i) => !isExpired(i)).length,
    expired: items.filter((i) => isExpired(i)).length,
    expiringSoon: items.filter((i) => isExpiringSoon(i)).length,
    byKind: DANCE_CERT_KINDS.reduce<Record<DanceCertKind, number>>(
      (acc, kind) => {
        acc[kind] = items.filter((i) => i.kind === kind).length;
        return acc;
      },
      { certificate: 0, completion: 0, workshop: 0, award: 0 }
    ),
  };

  return {
    items,
    loading: isLoading,
    addItem,
    updateItem,
    deleteItem,
    stats,
    refetch: () => mutate(),
  };
}
