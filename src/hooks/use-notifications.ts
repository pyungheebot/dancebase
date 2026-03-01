"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { realtimeConfig } from "@/lib/swr/cache-config";
import { invalidateNotifications } from "@/lib/swr/invalidate";
import { optimisticMutateMany, type OptimisticTarget } from "@/lib/swr/optimistic";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
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
    {
      // realtimeConfig: Realtime 구독 + 탭 복귀 즉시 갱신, dedupingInterval 2초
      // refreshInterval: Realtime이 주 채널이지만 보조 폴링으로 놓친 이벤트 보완
      ...realtimeConfig,
      refreshInterval: 120000,
    }
  );

  // 인스턴스별 고유 채널명 — 여러 컴포넌트에서 동시 마운트 시
  // 같은 채널명으로 중복 구독하면 예측 불가능한 동작이 발생하므로 suffix로 구별
  const channelNameRef = useRef(
    `notifications-realtime-${Math.random().toString(36).slice(2)}`
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
        .channel(channelNameRef.current)
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
    const supabase = createClient();

    // notifications 목록 + 읽지 않은 카운트를 동시에 낙관적 업데이트
    // 각 타겟이 서로 다른 타입(Notification[], number)이므로 unknown으로 캐스팅
    await optimisticMutateMany(
      [
        {
          key: swrKeys.notifications(),
          updater: (prev: unknown) =>
            ((prev as Notification[] | undefined) ?? []).map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            ),
        },
        {
          key: swrKeys.unreadNotificationCount(),
          updater: (prev: unknown) => Math.max(0, ((prev as number | undefined) ?? 0) - 1),
        },
      ] as OptimisticTarget<unknown>[],
      async () => {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notificationId);

        if (error) throw error;
      },
      {
        revalidate: false, // 서버 반영 확인 없이 낙관적 상태 유지
        onError: () => {
          toast.error(TOAST.NOTIFICATION.READ_ERROR);
        },
      }
    );
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 현재 읽지 않은 알림 수 (롤백 시 복원용으로 optimisticMutateMany가 자동 처리)
    await optimisticMutateMany(
      [
        {
          key: swrKeys.notifications(),
          updater: (prev: unknown) =>
            ((prev as Notification[] | undefined) ?? []).map((n) => ({ ...n, is_read: true })),
        },
        {
          key: swrKeys.unreadNotificationCount(),
          updater: () => 0,
        },
      ] as OptimisticTarget<unknown>[],
      async () => {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (error) throw error;
      },
      {
        revalidate: false,
        onError: () => {
          toast.error(TOAST.NOTIFICATION.READ_ERROR);
        },
      }
    );
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
    {
      // realtimeConfig: 탭 복귀 즉시 갱신, dedupingInterval 2초
      // refreshInterval: invalidateNotifications()로 Realtime 갱신되지만
      //   Realtime 구독 없는 이 훅은 폴링으로 보완 (30초)
      ...realtimeConfig,
      refreshInterval: 30000,
    }
  );

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
