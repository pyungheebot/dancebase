"use client";

import { useState, useCallback } from "react";
import type { SharedMemo, SharedMemoColor } from "@/types";

const MAX_MEMOS = 30;
const STORAGE_KEY = (groupId: string) =>
  `dancebase:shared-memo:${groupId}`;

function loadMemos(groupId: string): SharedMemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    const parsed: SharedMemo[] = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    // 만료일 지난 메모 자동 제거
    return parsed.filter(
      (m) => !m.expiresAt || m.expiresAt >= today
    );
  } catch {
    return [];
  }
}

function saveMemos(groupId: string, memos: SharedMemo[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(memos));
}

function sortMemos(memos: SharedMemo[]): SharedMemo[] {
  return [...memos].sort((a, b) => {
    // 핀된 메모 우선
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    // 최신 생성순
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export type AddMemoParams = {
  content: string;
  author: string;
  color: SharedMemoColor;
  expiresAt?: string;
};

export function useSharedMemo(groupId: string) {
  const [memos, setMemos] = useState<SharedMemo[]>(() =>
    groupId ? sortMemos(loadMemos(groupId)) : []
  );

  const persist = useCallback(
    (updated: SharedMemo[]) => {
      const sorted = sortMemos(updated);
      saveMemos(groupId, sorted);
      setMemos(sorted);
    },
    [groupId]
  );

  const addMemo = useCallback(
    (params: AddMemoParams) => {
      const current = loadMemos(groupId);
      if (current.length >= MAX_MEMOS) {
        return false;
      }
      const newMemo: SharedMemo = {
        id: crypto.randomUUID(),
        content: params.content.slice(0, 200),
        author: params.author.trim() || "익명",
        color: params.color,
        pinned: false,
        expiresAt: params.expiresAt || undefined,
        createdAt: new Date().toISOString(),
      };
      persist([...current, newMemo]);
      return true;
    },
    [groupId, persist]
  );

  const deleteMemo = useCallback(
    (id: string) => {
      const current = loadMemos(groupId);
      persist(current.filter((m) => m.id !== id));
    },
    [groupId, persist]
  );

  const togglePin = useCallback(
    (id: string) => {
      const current = loadMemos(groupId);
      persist(
        current.map((m) =>
          m.id === id ? { ...m, pinned: !m.pinned } : m
        )
      );
    },
    [groupId, persist]
  );

  const updateMemo = useCallback(
    (id: string, patch: Partial<Pick<SharedMemo, "content" | "color" | "expiresAt">>) => {
      const current = loadMemos(groupId);
      persist(
        current.map((m) =>
          m.id === id
            ? {
                ...m,
                ...patch,
                content: patch.content
                  ? patch.content.slice(0, 200)
                  : m.content,
              }
            : m
        )
      );
    },
    [groupId, persist]
  );

  return {
    memos,
    addMemo,
    deleteMemo,
    togglePin,
    updateMemo,
    isFull: memos.length >= MAX_MEMOS,
  };
}
