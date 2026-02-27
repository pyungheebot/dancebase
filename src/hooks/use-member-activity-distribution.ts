"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberActivityDistribution,
  MemberActivityGrade,
  MemberActivityGradeSummary,
  MemberActivityScore,
} from "@/types";

// 등급별 색상 정의
const GRADE_COLORS: Record<MemberActivityGrade, string> = {
  "매우 활발": "bg-green-500",
  활발: "bg-blue-500",
  보통: "bg-yellow-500",
  저조: "bg-red-400",
};

// 빈 결과 반환용 기본값
const EMPTY_RESULT: MemberActivityDistribution = {
  gradeSummary: [
    { grade: "매우 활발", count: 0, color: GRADE_COLORS["매우 활발"] },
    { grade: "활발", count: 0, color: GRADE_COLORS["활발"] },
    { grade: "보통", count: 0, color: GRADE_COLORS["보통"] },
    { grade: "저조", count: 0, color: GRADE_COLORS["저조"] },
  ],
  top5: [],
  totalMembers: 0,
  avgScore: 0,
};

// 멤버 기본 정보 타입
type MemberBasic = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

// 점수 집계 전 임시 타입
type ScoredMemberRaw = MemberBasic & {
  totalScore: number;
  breakdown: {
    attendance: number;
    posts: number;
    comments: number;
    rsvp: number;
  };
};

