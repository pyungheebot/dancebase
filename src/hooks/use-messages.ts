"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Conversation, Message } from "@/types";

export function useConversations() {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.conversations(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_conversations");
      return (data as Conversation[]) ?? [];
    },
  );

  return {
    conversations: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useConversation(partnerId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.conversation(partnerId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { messages: [] as Message[], partnerName: "" };

      const [profileRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", partnerId).single(),
        supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true }),
      ]);

      // 읽음 처리 (fire-and-forget)
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .is("read_at", null)
        .then();

      return {
        messages: (messagesRes.data as Message[]) ?? [],
        partnerName: profileRes.data?.name ?? "",
      };
    },
  );

  return {
    messages: data?.messages ?? [],
    partnerName: data?.partnerName ?? "",
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useUnreadCount() {
  const { data, mutate } = useSWR(
    swrKeys.unreadCount(),
    async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_unread_message_count");
      return typeof data === "number" ? data : 0;
    },
    {
      refreshInterval: 30000,
    },
  );

  return {
    count: data ?? 0,
    refetch: () => mutate(),
  };
}
