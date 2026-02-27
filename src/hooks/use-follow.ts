"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/types";

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [toggling, setToggling] = useState(false);

  const swrKey =
    user && user.id !== targetUserId
      ? swrKeys.followStatus(targetUserId)
      : null;

  const { data, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      const supabase = createClient();

      const [followingRes, followedByRes] = await Promise.all([
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user!.id)
          .eq("following_id", targetUserId)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", targetUserId)
          .eq("following_id", user!.id)
          .maybeSingle(),
      ]);

      return {
        isFollowing: !!followingRes.data,
        isFollowedBy: !!followedByRes.data,
      };
    },
  );

  const isFollowing = data?.isFollowing ?? false;
  const isFollowedBy = data?.isFollowedBy ?? false;
  const isMutual = isFollowing && isFollowedBy;
  const loaded = !!data || !swrKey;

  const toggleFollow = async () => {
    if (!user || toggling) return;
    setToggling(true);
    const supabase = createClient();

    const newIsFollowing = !isFollowing;

    // 낙관적 업데이트
    mutate(
      { isFollowing: newIsFollowing, isFollowedBy },
      false,
    );

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });
      }

      await mutate();
    } catch {
      // 실패 시 롤백
      await mutate();
    }

    setToggling(false);
  };

  return { isFollowing, isFollowedBy, isMutual, toggling, toggleFollow, loaded };
}

export function useFollowList(
  userId: string,
  type: "followers" | "following",
) {
  const { data, isLoading } = useSWR<Profile[]>(
    swrKeys.followList(userId, type),
    async (): Promise<Profile[]> => {
      const supabase = createClient();

      if (type === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("follower_id, profiles:follower_id(*)")
          .eq("following_id", userId);

        return (data ?? []).map(
          (row: { profiles: unknown }) => row.profiles as Profile,
        );
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following_id, profiles:following_id(*)")
          .eq("follower_id", userId);

        return (data ?? []).map(
          (row: { profiles: unknown }) => row.profiles as Profile,
        );
      }
    },
  );

  return {
    profiles: data ?? [],
    loading: isLoading,
  };
}
