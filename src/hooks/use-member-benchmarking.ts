"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberBenchmarkingResult, BenchmarkMetric } from "@/types";

/**
 * 멤버 벤치마킹 훅
 *
 * groupId와 userId를 받아서:
 * 1. 출석률: 최근 30일 attendance 테이블 기준
 * 2. 활동량: 최근 30일 게시글 + 댓글 수 기준
 * 3. RSVP 응답률: 최근 30일 schedule_rsvp 테이블 기준
 *
 * 각 지표에 대해:
 * - 현재 사용자 값
 * - 그룹 전체 평균
 * - 그룹 평균 대비 차이
 * - 상위 백분위 (낮을수록 상위)
 */
export function useMemberBenchmarking(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.memberBenchmarking(groupId, userId) : null,
    async (): Promise<MemberBenchmarkingResult> => {
      const supabase = createClient();

      const now = new Date();
      const ms = (days: number) => days * 24 * 60 * 60 * 1000;
      const t30 = new Date(now.getTime() - ms(30)).toISOString();
      const nowIso = now.toISOString();

      // =========================================
      // 1. 멤버 목록
      // =========================================
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (!memberRows || memberRows.length === 0) {
        return {
          attendance: emptyMetric(),
          activity: emptyMetric(),
          rsvp: emptyMetric(),
          hasData: false,
          totalMemberCount: 0,
        };
      }

      const memberUserIds = memberRows.map((m: { user_id: string }) => m.user_id);
      const totalMemberCount = memberUserIds.length;

      // =========================================
      // 2. 최근 30일 일정 목록
      // =========================================
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", t30)
        .lte("starts_at", nowIso);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const allScheduleIds = (scheduleRows ?? []).map(
        (s: { id: string }) => s.id
      );

      // =========================================
      // 3. 출석 데이터
      // =========================================
      type AttRow = { user_id: string; schedule_id: string; status: string };
      let attRows: AttRow[] = [];
      if (allScheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, schedule_id, status")
          .in("schedule_id", allScheduleIds);

        if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");
        attRows = (attData ?? []) as AttRow[];
      }

      // 멤버별 출석 카운트 (present + late)
      const attCountByUser: Record<string, number> = {};
      for (const uid of memberUserIds) attCountByUser[uid] = 0;
      for (const att of attRows) {
        if (
          attCountByUser[att.user_id] !== undefined &&
          (att.status === "present" || att.status === "late")
        ) {
          attCountByUser[att.user_id]++;
        }
      }

      // 출석률 계산 (0~100%)
      const attRateByUser: Record<string, number> = {};
      for (const uid of memberUserIds) {
        if (allScheduleIds.length === 0) {
          attRateByUser[uid] = 0;
        } else {
          attRateByUser[uid] = Math.round(
            (attCountByUser[uid] / allScheduleIds.length) * 100
          );
        }
      }

      // =========================================
      // 4. RSVP 데이터
      // =========================================
      type RsvpRow = { user_id: string; schedule_id: string };
      let rsvpRows: RsvpRow[] = [];
      if (allScheduleIds.length > 0) {
        const { data: rsvpData, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("user_id, schedule_id")
          .in("schedule_id", allScheduleIds);

        if (rsvpErr) throw new Error("RSVP 데이터를 불러오지 못했습니다");
        rsvpRows = (rsvpData ?? []) as RsvpRow[];
      }

      // 멤버별 RSVP 응답 카운트
      const rsvpCountByUser: Record<string, number> = {};
      for (const uid of memberUserIds) rsvpCountByUser[uid] = 0;
      for (const rsvp of rsvpRows) {
        if (rsvpCountByUser[rsvp.user_id] !== undefined) {
          rsvpCountByUser[rsvp.user_id]++;
        }
      }

      // RSVP 응답률 계산 (0~100%)
      const rsvpRateByUser: Record<string, number> = {};
      for (const uid of memberUserIds) {
        if (allScheduleIds.length === 0) {
          rsvpRateByUser[uid] = 0;
        } else {
          rsvpRateByUser[uid] = Math.round(
            (rsvpCountByUser[uid] / allScheduleIds.length) * 100
          );
        }
      }

      // =========================================
      // 5. 게시판 활동 데이터
      // =========================================
      const { data: postData, error: postErr } = await supabase
        .from("board_posts")
        .select("id, author_id")
        .eq("group_id", groupId)
        .gte("created_at", t30);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postRows = (postData ?? []) as { id: string; author_id: string }[];
      const postIds = postRows.map((p) => p.id);

      type CommentRow = { author_id: string };
      let commentRows: CommentRow[] = [];
      if (postIds.length > 0) {
        const { data: commentData, error: commentErr } = await supabase
          .from("board_comments")
          .select("author_id")
          .in("post_id", postIds)
          .gte("created_at", t30);

        if (commentErr) throw new Error("댓글 데이터를 불러오지 못했습니다");
        commentRows = (commentData ?? []) as CommentRow[];
      }

      // 멤버별 게시판 활동 카운트
      const activityCountByUser: Record<string, number> = {};
      for (const uid of memberUserIds) activityCountByUser[uid] = 0;
      for (const post of postRows) {
        if (activityCountByUser[post.author_id] !== undefined) {
          activityCountByUser[post.author_id]++;
        }
      }
      for (const comment of commentRows) {
        if (activityCountByUser[comment.author_id] !== undefined) {
          activityCountByUser[comment.author_id]++;
        }
      }

      // 활동량 백분율 계산
      // 활동량은 최대값 기준으로 정규화 (0~100 스케일)
      const activityValues = Object.values(activityCountByUser);
      const maxActivity = Math.max(...activityValues, 1);
      const activityRateByUser: Record<string, number> = {};
      for (const uid of memberUserIds) {
        activityRateByUser[uid] = Math.round(
          (activityCountByUser[uid] / maxActivity) * 100
        );
      }

      // =========================================
      // 6. 백분위 및 평균 계산
      // =========================================
      function calcMetric(
        byUserMap: Record<string, number>,
        myUid: string
      ): BenchmarkMetric {
        const allValues = Object.values(byUserMap);
        const myValue = byUserMap[myUid] ?? 0;

        const sum = allValues.reduce((acc, v) => acc + v, 0);
        const groupAverage =
          allValues.length > 0
            ? Math.round(sum / allValues.length)
            : 0;

        const diffFromAverage = myValue - groupAverage;

        // 상위 백분위: 내 값보다 낮은 사람 수 / 전체
        // percentile = 100 - (내 값보다 낮은 사람 비율 * 100)
        // 즉, 상위 N%이면 percentile = N
        const belowCount = allValues.filter((v) => v < myValue).length;
        const equalCount = allValues.filter((v) => v === myValue).length;
        // 동점자 포함 처리: 내 값보다 낮은 + 동점자 절반
        const rank = belowCount + equalCount * 0.5;
        const percentile = Math.max(
          1,
          Math.round(100 - (rank / allValues.length) * 100)
        );

        return {
          myValue,
          groupAverage,
          diffFromAverage,
          percentile,
        };
      }

      const attendanceMetric = calcMetric(attRateByUser, userId);
      const activityMetric = calcMetric(activityRateByUser, userId);
      const rsvpMetric = calcMetric(rsvpRateByUser, userId);

      return {
        attendance: attendanceMetric,
        activity: activityMetric,
        rsvp: rsvpMetric,
        hasData: true,
        totalMemberCount,
      };
    }
  );

  const defaultData: MemberBenchmarkingResult = {
    attendance: emptyMetric(),
    activity: emptyMetric(),
    rsvp: emptyMetric(),
    hasData: false,
    totalMemberCount: 0,
  };

  return {
    data: data ?? defaultData,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

function emptyMetric(): BenchmarkMetric {
  return {
    myValue: 0,
    groupAverage: 0,
    diffFromAverage: 0,
    percentile: 50,
  };
}
