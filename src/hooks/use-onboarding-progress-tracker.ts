"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  OnboardingItemStatus,
  MemberOnboardingProgress,
  OnboardingProgressResult,
} from "@/types";

// 온보딩 항목 정의
const ONBOARDING_ITEM_LABELS: Record<string, string> = {
  avatar: "프로필 사진 설정",
  bio: "자기소개 작성",
  attendance: "첫 출석",
  post_or_comment: "첫 게시글 또는 댓글",
  rsvp: "첫 RSVP 응답",
};

/**
 * 그룹 신규 멤버(최근 30일 내 가입)들의 온보딩 완료도를 추적하는 훅.
 *
 * 온보딩 항목:
 * 1. 프로필 사진 설정 (profiles.avatar_url not null)
 * 2. 자기소개 작성 (profiles.bio not null and not empty)
 * 3. 첫 출석 (attendance 테이블에 기록 존재)
 * 4. 첫 게시글 또는 댓글 (board_posts or board_comments에 기록)
 * 5. 첫 RSVP 응답 (schedule_rsvp에 기록)
 *
 * @param groupId - 그룹 ID
 */
export function useOnboardingProgressTracker(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.onboardingProgressTracker(groupId) : null,
    async (): Promise<OnboardingProgressResult> => {
      const supabase = createClient();

      // 최근 30일 기준일
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString();

      // 1. 최근 30일 내 가입한 신규 멤버 조회
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("id, user_id, joined_at")
        .eq("group_id", groupId)
        .gte("joined_at", cutoff)
        .order("joined_at", { ascending: false });

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");

      const members = memberRows ?? [];
      if (members.length === 0) {
        return {
          members: [],
          averageCompletionRate: 0,
          totalCount: 0,
          allDoneCount: 0,
        };
      }

      const userIds = members.map((m: { id: string; user_id: string; joined_at: string }) => m.user_id);

      // 2. 프로필 정보 조회 (avatar_url, bio, name)
      const { data: profileRows, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, bio")
        .in("id", userIds);

      if (profileErr) throw new Error("프로필 데이터를 불러오지 못했습니다");

      type ProfileRow = { id: string; name: string; avatar_url: string | null; bio: string | null };

      const profileMap = new Map<string, ProfileRow>(
        ((profileRows ?? []) as ProfileRow[]).map((p) => [p.id, p])
      );

      // 3. 그룹 내 일정 ID 조회 (출석/RSVP 체크용)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      // 4. 출석 기록이 있는 userId 집합
      const attendedUserIds = new Set<string>();
      if (scheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

        (attRows ?? []).forEach((a: { user_id: string }) => attendedUserIds.add(a.user_id));
      }

      // 5. 게시글 작성 기록이 있는 userId 집합
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("author_id")
        .eq("group_id", groupId)
        .in("author_id", userIds);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postedUserIds = new Set(
        (postRows ?? []).map((p: { author_id: string }) => p.author_id)
      );

      // 6. 댓글 작성 기록이 있는 userId 집합 (그룹 게시글 기준)
      const commentedUserIds = new Set<string>();
      const { data: groupPostIds, error: groupPostIdsErr } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId);

      if (groupPostIdsErr) throw new Error("게시글 ID 조회에 실패했습니다");

      const allGroupPostIds = (groupPostIds ?? []).map((p: { id: string }) => p.id);

      if (allGroupPostIds.length > 0) {
        const { data: commentRows, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", allGroupPostIds)
          .in("author_id", userIds);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");

        (commentRows ?? []).forEach((c: { author_id: string }) => commentedUserIds.add(c.author_id));
      }

      // 7. RSVP 응답 기록이 있는 userId 집합
      const rsvpedUserIds = new Set<string>();
      if (scheduleIds.length > 0) {
        const { data: rsvpRows, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds);

        if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");

        (rsvpRows ?? []).forEach((r: { user_id: string }) => rsvpedUserIds.add(r.user_id));
      }

      // 8. 멤버별 온보딩 진행 상황 계산
      const memberProgressList: MemberOnboardingProgress[] = members.map(
        (m: { id: string; user_id: string; joined_at: string }) => {
          const profile = profileMap.get(m.user_id);
          const name = profile?.name ?? "알 수 없음";

          const items: OnboardingItemStatus[] = [
            {
              id: "avatar",
              label: ONBOARDING_ITEM_LABELS["avatar"],
              isDone: !!profile?.avatar_url,
            },
            {
              id: "bio",
              label: ONBOARDING_ITEM_LABELS["bio"],
              isDone: !!profile?.bio && profile.bio.trim().length > 0,
            },
            {
              id: "attendance",
              label: ONBOARDING_ITEM_LABELS["attendance"],
              isDone: attendedUserIds.has(m.user_id),
            },
            {
              id: "post_or_comment",
              label: ONBOARDING_ITEM_LABELS["post_or_comment"],
              isDone: postedUserIds.has(m.user_id) || commentedUserIds.has(m.user_id),
            },
            {
              id: "rsvp",
              label: ONBOARDING_ITEM_LABELS["rsvp"],
              isDone: rsvpedUserIds.has(m.user_id),
            },
          ];

          const doneCount = items.filter((item) => item.isDone).length;
          const completionRate = Math.round((doneCount / items.length) * 100);
          const isAllDone = doneCount === items.length;

          return {
            userId: m.user_id,
            memberId: m.id,
            name,
            joinedAt: m.joined_at,
            items,
            completionRate,
            isAllDone,
          };
        }
      );

      // 전체 평균 완료율 계산
      const averageCompletionRate =
        memberProgressList.length > 0
          ? Math.round(
              memberProgressList.reduce((sum, m) => sum + m.completionRate, 0) /
                memberProgressList.length
            )
          : 0;

      const allDoneCount = memberProgressList.filter((m) => m.isAllDone).length;

      return {
        members: memberProgressList,
        averageCompletionRate,
        totalCount: memberProgressList.length,
        allDoneCount,
      };
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
