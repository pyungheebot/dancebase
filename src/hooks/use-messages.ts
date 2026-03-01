"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { realtimeConfig } from "@/lib/swr/cache-config";
import { useAuth } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import type { Conversation, Message } from "@/types";
import logger from "@/lib/logger";

export function useConversations() {
  const { user } = useAuth();
  // realtimeConfig: Realtime 구독 + 탭 복귀 시 즉시 갱신, dedupingInterval 2초
  const { data, isLoading, mutate } = useSWR(
    swrKeys.conversations(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_conversations");
      return (data as Conversation[]) ?? [];
    },
    realtimeConfig,
  );

  // mutate를 ref로 유지 — subscriptions useMemo 의존성에서 제외하여 재구독 방지
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  // subscriptions 배열을 useMemo로 안정화 (user.id가 바뀔 때만 재생성)
  const subscriptions = useMemo(
    () =>
      user
        ? [
            {
              event: "INSERT" as const,
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
              callback: () => mutateRef.current(),
            },
            {
              event: "INSERT" as const,
              table: "messages",
              filter: `sender_id=eq.${user.id}`,
              callback: () => mutateRef.current(),
            },
          ]
        : [],
    [user]
  );

  // useRealtime: 자동 구독/해제, cleanup 자동 처리
  useRealtime("conversation-list-realtime", subscriptions, {
    enabled: !!user,
  });

  return {
    conversations: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

const PAGE_SIZE = 50;

export function useConversation(partnerId: string) {
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // 가장 오래된 커서: 이전 메시지 로드 시 이 타임스탬프보다 이전 것을 조회
  const oldestCursorRef = useRef<string | null>(null);

  // realtimeConfig: Realtime 구독 + 탭 복귀 시 즉시 갱신, dedupingInterval 2초
  const { data, isLoading, mutate } = useSWR(
    swrKeys.conversation(partnerId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { messages: [] as Message[], partnerName: "", partnerAvatarUrl: null as string | null };

      const [profileRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("name, avatar_url").eq("id", partnerId).single(),
        // 최신 PAGE_SIZE개만 내림차순으로 조회 후 역순 정렬
        supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
      ]);

      // 읽음 처리
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .is("read_at", null)
        .then(({ error }: { error: unknown }) => {
          if (error) logger.error("Failed to mark messages as read", "useMessages", error);
        });

      const fetched = ((messagesRes.data as Message[]) ?? []).reverse();

      // hasMore: PAGE_SIZE개가 가득 찼으면 더 있을 수 있음
      const nextHasMore = fetched.length === PAGE_SIZE;

      return {
        messages: fetched,
        partnerName: profileRes.data?.name ?? "",
        partnerAvatarUrl: (profileRes.data?.avatar_url as string | null) ?? null,
        hasMore: nextHasMore,
      };
    },
    {
      ...realtimeConfig,
      onSuccess: (result) => {
        if (!result) return;
        // SWR 성공 시 olderMessages 초기화 및 커서 설정
        setOlderMessages([]);
        setHasMore(result.hasMore ?? false);
        if (result.messages.length > 0) {
          oldestCursorRef.current = result.messages[0].created_at;
        } else {
          oldestCursorRef.current = null;
        }
      },
    }
  );

  // 이전 메시지 불러오기 (커서 기반)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestCursorRef.current) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: olderData, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .lt("created_at", oldestCursorRef.current)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) {
        logger.error("Failed to load older messages", "useMessages", error);
        return;
      }

      const fetched = ((olderData as Message[]) ?? []).reverse();

      if (fetched.length > 0) {
        oldestCursorRef.current = fetched[0].created_at;
        setOlderMessages((prev) => [...fetched, ...prev]);
      }

      setHasMore(fetched.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, partnerId]);

  // 낙관적 메시지 추가
  const addOptimisticMessage = (msg: Message) => {
    mutate(
      (prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, msg] };
      },
      { revalidate: false }
    );
  };

  // 낙관적 메시지를 서버 데이터로 교체
  const replaceOptimistic = () => mutate();

  // olderMessages + SWR messages 합산 (중복 제거)
  const allMessages = useMemo(() => {
    const swrMessages = data?.messages ?? [];
    if (olderMessages.length === 0) return swrMessages;
    // SWR로 새로 갱신될 경우 older에 중복이 생길 수 있으므로 id 기준 dedup
    const swrIds = new Set(swrMessages.map((m) => m.id));
    const uniqueOlder = olderMessages.filter((m) => !swrIds.has(m.id));
    return [...uniqueOlder, ...swrMessages];
  }, [olderMessages, data?.messages]);

  return {
    messages: allMessages,
    partnerName: data?.partnerName ?? "",
    partnerAvatarUrl: data?.partnerAvatarUrl ?? null,
    loading: isLoading,
    hasMore,
    loadingMore,
    loadMore,
    refetch: () => mutate(),
    addOptimisticMessage,
    replaceOptimistic,
  };
}

export function useUnreadCount() {
  const { user } = useAuth();
  // realtimeConfig: Realtime 구독 + 탭 복귀 시 즉시 갱신, dedupingInterval 2초
  const { data, mutate } = useSWR(
    swrKeys.unreadCount(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_unread_message_count");
      return typeof data === "number" ? data : 0;
    },
    realtimeConfig,
  );

  // mutate를 ref로 유지 — subscriptions useMemo 의존성에서 제외하여 재구독 방지
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  // subscriptions 배열을 useMemo로 안정화 (user.id가 바뀔 때만 재생성)
  const subscriptions = useMemo(
    () =>
      user
        ? [
            {
              event: "INSERT" as const,
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
              callback: () => mutateRef.current(),
            },
            {
              event: "UPDATE" as const,
              table: "messages",
              filter: `receiver_id=eq.${user.id}`,
              callback: () => mutateRef.current(),
            },
          ]
        : [],
    [user]
  );

  // header/sidebar 등 여러 곳에서 동시 마운트 시 채널명이 같으면
  // Supabase가 동일 채널로 처리하므로 중복 구독 없이 안전하게 동작함
  // (useRealtime 내부에서 channelKey 기준으로 단일 채널 관리)
  useRealtime(`unread-count-${user?.id ?? "anonymous"}`, subscriptions, {
    enabled: !!user,
  });

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
