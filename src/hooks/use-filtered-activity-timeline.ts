"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  FilteredActivityItem,
  FilteredActivityType,
  FilteredActivityMonthGroup,
} from "@/types/index";

// ============================================
// 상수
// ============================================

const DEFAULT_DAYS_BACK = 30;

// ============================================
// 헬퍼: 날짜 → YYYY-MM 키
// ============================================

function toMonthKey(isoString: string): string {
  return isoString.slice(0, 7); // "YYYY-MM"
}

function toMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

// ============================================
// Hook
// ============================================

export function useFilteredActivityTimeline(
  groupId: string,
  daysBack: number = DEFAULT_DAYS_BACK
) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.filteredActivityTimeline(groupId, daysBack) : null,
    async (): Promise<FilteredActivityItem[]> => {
      const supabase = createClient();

      // 기준 날짜: daysBack일 전
      const since = new Date();
      since.setDate(since.getDate() - daysBack);
      const sinceIso = since.toISOString();

      // 병렬 조회
      const [attendanceRes, postsRes, commentsRes, rsvpRes, membersRes] =
        await Promise.all([
          // 1. 출석 기록 (attendance + schedules)
          supabase
            .from("attendance")
            .select(
              "id, user_id, status, created_at, schedules!inner(group_id, title)"
            )
            .eq("schedules.group_id", groupId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false })
            .limit(100),

          // 2. 게시글 (board_posts + profiles)
          supabase
            .from("board_posts")
            .select("id, title, created_at, author_id")
            .eq("group_id", groupId)
            .is("deleted_at", null)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false })
            .limit(100),

          // 3. 댓글 (board_comments + 게시글 제목)
          supabase
            .from("board_comments")
            .select(
              "id, content, created_at, author_id, board_posts!inner(group_id, title)"
            )
            .eq("board_posts.group_id", groupId)
            .gte("created_at", sinceIso)
            .order("created_at", { ascending: false })
            .limit(100),

          // 4. RSVP (schedule_rsvp + schedules)
          supabase
            .from("schedule_rsvp")
            .select(
              "id, response, updated_at, user_id, schedule_id, schedules!inner(group_id, title)"
            )
            .eq("schedules.group_id", groupId)
            .gte("updated_at", sinceIso)
            .order("updated_at", { ascending: false })
            .limit(100),

          // 5. 멤버 가입 (group_members, 최근 daysBack일)
          supabase
            .from("group_members")
            .select("id, joined_at, user_id")
            .eq("group_id", groupId)
            .gte("joined_at", sinceIso)
            .order("joined_at", { ascending: false })
            .limit(50),
        ]);

      // 에러 확인
      if (attendanceRes.error)
        throw new Error("출석 데이터를 불러오지 못했습니다");
      if (postsRes.error)
        throw new Error("게시글 데이터를 불러오지 못했습니다");
      if (commentsRes.error)
        throw new Error("댓글 데이터를 불러오지 못했습니다");
      if (rsvpRes.error) throw new Error("RSVP 데이터를 불러오지 못했습니다");
      if (membersRes.error)
        throw new Error("멤버 데이터를 불러오지 못했습니다");

      // 모든 userId 수집 후 profiles 한 번에 조회
      const userIdSet = new Set<string>();
      (attendanceRes.data ?? []).forEach((a: { user_id: string }) =>
        userIdSet.add(a.user_id)
      );
      (postsRes.data ?? []).forEach((p: { author_id: string }) =>
        userIdSet.add(p.author_id)
      );
      (commentsRes.data ?? []).forEach((c: { author_id: string }) =>
        userIdSet.add(c.author_id)
      );
      (rsvpRes.data ?? []).forEach((r: { user_id: string }) =>
        userIdSet.add(r.user_id)
      );
      (membersRes.data ?? []).forEach((m: { user_id: string }) =>
        userIdSet.add(m.user_id)
      );

      const userIds = Array.from(userIdSet).filter(Boolean);
      const profileMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        (profilesData ?? []).forEach((p: { id: string; name: string }) => {
          profileMap[p.id] = p.name;
        });
      }

      const getName = (userId: string | null) =>
        userId ? (profileMap[userId] ?? "알 수 없음") : "알 수 없음";

      // 통합 타임라인 구성
      const items: FilteredActivityItem[] = [];

      // 출석
      const statusLabels: Record<string, string> = {
        present: "출석",
        absent: "결석",
        late: "지각",
        excused: "면제",
      };
      for (const row of attendanceRes.data ?? []) {
        const a = row as {
          id: string;
          user_id: string;
          status: string;
          created_at: string;
          schedules: { title: string } | null;
        };
        const scheduleTitle = a.schedules?.title ?? "일정";
        const statusLabel = statusLabels[a.status] ?? a.status;
        items.push({
          id: `attendance-${a.id}`,
          type: "attendance" as FilteredActivityType,
          description: `"${scheduleTitle}" ${statusLabel}`,
          userName: getName(a.user_id),
          userId: a.user_id,
          occurredAt: a.created_at,
        });
      }

      // 게시글
      for (const row of postsRes.data ?? []) {
        const p = row as {
          id: string;
          title: string;
          created_at: string;
          author_id: string;
        };
        items.push({
          id: `post-${p.id}`,
          type: "post" as FilteredActivityType,
          description: `게시글 작성: "${p.title}"`,
          userName: getName(p.author_id),
          userId: p.author_id,
          occurredAt: p.created_at,
          metadata: { postId: p.id },
        });
      }

      // 댓글
      for (const row of commentsRes.data ?? []) {
        const c = row as {
          id: string;
          content: string;
          created_at: string;
          author_id: string;
          board_posts: { title: string } | null;
        };
        const postTitle = c.board_posts?.title ?? "게시글";
        items.push({
          id: `comment-${c.id}`,
          type: "comment" as FilteredActivityType,
          description: `"${postTitle}"에 댓글 작성`,
          userName: getName(c.author_id),
          userId: c.author_id,
          occurredAt: c.created_at,
        });
      }

      // RSVP
      const rsvpLabels: Record<string, string> = {
        going: "참석",
        not_going: "불참",
        maybe: "미정",
      };
      for (const row of rsvpRes.data ?? []) {
        const r = row as {
          id: string;
          response: string;
          updated_at: string;
          user_id: string;
          schedule_id: string;
          schedules: { title: string } | null;
        };
        const scheduleTitle = r.schedules?.title ?? "일정";
        const responseLabel = rsvpLabels[r.response] ?? r.response;
        items.push({
          id: `rsvp-${r.id}`,
          type: "rsvp" as FilteredActivityType,
          description: `"${scheduleTitle}" RSVP: ${responseLabel}`,
          userName: getName(r.user_id),
          userId: r.user_id,
          occurredAt: r.updated_at,
          metadata: { scheduleId: r.schedule_id },
        });
      }

      // 멤버 가입
      for (const row of membersRes.data ?? []) {
        const m = row as {
          id: string;
          joined_at: string;
          user_id: string;
        };
        items.push({
          id: `member-${m.id}`,
          type: "member_join" as FilteredActivityType,
          description: "그룹에 가입했습니다",
          userName: getName(m.user_id),
          userId: m.user_id,
          occurredAt: m.joined_at,
        });
      }

      // 최신순 정렬
      items.sort((a, b) => (a.occurredAt > b.occurredAt ? -1 : 1));
      return items;
    },
    { revalidateOnFocus: false }
  );

  const allItems = data ?? [];

  // 유형 필터링
  function filterByTypes(types: FilteredActivityType[]): FilteredActivityItem[] {
    if (types.length === 0) return allItems;
    return allItems.filter((item) => types.includes(item.type));
  }

  // 월별 그룹화 (최신순)
  function groupByMonth(): FilteredActivityMonthGroup[] {
    const map = new Map<string, FilteredActivityItem[]>();

    for (const item of allItems) {
      const key = toMonthKey(item.occurredAt);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    // Map은 삽입 순서를 유지하므로 배열로 변환 후 최신 월 우선 정렬
    const groups: FilteredActivityMonthGroup[] = Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([month, items]) => ({
        month,
        label: toMonthLabel(month),
        items,
      }));

    return groups;
  }

  return {
    items: allItems,
    loading: isLoading,
    filterByTypes,
    groupByMonth,
    refetch: () => mutate(),
  };
}
