"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ContentReport } from "@/types";

export type ContentReportWithDetails = ContentReport & {
  reporter_profile: { id: string; name: string } | null;
  post_title: string | null;
  comment_content: string | null;
};

export function useContentReports(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.contentReports(groupId),
    async () => {
      const supabase = createClient();

      const { data: reports, error } = await supabase
        .from("content_reports")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) return [] as ContentReportWithDetails[];

      const typedReports = (reports ?? []) as ContentReport[];

      // 신고자 프로필, 대상 콘텐츠 미리보기 조회
      const enriched = await Promise.all(
        typedReports.map(async (report) => {
          const [profileRes, contentRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, name")
              .eq("id", report.reporter_id)
              .single(),
            report.target_type === "post"
              ? supabase
                  .from("board_posts")
                  .select("title")
                  .eq("id", report.target_id)
                  .single()
              : supabase
                  .from("board_comments")
                  .select("content")
                  .eq("id", report.target_id)
                  .single(),
          ]);

          return {
            ...report,
            reporter_profile: profileRes.data as { id: string; name: string } | null,
            post_title:
              report.target_type === "post"
                ? (contentRes.data as { title: string } | null)?.title ?? null
                : null,
            comment_content:
              report.target_type === "comment"
                ? (contentRes.data as { content: string } | null)?.content ?? null
                : null,
          } as ContentReportWithDetails;
        })
      );

      return enriched;
    }
  );

  const pendingCount = (data ?? []).filter((r) => r.status === "pending").length;

  return {
    reports: data ?? [],
    pendingCount,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
