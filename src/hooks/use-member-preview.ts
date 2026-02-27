"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberPreviewData, GroupMemberRole } from "@/types";

export function useMemberPreview(userId: string, groupId?: string | null) {
  const { data, isLoading, mutate } = useSWR(
    userId ? swrKeys.memberPreview(userId, groupId) : null,
    async (): Promise<MemberPreviewData> => {
      const supabase = createClient();

      // profiles, group_members, 활동 통계 병렬 조회
      const [profileRes, postRes, commentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, avatar_url, bio")
          .eq("id", userId)
          .single(),
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId),
        supabase
          .from("board_comments")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId),
      ]);

      if (profileRes.error) {
        throw new Error("프로필 조회 실패");
      }

      const profile = profileRes.data as {
        id: string;
        name: string;
        avatar_url: string | null;
        bio: string | null;
      };

      // 그룹 멤버십 조회 (groupId가 있을 때만)
      let joinedAt: string | null = null;
      let role: GroupMemberRole | null = null;

      if (groupId) {
        const { data: memberData } = await supabase
          .from("group_members")
          .select("joined_at, role")
          .eq("user_id", userId)
          .eq("group_id", groupId)
          .single();

        if (memberData) {
          const member = memberData as { joined_at: string; role: GroupMemberRole };
          joinedAt = member.joined_at;
          role = member.role;
        }
      }

      // 최근 30일 출석률 계산 (groupId가 있을 때만)
      let attendanceRate: number | null = null;

      if (groupId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: scheduleData } = await supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .gte("start_at", thirtyDaysAgo.toISOString());

        const schedules = (scheduleData ?? []) as { id: string }[];

        if (schedules.length > 0) {
          const scheduleIds = schedules.map((s) => s.id);

          const { count: presentCount } = await supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("schedule_id", scheduleIds)
            .in("status", ["present", "late"]);

          attendanceRate = Math.round(((presentCount ?? 0) / schedules.length) * 100);
        } else {
          attendanceRate = null;
        }
      }

      return {
        userId,
        name: profile.name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        joinedAt,
        role,
        attendanceRate,
        postCount: postRes.count ?? 0,
        commentCount: commentRes.count ?? 0,
      };
    },
    {
      dedupingInterval: 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  return {
    preview: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
