"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidatePaymentMethods } from "@/lib/swr/invalidate";
import type { GroupPaymentMethod, PaymentMethodType } from "@/types";

export function usePaymentMethods(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.paymentMethods(groupId),
    async (): Promise<GroupPaymentMethod[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_payment_methods")
        .select("*")
        .eq("group_id", groupId)
        .eq("is_active", true)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as GroupPaymentMethod[];
    }
  );

  async function createPaymentMethod(values: {
    type: PaymentMethodType;
    label: string;
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    toss_id?: string;
    kakao_link?: string;
  }) {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { error: new Error("로그인이 필요합니다") };

    const { error } = await supabase.from("group_payment_methods").insert({
      group_id: groupId,
      type: values.type,
      label: values.label,
      bank_name: values.bank_name ?? null,
      account_number: values.account_number ?? null,
      account_holder: values.account_holder ?? null,
      toss_id: values.toss_id ?? null,
      kakao_link: values.kakao_link ?? null,
      is_active: true,
      sort_order: (data?.length ?? 0) + 1,
      created_by: user.user.id,
    });

    if (!error) invalidatePaymentMethods(groupId);
    return { error };
  }

  async function updatePaymentMethod(
    id: string,
    values: Partial<{
      label: string;
      bank_name: string;
      account_number: string;
      account_holder: string;
      toss_id: string;
      kakao_link: string;
    }>
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("group_payment_methods")
      .update(values)
      .eq("id", id)
      .eq("group_id", groupId);

    if (!error) invalidatePaymentMethods(groupId);
    return { error };
  }

  async function deletePaymentMethod(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("group_payment_methods")
      .update({ is_active: false })
      .eq("id", id)
      .eq("group_id", groupId);

    if (!error) invalidatePaymentMethods(groupId);
    return { error };
  }

  return {
    paymentMethods: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
}
