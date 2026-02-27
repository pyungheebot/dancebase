"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { WinbackCandidate, WinbackCampaignData } from "@/types";

// 비활성 기준: 30일
const INACTIVE_DAYS_THRESHOLD = 30;

export function useWinbackCampaign(groupId: string) {
  const [sending, setSending] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.winbackCandidates(groupId) : null,
    async (): Promise<WinbackCampaignData> => {
      const supabase = createClient();

      // 1. 그룹 멤버 목록 조회
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      type MemberRow = {
        user_id: string;
        profiles: { id: string; name: string; avatar_url: string | null } | null;
      };

      const memberRows = (members ?? []) as MemberRow[];
      if (memberRows.length === 0) {
        return { candidates: [], totalCount: 0 };
      }

      const memberIds = memberRows.map((m) => m.user_id);

      // 기준일: 30일 전
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - INACTIVE_DAYS_THRESHOLD);
      const thresholdIso = thresholdDate.toISOString();
      const now = new Date();

      // 2. 각 멤버의 최근 출석일 조회 (일정 기반 attendance)
      const { data: attendanceRows, error: attError } = await supabase
        .from("attendance")
        .select("user_id, schedules(starts_at)")
        .in("user_id", memberIds)
        .eq("status", "present")
        .gte("schedules.starts_at", thresholdIso);

      if (attError) throw attError;

      // 3. 각 멤버의 최근 게시글 작성일 조회
      const { data: postRows, error: postError } = await supabase
        .from("board_posts")
        .select("author_id, created_at")
        .in("author_id", memberIds)
        .gte("created_at", thresholdIso);

      if (postError) throw postError;

      // 4. 각 멤버의 최근 댓글 작성일 조회
      const { data: commentRows, error: commentError } = await supabase
        .from("board_comments")
        .select("author_id, created_at")
        .in("author_id", memberIds)
        .gte("created_at", thresholdIso);

      if (commentError) throw commentError;

      // 멤버별 최근 활동일 맵 구성 (30일 이내 활동)
      // key: userId, value: 가장 최근 활동일 ISO string
      const recentActivityMap = new Map<string, string>();

      // 출석 기록 반영
      type AttRow = {
        user_id: string;
        schedules: { starts_at: string } | null;
      };
      type PostRow = { author_id: string; created_at: string };
      type CommentRow = { author_id: string; created_at: string };

      (attendanceRows ?? []).forEach((row: AttRow) => {
        if (!row.schedules?.starts_at) return;
        const existing = recentActivityMap.get(row.user_id);
        if (!existing || row.schedules.starts_at > existing) {
          recentActivityMap.set(row.user_id, row.schedules.starts_at);
        }
      });

      // 게시글 작성 반영
      (postRows ?? []).forEach((row: PostRow) => {
        const existing = recentActivityMap.get(row.author_id);
        if (!existing || row.created_at > existing) {
          recentActivityMap.set(row.author_id, row.created_at);
        }
      });

      // 댓글 작성 반영
      (commentRows ?? []).forEach((row: CommentRow) => {
        const existing = recentActivityMap.get(row.author_id);
        if (!existing || row.created_at > existing) {
          recentActivityMap.set(row.author_id, row.created_at);
        }
      });

      // 30일 이내 활동이 없는 멤버 = 윈백 대상 후보
      // 마지막 활동일을 파악하기 위해 전체 이력도 추가 조회
      // (thresholdIso 이전 활동 중 가장 최근 것)
      const inactiveIds = memberIds.filter((id) => !recentActivityMap.has(id));

      if (inactiveIds.length === 0) {
        return { candidates: [], totalCount: 0 };
      }

      // 5. 비활성 멤버들의 전체 기간 최근 활동일 조회 (출석)
      const { data: allAttRows, error: allAttError } = await supabase
        .from("attendance")
        .select("user_id, schedules(starts_at)")
        .in("user_id", inactiveIds)
        .eq("status", "present")
        .order("schedules(starts_at)", { ascending: false });

      if (allAttError) throw allAttError;

      // 6. 비활성 멤버들의 전체 기간 최근 게시글 조회
      const { data: allPostRows, error: allPostError } = await supabase
        .from("board_posts")
        .select("author_id, created_at")
        .in("author_id", inactiveIds)
        .order("created_at", { ascending: false });

      if (allPostError) throw allPostError;

      // 7. 비활성 멤버들의 전체 기간 최근 댓글 조회
      const { data: allCommentRows, error: allCommentError } = await supabase
        .from("board_comments")
        .select("author_id, created_at")
        .in("author_id", inactiveIds)
        .order("created_at", { ascending: false });

      if (allCommentError) throw allCommentError;

      // 비활성 멤버별 마지막 활동일 맵
      const lastActivityMap = new Map<string, string>();

      (allAttRows ?? []).forEach((row: AttRow) => {
        if (!row.schedules?.starts_at) return;
        const existing = lastActivityMap.get(row.user_id);
        if (!existing || row.schedules.starts_at > existing) {
          lastActivityMap.set(row.user_id, row.schedules.starts_at);
        }
      });

      (allPostRows ?? []).forEach((row: PostRow) => {
        const existing = lastActivityMap.get(row.author_id);
        if (!existing || row.created_at > existing) {
          lastActivityMap.set(row.author_id, row.created_at);
        }
      });

      (allCommentRows ?? []).forEach((row: CommentRow) => {
        const existing = lastActivityMap.get(row.author_id);
        if (!existing || row.created_at > existing) {
          lastActivityMap.set(row.author_id, row.created_at);
        }
      });

      // 비활성 멤버 목록 구성
      const candidates: WinbackCandidate[] = inactiveIds
        .map((userId) => {
          const memberRow = memberRows.find((m) => m.user_id === userId);
          const lastActivityAt = lastActivityMap.get(userId) ?? null;

          let inactiveDays: number;
          if (lastActivityAt) {
            const lastDate = new Date(lastActivityAt);
            inactiveDays = Math.floor(
              (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
          } else {
            // 활동 기록이 전혀 없으면 가입일 기준으로 계산하거나 최대값 사용
            inactiveDays = INACTIVE_DAYS_THRESHOLD;
          }

          return {
            userId,
            name: memberRow?.profiles?.name ?? "알 수 없음",
            avatarUrl: memberRow?.profiles?.avatar_url ?? null,
            lastActivityAt,
            inactiveDays,
          };
        })
        // 비활성 일수 내림차순 정렬
        .sort((a, b) => b.inactiveDays - a.inactiveDays);

      return {
        candidates,
        totalCount: candidates.length,
      };
    }
  );

  // 선택된 멤버에게 재참여 메시지 발송
  async function sendWinbackMessages(
    memberIds: string[],
    message: string
  ): Promise<{ success: boolean; count: number }> {
    if (memberIds.length === 0) {
      return { success: true, count: 0 };
    }

    setSending(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다");
        return { success: false, count: 0 };
      }

      // messages 테이블에 일괄 insert
      const { error } = await supabase.from("messages").insert(
        memberIds.map((receiverId) => ({
          sender_id: user.id,
          receiver_id: receiverId,
          content: message,
          read_at: null,
        }))
      );

      if (error) throw error;

      return { success: true, count: memberIds.length };
    } catch {
      toast.error("메시지 발송에 실패했습니다");
      return { success: false, count: 0 };
    } finally {
      setSending(false);
    }
  }

  const campaignData = data ?? { candidates: [], totalCount: 0 };

  return {
    candidates: campaignData.candidates,
    totalCount: campaignData.totalCount,
    loading: isLoading,
    sending,
    sendWinbackMessages,
    refetch: () => mutate(),
  };
}
