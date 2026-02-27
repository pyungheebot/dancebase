"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateNotifications } from "@/lib/swr/invalidate";
import type { Notification } from "@/types";

export function useNotifications(limit = 10) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.notifications(),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as Notification[];

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      return (data as Notification[]) ?? [];
    },
    { refreshInterval: 60000 }
  );

  const markAsRead = async (notificationId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (!error) {
      invalidateNotifications();
    }
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) {
      invalidateNotifications();
    }
  };

  return {
    notifications: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    markAsRead,
    markAllAsRead,
  };
}

export function useUnreadNotificationCount() {
  const { data, mutate } = useSWR(
    swrKeys.unreadNotificationCount(),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      return count ?? 0;
    },
    { refreshInterval: 30000 }
  );

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
