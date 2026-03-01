"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateMemberBatchInvite } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { InviteCandidate } from "@/types";

export function useMemberBatchInvite(groupId: string) {
  const [inviting, setInviting] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberBatchInvite(groupId) : null,
    async (): Promise<InviteCandidate[]> => {
      const supabase = createClient();

      // 1. 이미 그룹에 속한 멤버 userId 목록 조회
      const { data: memberRows, error: memberError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (memberError) throw memberError;

      const memberUserIds = new Set(
        (memberRows ?? []).map((m: { user_id: string }) => m.user_id)
      );

      // 2. profiles 테이블 전체 사용자 조회 (id, name, avatar_url)
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .order("name", { ascending: true });

      if (profileError) throw profileError;

      type ProfileRow = {
        id: string;
        name: string;
        avatar_url: string | null;
      };

      return (profileRows ?? []).map((p: ProfileRow): InviteCandidate => ({
        userId: p.id,
        name: p.name,
        avatarUrl: p.avatar_url,
        isAlreadyMember: memberUserIds.has(p.id),
      }));
    }
  );

  // 검색어 기반 필터링 함수 (컴포넌트에서 useMemo와 함께 사용)
  function filterCandidates(query: string): InviteCandidate[] {
    const all = data ?? [];
    if (!query.trim()) return all;
    const lower = query.trim().toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(lower));
  }

  // 일괄 초대 함수
  async function inviteMembers(userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) {
      toast.error(TOAST.MEMBER.INVITE_REQUIRED);
      return false;
    }

    setInviting(true);
    try {
      const supabase = createClient();

      const rows = userIds.map((userId) => ({
        group_id: groupId,
        user_id: userId,
        role: "member" as const,
      }));

      const { error } = await supabase
        .from("group_members")
        .insert(rows);

      if (error) throw error;

      // SWR 캐시 무효화 (후보 목록 갱신)
      invalidateMemberBatchInvite(groupId);

      toast.success(`${userIds.length}명을 그룹에 초대했습니다`);
      return true;
    } catch {
      toast.error(TOAST.MEMBER.INVITE_ERROR);
      return false;
    } finally {
      setInviting(false);
    }
  }

  return {
    candidates: data ?? [],
    loading: isLoading,
    inviting,
    filterCandidates,
    inviteMembers,
    refetch: () => mutate(),
  };
}
