"use client";

import { useState, useCallback } from "react";
import type { ScheduleNoteItem, ScheduleNoteCategory } from "@/types";

const MAX_NOTES_PER_SCHEDULE = 5;

function getStorageKey(groupId: string): string {
  return `dancebase:schedule-notes:${groupId}`;
}

function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function saveAll(groupId: string, items: ScheduleNoteItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
  } catch {
    // localStorage 저장 실패 무시
  }
}

export function useScheduleNotes(groupId: string, scheduleId: string) {
  const [allItems, setAllItems] = useState<ScheduleNoteItem[]>([]);

  // 마운트 시 localStorage에서 전체 로드

  // 해당 scheduleId에 해당하는 메모만 필터링 (최신순)
  const notes = allItems
    .filter((item) => item.scheduleId === scheduleId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const isMaxReached = notes.length >= MAX_NOTES_PER_SCHEDULE;

  // 메모 추가
  const addNote = useCallback(
    (content: string, category: ScheduleNoteCategory): boolean => {
      if (!groupId || !scheduleId) return false;
      const trimmed = content.trim();
      if (!trimmed) return false;

      const currentNotes = allItems.filter(
        (item) => item.scheduleId === scheduleId
      );
      if (currentNotes.length >= MAX_NOTES_PER_SCHEDULE) return false;

      const now = new Date().toISOString();
      const newItem: ScheduleNoteItem = {
        id: generateId(),
        scheduleId,
        content: trimmed,
        category,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...allItems, newItem];
      saveAll(groupId, updated);
      setAllItems(updated);
      return true;
    },
    [groupId, scheduleId, allItems]
  );

  // 메모 수정
  const updateNote = useCallback(
    (
      id: string,
      content: string,
      category: ScheduleNoteCategory
    ): boolean => {
      if (!groupId) return false;
      const trimmed = content.trim();
      if (!trimmed) return false;

      const updated = allItems.map((item) =>
        item.id === id
          ? {
              ...item,
              content: trimmed,
              category,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      saveAll(groupId, updated);
      setAllItems(updated);
      return true;
    },
    [groupId, allItems]
  );

  // 메모 삭제
  const removeNote = useCallback(
    (id: string): void => {
      if (!groupId) return;
      const updated = allItems.filter((item) => item.id !== id);
      saveAll(groupId, updated);
      setAllItems(updated);
    },
    [groupId, allItems]
  );

  return {
    notes,
    loading: false,
    isMaxReached,
    maxCount: MAX_NOTES_PER_SCHEDULE,
    addNote,
    updateNote,
    removeNote,
  };
}
