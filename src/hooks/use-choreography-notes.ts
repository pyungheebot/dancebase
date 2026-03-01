"use client";

import { useState, useCallback } from "react";
import type { ChoreographyNote, ChoreographySection } from "@/types";

const MAX_NOTES = 5;
const MAX_SECTIONS_PER_NOTE = 20;

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:choreo-notes:${groupId}:${projectId}`;
}

function loadNotes(groupId: string, projectId: string): ChoreographyNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ChoreographyNote[];
  } catch {
    return [];
  }
}

function saveNotes(
  groupId: string,
  projectId: string,
  notes: ChoreographyNote[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(notes));
  } catch {
    // 무시
  }
}

export function useChoreographyNotes(groupId: string, projectId: string) {
  const [notes, setNotes] = useState<ChoreographyNote[]>([]);


  // 상태 업데이트 + localStorage 동기화
  const updateNotes = useCallback(
    (next: ChoreographyNote[]) => {
      setNotes(next);
      saveNotes(groupId, projectId, next);
    },
    [groupId, projectId]
  );

  // 노트 추가 (최대 5개)
  const addNote = useCallback(
    (title: string): boolean => {
      if (notes.length >= MAX_NOTES) return false;
      const newNote: ChoreographyNote = {
        id: crypto.randomUUID(),
        projectId,
        title: title.trim(),
        sections: [],
        updatedAt: new Date().toISOString(),
      };
      updateNotes([...notes, newNote]);
      return true;
    },
    [notes, projectId, updateNotes]
  );

  // 노트 삭제
  const deleteNote = useCallback(
    (noteId: string): void => {
      updateNotes(notes.filter((n) => n.id !== noteId));
    },
    [notes, updateNotes]
  );

  // 섹션 추가 (최대 20개/노트)
  const addSection = useCallback(
    (
      noteId: string,
      section: Omit<ChoreographySection, "id" | "createdAt">
    ): boolean => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return false;
      if (note.sections.length >= MAX_SECTIONS_PER_NOTE) return false;

      const newSection: ChoreographySection = {
        ...section,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const updatedNotes = notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              sections: [...n.sections, newSection],
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      updateNotes(updatedNotes);
      return true;
    },
    [notes, updateNotes]
  );

  // 섹션 수정
  const updateSection = useCallback(
    (
      noteId: string,
      sectionId: string,
      updates: Partial<Omit<ChoreographySection, "id" | "createdAt">>
    ): void => {
      const updatedNotes = notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              sections: n.sections.map((s) =>
                s.id === sectionId ? { ...s, ...updates } : s
              ),
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      updateNotes(updatedNotes);
    },
    [notes, updateNotes]
  );

  // 섹션 삭제
  const deleteSection = useCallback(
    (noteId: string, sectionId: string): void => {
      const updatedNotes = notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              sections: n.sections.filter((s) => s.id !== sectionId),
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      updateNotes(updatedNotes);
    },
    [notes, updateNotes]
  );

  return {
    notes,
    loading: false,
    canAddNote: notes.length < MAX_NOTES,
    addNote,
    deleteNote,
    addSection,
    updateSection,
    deleteSection,
  };
}
