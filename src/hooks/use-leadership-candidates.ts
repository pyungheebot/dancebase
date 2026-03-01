"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import { LeadershipCandidate } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:leadership-dismissed";

function getDismissedKey(groupId: string) {
  return `${STORAGE_KEY_PREFIX}:${groupId}`;
}

function loadDismissed(groupId: string): string[] {
  return loadFromStorage<string[]>(getDismissedKey(groupId), []);
}

function saveDismissed(groupId: string, dismissed: string[]) {
  saveToStorage(getDismissedKey(groupId), dismissed);
}

export function useLeadershipCandidates(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.leadershipCandidates(groupId) : null,
    async (): Promise<LeadershipCandidate[]> => {
      const supabase = createClient();

      const since = new Date();
      since.setDate(since.getDate() - 90);
      const sinceIso = since.toISOString();

      // 1. 그룹 멤버 + 프로필 조인
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(display_name)")
        .eq("group_id", groupId)
        .eq("status", "active");

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m: { user_id: string }) => m.user_id);

      // 2. 출석 데이터 (지난 90일)
      const { data: attendanceRows, error: attendanceError } = await supabase
        .from("attendance")
        .select("user_id, status")
        .in("user_id", userIds)
        .gte("created_at", sinceIso);

      if (attendanceError) throw attendanceError;

      // 3. 게시글 수 (지난 90일)
      const { data: postRows, error: postError } = await supabase
        .from("board_posts")
        .select("author_id")
        .in("author_id", userIds)
        .eq("group_id", groupId)
        .gte("created_at", sinceIso);

      if (postError) throw postError;

      // 4. 댓글 수 (지난 90일)
      const { data: commentRows, error: commentError } = await supabase
        .from("board_comments")
        .select("author_id")
        .in("author_id", userIds)
        .gte("created_at", sinceIso);

      if (commentError) throw commentError;

      // 유저별 집계 맵 생성
      const attendanceMap: Record<string, { present: number; late: number; total: number }> = {};
      const postCountMap: Record<string, number> = {};
      const commentCountMap: Record<string, number> = {};

      for (const uid of userIds) {
        attendanceMap[uid] = { present: 0, late: 0, total: 0 };
        postCountMap[uid] = 0;
        commentCountMap[uid] = 0;
      }

      for (const row of attendanceRows ?? []) {
        const entry = attendanceMap[row.user_id];
        if (!entry) continue;
        entry.total += 1;
        if (row.status === "present") entry.present += 1;
        if (row.status === "late") entry.late += 1;
      }

      for (const row of postRows ?? []) {
        if (postCountMap[row.author_id] !== undefined) {
          postCountMap[row.author_id] += 1;
        }
      }

      for (const row of commentRows ?? []) {
        if (commentCountMap[row.author_id] !== undefined) {
          commentCountMap[row.author_id] += 1;
        }
      }

      // dismissed 목록 로드
      const dismissed = loadDismissed(groupId);

      const candidates: LeadershipCandidate[] = [];

      for (const member of members) {
        const uid = member.user_id;

        // dismissed 멤버 제외
        if (dismissed.includes(uid)) continue;

        const att = attendanceMap[uid] ?? { present: 0, late: 0, total: 0 };
        const postCount = postCountMap[uid] ?? 0;
        const commentCount = commentCountMap[uid] ?? 0;

        // 점수 계산
        const attendanceScore =
          att.total > 0
            ? Math.round(((att.present + att.late) / att.total) * 100)
            : 0;
        const postScore = Math.round(Math.min(postCount / 10, 1) * 100);
        const commentScore = Math.round(Math.min(commentCount / 20, 1) * 100);
        const totalScore = Math.round(
          attendanceScore * 0.4 + postScore * 0.35 + commentScore * 0.25
        );

        if (totalScore < 60) continue;

        // profiles는 배열 또는 단일 객체일 수 있음
        const profileData = member.profiles;
        let displayName = "알 수 없음";
        if (Array.isArray(profileData) && profileData.length > 0) {
          displayName = (profileData[0] as { display_name?: string }).display_name ?? "알 수 없음";
        } else if (profileData && !Array.isArray(profileData)) {
          displayName = (profileData as { display_name?: string }).display_name ?? "알 수 없음";
        }

        candidates.push({
          userId: uid,
          displayName,
          attendanceScore,
          postScore,
          commentScore,
          totalScore,
        });
      }

      // totalScore 내림차순 정렬
      candidates.sort((a, b) => b.totalScore - a.totalScore);

      return candidates;
    }
  );

  function dismissCandidate(userId: string) {
    const dismissed = loadDismissed(groupId);
    if (!dismissed.includes(userId)) {
      saveDismissed(groupId, [...dismissed, userId]);
    }
    mutate();
  }

  return {
    candidates: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    dismissCandidate,
  };
}
