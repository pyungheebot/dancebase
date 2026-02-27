"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useAuth } from "@/hooks/use-auth";
import { filterProfileByPrivacy } from "@/lib/privacy";
import type { Profile, PublicProfile } from "@/types";

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
