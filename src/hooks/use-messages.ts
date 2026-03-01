"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message } from "@/types";

export function useConversations() {
  const { user } = useAuth();
  // revalidateOnFocus: 글로벌 true 상속 → 탭 복귀 시 자동 갱신
  // Realtime subscription이 주 업데이트 채널이므로 refreshInterval 미사용
  const { data, isLoading, mutate } = useSWR(
    swrKeys.conversations(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_conversations");
      return (data as Conversation[]) ?? [];
    },
  );

  // Realtime: 메시지 INSERT/UPDATE 시 목록 자동 갱신
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const channel = supabase
      .channel("conversation-list-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => mutate()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        () => mutate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, mutate]);

  return {
    conversations: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useConversation(partnerId: string) {
  // revalidateOnFocus: 글로벌 true 상속 → 탭 복귀 시 최신 메시지 자동 갱신
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
        supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true }),
      ]);

      // 읽음 처리
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .is("read_at", null)
        .then(({ error }: { error: unknown }) => {
          if (error) console.error("Failed to mark messages as read:", error);
        });

      return {
        messages: (messagesRes.data as Message[]) ?? [],
        partnerName: profileRes.data?.name ?? "",
        partnerAvatarUrl: (profileRes.data?.avatar_url as string | null) ?? null,
      };
    },
  );

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

  return {
    messages: data?.messages ?? [],
    partnerName: data?.partnerName ?? "",
    partnerAvatarUrl: data?.partnerAvatarUrl ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    addOptimisticMessage,
    replaceOptimistic,
  };
}

export function useUnreadCount() {
  const { user } = useAuth();
  // revalidateOnFocus: 글로벌 true 상속 → 탭 복귀 시 미읽은 수 즉시 갱신
  // Realtime INSERT/UPDATE 구독으로 실시간 갱신도 병행
  const { data, mutate } = useSWR(
    swrKeys.unreadCount(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_unread_message_count");
      return typeof data === "number" ? data : 0;
    },
  );

  // Realtime: 새 메시지 도착/읽음 처리 시 즉시 갱신
  const mutateRef = useRef(mutate);
  // ref 업데이트를 useEffect로 이동하여 렌더 중 ref 쓰기 방지
  useEffect(() => {
    mutateRef.current = mutate;
  });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const channel = supabase
      .channel("unread-count-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => mutateRef.current()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => mutateRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
