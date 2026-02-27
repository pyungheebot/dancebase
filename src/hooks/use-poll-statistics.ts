"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { BoardPoll, BoardPollOption, GroupMemberWithProfile } from "@/types";

export type PollOptionStat = BoardPollOption & {
  voteCount: number;
  percentage: number;
  isTop: boolean;
};

export type PollVoterInfo = {
  userId: string;
  name: string;
};

export type PollStatisticsData = {
  poll: BoardPoll;
  optionStats: PollOptionStat[];
  totalVotes: number;
  totalMembers: number;
  participantCount: number;
  participationRate: number;
  nonParticipants: PollVoterInfo[];
  isExpired: boolean;
};

export function usePollStatistics(postId: string, groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.pollStatistics(postId),
    async (): Promise<PollStatisticsData | null> => {
      const supabase = createClient();

      // 1. 해당 게시글의 투표 조회
      const { data: pollData, error: pollError } = await supabase
        .from("board_polls")
        .select("*")
        .eq("post_id", postId)
        .maybeSingle();

      if (pollError || !pollData) return null;
      const poll = pollData as BoardPoll;

      // 2. 투표 옵션 조회
      const { data: optionsData, error: optionsError } = await supabase
        .from("board_poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("sort_order", { ascending: true });

      if (optionsError || !optionsData) return null;
      const options = optionsData as BoardPollOption[];

      // 3. 각 옵션별 투표 수 조회
      const { data: votesData, error: votesError } = await supabase
        .from("board_poll_votes")
        .select("option_id, user_id")
        .in(
          "option_id",
          options.map((o) => o.id)
        );

      if (votesError) return null;
      const votes = (votesData ?? []) as { option_id: string; user_id: string }[];

      // 4. 그룹 멤버 조회 (참여율 계산용)
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (membersError) return null;
      const members = (membersData ?? []) as GroupMemberWithProfile[];

      // 5. 통계 계산
      const votesCountByOption: Record<string, number> = {};
      for (const option of options) {
        votesCountByOption[option.id] = 0;
      }
      for (const vote of votes) {
        if (votesCountByOption[vote.option_id] !== undefined) {
          votesCountByOption[vote.option_id]++;
        }
      }

      const totalVotes = votes.length;
      const maxVotes = Math.max(...Object.values(votesCountByOption), 0);

      const optionStats: PollOptionStat[] = options.map((option) => {
        const voteCount = votesCountByOption[option.id] ?? 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        return {
          ...option,
          voteCount,
          percentage,
          isTop: voteCount === maxVotes && maxVotes > 0,
        };
      });

      // 6. 참여율 계산 (투표한 고유 사용자 수)
      const voterIds = new Set(votes.map((v) => v.user_id));
      const participantCount = voterIds.size;
      const totalMembers = members.length;
      const participationRate =
        totalMembers > 0 ? Math.round((participantCount / totalMembers) * 100) : 0;

      // 7. 미참여 멤버 목록
      const nonParticipants: PollVoterInfo[] = members
        .filter((m) => !voterIds.has(m.user_id))
        .map((m) => ({
          userId: m.user_id,
          name: m.nickname || m.profiles?.name || "알 수 없음",
        }));

      const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;

      return {
        poll,
        optionStats,
        totalVotes,
        totalMembers,
        participantCount,
        participationRate,
        nonParticipants,
        isExpired,
      };
    }
  );

  return {
    statistics: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
