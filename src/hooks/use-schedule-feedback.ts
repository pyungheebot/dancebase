"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleFeedback } from "@/lib/swr/invalidate";
import type { ScheduleFeedback } from "@/types";

export function useScheduleFeedback(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleFeedback(scheduleId) : null,
    async () => {
      if (!scheduleId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("schedule_feedback")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (rows ?? []) as ScheduleFeedback[];
    }
  );

  const feedbacks = data ?? [];

  // 평균 별점 계산
  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

  // 본인 피드백 조회 (클라이언트에서 필터링)
  const getMyFeedback = async (): Promise<ScheduleFeedback | null> => {
    if (!scheduleId) return null;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("schedule_feedback")
      .select("*")
      .eq("schedule_id", scheduleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data as ScheduleFeedback | null;
  };

  // 피드백 제출/수정 (upsert)
  const submitFeedback = async (rating: number, comment: string | null): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase
      .from("schedule_feedback")
      .upsert(
        {
          schedule_id: scheduleId,
          user_id: user.id,
          rating,
          comment: comment?.trim() || null,
        },
        { onConflict: "schedule_id,user_id" }
      );

    if (error) throw error;

    invalidateScheduleFeedback(scheduleId);
    mutate();
  };

  // 피드백 삭제
  const deleteFeedback = async (): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase
      .from("schedule_feedback")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("user_id", user.id);

    if (error) throw error;

    invalidateScheduleFeedback(scheduleId);
    mutate();
  };

  // 별점 분포 계산 (5점~1점)
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbacks.filter((f) => f.rating === star).length,
    percentage:
      feedbacks.length > 0
        ? Math.round(
            (feedbacks.filter((f) => f.rating === star).length /
              feedbacks.length) *
              100
          )
        : 0,
  }));

  return {
    feedbacks,
    loading: isLoading,
    averageRating,
    ratingDistribution,
    refetch: () => mutate(),
    getMyFeedback,
    submitFeedback,
    deleteFeedback,
  };
}
