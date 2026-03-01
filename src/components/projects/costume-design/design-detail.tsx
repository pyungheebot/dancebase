"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ThumbsUp,
  MessageSquare,
  DollarSign,
  Scissors,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { CostumeDesignEntry, CostumeDesignStatus } from "@/types";
import { STATUS_LABELS, STATUS_NEXT } from "./types";
import { StatusBadge } from "./status-badge";

// ============================================================
// 디자인 상세 패널
// ============================================================

interface DesignDetailProps {
  design: CostumeDesignEntry;
  memberNames: string[];
  currentUser: string;
  onChangeStatus: (id: string, status: CostumeDesignStatus) => void;
  onToggleVote: (id: string, memberName: string) => void;
  onDelete: (id: string) => void;
  onAddComment: (designId: string, author: string, text: string) => void;
  onDeleteComment: (designId: string, commentId: string) => void;
}

export function DesignDetail({
  design,
  memberNames,
  currentUser,
  onChangeStatus,
  onToggleVote,
  onAddComment,
  onDeleteComment,
}: DesignDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(
    memberNames[0] ?? currentUser
  );

  const nextStatus = STATUS_NEXT[design.status];
  const hasVoted = design.votes.includes(currentUser);

  function handleAddComment() {
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error(TOAST.COSTUME_DESIGN.COMMENT_REQUIRED);
      return;
    }
    onAddComment(design.id, commentAuthor, trimmed);
    setCommentText("");
    toast.success(TOAST.COSTUME_DESIGN.COMMENT_ADDED);
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/30 mt-2">
      {/* 설명 */}
      {design.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {design.description}
        </p>
      )}

      {/* 소재 메모 */}
      {design.materialNotes && (
        <div className="flex items-start gap-1.5">
          <Scissors className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">{design.materialNotes}</p>
        </div>
      )}

      {/* 예상 비용 */}
      {design.estimatedCost !== undefined && (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3 w-3 text-green-500 shrink-0" aria-hidden="true" />
          <span className="text-xs text-foreground font-medium">
            {design.estimatedCost.toLocaleString()}원
          </span>
        </div>
      )}

      {/* 상태 변경 버튼 */}
      <div className="flex items-center gap-2" role="group" aria-label="상태 관리">
        <span className="text-[10px] text-muted-foreground">상태:</span>
        <StatusBadge status={design.status} />
        {nextStatus && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => {
              onChangeStatus(design.id, nextStatus);
              toast.success(
                `상태가 "${STATUS_LABELS[nextStatus]}"으로 변경되었습니다.`
              );
            }}
            aria-label={`상태를 ${STATUS_LABELS[nextStatus]}으로 변경`}
          >
            {STATUS_LABELS[nextStatus]}으로 변경
          </Button>
        )}
      </div>

      {/* 투표 */}
      <div className="flex items-center gap-2" role="group" aria-label="투표">
        <Button
          variant={hasVoted ? "default" : "outline"}
          size="sm"
          className={`h-6 text-[10px] px-2 gap-1 ${
            hasVoted ? "bg-pink-600 hover:bg-pink-700 border-pink-600" : ""
          }`}
          onClick={() => {
            onToggleVote(design.id, currentUser);
            if (hasVoted) {
              toast.success(TOAST.COSTUME_DESIGN.VOTE_CANCELLED);
            } else {
              toast.success(TOAST.COSTUME_DESIGN.VOTED);
            }
          }}
          aria-pressed={hasVoted}
          aria-label={hasVoted ? "투표 취소" : "투표하기"}
        >
          <ThumbsUp className="h-3 w-3" aria-hidden="true" />
          {hasVoted ? "투표 취소" : "투표하기"}
        </Button>
        {design.votes.length > 0 && (
          <div
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="투표한 멤버 목록"
          >
            {design.votes.map((v) => (
              <span
                key={v}
                role="listitem"
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      {design.comments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            댓글 {design.comments.length}
          </p>
          <ul
            className="space-y-1.5"
            role="list"
            aria-label={`댓글 ${design.comments.length}개`}
          >
            {design.comments.map((comment) => (
              <li
                key={comment.id}
                className="flex items-start justify-between gap-2 bg-muted/20 rounded px-2 py-1.5"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-medium text-foreground">
                    {comment.author}
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {comment.text}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive shrink-0"
                  onClick={() => {
                    onDeleteComment(design.id, comment.id);
                    toast.success(TOAST.COSTUME_DESIGN.COMMENT_DELETED);
                  }}
                  aria-label={`${comment.author}의 댓글 삭제`}
                >
                  <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 댓글 입력 */}
      <div className="space-y-1.5" role="group" aria-label="댓글 작성">
        <div className="flex gap-1.5">
          {memberNames.length > 0 ? (
            <Select value={commentAuthor} onValueChange={setCommentAuthor}>
              <SelectTrigger
                className="h-6 text-[10px] w-24 shrink-0"
                aria-label="댓글 작성자 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글 작성..."
            className="h-6 text-[10px]"
            aria-label="댓글 내용 입력"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 shrink-0"
            onClick={handleAddComment}
            aria-label="댓글 등록"
          >
            등록
          </Button>
        </div>
      </div>
    </div>
  );
}
