"use client";

import { createClient } from "@/lib/supabase/client";
import type { BoardPoll, BoardPollOptionWithVotes } from "@/types";

// ============================================================
// 투표 마감 여부 확인
// ============================================================

export function checkPollExpired(poll: BoardPoll): boolean {
  if (!poll.ends_at) return false;
  return new Date(poll.ends_at) < new Date();
}

// ============================================================
// 최다 득표 옵션 반환
// ============================================================

export function getWinningOption(
  options: BoardPollOptionWithVotes[]
): { option: string; votes: number; total: number } | null {
  if (options.length === 0) return null;
  const total = options.reduce((sum, o) => sum + o.vote_count, 0);
  const winner = options.reduce(
    (best, opt) => (opt.vote_count > best.vote_count ? opt : best),
    options[0]
  );
  return { option: winner.text, votes: winner.vote_count, total };
}

// ============================================================
// 결과 요약 텍스트 생성
// ============================================================

export function generateResultText(
  options: BoardPollOptionWithVotes[],
  postTitle: string
): string {
  const total = options.reduce((sum, o) => sum + o.vote_count, 0);
  const sorted = [...options].sort((a, b) => b.vote_count - a.vote_count);

  const lines: string[] = [`투표 결과: [${postTitle}]`];
  sorted.forEach((opt, idx) => {
    const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
    if (idx === 0) {
      lines.push(`1위: ${opt.text} (${opt.vote_count}표, ${pct}%)`);
    } else {
      lines.push(`${idx + 1}위: ${opt.text} (${opt.vote_count}표, ${pct}%)`);
    }
  });
  lines.push(`총 ${total}명 투표`);
  return lines.join("\n");
}

// ============================================================
// 이미 공지했는지 확인 (localStorage)
// ============================================================

export function isAnnounced(pollId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`poll-announced-${pollId}`) === "true";
  } catch {
    return false;
  }
}

function markAnnounced(pollId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`poll-announced-${pollId}`, "true");
  } catch {
    // 무시
  }
}

// ============================================================
// 그룹 전체 멤버에게 알림 발송
// ============================================================

export async function announceResult(
  groupId: string,
  poll: BoardPoll,
  options: BoardPollOptionWithVotes[],
  postTitle: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // 그룹 멤버 목록 조회
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError) {
      return { success: false, error: "멤버 목록을 불러오지 못했습니다" };
    }
    if (!members || members.length === 0) {
      return { success: false, error: "알림을 보낼 멤버가 없습니다" };
    }

    const winner = getWinningOption(options);
    const winnerText = winner
      ? `${winner.option} (${winner.votes}표)`
      : "집계 중";

    const notifications = members.map((m: { user_id: string }) => ({
      user_id: m.user_id,
      type: "new_post",
      title: `투표 결과: ${postTitle}`,
      message: `1위: ${winnerText} | 총 ${winner?.total ?? 0}명 투표`,
      link: `/groups/${groupId}/board/${postId}`,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      return { success: false, error: "알림 발송에 실패했습니다" };
    }

    // 발송 이력 저장
    markAnnounced(poll.id);
    return { success: true };
  } catch {
    return { success: false, error: "알 수 없는 오류가 발생했습니다" };
  }
}
