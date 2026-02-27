"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/app-layout";
import { BoardPostContent } from "@/components/board/board-post-content";
import { BoardPostAttachments } from "@/components/board/board-post-attachments";
import { BoardCommentSection } from "@/components/board/board-comment-section";
import { BoardPollView } from "@/components/board/board-poll";
import { BoardPostList } from "@/components/board/board-post-list";
import { BoardPostForm } from "@/components/board/board-post-form";
import { useBoardPost } from "@/hooks/use-board";
import { useGroupDetail } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BoardPostRevisionsSheet } from "@/components/board/board-post-revisions-sheet";
import { ArrowLeft, Loader2, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectBoardPostPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string; postId: string }>;
}) {
  const { id, projectId, postId } = use(params);
  const { post, comments, poll, pollOptions, loading, refetch } = useBoardPost(postId);
  const { nicknameMap, myRole } = useGroupDetail(id);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  const canEditOrDelete =
    post && user && (post.author_id === user.id || myRole === "leader");
  const canPin = post && user && myRole === "leader";

  const handleTogglePin = async () => {
    if (!post) return;
    setPinning(true);
    const newPinned = !post.is_pinned;
    const { error } = await supabase
      .from("board_posts")
      .update({ is_pinned: newPinned })
      .eq("id", postId);
    if (error) {
      toast.error("고정 설정에 실패했습니다");
    } else {
      toast.success(newPinned ? "공지로 고정했습니다" : "고정 해제했습니다");
      refetch();
    }
    setPinning(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("board_posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId);
    if (error) {
      toast.error("게시글 삭제에 실패했습니다");
      setDeleting(false);
      return;
    }
    toast.success("게시글이 휴지통으로 이동했습니다");
    router.push(`/groups/${id}/projects/${projectId}/board`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 h-7 text-xs">
          <Link href={`/groups/${id}/projects/${projectId}/board`}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            목록
          </Link>
        </Button>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {post.category}
            </Badge>
            {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          </div>
          <div className="flex items-start justify-between">
            <h1 className="text-base font-semibold">{post.title}</h1>
            {canEditOrDelete && (
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {canPin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${post.is_pinned ? "text-primary" : "text-muted-foreground"}`}
                    onClick={handleTogglePin}
                    disabled={pinning}
                    aria-label={post.is_pinned ? "고정 해제" : "공지 고정"}
                  >
                    {post.is_pinned ? (
                      <Pin className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <PinOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditOpen(true)}
                  aria-label="글 수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  aria-label="글 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {(nicknameMap[post.author_id] || post.profiles?.name)?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <UserPopoverMenu
              userId={post.author_id}
              displayName={nicknameMap[post.author_id] || post.profiles?.name || ""}
              groupId={id}
              className="text-xs hover:underline"
            >
              {nicknameMap[post.author_id] || post.profiles?.name}
            </UserPopoverMenu>
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(post.created_at), "yyyy.M.d HH:mm", { locale: ko })}
            </span>
            {post.updated_at !== post.created_at && (
              <BoardPostRevisionsSheet
                postId={postId}
                currentTitle={post.title}
              />
            )}
          </div>
        </div>

        <BoardPostContent content={post.content} />

        {/* 첨부파일 */}
        <BoardPostAttachments postId={postId} />

        {poll && (
          <div className="mt-4">
            <BoardPollView poll={poll} options={pollOptions} onUpdate={refetch} question={post.title} />
          </div>
        )}

        <Separator className="my-3" />

        <BoardCommentSection
          postId={postId}
          postAuthorId={post.author_id}
          postLink={`/groups/${id}/projects/${projectId}/board/${postId}`}
          comments={comments}
          onUpdate={refetch}
          nicknameMap={nicknameMap}
          groupId={id}
        />

        <Separator className="my-3" />

        <BoardPostList
          groupId={id}
          projectId={projectId}
          basePath={`/groups/${id}/projects/${projectId}/board`}
          nicknameMap={nicknameMap}
          hideHeader
          activePostId={postId}
        />

        {/* 수정 Dialog */}
        {canEditOrDelete && (
          <BoardPostForm
            groupId={id}
            projectId={projectId}
            onCreated={refetch}
            mode="edit"
            initialData={post}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        )}

        {/* 삭제 확인 Dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="게시글 삭제"
          description="게시글을 휴지통으로 이동합니다. 리더는 휴지통에서 복구하거나 영구 삭제할 수 있습니다."
          onConfirm={handleDelete}
          destructive
        />
      </div>
    </AppLayout>
  );
}
