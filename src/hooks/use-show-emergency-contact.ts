"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  EmergencyContact,
  EmergencyContactData,
  EmergencyContactPriority,
  EmergencyContactRole,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return `dancebase:show-emergency-contact:${projectId}`;
}

// ============================================================
// 훅
// ============================================================

export function useShowEmergencyContact(projectId: string) {
  const { data, mutate, isLoading } = useSWR(
    projectId ? swrKeys.showEmergencyContact(projectId) : null,
    () => loadFromStorage<EmergencyContactData>(storageKey(projectId), {} as EmergencyContactData)
  );

  const current: EmergencyContactData = useMemo(() => data ?? {
    projectId,
    contacts: [],
    updatedAt: new Date().toISOString(),
  }, [data, projectId]);

  const persist = useCallback(
    (next: EmergencyContactData) => {
      saveToStorage(storageKey(projectId), next);
      mutate(next, false);
    },
    [projectId, mutate]
  );

  // ── 연락처 추가 ───────────────────────────────────────────

  const addContact = useCallback(
    (
      partial: Omit<EmergencyContact, "id" | "createdAt" | "updatedAt">
    ): EmergencyContact => {
      const now = new Date().toISOString();
      const newContact: EmergencyContact = {
        id: crypto.randomUUID(),
        ...partial,
        createdAt: now,
        updatedAt: now,
      };
      persist({
        ...current,
        contacts: [...current.contacts, newContact],
        updatedAt: now,
      });
      return newContact;
    },
    [current, persist]
  );

  // ── 연락처 수정 ───────────────────────────────────────────

  const updateContact = useCallback(
    (
      contactId: string,
      partial: Partial<Omit<EmergencyContact, "id" | "createdAt" | "updatedAt">>
    ): boolean => {
      const idx = current.contacts.findIndex((c) => c.id === contactId);
      if (idx === -1) return false;
      const next = [...current.contacts];
      next[idx] = {
        ...next[idx],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      persist({
        ...current,
        contacts: next,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 연락처 삭제 ───────────────────────────────────────────

  const deleteContact = useCallback(
    (contactId: string): boolean => {
      const filtered = current.contacts.filter((c) => c.id !== contactId);
      if (filtered.length === current.contacts.length) return false;
      persist({
        ...current,
        contacts: filtered,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const stats = {
    total: current.contacts.length,
    byPriority: {
      1: current.contacts.filter((c) => c.priority === 1).length,
      2: current.contacts.filter((c) => c.priority === 2).length,
      3: current.contacts.filter((c) => c.priority === 3).length,
    } as Record<EmergencyContactPriority, number>,
    byRole: (
      [
        "총감독",
        "무대감독",
        "음향감독",
        "조명감독",
        "의료진",
        "보안",
        "기타",
      ] as EmergencyContactRole[]
    ).reduce(
      (acc, role) => {
        acc[role] = current.contacts.filter((c) => c.role === role).length;
        return acc;
      },
      {} as Record<EmergencyContactRole, number>
    ),
  };

  return {
    data: current,
    loading: isLoading,
    addContact,
    updateContact,
    deleteContact,
    stats,
    refetch: () => mutate(),
  };
}
