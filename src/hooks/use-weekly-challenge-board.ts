"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  WeeklyChallenge,
  WeeklyChallengeEntry,
  MemberChallengeProgress,
  WeeklyChallengeType,
  WeeklyChallengeBoardResult,
} from "@/types";

// -------------------------------------------------------
// 주간 날짜 유틸리티
// -------------------------------------------------------

/** 주어진 날짜가 속한 주의 월요일 00:00:00 반환 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월 ... 6=토
  // 월요일로 맞춤: 일요일(0)이면 -6, 그 외에는 -(day-1)
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 주어진 날짜가 속한 주의 일요일 23:59:59 반환 */
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** ISO 날짜 문자열 변환 (YYYY-MM-DD) */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 이번 주 남은 일수 계산 (오늘 포함, 일요일 기준 마감) */
function calcDaysLeft(weekEnd: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff + 1); // 당일 포함
}

// -------------------------------------------------------
// 기본 챌린지 목록
// -------------------------------------------------------

const DEFAULT_CHALLENGES: WeeklyChallenge[] = [
  { id: "attendance", title: "이번 주 출석 3회 이상", goal: 3 },
  { id: "board",      title: "게시글 또는 댓글 5개 이상", goal: 5 },
  { id: "rsvp",       title: "RSVP 전체 응답", goal: 1 },
];

// -------------------------------------------------------
// 메인 훅
// -------------------------------------------------------

