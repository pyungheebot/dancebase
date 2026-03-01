"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateSongParts } from "@/lib/swr/invalidate";
import type { SongPart, SongPartType } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export type SongPartWithProfile = SongPart & {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export const PART_TYPE_LABELS: Record<SongPartType, string> = {
  all: "전체",
  solo: "솔로",
  point: "포인트",
  backup: "백댄서",
  intro: "인트로",
  outro: "아웃트로",
  bridge: "브릿지",
};

export function useSongParts(songId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    songId ? swrKeys.songParts(songId) : null,
    async () => {
      if (!songId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("song_parts")
        .select("*, profiles(id, name, avatar_url)")
        .eq("song_id", songId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (rows ?? []) as SongPartWithProfile[];
    }
  );

  // 파트 추가
  async function assignPart(
    targetSongId: string,
    userId: string,
    partName: string,
    partType: SongPartType,
    notes?: string
  ): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(TOAST.LOGIN_REQUIRED);
      return false;
    }

    const parts = data ?? [];
    const maxSortOrder =
      parts.length > 0 ? Math.max(...parts.map((p) => p.sort_order)) + 1 : 0;

    const { error } = await supabase.from("song_parts").insert({
      song_id: targetSongId,
      user_id: userId,
      part_name: partName.trim(),
      part_type: partType,
      sort_order: maxSortOrder,
      notes: notes?.trim() || null,
      created_by: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error(TOAST.PART.DUPLICATE);
      } else {
        toast.error(TOAST.PART.ASSIGN_ERROR);
      }
      return false;
    }

    toast.success(TOAST.PART.ASSIGNED);
    invalidateSongParts(targetSongId);
    mutate();
    return true;
  }

  // 파트 수정
  async function updatePart(
    partId: string,
    updateData: Partial<Pick<SongPart, "part_name" | "part_type" | "notes" | "sort_order">>
  ): Promise<boolean> {
    if (!songId) return false;
    const supabase = createClient();

    const { error } = await supabase
      .from("song_parts")
      .update(updateData)
      .eq("id", partId);

    if (error) {
      toast.error(TOAST.PART.UPDATE_ERROR);
      return false;
    }

    toast.success(TOAST.PART.UPDATED);
    invalidateSongParts(songId);
    mutate();
    return true;
  }

  // 파트 삭제
  async function removePart(partId: string): Promise<void> {
    if (!songId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("song_parts")
      .delete()
      .eq("id", partId);

    if (error) {
      toast.error(TOAST.PART.DELETE_ERROR);
      return;
    }

    toast.success(TOAST.PART.DELETED);
    invalidateSongParts(songId);
    mutate();
  }

  // 순서 변경
  async function reorder(partId: string, newOrder: number): Promise<void> {
    if (!songId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("song_parts")
      .update({ sort_order: newOrder })
      .eq("id", partId);

    if (error) {
      toast.error(TOAST.ORDER_ERROR);
      return;
    }

    invalidateSongParts(songId);
    mutate();
  }

  return {
    parts: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    assignPart,
    updatePart,
    removePart,
    reorder,
  };
}
