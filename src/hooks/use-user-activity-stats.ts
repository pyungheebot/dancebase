"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type UserActivityStats = {
  postCount: number;
  commentCount: number;
  groupCount: number;
  attendanceCount: number;
};

export function useUserActivityStats(userId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.userActivityStats(userId),
    async (): Promise<UserActivityStats> => {
      const supabase = createClient();

      const [postRes, commentRes, groupRes, attendanceRes] = await Promise.all([
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId),
        supabase
          .from("board_comments")
          .select("id", { count: "exact", head: true })
          .eq("author_id", userId),
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("status", ["present", "late"]),
      ]);

      return {
        postCount: postRes.count ?? 0,
        commentCount: commentRes.count ?? 0,
        groupCount: groupRes.count ?? 0,
        attendanceCount: attendanceRes.count ?? 0,
      };
    }
  );

  return {
    stats: data ?? {
      postCount: 0,
      commentCount: 0,
      groupCount: 0,
      attendanceCount: 0,
    },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
