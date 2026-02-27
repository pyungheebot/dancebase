"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateReceiptShareTokens } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import type { ReceiptShareToken } from "@/types";

/** 32자리 랜덤 hex 토큰 생성 */
function generateToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function useReceiptShare(transactionId: string) {
  const { data, isLoading, mutate } = useSWR<ReceiptShareToken | null>(
    swrKeys.receiptShareTokens(transactionId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("receipt_share_tokens")
        .select("*")
        .eq("transaction_id", transactionId)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data as ReceiptShareToken | null;
    }
  );

  /** 공유 토큰 생성 (7일 유효) */
  async function createToken(): Promise<ReceiptShareToken | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("로그인이 필요합니다");
      return null;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("receipt_share_tokens")
      .insert({
        transaction_id: transactionId,
        token,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("공유 링크 생성에 실패했습니다");
      return null;
    }

    toast.success("공유 링크가 생성되었습니다");
    invalidateReceiptShareTokens(transactionId);
    return data as ReceiptShareToken;
  }

  /** 공유 토큰 삭제 */
  async function deleteToken(tokenId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from("receipt_share_tokens")
      .delete()
      .eq("id", tokenId);

    if (error) {
      toast.error("공유 링크 삭제에 실패했습니다");
      return false;
    }

    toast.success("공유 링크가 삭제되었습니다");
    invalidateReceiptShareTokens(transactionId);
    return true;
  }

  /** 공유 링크를 클립보드에 복사 */
  async function copyLink(token: string): Promise<void> {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/receipt/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("클립보드에 복사되었습니다");
    } catch {
      toast.error("복사에 실패했습니다");
    }
  }

  /** 만료 여부 확인 */
  function isExpired(token: ReceiptShareToken): boolean {
    return new Date(token.expires_at) < new Date();
  }

  return {
    token: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    createToken,
    deleteToken,
    copyLink,
    isExpired,
  };
}
