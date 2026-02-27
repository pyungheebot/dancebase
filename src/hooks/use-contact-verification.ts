"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ContactVerification } from "@/types";

export type ContactVerificationWithProfile = ContactVerification & {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export type ContactVerificationStatus = {
  /** 최신 요청의 확인 현황 목록 */
  verifications: ContactVerificationWithProfile[];
  /** 확인 완료 멤버 수 */
  verifiedCount: number;
  /** 전체 멤버 수 */
  totalCount: number;
  /** 마지막 요청 시각 */
  lastRequestedAt: string | null;
  /** 현재 사용자의 미확인 레코드 (미확인 상태인 경우 존재) */
  myPendingVerification: ContactVerification | null;
  loading: boolean;
  refetch: () => void;
};

/**
 * 그룹의 연락처 재확인 현황을 조회하는 훅.
 * 최신 requested_at 기준으로 전체 멤버의 확인 여부를 반환합니다.
 *
 * @param groupId - 그룹 ID
 * @param currentUserId - 현재 로그인한 사용자 ID
 */
export function useContactVerification(
  groupId: string,
  currentUserId?: string
): ContactVerificationStatus {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.contactVerification(groupId) : null,
    async () => {
      const supabase = createClient();

      // 최신 requested_at 조회
      const { data: latest, error: latestError } = await supabase
        .from("contact_verifications")
        .select("requested_at")
        .eq("group_id", groupId)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) throw latestError;
      if (!latest) return null;

      const latestRequestedAt = latest.requested_at;

      // 최신 요청 시각의 모든 레코드 조회 (프로필 포함)
      const { data: rows, error } = await supabase
        .from("contact_verifications")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", groupId)
        .eq("requested_at", latestRequestedAt);

      if (error) throw error;

      return {
        verifications: (rows ?? []) as ContactVerificationWithProfile[],
        lastRequestedAt: latestRequestedAt,
      };
    }
  );

  const verifications = data?.verifications ?? [];
  const verifiedCount = verifications.filter((v) => v.verified_at !== null).length;
  const totalCount = verifications.length;
  const lastRequestedAt = data?.lastRequestedAt ?? null;

  const myPendingVerification = currentUserId
    ? (verifications.find(
        (v) => v.user_id === currentUserId && v.verified_at === null
      ) ?? null)
    : null;

  return {
    verifications,
    verifiedCount,
    totalCount,
    lastRequestedAt,
    myPendingVerification,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
