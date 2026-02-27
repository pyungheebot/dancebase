"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBoardReactions } from "@/hooks/use-board-reactions";
import { BOARD_REACTION_EMOJIS, type BoardReactionEmoji } from "@/types";

interface BoardEmojiReactionsProps {
  postId: string;
  userId?: string;
}

export function BoardEmojiReactions({
  postId,
  userId,
}: BoardEmojiReactionsProps) {
  const { reactionList, myReaction, toggleReaction } = useBoardReactions(
    postId,
    userId
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  // 클릭 애니메이션 대상 이모지 추적
  const [bouncingEmoji, setBouncingEmoji] = useState<BoardReactionEmoji | null>(
    null
  );

  function handleToggle(emoji: BoardReactionEmoji) {
    if (!userId) return;
    setBouncingEmoji(emoji);
    setTimeout(() => setBouncingEmoji(null), 300);
    toggleReaction(postId, emoji, userId);
    setPickerOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* 기존 반응 버튼들 */}
      {reactionList.map(({ emoji, count }) => {
        const isMyReaction = myReaction === emoji;
        const isBouncing = bouncingEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleToggle(emoji as BoardReactionEmoji)}
            disabled={!userId}
            aria-label={`${emoji} 반응 ${count}개${isMyReaction ? ", 내가 반응함" : ""}`}
            aria-pressed={isMyReaction}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 h-6 text-xs",
              "transition-all duration-150 select-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isMyReaction
                ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                : "bg-background border-border text-foreground hover:bg-accent",
              isBouncing && "scale-110"
            )}
          >
            <span aria-hidden="true">{emoji}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}

      {/* "+" 버튼 - 이모지 피커 Popover */}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!userId}
            aria-label="이모지 반응 추가"
            className="h-6 w-6 p-0 rounded-full border-dashed text-muted-foreground hover:text-foreground hover:border-solid"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2"
          align="start"
          side="top"
        >
          <div
            className="grid grid-cols-3 gap-1"
            role="group"
            aria-label="이모지 선택"
          >
            {BOARD_REACTION_EMOJIS.map((emoji) => {
              const isSelected = myReaction === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggle(emoji)}
                  aria-label={`${emoji} 반응${isSelected ? " (선택됨)" : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-md text-lg",
                    "transition-all duration-150 hover:scale-110 hover:bg-accent",
                    isSelected && "bg-primary/10 ring-1 ring-primary"
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
