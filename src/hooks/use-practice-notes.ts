"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SharedPracticeNote, PracticeNoteTag } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:practice-notes:${groupId}`;

function loadNotes(groupId: string): SharedPracticeNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SharedPracticeNote[];
  } catch {
    return [];
  }
}

function saveNotes(groupId: string, notes: SharedPracticeNote[]): void {
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

  const notes: SharedPracticeNote[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: SharedPracticeNote[]): void {
    saveNotes(groupId, next);
    mutate(next, false);
  }

  // ── 노트 추가 ────────────────────────────────────────────

  function addNote(
    authorName: string,
    content: string,
    tags: PracticeNoteTag[],
    sessionDate: string,
    songTitle: string
  ): boolean {
    if (!authorName.trim() || !content.trim()) return false;
    const stored = loadNotes(groupId);
    const newNote: SharedPracticeNote = {
      id: crypto.randomUUID(),
      authorName: authorName.trim(),
      content: content.trim(),
      tags,
      sessionDate,
      songTitle: songTitle.trim(),
      likes: 0,
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    update([newNote, ...stored]);
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

  // ── 좋아요 (+1) ──────────────────────────────────────────

  function likeNote(noteId: string): boolean {
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, likes: n.likes + 1 } : n
    );
    update(next);
    return true;
  }

  // ── 핀 토글 ──────────────────────────────────────────────

  function togglePin(noteId: string): boolean {
    const stored = loadNotes(groupId);
    const idx = stored.findIndex((n) => n.id === noteId);
    if (idx === -1) return false;
    const next = stored.map((n) =>
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    );
    update(next);
    return true;
  }

  // ── 태그 필터 ────────────────────────────────────────────

  function filterByTag(tag: PracticeNoteTag | "all"): SharedPracticeNote[] {
    if (tag === "all") return notes;
    return notes.filter((n) => n.tags.includes(tag));
  }

  // ── 곡명 필터 ────────────────────────────────────────────

  function filterBySong(songTitle: string): SharedPracticeNote[] {
    if (!songTitle) return notes;
    return notes.filter((n) => n.songTitle === songTitle);
  }

  // ── 내용 검색 ────────────────────────────────────────────

  function searchNotes(query: string): SharedPracticeNote[] {
    if (!query.trim()) return notes;
    const q = query.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        n.authorName.toLowerCase().includes(q) ||
        n.songTitle.toLowerCase().includes(q)
    );
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalNotes = notes.length;

  const pinnedCount = notes.filter((n) => n.pinned).length;

  const topContributor = (() => {
    if (notes.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const n of notes) {
      countMap[n.authorName] = (countMap[n.authorName] ?? 0) + 1;
    }
    return Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  // ── 고유 곡명 목록 ───────────────────────────────────────

  const uniqueSongs = Array.from(
    new Set(notes.map((n) => n.songTitle).filter(Boolean))
  );

  return {
    notes,
    // CRUD
    addNote,
    deleteNote,
    likeNote,
    togglePin,
    // 필터/검색
    filterByTag,
    filterBySong,
    searchNotes,
    // 통계
    totalNotes,
    pinnedCount,
    topContributor,
    uniqueSongs,
    // SWR
    refetch: () => mutate(),
  };
}
