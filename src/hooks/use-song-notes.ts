"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateSongNotes } from "@/lib/swr/invalidate";
import type { SongNote } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export type SongNoteWithProfile = SongNote & {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export function useSongNotes(songId: string) {
  const fetcher = async (): Promise<SongNoteWithProfile[]> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("song_notes")
      .select("*, profiles(id, name, avatar_url)")
      .eq("song_id", songId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SongNoteWithProfile[];
  };

  const { data, isLoading, mutate } = useSWR(
    songId ? swrKeys.songNotes(songId) : null,
    fetcher
  );

  const notes = data ?? [];

  // 노트 추가
  async function addNote(content: string): Promise<boolean> {
    const trimmed = content.trim();
    if (!trimmed) return false;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(TOAST.LOGIN_REQUIRED);
      return false;
    }

    const { error } = await supabase.from("song_notes").insert({
      song_id: songId,
      content: trimmed,
      created_by: user.id,
    });

    if (error) {
      toast.error(TOAST.MEMO.ADD_ERROR);
      return false;
    }

    toast.success(TOAST.MEMO.ADDED);
    invalidateSongNotes(songId);
    mutate();
    return true;
  }

  // 노트 삭제
  async function deleteNote(noteId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("song_notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      toast.error(TOAST.MEMO.DELETE_ERROR);
      return;
    }

    toast.success(TOAST.MEMO.DELETED);
    invalidateSongNotes(songId);
    mutate();
  }

  return {
    notes,
    loading: isLoading,
    refetch: () => mutate(),
    addNote,
    deleteNote,
  };
}
