"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/use-bookmarks";
import type { BookmarkTargetType } from "@/types";

type BookmarkButtonProps = {
  targetId: string;
  targetType: BookmarkTargetType;
  title: string;
  href: string;
};

export function BookmarkButton({
  targetId,
  targetType,
  title,
  href,
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const bookmarked = isBookmarked(targetId, targetType);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const added = toggleBookmark({ targetId, targetType, title, href });

    if (added) {
      toast.success("북마크에 추가했습니다.");
    } else {
      toast.success("북마크에서 제거했습니다.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs px-1.5"
      onClick={handleClick}
      title={bookmarked ? "북마크 제거" : "북마크 추가"}
    >
      <Star
        className={`h-4 w-4 transition-colors ${
          bookmarked
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground"
        }`}
      />
    </Button>
  );
}
