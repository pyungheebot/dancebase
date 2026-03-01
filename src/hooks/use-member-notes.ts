"use client";

import { useState, useCallback } from "react";
import type { MemberNoteV2, MemberNoteCategory } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, writerId: string): string {
  return `dancebase:member-notes:${groupId}:${writerId}`;
}

// ============================================
// 내부 유틸
// ============================================

function saveToStorage(groupId: string, writerId: string, notes: MemberNoteV2[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, writerId), JSON.stringify(notes));
  } catch {
    // 무시
  }
}

// 최근 수정순 정렬
function sortByUpdated(notes: MemberNoteV2[]): MemberNoteV2[] {
  return [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ============================================
// 훅
// ============================================

export function useMemberNotes(groupId: string, writerId: string) {
  const [notes, setNotes] = useState<MemberNoteV2[]>([]);

  // 메모 추가
  const addNote = useCallback(
    (targetUserId: string, content: string, category: MemberNoteCategory): MemberNoteV2 => {
      const now = new Date().toISOString();
      const newNote: MemberNoteV2 = {
        id: crypto.randomUUID(),
        targetUserId,
        content: content.trim(),
        category,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => {
        const updated = sortByUpdated([...prev, newNote]);
        saveToStorage(groupId, writerId, updated);
        return updated;
      });
      return newNote;
    },
    [groupId, writerId]
  );

  // 메모 수정
  const updateNote = useCallback(
    (noteId: string, content: string, category: MemberNoteCategory): void => {
      setNotes((prev) => {
        const updated = sortByUpdated(
          prev.map((n) =>
            n.id === noteId
              ? { ...n, content: content.trim(), category, updatedAt: new Date().toISOString() }
              : n
          )
        );
        saveToStorage(groupId, writerId, updated);
        return updated;
      });
    },
    [groupId, writerId]
  );

  // 메모 삭제
  const deleteNote = useCallback(
    (noteId: string): void => {
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== noteId);
        saveToStorage(groupId, writerId, updated);
        return updated;
      });
    },
    [groupId, writerId]
  );

  // 멤버별 메모 필터
  const getNotesByTarget = useCallback(
    (targetUserId: string): MemberNoteV2[] => {
      return notes.filter((n) => n.targetUserId === targetUserId);
    },
    [notes]
  );

  // 카테고리별 필터
  const getNotesByCategory = useCallback(
    (targetUserId: string, category: MemberNoteCategory | "all"): MemberNoteV2[] => {
      const targetNotes = notes.filter((n) => n.targetUserId === targetUserId);
      if (category === "all") return targetNotes;
      return targetNotes.filter((n) => n.category === category);
    },
    [notes]
  );

  return {
    notes,
    loading: false,
    addNote,
    updateNote,
    deleteNote,
    getNotesByTarget,
    getNotesByCategory,
  };
}