export function useWeeklyChallengeBoard(
  groupId: string,
  currentUserId?: string
): WeeklyChallengeBoardResult {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(weekStart);
  const weekStartStr = toDateString(weekStart);
  const weekEndStr = toDateString(weekEnd);
  const daysLeft = calcDaysLeft(weekEnd);

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.weeklyChallengeBoard(groupId) : null,
    async (): Promise<{ entries: WeeklyChallengeEntry[] }> => {
      const supabase = createClient();

      // 1. 그룹 멤버 + 프로필 조회
      const { data: memberRows, error: memberErr } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", groupId);

      if (memberErr) throw memberErr;

      const members: { userId: string; name: string }[] = (memberRows ?? []).map(
        (row: {
          user_id: string;
          profiles: { id: string; name: string } | { id: string; name: string }[] | null;
        }) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            userId: row.user_id,
            name: profile?.name ?? "알 수 없음",
          };
        }
      );

      if (members.length === 0) {
        return { entries: [] };
      }

      const userIds = members.map((m) => m.userId);

      // 2. 이번 주 출석 일정 조회 (attendance_method != none)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", `${weekStartStr}T00:00:00`)
        .lte("starts_at", `${weekEndStr}T23:59:59`);

      if (schedErr) throw schedErr;

      const weekScheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      // 3. 이번 주 출석 기록 조회
      const attendanceCountMap = new Map<string, number>(); // userId → 출석 횟수
      if (weekScheduleIds.length > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status")
          .in("schedule_id", weekScheduleIds)
          .in("user_id", userIds)
          .in("status", ["present", "late"]);

        if (attErr) throw attErr;

        for (const row of attRows ?? []) {
          const prev = attendanceCountMap.get(row.user_id) ?? 0;
          attendanceCountMap.set(row.user_id, prev + 1);
        }
      }

      // 4. 이번 주 게시글 + 댓글 수 조회 (그룹 기준)
      const [postsRes, commentsRes] = await Promise.all([
        supabase
          .from("board_posts")
          .select("user_id")
          .eq("group_id", groupId)
          .in("user_id", userIds)
          .gte("created_at", `${weekStartStr}T00:00:00`)
          .lte("created_at", `${weekEndStr}T23:59:59`),
        supabase
          .from("board_comments")
          .select("user_id, board_posts!inner(group_id)")
          .eq("board_posts.group_id", groupId)
          .in("user_id", userIds)
          .gte("created_at", `${weekStartStr}T00:00:00`)
          .lte("created_at", `${weekEndStr}T23:59:59`),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (commentsRes.error) throw commentsRes.error;

      const boardCountMap = new Map<string, number>(); // userId → 게시글+댓글 수

      for (const row of postsRes.data ?? []) {
        const prev = boardCountMap.get(row.user_id) ?? 0;
        boardCountMap.set(row.user_id, prev + 1);
      }
      for (const row of commentsRes.data ?? []) {
        const prev = boardCountMap.get(row.user_id) ?? 0;
        boardCountMap.set(row.user_id, prev + 1);
      }

      // 5. 이번 주 RSVP 응답 여부 조회
      // 이번 주 일정 전체 (RSVP 대상)
      const { data: allScheduleRows, error: allSchedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .gte("starts_at", `${weekStartStr}T00:00:00`)
        .lte("starts_at", `${weekEndStr}T23:59:59`);

      if (allSchedErr) throw allSchedErr;

      const allWeekScheduleIds = (allScheduleRows ?? []).map((s: { id: string }) => s.id);

      // userId → RSVP 응답 여부 (모든 일정에 응답했으면 true)
      const rsvpCompletedMap = new Map<string, boolean>();

      if (allWeekScheduleIds.length > 0) {
        const { data: rsvpRows, error: rsvpErr } = await supabase
          .from("schedule_rsvp")
          .select("schedule_id, user_id, response")
          .in("schedule_id", allWeekScheduleIds)
          .in("user_id", userIds);

        if (rsvpErr) throw rsvpErr;

        // userId → 응답한 schedule_id 셋
        const rsvpMap = new Map<string, Set<string>>();
        for (const row of rsvpRows ?? []) {
          if (!rsvpMap.has(row.user_id)) {
            rsvpMap.set(row.user_id, new Set());
          }
          rsvpMap.get(row.user_id)!.add(row.schedule_id);
        }

        for (const member of members) {
          const respondedIds = rsvpMap.get(member.userId) ?? new Set();
          // 이번 주 모든 일정에 응답했으면 완료
          const allResponded =
            allWeekScheduleIds.length > 0 &&
            allWeekScheduleIds.every((id: string) => respondedIds.has(id));
          rsvpCompletedMap.set(member.userId, allResponded);
        }
      } else {
        // 이번 주 일정이 없으면 모두 완료 처리 (챌린지 달성 불가 상태)
        for (const member of members) {
          rsvpCompletedMap.set(member.userId, false);
        }
      }

      // 6. 멤버별 챌린지 진행 상황 계산
      const calcProgress = (
        challengeId: WeeklyChallengeType,
        userId: string,
        goal: number
      ): MemberChallengeProgress => {
        let current = 0;

        if (challengeId === "attendance") {
          current = attendanceCountMap.get(userId) ?? 0;
        } else if (challengeId === "board") {
          current = boardCountMap.get(userId) ?? 0;
        } else if (challengeId === "rsvp") {
          // RSVP: 완료=1, 미완료=0 (목표는 1)
          current = rsvpCompletedMap.get(userId) ? 1 : 0;
          goal = 1;
        }

        const completed = current >= goal;
        const progressRate = Math.min(100, Math.round((current / goal) * 100));

        return {
          challengeId,
          current,
          goal,
          completed,
          progressRate,
        };
      };

      const entriesWithoutRank: Omit<WeeklyChallengeEntry, "rank">[] = members.map((member) => {
        const challenges: MemberChallengeProgress[] = DEFAULT_CHALLENGES.map((ch) =>
          calcProgress(ch.id, member.userId, ch.goal)
        );

        const completedCount = challenges.filter((c) => c.completed).length;
        const score = completedCount;

        return {
          userId: member.userId,
          name: member.name,
          challenges,
          completedCount,
          score,
        };
      });

      // 7. 점수 내림차순 정렬 → 순위 부여
      entriesWithoutRank.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // 동점 시 이름 순
        return a.name.localeCompare(b.name);
      });

      const entries: WeeklyChallengeEntry[] = entriesWithoutRank.map((e, idx) => ({
        ...e,
        rank: idx + 1,
      }));

      return { entries };
    }
  );

  const entries = data?.entries ?? [];
  const myEntry = currentUserId
    ? (entries.find((e) => e.userId === currentUserId) ?? null)
    : null;

  return {
    entries,
    challenges: DEFAULT_CHALLENGES,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    daysLeft,
    myEntry,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
