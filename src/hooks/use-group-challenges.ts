"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateGroupChallenges } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import type { GroupChallenge } from "@/types";

type GroupChallengesResult = {
  challenges: GroupChallenge[];
  activeChallenge: GroupChallenge | null;
  currentRate: number;
  createChallenge: (params: {
    title: string;
    targetRate: number;
    startsAt: string;
    endsAt: string;
    description?: string;
  }) => Promise<boolean>;
  deleteChallenge: (id: string) => Promise<boolean>;
  loading: boolean;
  refetch: () => void;
};

export function useGroupChallenges(groupId: string): GroupChallengesResult {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupChallenges(groupId) : null,
    async () => {
      const supabase = createClient();

      const { data: challenges, error } = await supabase
        .from("group_challenges")
        .select("*")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().slice(0, 10);

      // 현재 진행 중인 챌린지 찾기 (가장 최근 시작된 것)
      const activeChallenge =
        (challenges ?? []).find(
          (c: GroupChallenge) => c.starts_at <= today && c.ends_at >= today
        ) ?? null;

      let currentRate = 0;

      if (activeChallenge) {
        // 챌린지 기간의 일정 조회
        const { data: scheduleRows, error: schedErr } = await supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .neq("attendance_method", "none")
          .gte("starts_at", `${activeChallenge.starts_at}T00:00:00`)
          .lte("starts_at", `${activeChallenge.ends_at}T23:59:59`);

        if (!schedErr && scheduleRows && scheduleRows.length > 0) {
          const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);

          // 해당 기간의 출석 집계
          const { data: attRows, error: attErr } = await supabase
            .from("attendance")
            .select("status")
            .in("schedule_id", scheduleIds);

          if (!attErr && attRows) {
            const totalSlots = attRows.length;
            const presentCount = attRows.filter(
              (a: { status: string }) => a.status === "present"
            ).length;
            currentRate =
              totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0;
          }
        }
      }

      return {
        challenges: (challenges ?? []) as GroupChallenge[],
        activeChallenge,
        currentRate,
      };
    }
  );

  const createChallenge = async (params: {
    title: string;
    targetRate: number;
    startsAt: string;
    endsAt: string;
    description?: string;
  }): Promise<boolean> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("로그인이 필요합니다");
      return false;
    }

    const { error } = await supabase.from("group_challenges").insert({
      group_id: groupId,
      title: params.title,
      description: params.description ?? null,
      target_rate: params.targetRate,
      starts_at: params.startsAt,
      ends_at: params.endsAt,
      created_by: user.id,
    });

    if (error) {
      toast.error("챌린지 생성에 실패했습니다");
      return false;
    }

    toast.success("챌린지가 생성되었습니다");
    invalidateGroupChallenges(groupId);
    return true;
  };

  const deleteChallenge = async (id: string): Promise<boolean> => {
    const supabase = createClient();

    const { error } = await supabase
      .from("group_challenges")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("챌린지 삭제에 실패했습니다");
      return false;
    }

    toast.success("챌린지가 삭제되었습니다");
    invalidateGroupChallenges(groupId);
    return true;
  };

  return {
    challenges: data?.challenges ?? [],
    activeChallenge: data?.activeChallenge ?? null,
    currentRate: data?.currentRate ?? 0,
    createChallenge,
    deleteChallenge,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
