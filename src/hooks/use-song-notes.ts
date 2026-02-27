"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateSongNotes } from "@/lib/swr/invalidate";
import type { SongNote } from "@/types";
import { toast } from "sonner";

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
      toast.error("로그인이 필요합니다");
      return false;
    }

    const { error } = await supabase.from("song_notes").insert({
      song_id: songId,
      content: trimmed,
      created_by: user.id,
    });

    if (error) {
      toast.error("메모 추가에 실패했습니다");
      return false;
    }

    toast.success("메모가 추가되었습니다");
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
      toast.error("메모 삭제에 실패했습니다");
      return;
    }

    toast.success("메모가 삭제되었습니다");
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
