"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateProjectSongs } from "@/lib/swr/invalidate";
import type { ProjectSong } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export function useProjectSongs(projectId: string) {
  const fetcher = async (): Promise<ProjectSong[]> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("project_songs")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ProjectSong[];
  };

  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.projectSongs(projectId) : null,
    fetcher
  );

  const songs = data ?? [];

  // 상태별 분류
  const notStartedSongs = songs.filter((s) => s.status === "not_started");
  const inProgressSongs = songs.filter((s) => s.status === "in_progress");
  const masteredSongs = songs.filter((s) => s.status === "mastered");

  // 진행률 계산
  const totalCount = songs.length;
  const masteredCount = masteredSongs.length;
  const completionRate = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  // 곡 추가
  async function addSong(payload: {
    title: string;
    artist?: string;
    youtube_url?: string;
    spotify_url?: string;
  }): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(TOAST.LOGIN_REQUIRED);
      return false;
    }

    const maxSortOrder =
      songs.length > 0 ? Math.max(...songs.map((s) => s.sort_order)) + 1 : 0;

    const { error } = await supabase.from("project_songs").insert({
      project_id: projectId,
      title: payload.title.trim(),
      artist: payload.artist?.trim() || null,
      youtube_url: payload.youtube_url?.trim() || null,
      spotify_url: payload.spotify_url?.trim() || null,
      status: "not_started",
      created_by: user.id,
      sort_order: maxSortOrder,
    });

    if (error) {
      toast.error(TOAST.SONG.ADD_ERROR);
      return false;
    }

    toast.success(TOAST.SONG.ADDED);
    invalidateProjectSongs(projectId);
    mutate();
    return true;
  }

  // 상태 변경 (순환: not_started → in_progress → mastered → not_started)
  async function cycleSongStatus(song: ProjectSong): Promise<void> {
    const nextStatus: Record<ProjectSong["status"], ProjectSong["status"]> = {
      not_started: "in_progress",
      in_progress: "mastered",
      mastered: "not_started",
    };
    const newStatus = nextStatus[song.status];

    const supabase = createClient();
    const { error } = await supabase
      .from("project_songs")
      .update({ status: newStatus })
      .eq("id", song.id);

    if (error) {
      toast.error(TOAST.STATUS_ERROR);
      return;
    }

    invalidateProjectSongs(projectId);
    mutate();
  }

  // 상태 직접 변경
  async function updateSongStatus(
    songId: string,
    status: ProjectSong["status"]
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_songs")
      .update({ status })
      .eq("id", songId);

    if (error) {
      toast.error(TOAST.STATUS_ERROR);
      return;
    }

    invalidateProjectSongs(projectId);
    mutate();
  }

  // 곡 삭제
  async function deleteSong(songId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("project_songs")
      .delete()
      .eq("id", songId);

    if (error) {
      toast.error(TOAST.DELETE_SIMPLE_ERROR);
      return;
    }

    toast.success(TOAST.SONG.DELETED);
    invalidateProjectSongs(projectId);
    mutate();
  }

  return {
    songs,
    notStartedSongs,
    inProgressSongs,
    masteredSongs,
    loading: isLoading,
    totalCount,
    masteredCount,
    completionRate,
    refetch: () => mutate(),
    addSong,
    cycleSongStatus,
    updateSongStatus,
    deleteSong,
  };
}
