"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MonthlyArchiveEntry,
  MonthlyArchiveTopMember,
  MonthlyArchivePopularPost,
} from "@/types";

// -----------------------------------------------
// 최근 6개월 YYYY-MM 목록 생성
// -----------------------------------------------

function getLast6Months(): { month: string; label: string }[] {
  const result: { month: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, "0");
    result.push({
      month: `${year}-${monthStr}`,
      label: `${year}년 ${month}월`,
    });
  }

  // 최신 월이 먼저 오도록 (이미 i=0이 최신)
  return result;
}

// -----------------------------------------------
// 월 범위 ISO 문자열 반환
// -----------------------------------------------

function getMonthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// -----------------------------------------------
// 활동 점수 계산 (게시글 2점 + 댓글 1점 + 출석 3점)
// -----------------------------------------------

function calcActivityScore(posts: number, comments: number, attendance: number): number {
  return posts * 2 + comments * 1 + attendance * 3;
}

// -----------------------------------------------
// 단일 월 데이터 집계
// -----------------------------------------------

async function fetchMonthEntry(
  groupId: string,
  monthInfo: { month: string; label: string }
): Promise<MonthlyArchiveEntry> {
  const supabase = createClient();
  const { start, end } = getMonthRange(monthInfo.month);

  // 병렬 조회: 일정, 게시글, 댓글, 신규 멤버
  const [schedulesRes, postsRes, commentsRes, newMembersRes] = await Promise.all([
    // 일정 목록
    supabase
      .from("schedules")
      .select("id")
      .eq("group_id", groupId)
      .gte("starts_at", start)
      .lt("starts_at", end),

    // 게시글 (id, author_id, title)
    supabase
      .from("board_posts")
      .select("id, author_id, title, profiles(id, name)")
      .eq("group_id", groupId)
      .gte("created_at", start)
      .lt("created_at", end),

    // 댓글 (author_id, post_id)
    supabase
      .from("board_comments")
      .select("id, author_id, post_id, profiles(id, name), board_posts!inner(group_id)")
      .eq("board_posts.group_id", groupId)
      .gte("created_at", start)
      .lt("created_at", end),

    // 신규 멤버 수
    supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .gte("joined_at", start)
      .lt("joined_at", end),
  ]);

  const scheduleRows = schedulesRes.data ?? [];
  const postRows = postsRes.data ?? [];
  const commentRows = commentsRes.data ?? [];
  const newMemberCount = newMembersRes.count ?? 0;

  // 출석 집계 (일정이 있을 때만 조회)
  let totalAttendance = 0;
  let avgAttendanceRate = 0;
  const memberAttendanceCount: Record<string, number> = {};

  if (scheduleRows.length > 0) {
    const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("schedule_id, user_id, status")
      .in("schedule_id", scheduleIds);

    const records = attendanceRows ?? [];
    const present = records.filter(
      (a: { status: string }) => a.status === "present" || a.status === "late"
    );
    const absent = records.filter(
      (a: { status: string }) => a.status === "absent"
    );

    totalAttendance = present.length;
    const totalMarked = present.length + absent.length;
    avgAttendanceRate =
      totalMarked > 0 ? Math.round((present.length / totalMarked) * 100) : 0;

    // 멤버별 출석 횟수 카운팅
    for (const record of present) {
      const uid = (record as { user_id: string }).user_id;
      if (uid) {
        memberAttendanceCount[uid] = (memberAttendanceCount[uid] ?? 0) + 1;
      }
    }
  }

  // 게시글 수, 댓글 수
  const postCount = postRows.length;
  const commentCount = commentRows.length;

  // 멤버별 게시글 수 카운팅
  const memberPostCount: Record<string, number> = {};
  const memberNameMap: Record<string, string> = {};

  for (const post of postRows) {
    const uid = post.author_id as string | null;
    if (!uid) continue;
    memberPostCount[uid] = (memberPostCount[uid] ?? 0) + 1;
    // 이름 수집
    const profile = post.profiles as { id: string; name: string } | null;
    if (profile?.name) memberNameMap[uid] = profile.name;
  }

  // 멤버별 댓글 수 카운팅
  const memberCommentCount: Record<string, number> = {};
  for (const comment of commentRows) {
    const uid = comment.author_id as string | null;
    if (!uid) continue;
    memberCommentCount[uid] = (memberCommentCount[uid] ?? 0) + 1;
    const profile = comment.profiles as { id: string; name: string } | null;
    if (profile?.name) memberNameMap[uid] = profile.name;
  }

  // 멤버별 활동 점수 계산 → TOP 3
  const allUserIds = new Set([
    ...Object.keys(memberPostCount),
    ...Object.keys(memberCommentCount),
    ...Object.keys(memberAttendanceCount),
  ]);

  const scoredMembers: MonthlyArchiveTopMember[] = Array.from(allUserIds).map(
    (uid) => ({
      userId: uid,
      name: memberNameMap[uid] ?? "멤버",
      score: calcActivityScore(
        memberPostCount[uid] ?? 0,
        memberCommentCount[uid] ?? 0,
        memberAttendanceCount[uid] ?? 0
      ),
    })
  );

  scoredMembers.sort((a, b) => b.score - a.score);
  const topMembers = scoredMembers.slice(0, 3);

  // 가장 인기 있는 게시글 (댓글 수 기준)
  let popularPost: MonthlyArchivePopularPost | null = null;

  if (postRows.length > 0) {
    const postIds = postRows.map((p: { id: string }) => p.id);

    // 게시글별 댓글 수 집계
    const postCommentCounts: Record<string, number> = {};
    for (const comment of commentRows) {
      const pid = comment.post_id as string | null;
      if (pid && postIds.includes(pid)) {
        postCommentCounts[pid] = (postCommentCounts[pid] ?? 0) + 1;
      }
    }

    // 댓글이 가장 많은 게시글 찾기
    let maxComments = -1;
    let popularPostId: string | null = null;

    for (const [pid, cnt] of Object.entries(postCommentCounts)) {
      if (cnt > maxComments) {
        maxComments = cnt;
        popularPostId = pid;
      }
    }

    if (popularPostId !== null && maxComments >= 0) {
      const foundPost = postRows.find(
        (p: { id: string }) => p.id === popularPostId
      );
      if (foundPost) {
        popularPost = {
          postId: popularPostId,
          title: (foundPost as { title: string }).title,
          commentCount: maxComments,
        };
      }
    }
  }

  return {
    month: monthInfo.month,
    label: monthInfo.label,
    totalSchedules: scheduleRows.length,
    totalAttendance,
    avgAttendanceRate,
    postCount,
    commentCount,
    newMemberCount,
    topMembers,
    popularPost,
  };
}

// -----------------------------------------------
// Hook
// -----------------------------------------------

export function useActivityArchive(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.activityArchive(groupId) : null,
    async (): Promise<MonthlyArchiveEntry[]> => {
      const months = getLast6Months();

      // 6개월 데이터를 병렬 조회
      const entries = await Promise.all(
        months.map((m) => fetchMonthEntry(groupId, m))
      );

      return entries;
    },
    {
      // 아카이브는 자주 바뀌지 않으므로 5분 캐시
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  return {
    archive: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
