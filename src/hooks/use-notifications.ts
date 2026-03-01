"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { realtimeConfig } from "@/lib/swr/cache-config";
import { invalidateNotifications } from "@/lib/swr/invalidate";
import { optimisticMutateMany, type OptimisticTarget } from "@/lib/swr/optimistic";
import { useRealtime } from "@/hooks/use-realtime";
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

  // 유저 ID는 SWR 데이터 자체에 포함되지 않으므로 별도로 가져옴
  // 구독 필터에 userId가 필요하기 때문에 notifications SWR 키를 통해 간접 파악하거나
  // 아래처럼 useSWR로 userId를 별도 관리한다.
  // 단순화: swrKeys.notifications()가 userId 없이 전역 키이므로
  // userId를 얻기 위한 별도 SWR (revalidateOnFocus: false, 캐시만 참조)
  const { data: userId } = useSWR<string | null>(
    "auth-user-id-for-notifications",
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // subscriptions 배열을 useMemo로 안정화 (userId가 바뀔 때만 재생성)
  const subscriptions = useMemo(
    () =>
      userId
        ? [
            {
              event: "INSERT" as const,
              table: "notifications",
              filter: `user_id=eq.${userId}`,
              // 새 알림 수신 시 SWR 캐시 즉시 갱신
              callback: () => {
                invalidateNotifications();
              },
            },
          ]
        : [],
    [userId]
  );

  // useRealtime: 자동 구독/해제, cleanup 자동 처리
  useRealtime(`notifications-${userId ?? "anonymous"}`, subscriptions, {
    enabled: !!userId,
  });

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
