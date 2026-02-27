"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useAuth } from "@/hooks/use-auth";
import { filterProfileByPrivacy } from "@/lib/privacy";
import type { Profile, PublicProfile, PublicProfileGroup } from "@/types";

export function useUserProfile(userId: string) {
  const { user } = useAuth();

  const { data, isLoading, mutate } = useSWR(
    swrKeys.userProfile(userId),
    async () => {
      const supabase = createClient();

      const [profileRes, followerRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      let profile: PublicProfile | null = null;

      if (profileRes.data) {
        const rawProfile = profileRes.data as Profile;

        let isMutualFollow = false;
        if (user && user.id !== userId) {
          const { data: mutualData } = await supabase.rpc("is_mutual_follow", {
            user_a: user.id,
            user_b: userId,
          });
          isMutualFollow = !!mutualData;
        }

        const filtered = filterProfileByPrivacy(rawProfile, {
          viewerId: user?.id ?? null,
          profileOwnerId: userId,
          isMutualFollow,
        });

        const { data: teamGroups } = await supabase
          .from("group_members")
          .select("groups!inner(id, name, group_type)")
          .eq("user_id", userId)
          .eq("groups.group_type", "팀");

        if (teamGroups && teamGroups.length > 0) {
          const teamPrivacy: Record<string, string> = rawProfile.team_privacy ?? {};
          const isOwner = user?.id === userId;

          type TeamGroupRow = { groups: { id: string; name: string; group_type: string } };
          filtered.teams = (teamGroups as TeamGroupRow[])
            .filter((row) => {
              if (isOwner) return true;
              const level = teamPrivacy[row.groups.id] ?? "public";
              if (level === "public") return true;
              if (level === "mutual_follow") return isMutualFollow;
              return false;
            })
            .map((row) => row.groups.name);
        } else {
          filtered.teams = [];
        }

        // 소속 그룹 조회 (그룹 visibility + member_count 포함)
        const { data: memberGroupRows } = await supabase
          .from("group_members")
          .select("groups!inner(id, name, avatar_url, dance_genre, group_type, visibility)")
          .eq("user_id", userId);

        if (memberGroupRows && memberGroupRows.length > 0) {
          const isOwner = user?.id === userId;

          type MemberGroupRow = {
            groups: {
              id: string;
              name: string;
              avatar_url: string | null;
              dance_genre: string[];
              group_type: string;
              visibility: string;
            };
          };

          // visibility 필터링: 본인이면 전체, 아니면 public만
          const visibleGroups = (memberGroupRows as MemberGroupRow[]).filter((row) => {
            if (isOwner) return true;
            return row.groups.visibility === "public";
          });

          // 각 그룹의 멤버 수 조회
          const groupIds = visibleGroups.map((row) => row.groups.id);
          const memberCountMap: Record<string, number> = {};

          if (groupIds.length > 0) {
            const { data: countRows } = await supabase
              .from("group_members")
              .select("group_id")
              .in("group_id", groupIds);

            if (countRows) {
              for (const row of countRows) {
                memberCountMap[row.group_id] = (memberCountMap[row.group_id] ?? 0) + 1;
              }
            }
          }

          filtered.groups = visibleGroups.map((row): PublicProfileGroup => ({
            id: row.groups.id,
            name: row.groups.name,
            avatar_url: row.groups.avatar_url,
            dance_genre: row.groups.dance_genre ?? [],
            group_type: row.groups.group_type as PublicProfileGroup["group_type"],
            visibility: row.groups.visibility as PublicProfileGroup["visibility"],
            member_count: memberCountMap[row.groups.id] ?? 0,
          }));
        } else {
          filtered.groups = [];
        }

        profile = filtered;
      }

      return {
        profile,
        followerCount: followerRes.count ?? 0,
        followingCount: followingRes.count ?? 0,
      };
    },
  );

  return {
    profile: data?.profile ?? null,
    followerCount: data?.followerCount ?? 0,
    followingCount: data?.followingCount ?? 0,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
