"use client";

import { useState } from "react";
import { formatKo } from "@/lib/date-utils";
import { Trash2, RotateCcw, X, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBoardTrash } from "@/hooks/use-board";
import { invalidateBoard, invalidateBoardTrash } from "@/lib/swr/invalidate";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { useAsyncAction } from "@/hooks/use-async-action";
import { EmptyState } from "@/components/shared/empty-state";

interface BoardTrashProps {
  groupId: string;
  nicknameMap?: Record<string, string>;
}

export function BoardTrash({ groupId, nicknameMap = {} }: BoardTrashProps) {
  const [open, setOpen] = useState(false);
  const { posts, loading, refetch } = useBoardTrash(groupId);

  // 복구 대상 postId
  const restoreConfirm = useDeleteConfirm<string>();
  const { pending: restoring, execute: executeRestore } = useAsyncAction();

  // 영구 삭제 대상 postId
  const deleteConfirm = useDeleteConfirm<string>();
  const { pending: deleting, execute: executeDelete } = useAsyncAction();

  const handleRestore = async () => {
    const target = restoreConfirm.confirm();
    if (!target) return;
    await executeRestore(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("board_posts")
        .update({ deleted_at: null })
        .eq("id", target);

      if (error) {
        toast.error(TOAST.BOARD.TRASH_RESTORE_ERROR);
      } else {
        toast.success(TOAST.BOARD.TRASH_RESTORED);
        invalidateBoard(groupId);
        invalidateBoardTrash(groupId);
        refetch();
      }
    });
  };

  const handlePermanentDelete = async () => {
    const target = deleteConfirm.confirm();
    if (!target) return;
    await executeDelete(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("board_posts")
        .delete()
        .eq("id", target);

      if (error) {
        toast.error(TOAST.BOARD.TRASH_PERM_DELETE_ERROR);
      } else {
        toast.success(TOAST.BOARD.TRASH_PERM_DELETED);
        invalidateBoardTrash(groupId);
        refetch();
      }
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
          >
            <Trash2 className="h-3 w-3" />
            휴지통
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="text-sm flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              삭제된 게시글
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
            ) : posts.length === 0 ? (
              <EmptyState
                icon={Trash2}
                title="휴지통이 비어있습니다"
                className="m-4 py-12"
              />
            ) : (
              <div className="divide-y">
                {posts.map((post) => {
                  const authorName =
                    nicknameMap[post.author_id] || post.profiles?.name || "알 수 없음";
                  const deletedAt = post.deleted_at
                    ? formatKo(new Date(post.deleted_at), "M/d HH:mm")
                    : "";

                  return (
                    <div
                      key={post.id}
                      className="px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{post.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                          {post.projects && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              <FolderOpen className="h-2.5 w-2.5" />
                              {post.projects.name}
                            </span>
                          )}
                          <span className="truncate max-w-[6rem]">{authorName}</span>
                          <span className="shrink-0">삭제: {deletedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 gap-0.5"
                          onClick={() => restoreConfirm.request(post.id)}
                          disabled={restoring || deleting}
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          복구
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 gap-0.5 text-destructive hover:text-destructive"
                          onClick={() => deleteConfirm.request(post.id)}
                          disabled={restoring || deleting}
                        >
                          <X className="h-2.5 w-2.5" />
                          영구 삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {posts.length > 0 && (
            <div className="px-4 py-2 border-t shrink-0">
              <p className="text-[10px] text-muted-foreground">
                총 {posts.length}개의 삭제된 게시글
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 복구 확인 */}
      <ConfirmDialog
        open={restoreConfirm.open}
        onOpenChange={restoreConfirm.onOpenChange}
        title="게시글 복구"
        description="이 게시글을 복구하시겠습니까? 게시판 목록에 다시 나타납니다."
        onConfirm={handleRestore}
      />

      {/* 영구 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="영구 삭제"
        description="이 게시글을 영구적으로 삭제합니다. 댓글, 투표, 첨부파일이 모두 삭제되며 복구할 수 없습니다."
        onConfirm={handlePermanentDelete}
        destructive
      />
    </>
  );
}
