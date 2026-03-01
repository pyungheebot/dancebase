"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsBookmarked } from "@/hooks/use-post-bookmarks";
import { invalidatePostBookmarks } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";

interface BoardBookmarkButtonProps {
  postId: string;
  /** 북마크 목록 무효화용 (선택적) */
  groupId?: string | null;
  /** 아이콘만 표시 (목록 행 내 compact 버튼) */
  compact?: boolean;
}

export function BoardBookmarkButton({
  postId,
  groupId,
  compact = false,
}: BoardBookmarkButtonProps) {
  const { user } = useAuth();
  const { bookmarked, bookmarkId, mutate } = useIsBookmarked(postId);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(TOAST.BOARD.BOOKMARK_LOGIN_REQUIRED);
      return;
    }
    if (toggling) return;
    setToggling(true);

    const supabase = createClient();

    // optimistic update
    mutate(
      () => ({ bookmarked: !bookmarked, bookmarkId: bookmarked ? null : "temp" }),
      { revalidate: false }
    );

    try {
      if (bookmarked && bookmarkId) {
        const { error } = await supabase
          .from("post_bookmarks")
          .delete()
          .eq("id", bookmarkId);
        if (error) throw error;
        toast.success(TOAST.BOARD.BOOKMARK_REMOVED);
      } else {
        const { error } = await supabase
          .from("post_bookmarks")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
        toast.success(TOAST.BOARD.BOOKMARK_ADDED);
      }
      // 서버 상태 재검증
      mutate();
      invalidatePostBookmarks(postId, groupId);
    } catch {
      // 롤백
      mutate();
      toast.error(TOAST.BOARD.BOOKMARK_ERROR);
    } finally {
      setToggling(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
        className={cn(
          "p-0.5 rounded transition-colors",
          bookmarked
            ? "text-amber-500 hover:text-amber-600"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-3 w-3 fill-current" />
        ) : (
          <Bookmark className="h-3 w-3" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "flex items-center gap-1 h-7 text-xs px-2",
        bookmarked
          ? "text-amber-500 hover:text-amber-600"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={handleToggle}
      disabled={toggling}
      aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      <span>{bookmarked ? "북마크됨" : "북마크"}</span>
    </Button>
  );
}
