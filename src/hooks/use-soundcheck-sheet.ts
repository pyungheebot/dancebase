"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SoundcheckSheet, SoundcheckChannel } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:soundcheck-sheet:${groupId}:${projectId}`;
}

function loadSheets(groupId: string, projectId: string): SoundcheckSheet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as SoundcheckSheet[]) : [];
  } catch {
    return [];
  }
}

function saveSheets(
  groupId: string,
  projectId: string,
  sheets: SoundcheckSheet[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(sheets)
  );
}

// ============================================================
// 훅
// ============================================================

export function useSoundcheckSheet(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.soundcheckSheet(groupId, projectId),
    async () => loadSheets(groupId, projectId)
  );

  const sheets = data ?? [];

  // ── 시트 추가 ──
  async function addSheet(
    input: Omit<SoundcheckSheet, "id" | "createdAt" | "channels">
  ): Promise<SoundcheckSheet> {
    const newSheet: SoundcheckSheet = {
      ...input,
      id: crypto.randomUUID(),
      channels: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...sheets, newSheet];
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
    return newSheet;
  }

  // ── 시트 수정 ──
  async function updateSheet(
    sheetId: string,
    changes: Partial<Omit<SoundcheckSheet, "id" | "createdAt" | "channels">>
  ): Promise<void> {
    const updated = sheets.map((s) =>
      s.id === sheetId ? { ...s, ...changes } : s
    );
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 시트 삭제 ──
  async function deleteSheet(sheetId: string): Promise<void> {
    const updated = sheets.filter((s) => s.id !== sheetId);
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 채널 추가 ──
  async function addChannel(
    sheetId: string,
    input: Omit<SoundcheckChannel, "id">
  ): Promise<void> {
    const updated = sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const newChannel: SoundcheckChannel = {
        ...input,
        id: crypto.randomUUID(),
      };
      return { ...s, channels: [...s.channels, newChannel] };
    });
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 채널 수정 ──
  async function updateChannel(
    sheetId: string,
    channelId: string,
    changes: Partial<Omit<SoundcheckChannel, "id">>
  ): Promise<void> {
    const updated = sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const newChannels = s.channels.map((c) =>
        c.id === channelId ? { ...c, ...changes } : c
      );
      return { ...s, channels: newChannels };
    });
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 채널 삭제 ──
  async function deleteChannel(sheetId: string, channelId: string): Promise<void> {
    const updated = sheets.map((s) => {
      if (s.id !== sheetId) return s;
      return { ...s, channels: s.channels.filter((c) => c.id !== channelId) };
    });
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 채널 체크 토글 ──
  async function toggleChecked(sheetId: string, channelId: string): Promise<void> {
    const updated = sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const newChannels = s.channels.map((c) =>
        c.id === channelId ? { ...c, isChecked: !c.isChecked } : c
      );
      return { ...s, channels: newChannels };
    });
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 채널 순서 변경 ──
  async function reorderChannels(sheetId: string, channelIds: string[]): Promise<void> {
    const updated = sheets.map((s) => {
      if (s.id !== sheetId) return s;
      const channelMap = new Map(s.channels.map((c) => [c.id, c]));
      const newChannels = channelIds
        .map((id) => channelMap.get(id))
        .filter((c): c is SoundcheckChannel => c !== undefined);
      return { ...s, channels: newChannels };
    });
    saveSheets(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 통계 ──
  const totalSheets = sheets.length;
  const totalChannels = sheets.reduce((sum, s) => sum + s.channels.length, 0);
  const checkedChannels = sheets.reduce(
    (sum, s) => sum + s.channels.filter((c) => c.isChecked).length,
    0
  );
  const completionRate =
    totalChannels > 0
      ? Math.round((checkedChannels / totalChannels) * 100)
      : 0;

  const stats = {
    totalSheets,
    totalChannels,
    checkedChannels,
    completionRate,
  };

  return {
    sheets,
    loading: isLoading,
    refetch: () => mutate(),
    addSheet,
    updateSheet,
    deleteSheet,
    addChannel,
    updateChannel,
    deleteChannel,
    toggleChecked,
    reorderChannels,
    stats,
  };
}
