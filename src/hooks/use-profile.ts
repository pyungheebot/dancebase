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

      // 1단계: 프로필, 팔로워/팔로잉 수, 상호 팔로우 여부를 한 번에 병렬 조회
      const isSelf = !user || user.id === userId;
      const [profileRes, followerRes, followingRes, mutualRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", userId),
          // 본인이면 null 반환, 아니면 상호 팔로우 여부 조회
          isSelf
            ? Promise.resolve({ data: false })
            : supabase.rpc("is_mutual_follow", {
                user_a: user!.id,
                user_b: userId,
              }),
        ]);

      let profile: PublicProfile | null = null;

      if (profileRes.data) {
        const rawProfile = profileRes.data as Profile;
        const isMutualFollow = !!mutualRes.data;

        const filtered = filterProfileByPrivacy(rawProfile, {
          viewerId: user?.id ?? null,
          profileOwnerId: userId,
          isMutualFollow,
        });

        const isOwner = user?.id === userId;

        // 2단계: 팀 그룹과 전체 그룹 멤버십을 병렬 조회
        const [teamGroupsRes, memberGroupRowsRes] = await Promise.all([
          supabase
            .from("group_members")
            .select("groups!inner(id, name, group_type)")
            .eq("user_id", userId)
            .eq("groups.group_type", "팀"),
          supabase
            .from("group_members")
            .select("groups!inner(id, name, avatar_url, dance_genre, group_type, visibility)")
            .eq("user_id", userId),
        ]);

        // 팀 목록 처리
        const teamGroups = teamGroupsRes.data;
        if (teamGroups && teamGroups.length > 0) {
          const teamPrivacy: Record<string, string> = rawProfile.team_privacy ?? {};

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

        // 소속 그룹 목록 처리
        const memberGroupRows = memberGroupRowsRes.data;
        if (memberGroupRows && memberGroupRows.length > 0) {
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

          // 3단계: 각 그룹의 멤버 수를 한 번의 쿼리로 일괄 조회
          const groupIds = visibleGroups.map((row) => row.groups.id);
          const memberCountMap: Record<string, number> = {};

          if (groupIds.length > 0) {
            const { data: countRows } = await supabase
              .from("group_members")
              .select("group_id", { count: "exact" })
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
