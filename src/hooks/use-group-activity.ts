"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ActivityItem, ActivityType } from "@/types/index";

const MAX_ITEMS = 30;

export function useGroupActivity(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupActivity(groupId) : null,
    async (): Promise<ActivityItem[]> => {
      const supabase = createClient();

      // 병렬로 모든 데이터 조회
      const [
        postsRes,
        commentsRes,
        rsvpRes,
        membersRes,
        schedulesRes,
        financeRes,
      ] = await Promise.all([
        // 1. 최근 게시글
        supabase
          .from("board_posts")
          .select("id, title, created_at, author_id")
          .eq("group_id", groupId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10),

        // 2. 최근 댓글 (게시글 title 포함)
        supabase
          .from("board_comments")
          .select("id, content, created_at, author_id, board_posts!inner(group_id, title)")
          .eq("board_posts.group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(10),

        // 3. 최근 RSVP (일정 title 포함)
        supabase
          .from("schedule_rsvp")
          .select("id, response, updated_at, user_id, schedule_id, schedules!inner(group_id, title)")
          .eq("schedules.group_id", groupId)
          .order("updated_at", { ascending: false })
          .limit(10),

        // 4. 최근 신규 멤버
        supabase
          .from("group_members")
          .select("id, joined_at, user_id")
          .eq("group_id", groupId)
          .order("joined_at", { ascending: false })
          .limit(5),

        // 5. 최근 일정 생성
        supabase
          .from("schedules")
          .select("id, title, created_at, created_by")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(5),

        // 6. 최근 회비 거래
        supabase
          .from("finance_transactions")
          .select("id, title, type, amount, created_at, created_by")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // 에러 확인
      if (postsRes.error) throw new Error("게시글 데이터를 불러오지 못했습니다");
      if (commentsRes.error) throw new Error("댓글 데이터를 불러오지 못했습니다");
      if (rsvpRes.error) throw new Error("RSVP 데이터를 불러오지 못했습니다");
      if (membersRes.error) throw new Error("멤버 데이터를 불러오지 못했습니다");
      if (schedulesRes.error) throw new Error("일정 데이터를 불러오지 못했습니다");
      if (financeRes.error) throw new Error("회비 데이터를 불러오지 못했습니다");

      // 모든 user_id 수집 (중복 제거)
      const userIdSet = new Set<string>();

      (postsRes.data ?? []).forEach((p: { author_id: string }) => userIdSet.add(p.author_id));
      (commentsRes.data ?? []).forEach((c: { author_id: string }) => userIdSet.add(c.author_id));
      (rsvpRes.data ?? []).forEach((r: { user_id: string }) => userIdSet.add(r.user_id));
      (membersRes.data ?? []).forEach((m: { user_id: string }) => userIdSet.add(m.user_id));
      (schedulesRes.data ?? []).forEach((s: { created_by: string }) => userIdSet.add(s.created_by));
      (financeRes.data ?? []).forEach((f: { created_by: string | null }) => {
        if (f.created_by) userIdSet.add(f.created_by);
      });

      const userIds = Array.from(userIdSet).filter(Boolean);

      // profiles 한 번에 조회
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

      const getUserName = (userId: string | null) =>
        userId ? (profileMap[userId] ?? "알 수 없음") : "알 수 없음";

      // ActivityItem 변환
      const items: ActivityItem[] = [];

      // 게시글
      for (const post of postsRes.data ?? []) {
        const p = post as { id: string; title: string; created_at: string; author_id: string };
        items.push({
          id: `post-${p.id}`,
          type: "post" as ActivityType,
          title: "새 게시글",
          description: p.title,
          userName: getUserName(p.author_id),
          userId: p.author_id,
          createdAt: p.created_at,
          metadata: { postId: p.id },
        });
      }

      // 댓글
      for (const comment of commentsRes.data ?? []) {
        const c = comment as {
          id: string;
          content: string;
          created_at: string;
          author_id: string;
          board_posts: { title: string } | null;
        };
        const postTitle = c.board_posts?.title ?? "게시글";
        items.push({
          id: `comment-${c.id}`,
          type: "comment" as ActivityType,
          title: "새 댓글",
          description: `"${postTitle}"에 댓글을 남겼습니다`,
          userName: getUserName(c.author_id),
          userId: c.author_id,
          createdAt: c.created_at,
        });
      }

      // RSVP
      const rsvpLabels: Record<string, string> = {
        going: "참석",
        not_going: "불참",
        maybe: "미정",
      };
      for (const rsvp of rsvpRes.data ?? []) {
        const r = rsvp as {
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
          type: "rsvp" as ActivityType,
          title: "일정 RSVP",
          description: `"${scheduleTitle}" - ${responseLabel}`,
          userName: getUserName(r.user_id),
          userId: r.user_id,
          createdAt: r.updated_at,
          metadata: { scheduleId: r.schedule_id },
        });
      }

      // 신규 멤버
      for (const member of membersRes.data ?? []) {
        const m = member as { id: string; joined_at: string; user_id: string };
        items.push({
          id: `member-${m.id}`,
          type: "member_join" as ActivityType,
          title: "신규 멤버",
          description: "그룹에 가입했습니다",
          userName: getUserName(m.user_id),
          userId: m.user_id,
          createdAt: m.joined_at,
        });
      }

      // 일정 생성
      for (const schedule of schedulesRes.data ?? []) {
        const s = schedule as { id: string; title: string; created_at: string; created_by: string };
        items.push({
          id: `schedule-${s.id}`,
          type: "schedule_create" as ActivityType,
          title: "새 일정",
          description: s.title,
          userName: getUserName(s.created_by),
          userId: s.created_by,
          createdAt: s.created_at,
          metadata: { scheduleId: s.id },
        });
      }

      // 회비 거래
      const financeTypeLabels: Record<string, string> = {
        income: "수입",
        expense: "지출",
      };
      for (const txn of financeRes.data ?? []) {
        const f = txn as {
          id: string;
          title: string;
          type: string;
          amount: number;
          created_at: string;
          created_by: string | null;
        };
        const typeLabel = financeTypeLabels[f.type] ?? f.type;
        const amountStr = f.amount.toLocaleString("ko-KR");
        items.push({
          id: `finance-${f.id}`,
          type: "finance" as ActivityType,
          title: `회비 ${typeLabel}`,
          description: `${f.title} (${amountStr}원)`,
          userName: getUserName(f.created_by),
          userId: f.created_by ?? "",
          createdAt: f.created_at,
        });
      }

      // createdAt DESC 정렬 후 30개만 반환
      items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
      return items.slice(0, MAX_ITEMS);
    },
    { revalidateOnFocus: false }
  );

  return {
    activities: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
