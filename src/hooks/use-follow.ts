"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateProfile, invalidateFollowList, invalidateSuggestedFollows } from "@/lib/swr/invalidate";
import { optimisticMutate } from "@/lib/swr/optimistic";
import { useAuth } from "@/hooks/use-auth";
import { createNotification } from "@/lib/notifications";
import type { Profile } from "@/types";

type FollowStatus = {
  isFollowing: boolean;
  isFollowedBy: boolean;
};

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const [toggling, setToggling] = useState(false);

  const swrKey =
    user && user.id !== targetUserId
      ? swrKeys.followStatus(targetUserId)
      : null;

  const { data, mutate } = useSWR(
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
    if (!user || toggling || !swrKey) return;
    setToggling(true);

    const newIsFollowing = !isFollowing;
    const supabase = createClient();

    // optimisticMutate: 즉시 UI 반영 + 실패 시 자동 롤백
    await optimisticMutate<FollowStatus>(
      swrKey,
      () => ({ isFollowing: newIsFollowing, isFollowedBy }),
      async () => {
        if (isFollowing) {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("follows").insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
          if (error) throw error;

          // 팔로우 알림 발송 (fire-and-forget, 실패해도 롤백 불필요)
          createNotification({
            userId: targetUserId,
            type: "new_follow",
            title: "새 팔로워",
            message: `${user.user_metadata?.name ?? user.email ?? "누군가"}님이 회원님을 팔로우합니다.`,
            link: `/users/${user.id}`,
          });
        }

        // 관련 캐시 무효화 (성공 시에만)
        invalidateProfile(targetUserId);
        invalidateProfile(user.id);
        invalidateFollowList(targetUserId);
        invalidateFollowList(user.id);
        invalidateSuggestedFollows();
      },
      {
        revalidate: true,   // 성공 후 팔로우 상태 서버에서 재검증
        rollbackOnError: true,
      }
    );

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
