"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateNotifications } from "@/lib/swr/invalidate";
import { toast } from "sonner";
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
    // 폴링 주기 60초 → 120초 (Realtime이 주 업데이트 채널)
    { refreshInterval: 120000 }
  );

  // Realtime 구독 채널 참조 (cleanup용)
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    // async/await로 유저 확인 후 구독 (then 콜백 타입 추론 우회)
    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      // 로그인 안 된 경우 구독하지 않음
      if (!user || !active) return;

      // 이미 구독 중이면 중복 구독 방지
      if (channelRef.current) return;

      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // 새 알림 수신 시 SWR 캐시 즉시 갱신
            invalidateNotifications();
          }
        )
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      // 컴포넌트 언마운트 시 구독 해제 (메모리 누수 방지)
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    // Optimistic: 즉시 UI 업데이트
    await mutate(
      (prev) => prev?.map((n) => n.id === notificationId ? { ...n, is_read: true } : n),
      false
    );
    // 서버 반영
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      // 롤백
      mutate();
      toast.error("읽음 처리에 실패했습니다.");
    }
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic: 즉시 UI 업데이트
    await mutate(
      (prev) => prev?.map((n) => ({ ...n, is_read: true })),
      false
    );
    // 서버 반영
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      // 롤백
      mutate();
      toast.error("읽음 처리에 실패했습니다.");
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
    // 폴링 주기 유지 (unread count는 Realtime invalidateNotifications()에서도 갱신됨)
    { refreshInterval: 30000 }
  );

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
