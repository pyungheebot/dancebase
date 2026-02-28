"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateSettlementRequests } from "@/lib/swr/invalidate";
import type {
  SettlementRequest,
  SettlementRequestMember,
  GroupPaymentMethod,
} from "@/types";

export type SettlementRequestWithDetails = SettlementRequest & {
  group_payment_methods: GroupPaymentMethod | null;
  settlement_request_members: (SettlementRequestMember & {
    profiles: { id: string; name: string; avatar_url: string | null };
  })[];
};

export function useSettlementRequests(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.settlementRequests(groupId),
    async (): Promise<SettlementRequestWithDetails[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("settlement_requests")
        .select(
          `*,
          group_payment_methods(*),
          settlement_request_members(
            *,
            profiles(id, name, avatar_url)
          )`
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SettlementRequestWithDetails[];
    }
  );

  async function createRequest(params: {
    title: string;
    memo?: string;
    amount: number;
    due_date?: string;
    payment_method_id?: string;
    member_ids: string[];
  }) {
    const supabase = createClient();
    const { error } = await supabase.rpc("create_settlement_request_with_notifications", {
      p_group_id: groupId,
      p_title: params.title,
      p_memo: params.memo ?? null,
      p_amount: params.amount,
      p_due_date: params.due_date ?? null,
      p_payment_method_id: params.payment_method_id ?? null,
      p_member_ids: params.member_ids,
    });

    if (!error) invalidateSettlementRequests(groupId);
    return { error };
  }

  async function closeRequest(requestId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("settlement_requests")
      .update({ status: "closed" })
      .eq("id", requestId)
      .eq("group_id", groupId);

    if (!error) invalidateSettlementRequests(groupId);
    return { error };
  }

  async function markAsPaid(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("settlement_request_members")
      .update({ status: "paid_pending", paid_at: new Date().toISOString() })
      .eq("id", memberId);

    if (!error) invalidateSettlementRequests(groupId);
    return { error };
  }

  async function confirmPayment(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("settlement_request_members")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", memberId);

    if (!error) invalidateSettlementRequests(groupId);
    return { error };
  }

  async function sendReminder(requestId: string) {
    const supabase = createClient();
    const { error } = await supabase.rpc("remind_settlement_request", {
      p_request_id: requestId,
    });

    return { error };
  }

  return {
    settlementRequests: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    createRequest,
    closeRequest,
    markAsPaid,
    confirmPayment,
    sendReminder,
  };
}
