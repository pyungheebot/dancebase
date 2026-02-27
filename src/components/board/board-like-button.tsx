"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useBoardPostLikes } from "@/hooks/use-board";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BoardPostLike } from "@/types";

interface BoardLikeButtonProps {
  postId: string;
}

export function BoardLikeButton({ postId }: BoardLikeButtonProps) {
  const { user } = useAuth();
  const { likeCount, likedByMe, mutate } = useBoardPostLikes(postId);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }
    if (toggling) return;
    setToggling(true);

    const supabase = createClient();

    // optimistic update
    const optimisticLikedByMe = !likedByMe;

    mutate(
      (prev) => {
        if (!prev) return prev;
        const newLikes: BoardPostLike[] = optimisticLikedByMe
          ? [
              ...prev.likes,
              {
                id: "temp",
                post_id: postId,
                user_id: user.id,
                created_at: new Date().toISOString(),
              },
            ]
          : prev.likes.filter((l: BoardPostLike) => l.user_id !== user.id);
        return { likes: newLikes, likedByMe: optimisticLikedByMe };
      },
      { revalidate: false },
    );

    try {
      if (likedByMe) {
        const { error } = await supabase
          .from("board_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("board_post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
      // 서버 상태로 재검증
      mutate();
    } catch {
      // 롤백
      mutate();
      toast.error("좋아요 처리에 실패했습니다");
    } finally {
      setToggling(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "flex items-center gap-1 h-7 text-xs px-2",
        likedByMe
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-foreground",
      )}
      onClick={handleToggle}
      disabled={toggling}
      aria-label={likedByMe ? "좋아요 취소" : "좋아요"}
    >
      <Heart className={cn("h-3.5 w-3.5", likedByMe && "fill-current")} />
      <span>{likeCount}</span>
    </Button>
  );
}
