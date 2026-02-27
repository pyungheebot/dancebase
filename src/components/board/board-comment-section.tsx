"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { BoardCommentWithProfile } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BoardCommentSectionProps {
  postId: string;
  comments: BoardCommentWithProfile[];
  onUpdate: () => void;
  nicknameMap?: Record<string, string>;
  groupId?: string;
}

export function BoardCommentSection({
  postId,
  comments,
  onUpdate,
  nicknameMap,
  groupId,
}: BoardCommentSectionProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const supabase = createClient();

  // 현재 유저 확인
  useEffect(() => {
    if (currentUserId !== null) return;
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, [supabase, currentUserId]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("board_comments").insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
    });

    if (error) { toast.error("댓글 작성에 실패했습니다"); setSubmitting(false); return; }
    setContent("");
    setSubmitting(false);
    onUpdate();
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("board_comments").delete().eq("id", commentId);
    if (error) { toast.error("댓글 삭제에 실패했습니다"); return; }
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
    if (!editingContent.trim() || editSaving) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("board_comments")
      .update({ content: editingContent.trim() })
      .eq("id", commentId);
    if (error) { toast.error("댓글 수정에 실패했습니다"); setEditSaving(false); return; }
    toast.success("댓글이 수정되었습니다");
    setEditingId(null);
    setEditingContent("");
    setEditSaving(false);
    onUpdate();
  };

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-medium">댓글 ({comments.length})</h3>

      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {(nicknameMap?.[comment.author_id] || comment.profiles.name)?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <UserPopoverMenu
                    userId={comment.author_id}
                    displayName={nicknameMap?.[comment.author_id] || comment.profiles.name}
                    groupId={groupId}
                    className="text-xs font-medium hover:underline"
                  >
                    {nicknameMap?.[comment.author_id] || comment.profiles.name}
                  </UserPopoverMenu>
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(comment.created_at), "M/d HH:mm", { locale: ko })}
                  </span>
                  {currentUserId === comment.author_id && editingId !== comment.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditStart(comment)}
                        aria-label="댓글 수정"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(comment.id)}
                        aria-label="댓글 삭제"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="mt-1 space-y-1">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="text-sm min-h-[60px] resize-none"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => handleEditSave(comment.id)}
                        disabled={!editingContent.trim() || editSaving}
                      >
                        <Check className="h-2.5 w-2.5 mr-1" />
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={handleEditCancel}
                        disabled={editSaving}
                      >
                        <X className="h-2.5 w-2.5 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
        >
          {submitting ? "..." : "작성"}
        </Button>
      </div>
    </div>
  );
}
