"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { BoardPoll, BoardPollOptionWithVotes } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PollShareCard } from "@/components/board/poll-share-card";
import { AdoptDecisionButton } from "@/components/board/poll-decision-log";
import { PollCloseAnnounceDialog } from "@/components/board/poll-close-announce-dialog";

interface BoardPollProps {
  poll: BoardPoll;
  options: BoardPollOptionWithVotes[];
  onUpdate: () => void;
  /** 투표 질문 (게시글 제목 등 외부에서 전달). 없으면 "투표"로 표시 */
  question?: string;
  /** 결정 채택 버튼 표시를 위한 그룹 ID */
  groupId?: string;
  /** 결정 채택 버튼 표시를 위한 게시글 ID */
  postId?: string;
  /** 현재 로그인 사용자 ID */
  currentUserId?: string;
  /** 결과 공지 버튼 표시 여부 (리더/작성자) */
  canAnnounce?: boolean;
}

export function BoardPollView({
  poll,
  options,
  onUpdate,
  question,
  groupId,
  postId,
  currentUserId,
  canAnnounce,
}: BoardPollProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const { pending: submitting, execute } = useAsyncAction();
  const supabase = createClient();

  const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);
  const hasVoted = options.some((o) => o.voted_by_me);
  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;

  // 최다 득표 옵션 (결정 채택 시 사용)
  const winningOption = options.reduce(
    (best, opt) => (opt.vote_count > (best?.vote_count ?? -1) ? opt : best),
    options[0]
  );

  const handleToggle = (optionId: string) => {
    if (poll.allow_multiple) {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) return;

    await execute(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      for (const optionId of selected) {
        await supabase.from("board_poll_votes").insert({
          option_id: optionId,
          user_id: user.id,
        });
      }

      setSelected([]);
      onUpdate();
    });
  };

  const handleUnvote = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const votedOptionIds = options.filter((o) => o.voted_by_me).map((o) => o.id);
    for (const optionId of votedOptionIds) {
      await supabase
        .from("board_poll_votes")
        .delete()
        .eq("option_id", optionId)
        .eq("user_id", user.id);
    }
    onUpdate();
  };

  // 결과 표시 (투표 완료 또는 마감)
  if (hasVoted || isExpired) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            투표 결과 · {totalVotes}표
            {poll.allow_multiple && " (복수선택)"}
          </span>
          <div className="flex items-center gap-1">
            <PollShareCard
              question={question ?? "투표"}
              options={options.map((o) => ({ text: o.text, voteCount: o.vote_count }))}
              totalVotes={totalVotes}
            />
            {/* 결과 공지 버튼 — 마감된 투표에서만 표시 */}
            {isExpired && groupId && postId && (
              <PollCloseAnnounceDialog
                poll={poll}
                options={options}
                postTitle={question ?? "투표"}
                postId={postId}
                groupId={groupId}
                canAnnounce={canAnnounce ?? false}
              />
            )}
            {/* 결정 채택 버튼 — 마감된 투표에서만 표시 */}
            {isExpired && groupId && postId && currentUserId && winningOption && (
              <AdoptDecisionButton
                groupId={groupId}
                pollId={poll.id}
                postId={postId}
                question={question ?? "투표"}
                winningOption={winningOption.text}
                decidedBy={currentUserId}
                isExpired={isExpired}
              />
            )}
            {hasVoted && !isExpired && (
              <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={handleUnvote}>
                투표 취소
              </Button>
            )}
          </div>
        </div>
        {options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          return (
            <div key={opt.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-sm">
                <span className={opt.voted_by_me ? "font-medium" : ""}>
                  {opt.text}
                  {opt.voted_by_me && " ✓"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {opt.vote_count}표 ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 투표 선택 UI
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <span className="text-xs font-medium text-muted-foreground">
        투표{poll.allow_multiple ? " (복수선택 가능)" : ""}
      </span>
      {options.map((opt) => (
        <label
          key={opt.id}
          className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer transition-colors"
        >
          <Checkbox
            checked={selected.includes(opt.id)}
            onCheckedChange={() => handleToggle(opt.id)}
          />
          <span className="text-sm">{opt.text}</span>
        </label>
      ))}
      <Button
        className="w-full h-8 text-xs"
        onClick={handleVote}
        disabled={selected.length === 0 || submitting}
      >
        {submitting ? "투표 중..." : "투표하기"}
      </Button>
    </div>
  );
}
