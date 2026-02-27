"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidatePracticeVideos } from "@/lib/swr/invalidate";
import type { PracticeVideo } from "@/types";
import { toast } from "sonner";

export type PracticeVideoWithProfile = PracticeVideo & {
  profiles: { id: string; name: string; avatar_url: string | null } | null;
};

export function usePracticeVideos(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.practiceVideos(groupId) : null,
    async () => {
      if (!groupId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("practice_videos")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (rows ?? []) as PracticeVideoWithProfile[];
    }
  );

  const videos = data ?? [];

  // 영상 추가
  async function addVideo(payload: {
    url: string;
    title: string;
    platform: string;
    tags: string[];
    projectId?: string | null;
    scheduleId?: string | null;
    songId?: string | null;
  }): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("로그인이 필요합니다");
      return false;
    }

    const { error } = await supabase.from("practice_videos").insert({
      group_id: groupId,
      project_id: payload.projectId ?? null,
      schedule_id: payload.scheduleId ?? null,
      song_id: payload.songId ?? null,
      url: payload.url.trim(),
      title: payload.title.trim(),
      platform: payload.platform,
      tags: payload.tags,
      uploaded_by: user.id,
    });

    if (error) {
      toast.error("영상 추가에 실패했습니다");
      return false;
    }

    toast.success("영상이 추가되었습니다");
    invalidatePracticeVideos(groupId);
    mutate();
    return true;
  }

  // 영상 삭제
  async function deleteVideo(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("practice_videos")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("삭제에 실패했습니다");
      return;
    }

    toast.success("영상이 삭제되었습니다");
    invalidatePracticeVideos(groupId);
    mutate();
  }

  // 곡별 필터
  function filterBySong(songId: string | null) {
    if (!songId) return videos;
    return videos.filter((v) => v.song_id === songId);
  }

  // 태그별 필터
  function filterByTag(tag: string | null) {
    if (!tag) return videos;
    return videos.filter((v) => v.tags.includes(tag));
  }

  // 전체 태그 목록 (중복 제거)
  const allTags = Array.from(new Set(videos.flatMap((v) => v.tags)));

  return {
    videos,
    loading: isLoading,
    allTags,
    refetch: () => mutate(),
    addVideo,
    deleteVideo,
    filterBySong,
    filterByTag,
  };
}
