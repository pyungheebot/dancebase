"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  BackstageCommEntry,
  BackstageCommMessage,
  BackstageCommType,
  BackstageCommTarget,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:backstage-comm:${groupId}:${projectId}`;
}

function loadEntry(
  groupId: string,
  projectId: string
): BackstageCommEntry | null {
  return loadFromStorage<BackstageCommEntry | null>(
    getStorageKey(groupId, projectId),
    null
  );
}

function saveEntry(
  groupId: string,
  projectId: string,
  entry: BackstageCommEntry
): void {
  saveToStorage(getStorageKey(groupId, projectId), entry);
}

function createEmptyEntry(
  groupId: string,
  projectId: string
): BackstageCommEntry {
  return {
    id: crypto.randomUUID(),
    groupId,
    projectId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 훅
// ============================================================

export function useBackstageComm(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.backstageComm(groupId, projectId),
    async () => {
      const existing = loadEntry(groupId, projectId);
      if (existing) return existing;
      const fresh = createEmptyEntry(groupId, projectId);
      saveEntry(groupId, projectId, fresh);
      return fresh;
    }
  );

  const entry = data ?? createEmptyEntry(groupId, projectId);

  // 공통 저장 헬퍼
  function persist(updated: BackstageCommEntry): void {
    const withTimestamp: BackstageCommEntry = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveEntry(groupId, projectId, withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 메시지 추가 ──
  function addMessage(input: {
    type: BackstageCommType;
    content: string;
    senderName: string;
    target: BackstageCommTarget;
  }): BackstageCommMessage {
    const newMsg: BackstageCommMessage = {
      id: crypto.randomUUID(),
      type: input.type,
      content: input.content,
      senderName: input.senderName,
      target: input.target,
      isPinned: false,
      isRead: false,
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    persist({ ...entry, messages: [...entry.messages, newMsg] });
    return newMsg;
  }

  // ── 메시지 삭제 ──
  function deleteMessage(messageId: string): void {
    const filtered = entry.messages.filter((m) => m.id !== messageId);
    persist({ ...entry, messages: filtered });
  }

  // ── 확인 토글 (isRead) ──
  function toggleRead(messageId: string): void {
    const updated = entry.messages.map((m) =>
      m.id === messageId ? { ...m, isRead: !m.isRead } : m
    );
    persist({ ...entry, messages: updated });
  }

  // ── 확인자 추가 (readBy) ──
  function addReadBy(messageId: string, readerName: string): void {
    const updated = entry.messages.map((m) => {
      if (m.id !== messageId) return m;
      if (m.readBy.includes(readerName)) return m;
      return {
        ...m,
        readBy: [...m.readBy, readerName],
        isRead: true,
      };
    });
    persist({ ...entry, messages: updated });
  }

  // ── 핀 고정 토글 ──
  function togglePin(messageId: string): void {
    const updated = entry.messages.map((m) =>
      m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
    );
    persist({ ...entry, messages: updated });
  }

  // ── 유형별 필터 ──
  function getByType(type: BackstageCommType): BackstageCommMessage[] {
    return entry.messages.filter((m) => m.type === type);
  }

  // ── 긴급 메시지 목록 ──
  const urgentMessages = entry.messages.filter((m) => m.type === "urgent");

  // ── 핀 고정 메시지 목록 ──
  const pinnedMessages = entry.messages.filter((m) => m.isPinned);

  // ── 시간순 정렬된 전체 메시지 ──
  const sortedMessages = [...entry.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // ── 통계 ──
  const stats = {
    total: entry.messages.length,
    urgent: entry.messages.filter((m) => m.type === "urgent").length,
    unread: entry.messages.filter((m) => !m.isRead).length,
    pinned: entry.messages.filter((m) => m.isPinned).length,
  };

  return {
    entry,
    loading: isLoading,
    messages: sortedMessages,
    urgentMessages,
    pinnedMessages,
    stats,
    addMessage,
    deleteMessage,
    toggleRead,
    addReadBy,
    togglePin,
    getByType,
    refetch: () => mutate(),
  };
}
