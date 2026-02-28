"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateProfile, invalidateFollowList, invalidateSuggestedFollows } from "@/lib/swr/invalidate";
import { useAuth } from "@/hooks/use-auth";
import { createNotification } from "@/lib/notifications";
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

        // 팔로우 알림 발송
        createNotification({
          userId: targetUserId,
          type: "new_follow",
          title: "새 팔로워",
          message: `${user.user_metadata?.name ?? user.email ?? "누군가"}님이 회원님을 팔로우합니다.`,
          link: `/users/${user.id}`,
        });
      }

      await mutate();

      // 캐시 무효화
      invalidateProfile(targetUserId);
      invalidateProfile(user.id);
      invalidateFollowList(targetUserId);
      invalidateFollowList(user.id);
      invalidateSuggestedFollows();
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
          .select("follower_id, profiles:follower_id(id, name, avatar_url, dance_genre)")
          .eq("following_id", userId);

        return (data ?? []).map(
          (row: { profiles: unknown }) => row.profiles as Profile,
        );
      } else {
        const { data } = await supabase
          .from("follows")
          .select("following_id, profiles:following_id(id, name, avatar_url, dance_genre)")
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

type SuggestedFollow = {
  id: string;
  name: string;
  avatar_url: string | null;
  dance_genre: string[];
  shared_group_count: number;
};

export function useSuggestedFollows(limit: number = 5) {
  const { user } = useAuth();

  const { data, isLoading } = useSWR<SuggestedFollow[]>(
    user ? swrKeys.suggestedFollows() : null,
    async (): Promise<SuggestedFollow[]> => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_suggested_follows", {
        limit_count: limit,
      });
      return (data ?? []) as SuggestedFollow[];
    },
  );

  return {
    suggestions: data ?? [],
    loading: isLoading,
  };
}
