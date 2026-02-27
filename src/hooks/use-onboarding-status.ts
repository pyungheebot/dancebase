"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useAuth } from "@/hooks/use-auth";

export type OnboardingStatus = {
  profileComplete: boolean;
  hasGroup: boolean;
  hasActivity: boolean;
};

export function useOnboardingStatus() {
  const { user } = useAuth();

  const { data, isLoading, mutate } = useSWR(
    user ? swrKeys.onboardingStatus(user.id) : null,
    async (): Promise<OnboardingStatus> => {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        return { profileComplete: false, hasGroup: false, hasActivity: false };
      }

      const [profileRes, groupRes, postRes, commentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("avatar_url, bio")
          .eq("id", currentUser.id)
          .single(),
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUser.id),
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("author_id", currentUser.id),
        supabase
          .from("board_comments")
          .select("id", { count: "exact", head: true })
          .eq("author_id", currentUser.id),
      ]);

      const profile = profileRes.data;
      const profileComplete = !!(
        profile?.avatar_url || (profile?.bio && profile.bio.trim() !== "")
      );
      const hasGroup = (groupRes.count ?? 0) > 0;
      const hasActivity =
        (postRes.count ?? 0) > 0 || (commentRes.count ?? 0) > 0;

      return { profileComplete, hasGroup, hasActivity };
    }
  );

  return {
    status: data ?? { profileComplete: false, hasGroup: false, hasActivity: false },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
