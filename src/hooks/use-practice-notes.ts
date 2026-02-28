"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PracticeNoteEntry, PracticeNoteTag, PracticeNoteComment } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:practice-notes:${groupId}`;

function loadNotes(groupId: string): PracticeNoteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeNoteEntry[];
  } catch {
    return [];
  }
}

function saveNotes(groupId: string, notes: PracticeNoteEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePracticeNotes(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.practiceNotes(groupId) : null,
    () => loadNotes(groupId),
    { revalidateOnFocus: false }
  );

  const notes: PracticeNoteEntry[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: PracticeNoteEntry[]): void {
    saveNotes(groupId, next);
    mutate(next, false);
  }

  // ── 노트 추가 ────────────────────────────────────────────

  function addNote(
    input: Omit<PracticeNoteEntry, "id" | "comments" | "isPinned" | "createdAt">
  ): boolean {
    if (!input.author.trim() || !input.title.trim() || !input.content.trim()) return false;
    const stored = loadNotes(groupId);
    const newNote: PracticeNoteEntry = {
      ...input,
      id: crypto.randomUUID(),
      comments: [],
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    update([newNote, ...stored]);
    return true;
  }

  // ── 노트 수정 ────────────────────────────────────────────

  function updateNote(
    noteId: string,
    changes: Partial<Pick<PracticeNoteEntry, "title" | "content" | "tags" | "date">>
  ): boolean {
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, ...changes } : n
    );
    update(next);
    return true;
  }

  // ── 노트 삭제 ────────────────────────────────────────────

  function deleteNote(noteId: string): boolean {
    const stored = loadNotes(groupId);
    const next = stored.filter((n) => n.id !== noteId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 핀 토글 ──────────────────────────────────────────────

  function togglePin(noteId: string): boolean {
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
    );
    update(next);
    return true;
  }

  // ── 코멘트 추가 ──────────────────────────────────────────

  function addComment(noteId: string, author: string, content: string): boolean {
    if (!author.trim() || !content.trim()) return false;
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const newComment: PracticeNoteComment = {
      id: crypto.randomUUID(),
      author: author.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, comments: [...n.comments, newComment] } : n
    );
    update(next);
    return true;
  }

  // ── 코멘트 삭제 ──────────────────────────────────────────

  function deleteComment(noteId: string, commentId: string): boolean {
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const note = stored[idx];
    const filteredComments = note.comments.filter((c) => c.id !== commentId);
    if (filteredComments.length === note.comments.length) return false;
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, comments: filteredComments } : n
    );
    update(next);
    return true;
  }

  // ── 태그 필터 ────────────────────────────────────────────

  function getByTag(tag: PracticeNoteTag): PracticeNoteEntry[] {
    return notes.filter((n) => n.tags.includes(tag));
  }

  // ── 고정 노트 ────────────────────────────────────────────

  function getPinned(): PracticeNoteEntry[] {
    return notes.filter((n) => n.isPinned);
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalNotes = notes.length;
  const pinnedNotes = notes.filter((n) => n.isPinned).length;
  const totalComments = notes.reduce((sum, n) => sum + n.comments.length, 0);

  const stats = { totalNotes, pinnedNotes, totalComments };

  return {
    notes,
    // CRUD
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    // 코멘트
    addComment,
    deleteComment,
    // 필터
    getByTag,
    getPinned,
    // 통계
    stats,
    // SWR
    refetch: () => mutate(),
  };
}
