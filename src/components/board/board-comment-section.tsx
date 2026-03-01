"use client";

import { useState } from "react";
import { formatKo } from "@/lib/date-utils";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import type { BoardCommentWithProfile } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { Trash2, Pencil, Check, X, CornerDownRight, Flag } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { createNotification } from "@/lib/notifications";
import { ContentReportDialog } from "@/components/board/content-report-dialog";
import { useAsyncAction } from "@/hooks/use-async-action";

interface BoardCommentSectionProps {
  postId: string;
  postAuthorId?: string;
  postLink?: string;
  comments: BoardCommentWithProfile[];
  onUpdate: () => void;
  nicknameMap?: Record<string, string>;
  groupId?: string;
}

// 트리 구조 타입
type CommentNode = BoardCommentWithProfile & {
  replies: BoardCommentWithProfile[];
};

// 댓글을 트리 구조로 변환 (parent_id 기준, 최대 2단계)
function buildCommentTree(comments: BoardCommentWithProfile[]): CommentNode[] {
  const rootComments = comments.filter((c) => !c.parent_id);
  return rootComments.map((root) => ({
    ...root,
    replies: comments.filter((c) => c.parent_id === root.id),
  }));
}

// 개별 댓글 아이템 컴포넌트
function CommentItem({
  comment,
  currentUserId,
  editingId,
  editingContent,
  editSaving,
  nicknameMap,
  groupId,
  isReply,
  parentAuthorId,
  parentAuthorName,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onReplyClick,
  onReport,
  activeReplyId,
  editingContentChange,
}: {
  comment: BoardCommentWithProfile;
  currentUserId: string | null;
  editingId: string | null;
  editingContent: string;
  editSaving: boolean;
  nicknameMap?: Record<string, string>;
  groupId?: string;
  isReply: boolean;
  parentAuthorId?: string;
  parentAuthorName?: string;
  onEditStart: (comment: BoardCommentWithProfile) => void;
  onEditCancel: () => void;
  onEditSave: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReplyClick: (commentId: string) => void;
  onReport: (commentId: string) => void;
  activeReplyId: string | null;
  editingContentChange: (value: string) => void;
}) {
  const displayName = nicknameMap?.[comment.author_id] || comment.profiles.name;
  const isOwnComment = currentUserId === comment.author_id;

  // 숨김 처리된 댓글
  if (comment.is_hidden) {
    return (
      <div className={`flex gap-2 ${isReply ? "ml-8" : ""}`}>
        {isReply && (
          <CornerDownRight className="h-3 w-3 text-muted-foreground mt-1.5 shrink-0" />
        )}
        <p className="text-xs text-muted-foreground italic py-0.5">
          [숨김 처리된 댓글입니다]
        </p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isReply ? "ml-8" : ""}`}>
      {isReply && (
        <CornerDownRight className="h-3 w-3 text-muted-foreground mt-1.5 shrink-0" />
      )}
      <Avatar className="h-6 w-6 mt-0.5 shrink-0">
        <AvatarFallback className="text-[10px]">
          {displayName?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <UserPopoverMenu
            userId={comment.author_id}
            displayName={displayName}
            groupId={groupId}
            className="text-xs font-medium hover:underline"
          >
            {displayName}
          </UserPopoverMenu>
          <span className="text-[11px] text-muted-foreground">
            {formatKo(new Date(comment.created_at), "M/d HH:mm")}
          </span>
          {isOwnComment && editingId !== comment.id && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => onEditStart(comment)}
                aria-label="댓글 수정"
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(comment.id)}
                aria-label="댓글 삭제"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
          {/* 신고 버튼: 본인 댓글이 아닌 경우 */}
          {!isOwnComment && currentUserId && groupId && editingId !== comment.id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-orange-500"
              onClick={() => onReport(comment.id)}
              aria-label="댓글 신고"
            >
              <Flag className="h-2.5 w-2.5" />
            </Button>
          )}
          {/* 답글 버튼: 원댓글에만 표시 (대댓글에는 표시하지 않음) */}
          {!isReply && editingId !== comment.id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => onReplyClick(comment.id)}
            >
              {activeReplyId === comment.id ? "취소" : "답글"}
            </Button>
          )}
        </div>
        {editingId === comment.id ? (
          <div className="mt-1 space-y-1">
            <Textarea
              value={editingContent}
              onChange={(e) => editingContentChange(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              maxLength={2000}
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => onEditSave(comment.id)}
                disabled={!editingContent.trim() || editSaving}
              >
                <Check className="h-2.5 w-2.5 mr-1" />
                저장
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={onEditCancel}
                disabled={editSaving}
              >
                <X className="h-2.5 w-2.5 mr-1" />
                취소
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">
            {isReply && parentAuthorId && parentAuthorName && (
              <span className="text-blue-500 text-xs font-medium mr-1">
                @{parentAuthorName}
              </span>
            )}
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}

export function BoardCommentSection({
  postId,
  postAuthorId,
  postLink,
  comments,
  onUpdate,
  nicknameMap,
  groupId,
}: BoardCommentSectionProps) {
  const [content, setContent] = useState("");
  const { pending: submitting, execute: executeSubmit } = useAsyncAction();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { pending: editSaving, execute: executeEdit } = useAsyncAction();
  // 답글 관련 상태
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { pending: replySubmitting, execute: executeReply } = useAsyncAction();
  // 신고 다이얼로그 상태
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);

  const supabase = createClient();
  const { user } = useAuth();

  // 현재 유저 ID (파생값으로 처리)
  const currentUserId = user?.id ?? null;

  // 댓글 제출 (parent_id 포함)
  const handleSubmit = async (parentId: string | null = null) => {
    const targetContent = parentId ? replyContent : content;
    if (!targetContent.trim()) return;

    const execFn = parentId ? executeReply : executeSubmit;

    await execFn(async () => {
      if (!user) return;

      const { error } = await supabase.from("board_comments").insert({
        post_id: postId,
        author_id: user.id,
        content: targetContent.trim(),
        parent_id: parentId ?? null,
      });

      if (error) {
        toast.error(TOAST.BOARD.COMMENT_CREATE_ERROR);
        return;
      }

      // 게시글 작성자에게 알림 (본인 댓글이면 스킵)
      if (postAuthorId && postAuthorId !== user.id) {
        const commenterName =
          (await supabase.from("profiles").select("name").eq("id", user.id).single()).data?.name ?? "누군가";
        await createNotification({
          userId: postAuthorId,
          type: "new_comment",
          title: "새 댓글",
          message: `${commenterName}님이 댓글을 달았습니다`,
          link: postLink,
        });
      }

      if (parentId) {
        setReplyContent("");
        setActiveReplyId(null);
      } else {
        setContent("");
      }
      onUpdate();
    });
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("board_comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      toast.error(TOAST.BOARD.COMMENT_DELETE_ERROR);
      return;
    }
    onUpdate();
  };

  const handleEditStart = (comment: BoardCommentWithProfile) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleEditSave = async (commentId: string) => {
    if (!editingContent.trim()) return;
    await executeEdit(async () => {
      const { error } = await supabase
        .from("board_comments")
        .update({ content: editingContent.trim() })
        .eq("id", commentId);
      if (error) {
        toast.error(TOAST.BOARD.COMMENT_UPDATE_ERROR);
        return;
      }
      toast.success(TOAST.BOARD.COMMENT_UPDATED);
      setEditingId(null);
      setEditingContent("");
      onUpdate();
    });
  };

  const handleReplyClick = (commentId: string) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setReplyContent("");
    } else {
      setActiveReplyId(commentId);
      setReplyContent("");
    }
  };

  const handleReport = (commentId: string) => {
    setReportTargetId(commentId);
  };

  // 트리 구조로 변환
  const commentTree = buildCommentTree(comments);

  // 총 댓글 수 (원댓글 + 대댓글)
  const totalCount = comments.length;

  const commonItemProps = {
    currentUserId,
    editingId,
    editingContent,
    editSaving,
    nicknameMap,
    groupId,
    onEditStart: handleEditStart,
    onEditCancel: handleEditCancel,
    onEditSave: handleEditSave,
    onDelete: handleDelete,
    onReplyClick: handleReplyClick,
    onReport: handleReport,
    activeReplyId,
    editingContentChange: setEditingContent,
  };

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-medium">댓글 ({totalCount})</h3>

      {commentTree.length > 0 && (
        <div className="space-y-2">
          {commentTree.map((commentNode) => (
            <div key={commentNode.id} className="space-y-2">
              {/* 원댓글 */}
              <CommentItem
                comment={commentNode}
                isReply={false}
                {...commonItemProps}
              />

              {/* 답글 입력폼 (원댓글 아래, 대댓글 위) */}
              {activeReplyId === commentNode.id && (
                <div className="ml-8 flex gap-2 items-start">
                  <CornerDownRight className="h-3 w-3 text-muted-foreground mt-2.5 shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder={`@${nicknameMap?.[commentNode.author_id] || commentNode.profiles.name} 에게 답글 작성`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(commentNode.id);
                        }
                      }}
                      maxLength={2000}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSubmit(commentNode.id)}
                      disabled={!replyContent.trim() || replySubmitting}
                    >
                      {replySubmitting ? "..." : "답글"}
                    </Button>
                  </div>
                </div>
              )}

              {/* 대댓글 목록 */}
              {commentNode.replies.length > 0 && (
                <div className="space-y-2">
                  {commentNode.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply={true}
                      parentAuthorId={commentNode.author_id}
                      parentAuthorName={
                        nicknameMap?.[commentNode.author_id] ||
                        commentNode.profiles.name
                      }
                      {...commonItemProps}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 댓글 작성 */}
      <div className="flex gap-2">
        <Input
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(null);
            }
          }}
          maxLength={2000}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => handleSubmit(null)}
          disabled={!content.trim() || submitting}
        >
          {submitting ? "..." : "작성"}
        </Button>
      </div>

      {/* 신고 다이얼로그 */}
      {groupId && reportTargetId && (
        <ContentReportDialog
          open={reportTargetId !== null}
          onOpenChange={(open) => {
            if (!open) setReportTargetId(null);
          }}
          groupId={groupId}
          targetType="comment"
          targetId={reportTargetId}
        />
      )}
    </div>
  );
}
