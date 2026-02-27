"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bookmark, BookmarkX, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePostBookmarks } from "@/hooks/use-post-bookmarks";
import { invalidatePostBookmarks } from "@/lib/swr/invalidate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface BookmarkedPostsSheetProps {
  /** 특정 그룹 내 북마크만 표시 (미지정 시 전체) */
  groupId?: string | null;
}

export function BookmarkedPostsSheet({ groupId }: BookmarkedPostsSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { bookmarks, loading, refetch } = usePostBookmarks(groupId);
  const router = useRouter();

  const handleRemoveBookmark = async (
    e: React.MouseEvent,
    bookmarkId: string,
    postId: string
  ) => {
    e.stopPropagation();
    if (!user) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("post_bookmarks")
      .delete()
      .eq("id", bookmarkId);

    if (error) {
      toast.error("북마크 해제에 실패했습니다");
      return;
    }

    toast.success("북마크를 해제했습니다");
    refetch();
    invalidatePostBookmarks(postId, groupId);
  };

  const handlePostClick = (bookmark: (typeof bookmarks)[number]) => {
    const post = bookmark.board_posts;
    if (!post) return;

    const path = post.project_id
      ? `/groups/${post.group_id}/projects/${post.project_id}/board/${post.id}`
      : `/groups/${post.group_id}/board/${post.id}`;

    router.push(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          aria-label="북마크한 게시글 목록 열기"
        >
          <Bookmark className="h-3 w-3" />
          북마크
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            북마크한 게시글
            {!loading && bookmarks.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                {bookmarks.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y px-4 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="py-3 flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Bookmark className="h-8 w-8 opacity-30" />
              <p className="text-xs">북마크한 게시글이 없습니다</p>
              <p className="text-[10px] text-muted-foreground/70">
                게시글 목록에서 북마크 아이콘을 눌러 저장하세요
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {bookmarks.map((bookmark) => {
                const post = bookmark.board_posts;
                if (!post) return null;

                const groupName = post.groups?.name ?? "";
                const createdAt = format(
                  new Date(post.created_at),
                  "yyyy.M.d",
                  { locale: ko }
                );

                return (
                  <button
                    key={bookmark.id}
                    type="button"
                    className="w-full px-4 py-3 flex items-start justify-between gap-3 hover:bg-accent transition-colors text-left"
                    onClick={() => handlePostClick(bookmark)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal shrink-0"
                        >
                          {post.category}
                        </Badge>
                        <span className="text-xs font-medium truncate">
                          {post.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {groupName && !groupId && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            <FolderOpen className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[6rem]">{groupName}</span>
                          </span>
                        )}
                        <span className="shrink-0">{createdAt}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleRemoveBookmark(e, bookmark.id, post.id)
                      }
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="북마크 해제"
                    >
                      <BookmarkX className="h-3.5 w-3.5" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!loading && bookmarks.length > 0 && (
          <div className="px-4 py-2 border-t shrink-0">
            <p className="text-[10px] text-muted-foreground">
              총 {bookmarks.length}개의 북마크
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
