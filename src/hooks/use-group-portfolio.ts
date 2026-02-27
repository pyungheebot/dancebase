"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type GroupPortfolioData = {
  group: {
    name: string;
    description: string | null;
    genre: string | null;
    created_at: string;
    member_count: number;
  };
  performances: Array<{
    event_name: string;
    event_date: string;
    event_type: string;
    result: string | null;
    venue: string | null;
  }>;
  videos: Array<{
    url: string;
    title: string;
    platform: string;
    created_at: string;
  }>;
  members: Array<{
    name: string;
    avatar_url: string | null;
    role: string;
  }>;
  stats: {
    totalSchedules: number;
    totalPerformances: number;
    activeSince: string;
  };
};

export function useGroupPortfolio(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupPortfolio(groupId) : null,
    async (): Promise<GroupPortfolioData | null> => {
      if (!groupId) return null;
      const supabase = createClient();

      // 그룹 기본 정보
      const { data: groupRow, error: groupError } = await supabase
        .from("groups")
        .select("name, description, dance_genre, created_at")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;

      // 멤버 수
      const { count: memberCount } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId);

      // 성과 기록 (최근 10개)
      const { data: performanceRows, error: perfError } = await supabase
        .from("performance_records")
        .select("event_name, event_date, event_type, result, venue")
        .eq("group_id", groupId)
        .order("event_date", { ascending: false })
        .limit(10);

      if (perfError) throw perfError;

      // 연습 영상 (최근 6개)
      const { data: videoRows, error: videoError } = await supabase
        .from("practice_videos")
        .select("url, title, platform, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (videoError) throw videoError;

      // 멤버 목록 (리더 먼저, 최대 20명)
      const { data: memberRows, error: memberError } = await supabase
        .from("group_members")
        .select("role, profiles(name, avatar_url)")
        .eq("group_id", groupId)
        .order("role", { ascending: true })
        .limit(20);

      if (memberError) throw memberError;

      // 일정 총 수
      const { count: totalSchedules } = await supabase
        .from("schedules")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId);

      // 성과 총 수
      const { count: totalPerformances } = await supabase
        .from("performance_records")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId);

      const genre =
        groupRow.dance_genre && groupRow.dance_genre.length > 0
          ? groupRow.dance_genre.join(", ")
          : null;

      type MemberRow = { name: string; avatar_url: string | null; role: string };
      const members: MemberRow[] = (memberRows ?? []).map((m: { role: string; profiles: unknown }) => {
        const profile = m.profiles as { name: string; avatar_url: string | null } | null;
        return {
          name: profile?.name ?? "알 수 없음",
          avatar_url: profile?.avatar_url ?? null,
          role: m.role as string,
        };
      });

      // 리더 먼저 정렬
      members.sort((a: MemberRow, b: MemberRow) => {
        const roleOrder: Record<string, number> = { leader: 0, sub_leader: 1, member: 2 };
        return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
      });

      return {
        group: {
          name: groupRow.name,
          description: groupRow.description,
          genre,
          created_at: groupRow.created_at,
          member_count: memberCount ?? 0,
        },
        performances: (performanceRows as Array<{
          event_name: string;
          event_date: string;
          event_type: string;
          result: string | null;
          venue: string | null;
        }> ?? []).map((p) => ({
          event_name: p.event_name,
          event_date: p.event_date,
          event_type: p.event_type,
          result: p.result,
          venue: p.venue,
        })),
        videos: (videoRows as Array<{
          url: string;
          title: string;
          platform: string;
          created_at: string;
        }> ?? []).map((v) => ({
          url: v.url,
          title: v.title,
          platform: v.platform,
          created_at: v.created_at,
        })),
        members,
        stats: {
          totalSchedules: totalSchedules ?? 0,
          totalPerformances: totalPerformances ?? 0,
          activeSince: groupRow.created_at,
        },
      };
    }
  );

  return {
    portfolio: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