export function useMemberActivityDistribution(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.memberActivityDistribution(groupId),
    async (): Promise<MemberActivityDistribution> => {
      const supabase = createClient();

      // 최근 30일 범위 계산
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fromDate = thirtyDaysAgo.toISOString();

      // 1. 그룹 멤버 목록 조회 (profiles 조인)
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (memberErr || !memberRows || memberRows.length === 0) {
        return EMPTY_RESULT;
      }

      // 멤버 기본 정보 매핑
      const members: MemberBasic[] = (
        memberRows as Array<{
          user_id: string;
          profiles: { name: string; avatar_url: string | null } | Array<{ name: string; avatar_url: string | null }> | null;
        }>
      ).map((row) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        return {
          userId: row.user_id,
          name: profile?.name ?? "알 수 없음",
          avatarUrl: profile?.avatar_url ?? null,
        };
      });

      const userIds: string[] = members.map((m) => m.userId);

      // 2. 출석 기록 조회 (최근 30일)
      // 일정 ID 먼저 조회
      const { data: scheduleRows } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("starts_at", fromDate);

      const scheduleIds: string[] = (
        scheduleRows as Array<{ id: string }> | null ?? []
      ).map((s) => s.id);

      // 출석 카운트 (user_id별, status='present')
      const attendanceCountMap = new Map<string, number>();
      if (scheduleIds.length > 0) {
        const { data: attRows } = await supabase
          .from("attendance")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds)
          .eq("status", "present");

        for (const row of (attRows as Array<{ user_id: string }> | null ?? [])) {
          attendanceCountMap.set(
            row.user_id,
            (attendanceCountMap.get(row.user_id) ?? 0) + 1
          );
        }
      }

      // 3. 게시글 카운트 조회 (최근 30일)
      const postCountMap = new Map<string, number>();
      {
        const { data: postRows } = await supabase
          .from("board_posts")
          .select("author_id")
          .eq("group_id", groupId)
          .in("author_id", userIds)
          .gte("created_at", fromDate)
          .is("deleted_at", null);

        for (const row of (postRows as Array<{ author_id: string }> | null ?? [])) {
          postCountMap.set(
            row.author_id,
            (postCountMap.get(row.author_id) ?? 0) + 1
          );
        }
      }

      // 4. 댓글 카운트 조회 (최근 30일)
      const commentCountMap = new Map<string, number>();
      {
        const { data: commentRows } = await supabase
          .from("board_comments")
          .select("author_id, board_posts!inner(group_id)")
          .eq("board_posts.group_id", groupId)
          .in("author_id", userIds)
          .gte("created_at", fromDate)
          .is("deleted_at", null);

        for (const row of (commentRows as Array<{ author_id: string }> | null ?? [])) {
          commentCountMap.set(
            row.author_id,
            (commentCountMap.get(row.author_id) ?? 0) + 1
          );
        }
      }

      // 5. RSVP 응답 카운트 조회 (최근 30일)
      const rsvpCountMap = new Map<string, number>();
      if (scheduleIds.length > 0) {
        const { data: rsvpRows } = await supabase
          .from("schedule_rsvp")
          .select("user_id")
          .in("schedule_id", scheduleIds)
          .in("user_id", userIds);

        for (const row of (rsvpRows as Array<{ user_id: string }> | null ?? [])) {
          rsvpCountMap.set(
            row.user_id,
            (rsvpCountMap.get(row.user_id) ?? 0) + 1
          );
        }
      }

      // 6. 멤버별 총 활동 점수 계산
      const scoredMembers: ScoredMemberRaw[] = members.map((member) => {
        const attendanceCount = attendanceCountMap.get(member.userId) ?? 0;
        const postCount = postCountMap.get(member.userId) ?? 0;
        const commentCount = commentCountMap.get(member.userId) ?? 0;
        const rsvpCount = rsvpCountMap.get(member.userId) ?? 0;

        const totalScore =
          attendanceCount * 3 +
          postCount * 2 +
          commentCount * 1 +
          rsvpCount * 1;

        return {
          userId: member.userId,
          name: member.name,
          avatarUrl: member.avatarUrl,
          totalScore,
          breakdown: {
            attendance: attendanceCount * 3,
            posts: postCount * 2,
            comments: commentCount,
            rsvp: rsvpCount,
          },
        };
      });

      // 7. 점수 내림차순 정렬 후 등급 분류
      scoredMembers.sort(
        (a: ScoredMemberRaw, b: ScoredMemberRaw) => b.totalScore - a.totalScore
      );

      const total = scoredMembers.length;
      const top20Idx = Math.ceil(total * 0.2);
      const top50Idx = Math.ceil(total * 0.5);
      const top80Idx = Math.ceil(total * 0.8);

      const gradeResult: MemberActivityScore[] = scoredMembers.map(
        (member: ScoredMemberRaw, idx: number) => {
          let grade: MemberActivityGrade;
          if (idx < top20Idx) {
            grade = "매우 활발";
          } else if (idx < top50Idx) {
            grade = "활발";
          } else if (idx < top80Idx) {
            grade = "보통";
          } else {
            grade = "저조";
          }

          return {
            ...member,
            grade,
            rank: idx + 1,
          };
        }
      );

      // 8. 등급별 집계
      const gradeCountMap = new Map<MemberActivityGrade, number>([
        ["매우 활발", 0],
        ["활발", 0],
        ["보통", 0],
        ["저조", 0],
      ]);
      for (const member of gradeResult) {
        gradeCountMap.set(
          member.grade,
          (gradeCountMap.get(member.grade) ?? 0) + 1
        );
      }

      const gradeSummary: MemberActivityGradeSummary[] = (
        ["매우 활발", "활발", "보통", "저조"] as MemberActivityGrade[]
      ).map((grade) => ({
        grade,
        count: gradeCountMap.get(grade) ?? 0,
        color: GRADE_COLORS[grade],
      }));

      // 9. TOP 5 추출
      const top5 = gradeResult.slice(0, 5);

      // 10. 평균 점수
      const avgScore =
        total > 0
          ? Math.round(
              scoredMembers.reduce(
                (sum: number, m: ScoredMemberRaw) => sum + m.totalScore,
                0
              ) / total
            )
          : 0;

      return {
        gradeSummary,
        top5,
        totalMembers: total,
        avgScore,
      };
    }
  );

  return {
    distribution: data ?? EMPTY_RESULT,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
